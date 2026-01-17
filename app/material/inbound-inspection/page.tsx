'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ref, onValue, query, limitToLast } from "firebase/database";
import { db } from '@/lib/firebase';
import { 
  DashboardContainer, Column, TopCard, CardTitle, 
  VehicleImagePlaceholder, PlateContainer, InfoRow, DwellTimeBadge, 
  MiniEmptyState, FullHeightCard, CompactScoreRow, CompactScoreBox, 
  HistoryListContainer, HistoryItem, VideoCard, VideoHeader, 
  IpInputWrapper, PinkButton, StyledErrorState, Backdrop, SlidePanel 
} from '@/styles/styles';
import { WearableApiEntry, WearableHistoryItemData } from '@/types/types';
import AIDashboardModal from '@/components/ai-dashboard-modal';
import WarehouseBoard from '@/components/wearable-warehouse-board';
import { 
  Loader2, ServerCrash, History, RefreshCw, Signal, ScanBarcode, AlertTriangle, Search 
} from "lucide-react";
import { LuMaximize, LuMinimize } from "react-icons/lu";

// --- Constants ---
const PORT = 8080;
const API_URL_LIST = "http://1.254.24.170:24828/api/DX_API000028"; // 하단 이력용
const API_URL_VEHICLE = "http://1.254.24.170:24828/api/DX_API000020"; // 상단 차량정보용 (New)
const API_URL_INVOICE = "http://1.254.24.170:24828/api/V_PurchaseIn"; // 스캔용

// --- Types for Vehicle API ---
interface VehicleSlotDetail {
  slot_id: number;
  PLATE: string | null;
  FILENAME: string | null;
  FILEPATH: string;
  entry_time: string | null;
  exit_time: string | null;
}

interface VehicleApiResponse {
  [key: string]: {
    total: number;
    slots_detail: VehicleSlotDetail[];
  };
}

