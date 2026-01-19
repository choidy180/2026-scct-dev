'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Loader2, History, RefreshCw, Signal, AlertTriangle, Search 
} from "lucide-react";
import { LuMaximize, LuMinimize } from "react-icons/lu";

// --- Constants ---
const PORT = 8080;
const API_URL_VEHICLE = "http://1.254.24.170:24828/api/DX_API000020";
const API_URL_INVOICE = "http://1.254.24.170:24828/api/V_PurchaseIn";

// --- Types ---
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

type StreamStatus = "idle" | "checking" | "ok" | "error";

export default function DashboardPage() {
  // [상태] 스트림 호스트 및 상태
  const [streamHost, setStreamHost] = useState("192.168.0.53");
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [retryKey, setRetryKey] = useState(0); 
  
  // Vuzix URL 포맷
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

  const lastProcessedKeyRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // Timer
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => { setNow(new Date()); }, 1000);
    return () => clearInterval(timer);
  }, []);

  // [수정] fetch 제거 -> new Image() 방식으로 변경
  // fetch는 로컬 IP 접근 시 CORS/Network 에러로 앱을 터뜨리지만,
  // Image 객체는 조용히 onload/onerror 이벤트만 발생시킵니다.
  useEffect(() => {
    if (!streamUrl) {
      setStreamStatus("idle");
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkStream = () => {
      setStreamStatus("checking");

      const img = new Image();
      
      // 5초 타임아웃 설정
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setStreamStatus("error");
          img.src = ""; // 연결 중단 시도
        }
      }, 5000);

      img.onload = () => {
        clearTimeout(timeoutId);
        if (isMounted) setStreamStatus("ok");
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        if (isMounted) setStreamStatus("error");
      };

      // 타임스탬프로 캐시 방지하여 요청
      img.src = `${streamUrl}?t=${Date.now()}`;
    };

    checkStream();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [streamUrl, retryKey]);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStreamHost(e.target.value.trim());
    if(streamStatus !== 'idle') setStreamStatus('idle');
  };

  // --- 기존 로직 유지 (차량 데이터 조회 등) ---
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

  useEffect(() => {
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
    loadDummyHistory();
  }, []);

  // Keyboard
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

  // Firebase
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

      if (isInitialLoadRef.current) {
          lastProcessedKeyRef.current = key;
          setTimeout(() => { isInitialLoadRef.current = false; }, 500);
          return;
      }
      if (lastProcessedKeyRef.current === key) return;
      lastProcessedKeyRef.current = key;
      fetchVehicleData();
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
        } catch (err) { console.error(err); }
      }
    });
    return () => unsubscribe();
  }, []);

  const manualTrigger = useCallback(() => { fetchVehicleData(); setShowDashboard(true); }, []);
  const toggleMapBoard = useCallback(() => { setShowMapBoard(true); }, []);
  const closeDashboard = useCallback(() => { setShowDashboard(false); }, []);
  const closeMapBoard = useCallback(() => { setShowMapBoard(false); }, []);
  const toggleFullScreen = useCallback(() => { setIsFullScreen(prev => !prev); }, []);

  return (
    <LayoutGroup>      
      <DashboardContainer $show={true}>
            <Column>
                {/* 1. Vehicle Info */}
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

                {/* 2. Stats & History */}
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
                                <input value={streamHost} onChange={handleHostChange} placeholder="192.168.xx.xx" />
                            </IpInputWrapper>
                        </div>
                        <div className="btn-group">
                            <PinkButton onClick={manualTrigger}>TEST &gt;</PinkButton>
                            <PinkButton onClick={toggleMapBoard}>D동 현황</PinkButton>
                        </div>
                    </VideoHeader>

                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
                      <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%', zIndex: 1 }}>
                        
                        {/* 상태에 따른 화면 렌더링 */}
                        {streamStatus === "ok" && streamUrl && (
                          <iframe 
                            src={streamUrl} 
                            style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }} 
                            title="Stream" 
                            allow="fullscreen"
                            // iframe 로드 실패 시 에러 처리
                            onError={() => setStreamStatus('error')}
                          />
                        )}

                        {streamStatus === "checking" && (
                          <StyledErrorState>
                              <RefreshCw className="spin" size={40} color="#3b82f6" />
                              <h2 style={{marginTop: 16, color: '#93c5fd'}}>CONNECTING...</h2>
                          </StyledErrorState>
                        )}

                        {streamStatus === "error" && (
                            <StyledErrorState>
                                <div className="grid-bg"></div>
                                <div className="content-box">
                                    <div className="icon-wrapper">
                                        <AlertTriangle size={32} color="#ef4444" />
                                    </div>
                                    <h2>CONNECTION FAILED</h2>
                                    <p>Check: IP / Power / Network</p>
                                    <div style={{marginTop: 10, display: 'flex', gap: 10, justifyContent: 'center'}}>
                                        <PinkButton onClick={handleRetry} style={{background: '#334155'}}>
                                            <RefreshCw size={14} style={{marginRight: 6}}/> RETRY
                                        </PinkButton>
                                    </div>
                                </div>
                            </StyledErrorState>
                        )}

                        {streamStatus === "idle" && (
                            <StyledErrorState>
                                <Signal size={40} color="#64748b" />
                                <p style={{marginTop:10}}>Enter Camera IP</p>
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