import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ref, onValue, query, limitToLast } from "firebase/database"; // Firebase Import 복구
import { db } from '@/lib/firebase'; // Firebase DB Import 복구
import { 
  OverlayContainer, HeaderBar, MainGridInternal, RPAProcessView, 
  StepItem, CameraFrame, CompletionPopup, FailurePopup, 
  RightContentContainer, TopInfoSection, InfoInputBox, SplitRow, 
  ListSection, DetailSection, LogSection, ItemCardStyled 
} from '@/styles/styles';
import { WearableApiEntry, WearableItemData } from '@/types/types';
import { 
  ScanBarcode, Cpu, Save, CheckCircle2, Activity, FileBadge, 
  Loader2, MoreHorizontal, Calendar, Truck, ListTodo, Box, 
  Layers, XCircle, Search 
} from "lucide-react";
import { LuX, LuClipboardCheck, LuFileText } from "react-icons/lu";
import styled from 'styled-components';

// Props 인터페이스 정의
interface AIDashboardModalProps {
  onClose: () => void;
  streamUrl?: string | null;
  streamStatus: string;
  externalData?: WearableApiEntry[];
}

// --- Styled Component for Empty State inside Modal ---
const EmptyDataPlaceholder = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  gap: 16px;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  margin-bottom: 20px;

  .icon {
    width: 64px;
    height: 64px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
  }
  
  p {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }
  
  span {
    font-size: 0.85rem;
    opacity: 0.7;
  }