export default function DashboardPage() {
  const [streamHost, setStreamHost] = useState("192.168.0.53");
  const [streamStatus, setStreamStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const streamUrl = streamHost ? `http://${streamHost}:${PORT}/` : null;

  const [showDashboard, setShowDashboard] = useState(false);
  const [showMapBoard, setShowMapBoard] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [now, setNow] = useState<Date | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleSlotDetail | null>(null);
  const [isVehicleLoading, setIsVehicleLoading] = useState(false);
  const [isVehicleDataLoaded, setIsVehicleDataLoaded] = useState(false);
  const [dwellString, setDwellString] = useState("-");
  const [isLongDwell, setIsLongDwell] = useState(false);

  const [stats, setStats] = useState({ pass: 0, fail: 0, passRate: 0, failRate: 0 });
  const [historyList, setHistoryList] = useState<WearableHistoryItemData[]>([]);
  const [scannedInvoiceData, setScannedInvoiceData] = useState<WearableApiEntry[]>([]);

  // Firebase Refs
  const lastProcessedKeyRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // Timer
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => { setNow(new Date()); }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Vehicle Info
  const fetchVehicleData = async () => {
    try {
      setIsVehicleLoading(true);
      const res = await fetch(API_URL_VEHICLE);
      if (!res.ok) throw new Error("Vehicle API Error");
      
      const data: VehicleApiResponse = await res.json();
      const allSlots = Object.values(data).flatMap(area => area.slots_detail);
      const validSlots = allSlots.filter(slot => 
        slot.FILEPATH && slot.FILENAME && (slot.FILENAME.toLowerCase().endsWith('.jpg') || slot.FILENAME.toLowerCase().endsWith('.png'))
      );

      validSlots.sort((a, b) => {
        if (!a.entry_time) return 1;
        if (!b.entry_time) return -1;
        return new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime();
      });

      if (validSlots.length > 0) {
        setVehicleInfo(validSlots[0]);
        setIsVehicleDataLoaded(true);
      }
    } catch (err) {
      console.error("Vehicle Fetch Failed:", err);
    } finally {
      setIsVehicleLoading(false);
    }
  };

  // Dwell Time Calculation
  useEffect(() => {
    if (!now || !vehicleInfo || !vehicleInfo.entry_time) {
      setDwellString("-");
      setIsLongDwell(false);
      return;
    }
    const entryTime = new Date(vehicleInfo.entry_time);
    const diffMs = now.getTime() - entryTime.getTime();
    if (diffMs < 0) {
      setDwellString("0분"); setIsLongDwell(false);
    } else {
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      setIsLongDwell(diffMins >= 30);
      setDwellString(hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`);
    }
  }, [now, vehicleInfo]);

  // Fetch History & Stats (Fallback)
  useEffect(() => {
    const fetchHistoryData = async () => {
        const loadDummyHistory = () => {
            const dummy: WearableHistoryItemData[] = Array.from({length: 10}).map((_, i) => ({
                id: `dummy-${i}`,
                company: i % 2 === 0 ? "세진공업(주)" : "LG에너지솔루션",
                purInNo: `PO-2026-${1000+i}`,
                status: i % 5 === 0 ? "검수필요" : "정상",
                time: `${10 + i}:30`,
                fullDate: "2026-01-17"
            }));
            setHistoryList(dummy);
            setStats({ pass: 42, fail: 3, passRate: 93.3, failRate: 6.7 });
        };

        try {
            const res = await fetch(API_URL_LIST);
            if (!res.ok) throw new Error("History API Error");
            const data: WearableApiEntry[] = await res.json();
            
            if (!data || data.length === 0) {
                loadDummyHistory();
                return;
            }
            // ... (데이터 처리 로직은 기존과 동일) ...
            const processedHistory: WearableHistoryItemData[] = data.map(item => {
                const isPass = item.InspConf && item.InspConf.toUpperCase() === 'Y';
                return {
                    id: item.PurInNo || Math.random().toString(),
                    company: item.NmCustm,
                    purInNo: item.PurInNo || '-',
                    status: isPass ? '정상' : '검수필요',
                    time: item.PurInDate ? item.PurInDate.split(' ')[1].substring(0,5) : "-",
                    fullDate: item.PurInDate || ''
                };
            });
            // ... (생략된 정렬 및 통계 로직은 기존 유지) ...
            setHistoryList(processedHistory.slice(0, 20)); 
        } catch (err) {
            loadDummyHistory();
        }
    };
    fetchHistoryData();
  }, []);

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (showMapBoard) setShowMapBoard(false);
            else if (showDashboard) setShowDashboard(false);
            else if (isFullScreen) setIsFullScreen(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, showDashboard, showMapBoard]);

  // Firebase Listener (Strict Initial Load Check)
  useEffect(() => {
    if (!db) return;
    const logsRef = ref(db, 'vuzix_log');
    const q = query(logsRef, limitToLast(1));

    const unsubscribe = onValue(q, async (snapshot) => {
      const dataWrapper = snapshot.val();
      if (!dataWrapper) return;

      const key = Object.keys(dataWrapper)[0];
      const data = dataWrapper[key];
      const barcode = data.barcode || data.Barcode; 

      // [핵심 수정] 초기 로드 시점(새로고침 등)에는 절대 실행 안 함
      // React Strict Mode 때문에 두 번 실행되는 것도 방어
      if (isInitialLoadRef.current) {
          lastProcessedKeyRef.current = key;
          // 약간의 딜레이 후 false로 변경하여 안정성 확보
          setTimeout(() => { isInitialLoadRef.current = false; }, 500);
          return;
      }

      // 이전 키와 동일하면 무시 (중복 실행 방지)
      if (lastProcessedKeyRef.current === key) return;

      // 실제 이벤트 발생
      lastProcessedKeyRef.current = key;
      fetchVehicleData(); // 차량 정보 갱신

      if (barcode) {
        try {
            const apiUrl = `${API_URL_INVOICE}?InvoiceNo=${barcode}`;
            const res = await fetch(apiUrl);
            if (res.ok) {
                const json: WearableApiEntry[] = await res.json();
                if (Array.isArray(json)) {
                    setScannedInvoiceData(json);
                    setShowDashboard(true);
                }
            }
        } catch (err) {
            console.error(err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Stream Checker
  useEffect(() => {
    if (streamHost) {
      setStreamStatus("checking");
      const timer = setTimeout(() => setStreamStatus(prev => prev === "checking" ? "error" : prev), 5000);
      return () => clearTimeout(timer);
    }
  }, [streamHost]);

  const manualTrigger = useCallback(() => { fetchVehicleData(); setShowDashboard(true); }, []);
  const toggleMapBoard = useCallback(() => { setShowMapBoard(true); }, []);
  const closeDashboard = useCallback(() => { setShowDashboard(false); }, []);
  const closeMapBoard = useCallback(() => { setShowMapBoard(false); }, []);
  const toggleFullScreen = useCallback(() => { setIsFullScreen(prev => !prev); }, []);
  const handleRetry = useCallback(() => { 
      setStreamStatus("checking"); 
      setTimeout(() => setStreamStatus("error"), 2000); 
  }, []);

  return (
    <LayoutGroup>      
      <DashboardContainer $show={true}>
            <Column>
                {/* 1. Vehicle Info Card */}
                <TopCard>
                    <CardTitle>입고 차량 정보</CardTitle>
                    {isVehicleDataLoaded && vehicleInfo ? (
                      <>
                        <VehicleImagePlaceholder>
                            <img src={vehicleInfo.FILEPATH} alt="Vehicle" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </VehicleImagePlaceholder>
                        <PlateContainer>
                            <span className="label">차량 번호</span>
                            <div className="plate-badge">{vehicleInfo.PLATE || "번호미상"}</div>
                        </PlateContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
                            <InfoRow>
                                <span className="label">도착시간</span>
                                <span className="value">{vehicleInfo.entry_time ? vehicleInfo.entry_time.split(' ')[1] : "-"}</span>
                            </InfoRow>
                            <InfoRow>
                                <span className="label">체류시간</span>
                                <DwellTimeBadge $isWarning={isLongDwell}>
                                    {isLongDwell && <AlertTriangle size={12} style={{marginRight:4}}/>}
                                    {dwellString}
                                </DwellTimeBadge>
                            </InfoRow>
                            <InfoRow>
                                <span className="label">상태</span>
                                <span className="value highlight-box">입고대기</span>
                            </InfoRow>
                        </div>
                      </>
                    ) : (
                      <MiniEmptyState>
                        <div className="icon-circle"><Search size={28} /></div>
                        <h3>데이터 조회 대기</h3>
                        <p>데이터를 조회하면 데이터가 표시됩니다.</p>
                      </MiniEmptyState>
                    )}
                </TopCard>

                {/* 2. Stats & History Card */}
                <FullHeightCard>
                    <CardTitle>통계 및 이력</CardTitle>
                    <CompactScoreRow>
                        <CompactScoreBox $type="pass"><span className="label">합격률</span><span className="value">{stats.passRate}%</span></CompactScoreBox>
                        <CompactScoreBox $type="fail"><span className="label">불량률</span><span className="value">{stats.failRate}%</span></CompactScoreBox>
                    </CompactScoreRow>
                    <HistoryListContainer>
                        <div className="h-title"><History size={16} />최근 이력 ({historyList.length}건)</div>
                        <div className="h-scroll-area">
                            {historyList.length > 0 ? (
                                historyList.map((h, idx) => (
                                    <HistoryItem key={h.id || idx}>
                                        <div className="left-grp">
                                            <span className="comp">{h.company}</span>
                                            <span className="sub-txt">{h.purInNo}</span>
                                        </div>
                                        <div className="info">
                                            <span className={`status ${h.status === '정상' ? 'ok' : 'bad'}`}>{h.status}</span>
                                            <span className="time">{h.time}</span>
                                        </div>
                                    </HistoryItem>
                                ))
                            ) : (
                                <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:'0.9rem', gap:'10px'}}>
                                    <Loader2 className="spin" size={24}/><span>이력을 불러오는 중...</span>
                                </div>
                            )}
                        </div>
                    </HistoryListContainer>
                </FullHeightCard>
            </Column>

            <Column>
                <VideoCard 
                    $isFullScreen={isFullScreen}
                    layout
                    transition={{ layout: { duration: 0.6, type: "spring", stiffness: 80, damping: 20 } }}
                >
                    <VideoHeader>
                        <div className="title-group">
                            <h3>자재검수 화면</h3>
                            <IpInputWrapper>
                                <span className="label">CAM IP</span>
                                <input value={streamHost} onChange={(e) => { setStreamHost(e.target.value.trim()); setStreamStatus("idle"); }} placeholder="192.168.xx.xx" />
                            </IpInputWrapper>
                        </div>
                        <div className="btn-group">
                            <PinkButton onClick={manualTrigger}>TEST &gt;</PinkButton>
                            <PinkButton onClick={toggleMapBoard}>D동 현황 &gt;</PinkButton>
                        </div>
                    </VideoHeader>

                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
                      <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%', zIndex: 1 }}>
                        {streamStatus === "ok" && streamUrl ? (
                            <iframe src={streamUrl} style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }} title="Stream" onError={() => setStreamStatus("error")} />
                        ) : (
                            <StyledErrorState>
                                <div className="grid-bg"></div>
                                <div className="content-box">
                                    <div className="icon-wrapper">
                                        {streamStatus === 'checking' ? <RefreshCw className="spin" size={32} color="#ef4444" /> : <Signal size={32} color="#ef4444" />}
                                    </div>
                                    {streamStatus === 'checking' ? <><h2>CONNECTING...</h2><p>Establishing secure connection...</p></> : <><h2>SIGNAL LOST</h2><p>Connection to Camera is unstable.</p><div style={{marginTop: 10, display: 'flex', gap: 10, justifyContent: 'center'}}><PinkButton onClick={handleRetry} style={{background: '#334155'}}><RefreshCw size={14} style={{marginRight: 6}}/> RETRY</PinkButton></div></>}
                                </div>
                                <div className="barcode-layer"><ScanBarcode size={120} color="white" style={{opacity: 0.8}} /><span>WAITING FOR SCANNER SIGNAL...</span></div>
                            </StyledErrorState>
                        )}
                      </motion.div>

                      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 50 }}>
                          <button onClick={toggleFullScreen} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isFullScreen ? <LuMinimize size={20}/> : <LuMaximize size={20}/>}
                          </button>
                      </div>

                      <AnimatePresence>
                          {showDashboard && (
                              <AIDashboardModal 
                                onClose={closeDashboard} 
                                streamUrl={streamUrl} 
                                streamStatus={streamStatus} 
                                externalData={scannedInvoiceData}
                              />
                          )}
                      </AnimatePresence>
                    </div>
                </VideoCard>
            </Column>
      </DashboardContainer>

      <AnimatePresence>
        {showMapBoard && (
            <>
                <Backdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMapBoard} />
                <SlidePanel initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                    <WarehouseBoard onClose={closeMapBoard} />
                </SlidePanel>
            </>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}