`;

const PROCESS_STEPS = [
  { id: 1, label: "바코드 디코딩", icon: <ScanBarcode size={14} /> },
  { id: 2, label: "ERP 조회", icon: <Cpu size={14} /> },
  { id: 3, label: "입고 검사 매칭", icon: <Activity size={14} /> },
  { id: 4, label: "품질 이력 분석", icon: <FileBadge size={14} /> },
  { id: 5, label: "데이터 저장", icon: <Save size={14} /> },
];

const FAILURE_REASONS = [
  "ERP 서버 응답 시간 초과 (Timeout)",
  "바코드 데이터 형식 불일치",
  "발주 수량 초과 (Over Count)",
  "필수 품질 검사 데이터 누락",
  "네트워크 연결 불안정 (Packet Loss)"
];

const generateDummyItems = (): WearableItemData[] => {
  const count = 3;
  const items: WearableItemData[] = [];
  for(let i=0; i<count; i++) {
    items.push({
      id: i,
      project: "TEST-PRJ",
      code: `TEST-ITEM-${i}`,
      name: "테스트 품목",
      type: "육안검사",
      date: "2026-01-17",
      vendor: "테스트업체",
      qty: 100,
      quality: "Y",
      dwellTime: "5분",
      invoiceNo: "TEST-INV",
      totalQty: 300,
      qmConf: "Y"
    });
  }
  return items;
};

const MemoizedItemCard = React.memo(({ item, selectedId, onClick }: { item: WearableItemData, selectedId: number, onClick: (id: number) => void }) => ( 
  <ItemCardStyled $active={selectedId === item.id} onClick={() => onClick(item.id)} > 
    <div className="c">{item.code}</div> 
    <div className="n">{item.name}</div> 
    <div className="q">{item.qty.toLocaleString()} EA</div> 
  </ItemCardStyled> 
)); 
MemoizedItemCard.displayName = 'MemoizedItemCard';

// RPA 진행 상태 뷰
const RPAStatusView = React.memo(({ step, isWearableConnected, streamUrl }: { step: number, isWearableConnected?: boolean, streamUrl?: string | null }) => {
  return (
    <RPAProcessView initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} >
      <div className="rpa-header"> 
        <h2><Cpu size={24} color="#60a5fa" strokeWidth={2.5}/> AUTO PROCESSING</h2> 
        <p>Vision AI 데이터 분석 및 ERP 자동 입고 처리를 진행합니다.</p> 
      </div>
      <div className="step-container"> 
        {PROCESS_STEPS.map((s) => ( 
          <StepItem key={s.id} $active={step === s.id} $done={step > s.id} > 
            <div className="icon-box">{s.icon}</div> 
            <div className="txt">{s.label}</div> 
            <div className="status"> 
              {step > s.id ? <CheckCircle2 size={18} color="#10b981" strokeWidth={3}/> : step === s.id ? <Loader2 className="spin" size={18} color="#fff"/> : <MoreHorizontal size={18}/>} 
            </div> 
          </StepItem> 
        ))} 
      </div>
      
      <div className="pip-container">
        <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%' }}>
          <CameraFrame>
            {isWearableConnected && streamUrl ? (
                <iframe src={streamUrl} style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }} />
            ) : (
                <div className="simulated-barcode-view" style={{background: '#000'}}>
                    <div style={{opacity: 0.3}}><ScanBarcode size={40} /></div>
                </div>
            )}
          </CameraFrame>
        </motion.div>
      </div>
    </RPAProcessView>
  );
});
RPAStatusView.displayName = 'RPAStatusView';

// 메인 컴포넌트
export default function AIDashboardModal({ onClose, streamUrl, streamStatus, externalData }: AIDashboardModalProps) {
  const [items, setItems] = useState<WearableItemData[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  
  // Logic States
  const [rpaStep, setRpaStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [closeCountdown, setCloseCountdown] = useState(5);

  const [stepQueue, setStepQueue] = useState<number[]>([]);
  const isProcessingRef = useRef(false);
  const lastStepTimeRef = useRef<number>(0); 
  const initialMount = useRef(true);
  
  const isWearableConnected = streamStatus === 'ok' && !!streamUrl;

  // 1. 외부 데이터 매핑 (API 응답 시 UI 채움)
  useEffect(() => {
    if (externalData && externalData.length > 0) {
        const mappedItems: WearableItemData[] = externalData.map((item, index) => ({
            id: index,
            project: item.PrjName || "-",
            code: item.CdGItem || item.CdGlItem || "-",
            name: item.NmGItem || item.NmGlItem || "품목명 없음",
            type: item.NmInspGB || "일반검사",
            date: item.DtPurIn ? item.DtPurIn.substring(0, 10) : "-",
            vendor: item.NmCustm || "-",
            qty: item.InQty || 0,
            quality: item.QmConf || "-",
            dwellTime: "0분",
            invoiceNo: item.InvoiceNo || "-",
            totalQty: item.TInQty || 0,
            qmConf: item.QmConf || "-"
        }));
        setItems(mappedItems);
        if(mappedItems.length > 0) setSelectedId(mappedItems[0].id);
        
        // [수정] 데이터가 들어왔다고 바로 RPA 시작하지 않음 (simulateRPA 제거)
        // 오직 Firebase logs 변화에 따라서만 움직임
    } else {
        setItems([]);
    }
  }, [externalData]);

  // 2. Firebase Logs 감지 (RPA 스텝 진행 로직 복구)
  useEffect(() => {
    if (!db) return;
    const logRef = ref(db, 'logs');
    const q = query(logRef, limitToLast(1)); // 마지막 1개만 감지
    
    const unsubscribe = onValue(q, (snapshot) => {
        const dataWrapper = snapshot.val();
        
        // 최초 마운트 시에는 기존 데이터 무시
        if (initialMount.current) {
            initialMount.current = false;
            return;
        }

        if (dataWrapper) {
            const key = Object.keys(dataWrapper)[0];
            const data = dataWrapper[key];
            
            // Status 필드 감지
            if (data && data.Status) {
                const newStatus = parseInt(data.Status, 10);
                if (!isNaN(newStatus)) {
                    // Queue에 추가 (중복 방지: 마지막 스텝과 같으면 무시)
                    setStepQueue(prev => {
                        if (prev.length > 0 && prev[prev.length - 1] === newStatus) return prev;
                        return [...prev, newStatus];
                    });
                }
            }
        }
    });

    return () => unsubscribe();
  }, []);

  // 3. Queue 처리기 (순차 실행 및 딜레이)
  useEffect(() => {
    const processQueue = async () => {
        if (stepQueue.length === 0 || isProcessingRef.current || showFailure || showComplete) return;

        isProcessingRef.current = true;
        const nextStatus = stepQueue[0];

        // 에러 코드 처리 (-1)
        if (nextStatus === -1) {
            triggerFailure("ERP 서버로부터 오류 코드가 수신되었습니다.");
            return;
        }

        // 순서 역행 방지 (단, 5 완료 후 1 재시작은 허용해야 하므로 예외 처리 필요하나, 기본적으론 오름차순 가정)
        // 여기서는 단순하게 진행
        
        const now = Date.now();
        const timeSinceLastUpdate = now - lastStepTimeRef.current;
        const minDelay = 1500; // 스텝 간 최소 1.5초 딜레이
        
        let waitTime = 0;
        // 1번 스텝은 즉시 시작, 그 외에는 딜레이 적용
        if (nextStatus > 1 && timeSinceLastUpdate < minDelay) {
            waitTime = minDelay - timeSinceLastUpdate;
        }

        if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // 상태 업데이트
        setRpaStep(nextStatus);
        lastStepTimeRef.current = Date.now();

        // 5번(저장완료) 도달 시 완료 팝업
        if (nextStatus === 5) {
            setTimeout(() => {
                setShowComplete(true);
                setStepQueue([]); 
            }, 2000); 
        }

        // 큐에서 제거
        setStepQueue(prev => prev.slice(1));
        isProcessingRef.current = false;
    };

    processQueue();
  }, [stepQueue, rpaStep, showFailure, showComplete]);

  // 실패 처리
  const triggerFailure = (specificReason?: string) => {
      const reason = specificReason || FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];
      setFailureReason(reason);
      setShowFailure(true);
      setStepQueue([]); 
      isProcessingRef.current = false;
  };

  // 실패 시 카운트다운 및 종료
  useEffect(() => {
      let timer: NodeJS.Timeout;
      if (showFailure && closeCountdown > 0) {
          timer = setInterval(() => {
              setCloseCountdown(prev => prev - 1);
          }, 1000);
      } else if (showFailure && closeCountdown === 0) {
          onClose(); 
      }
      return () => clearInterval(timer);
  }, [showFailure, closeCountdown, onClose]);

  const handleItemClick = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const activeItem = useMemo(() => items.find(i => i.id === selectedId) || (items.length > 0 ? items[0] : null), [items, selectedId]);
  const hasData = items.length > 0;

  return ( 
    <OverlayContainer initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} > 
      <HeaderBar> 
        <div className="brand"><ScanBarcode color="#60a5fa" strokeWidth={3}/> VISION AI SCANNER</div> 
        <button className="close-btn" onClick={onClose}><LuX size={20} strokeWidth={3}/></button> 
      </HeaderBar> 
      <MainGridInternal> 
        <AnimatePresence> 
          {showComplete && ( 
            <CompletionPopup initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }} transition={{ type: "spring", bounce: 0.5 }} > 
              <div className="icon-check"><CheckCircle2 size={48} strokeWidth={4} /></div> 
              <div className="text">RPA PROCESSING COMPLETE</div> 
            </CompletionPopup> 
          )} 
          {showFailure && (
            <FailurePopup initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }} transition={{ type: "spring", bounce: 0.5 }}>
                <div className="icon-fail"><XCircle size={48} strokeWidth={4} /></div>
                <div className="title">ERP 자동입고 처리 실패</div>
                <div className="reason">실패사유 : {failureReason}</div>
                <div className="countdown">시스템 종료까지 {closeCountdown}초...</div>
            </FailurePopup>
          )}
        </AnimatePresence> 
        
        {/* Left Pane: RPA View */}
        <div className="left-pane"> 
          <LayoutGroup> 
            <RPAStatusView step={rpaStep} isWearableConnected={isWearableConnected} streamUrl={streamUrl} />
          </LayoutGroup> 
        </div> 
        
        {/* Right Panel */}
        <div className="right-pane"> 
          <RightContentContainer>
            {hasData ? (
              <>
                <TopInfoSection>
                  <InfoInputBox>
                    <div className="label-area"><Calendar size={13}/> 송장번호</div>
                    <div className="value-area">{activeItem ? activeItem.invoiceNo : '-'}</div>
                  </InfoInputBox>
                  <SplitRow>
                    <InfoInputBox>
                      <div className="label-area"><Calendar size={13}/> 입고일자</div>
                      <div className="value-area">{activeItem ? activeItem.date : '-'}</div>
                    </InfoInputBox>
                    <InfoInputBox>
                      <div className="label-area"><Truck size={13}/> 거래처명</div>
                      <div className="value-area">{activeItem ? activeItem.vendor : '-'}</div>
                    </InfoInputBox>
                  </SplitRow>
                </TopInfoSection>

                <ListSection>
                  <div className="header"><ListTodo size={14}/> 입고 예정 리스트 (Live)</div>
                  <div className="list-scroll-view">
                    {items.map(item => (
                      <MemoizedItemCard key={item.id} item={item} selectedId={selectedId} onClick={handleItemClick} />
                    ))}
                  </div>
                </ListSection>

                <DetailSection>
                    <AnimatePresence mode="wait">
                      {activeItem && (
                        <motion.div
                          key={activeItem.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                        >
                          <div className="title-area">
                            <h1>{activeItem.name}</h1>
                          </div>

                          <div className="grid-table">
                              <div className="grid-row">
                                <div className="lbl"><Box size={15}/> 품목번호 (CdGItem)</div>
                                <div className="val">{activeItem.code}</div>
                              </div>
                              <div className="grid-row">
                                <div className="lbl"><Layers size={15}/> 프로젝트명 (PrjName)</div>
                                <div className="val">{activeItem.project}</div>
                              </div>
                              <div className="grid-row">
                                <div className="lbl"><LuClipboardCheck size={15}/> 입고수량 (InQty)</div>
                                <div className="val qty">{activeItem.qty.toLocaleString()} <span style={{fontSize: '0.8em', fontWeight: 600, color: '#64748b'}}>EA</span></div>
                              </div>
                              <div className="grid-row">
                                <div className="lbl"><LuClipboardCheck size={15}/> 총입고수량 (TInQty)</div>
                                <div className="val">{activeItem.totalQty ? activeItem.totalQty.toLocaleString() : '-'} <span style={{fontSize: '0.8em', fontWeight: 600, color: '#64748b'}}>EA</span></div>
                              </div>
                              <div className="grid-row">
                                <div className="lbl"><LuFileText size={15}/> 검사구분명 (NmInspGB)</div>
                                <div className="val">{activeItem.type}</div>
                              </div>
                              <div className="grid-row">
                                <div className="lbl"><CheckCircle2 size={15}/> QM판정여부 (QmConf)</div>
                                <div className="val">{activeItem.qmConf || '-'}</div>
                              </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </DetailSection>

                <LogSection>
                    <div className="log-head">SYSTEM LOG</div>
                    <div className="log-body">
    [INFO] 웨어러블 API 데이터 수신 완료.<br/>
    [INFO] 송장번호: {activeItem ? activeItem.invoiceNo : 'N/A'}<br/>
    [INFO] ERP 데이터 대조 완료.<br/>
                    </div>
                </LogSection>
              </>
            ) : (
              // 데이터 없음 (Placeholder UI)
              <EmptyDataPlaceholder>
                <div className="icon"><Search size={32} /></div>
                <p>데이터를 조회하면 입고 정보가 표시됩니다.</p>
                <span>스캐너를 통해 바코드를 스캔해주세요.</span>
              </EmptyDataPlaceholder>
            )}

          </RightContentContainer>
        </div> 
      </MainGridInternal> 
    </OverlayContainer> 
  );
}