'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// --- Firebase Imports ---
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, Database } from "firebase/database";

import {
  LuWifi,
  LuWifiOff,
  LuMaximize,
  LuMinimize,
  LuPlay,
} from "react-icons/lu";

import {
  ScanEye,
  FileText,
  History,
  BatteryCharging,
  Wifi,
  MoreHorizontal,
  AlertCircle,
  Thermometer,
  ShieldAlert,
  LayoutTemplate,
  CircleDashed,
  Barcode,
  Loader2,
  Cpu,
  Save,
  CheckCircle2,
  Zap 
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// ─── [CONFIG] Firebase Configuration ─────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAOBRFxZhVTJmP8_jdPNCFHSLN1FG9QAho",
  authDomain: "scct2026.firebaseapp.com",
  databaseURL: "https://scct2026-default-rtdb.firebaseio.com",
  projectId: "scct2026",
  storageBucket: "scct2026.firebasestorage.app",
  messagingSenderId: "496699213652",
  appId: "1:496699213652:web:b0f2c451096bd47b456ac1",
  measurementId: "G-D74LJZSR7H"
};

let app: FirebaseApp | undefined;
let db: Database | undefined;

try {
  if (firebaseConfig.apiKey.length > 10) { 
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
} catch (e) {
  console.warn("Firebase Init Failed:", e);
}

// ─── [CONFIG] System & Theme ─────────────────────────────

type StreamStatus = "idle" | "checking" | "ok" | "error";
const PORT = 8080;

const PROCESS_STEPS = [
  { id: 1, label: "데이터 수신 및 대기", icon: <Wifi size={20} /> },
  { id: 2, label: "바코드 / QR 스캔", icon: <Barcode size={20} /> },
  { id: 3, label: "AI 시각 정밀 분석", icon: <ScanEye size={20} /> },
  { id: 4, label: "결함 데이터 처리", icon: <Cpu size={20} /> },
  { id: 5, label: "서버 동기화 완료", icon: <Save size={20} /> },
];

interface HistoryStatusProps {
  status: 'ok' | 'fail';
}

const THEME = {
  bg: "#0f172a",
  primary: "#3B82F6",
  alert: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",
  textMain: "#1E293B",
  textSub: "#64748B",
  cardBg: "rgba(255, 255, 255, 0.85)",
  line: "#94A3B8",
};

const DATA_NODES = [
  { id: 1, title: "Detected Object", value: "Unattended Box", subValue: "Conf: 98%", color: THEME.warning, icon: <ScanEye size={18} />, tags: ["Zone B-2", "Cardboard"] },
  { id: 2, title: "Thermal Scan", value: "65°C (High)", subValue: "Heat Source", color: THEME.alert, icon: <Thermometer size={18} />, tags: ["Risk: Fire", "Sensor: IR"] },
  { id: 3, title: "Protocol", value: "Code Yellow", subValue: "Check Item", color: THEME.primary, icon: <FileText size={18} />, tags: ["View Log", "Share"] },
  { id: 4, title: "History", value: "New Entry", subValue: "10s ago", color: THEME.textSub, icon: <History size={18} />, tags: ["Line #2", "Cam #4"] },
  { id: 5, title: "Battery", value: "92%", subValue: "Connected", color: THEME.success, icon: <BatteryCharging size={18} />, tags: ["AC Power"] },
  { id: 6, title: "Network", value: "5G Stable", subValue: "12ms Latency", color: THEME.success, icon: <Wifi size={18} />, tags: ["Secure", "HD Stream"] },
];

const LAYOUT_CONFIG = {
  FHD: {
    arRadiusX: 280,
    arRadiusY: 160,
    hudOffsetX: 400,
    hudGapY_Left: 130,
    hudGapY_Right: 130,
    hudStartY_Left: -180,
    hudStartY_Right: -180,
  },
  QHD: {
    arRadiusX: 400,
    arRadiusY: 250,
    hudOffsetX: 550,
    hudGapY_Left: 160,
    hudGapY_Right: 160,
    hudStartY_Left: -220,
    hudStartY_Right: -220,
  }
};

// ─── [Components] AR Interface Parts ─────────────────────

function ARNodeItem({ data, x, y, index }: { data: any, x: number, y: number, index: number }) {
  return (
    <CardPositioner
      layout
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
      animate={{
        x, y, opacity: 1, scale: 1,
        transition: { type: "spring", stiffness: 80, damping: 15, delay: index * 0.1 }
      }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
    >
      <CardCentering>
        <ARCard $accentColor={data.color}>
          <ARCardHeader>
            <div className="icon-group">
              <IconBox $color={data.color}>{data.icon}</IconBox>
              <span className="title">{data.title}</span>
            </div>
            <MoreHorizontal size={16} color="#94A3B8" />
          </ARCardHeader>
          <ARCardBody>
            <div className="value">{data.value}</div>
            <div className="sub-row">
              <span className="sub-text" style={{ color: data.color }}>{data.subValue}</span>
            </div>
          </ARCardBody>
          <ARCardFooter>
            {data.tags.map((tag: string, i: number) => <Tag key={i}>{tag}</Tag>)}
          </ARCardFooter>
        </ARCard>
      </CardCentering>
    </CardPositioner>
  );
}

// ─── [Main] Dashboard Component ──────────────────────────

export default function SmartFactoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [statusText, setStatusText] = useState('시스템 초기화 중...');

  const [streamHost, setStreamHost] = useState("192.168.50.196");
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("idle");
  const [retryKey, setRetryKey] = useState(0);
  const streamUrl = streamHost ? `http://${streamHost}:${PORT}/` : null;

  const [isActive, setIsActive] = useState(false);
  const [isCircularLayout, setIsCircularLayout] = useState(true);
  const [isQHD, setIsQHD] = useState(false);

  // [상태 관리]
  const [processStep, setProcessStep] = useState(0); 
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showARNodes, setShowARNodes] = useState(false);
  const [processProgress, setProcessProgress] = useState(0); 
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousDataRef = useRef<string>(""); 

  useEffect(() => {
    const checkRes = () => setIsQHD(window.innerWidth > 2200);
    checkRes();
    window.addEventListener('resize', checkRes);
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullScreen) {
            setIsFullScreen(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', checkRes);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  const CONFIG = isQHD ? LAYOUT_CONFIG.QHD : LAYOUT_CONFIG.FHD;

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  const getCardPosition = (index: number) => {
    if (isCircularLayout) {
      const angleDeg = (index * (360 / DATA_NODES.length)) - 90;
      const radian = (angleDeg * Math.PI) / 180;
      return { x: Math.cos(radian) * CONFIG.arRadiusX, y: Math.sin(radian) * CONFIG.arRadiusY };
    } else {
      if (index < 3) return { x: -CONFIG.hudOffsetX, y: CONFIG.hudStartY_Left + (index * CONFIG.hudGapY_Left) };
      else { const rightIndex = index - 3; return { x: CONFIG.hudOffsetX, y: CONFIG.hudStartY_Right + (rightIndex * CONFIG.hudGapY_Right) }; }
    }
  };

  // 초기 로딩
  useEffect(() => {
    if (!loading) return;
    let interval = setInterval(() => {
      setProgress((prev) => {
        let inc = Math.random() * 5;
        if (prev < 30) { setStatusText('시스템 모듈 로드 중...'); inc = Math.random() * 8; }
        else if (prev < 60) { setStatusText('보안 프로토콜 연결 중...'); inc = Math.random() * 3; }
        else if (prev < 85) { setStatusText('AI 비전 모델 동기화 중...'); inc = Math.random() * 4; }
        else { setStatusText('대시보드 구성 완료...'); inc = Math.random() * 10; }
        const next = prev + inc;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsFadingOut(true), 500);
          setTimeout(() => setLoading(false), 1300);
          return 100;
        }
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [loading]);

  // 스트림 체크
  useEffect(() => {
    if (!streamUrl) { setStreamStatus("idle"); return; }
    let cancelled = false;
    async function checkStream() {
      setStreamStatus("checking");
      try {
        await fetch(streamUrl!, { method: "HEAD", mode: "no-cors", signal: AbortSignal.timeout(3000) });
        if (!cancelled) setStreamStatus("ok");
      } catch {
        if (!cancelled) setStreamStatus("error");
      }
    }
    checkStream();
    return () => { cancelled = true; };
  }, [streamUrl, retryKey]);

  // [핵심 로직] 시나리오 실행 함수
  const triggerProcess = () => {
    if (isProcessingRef.current) return;
    
    console.log("🚀 [System] Logic Sequence Started");
    isProcessingRef.current = true;
    setIsProcessing(true);
    
    setIsActive(true); 
    setProcessProgress(0);
    
    setIsPanelActive(true);
    setShowScanner(false);
    setShowARNodes(false);
    setProcessStep(1);

    setTimeout(() => {
        setProcessStep(2);
        setShowScanner(true);
    }, 3000);

    setTimeout(() => {
        setShowScanner(false);
        setShowARNodes(true);
        setProcessStep(3);
        setTimeout(() => setProcessStep(4), 4000); 
        setTimeout(() => setProcessStep(5), 8000); 
        setTimeout(() => setProcessStep(6), 12000); 
    }, 8000);

    setTimeout(() => {
        setIsActive(false);
        setIsPanelActive(false);
        setShowARNodes(false);
        isProcessingRef.current = false;
        setIsProcessing(false);
        setProcessStep(0);
        console.log("🏁 [System] Sequence Completed");
    }, 23000);
  };

  useEffect(() => {
    if (!db) return;
    const logsRef = ref(db, 'logs');
    let initialLoad = true;
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const currentString = JSON.stringify(snapshot.val() || {});
      if (initialLoad) {
        previousDataRef.current = currentString;
        initialLoad = false;
        return;
      }
      if (currentString !== previousDataRef.current) {
        console.log("🔥 [CHANGE] Triggering Sequence!");
        triggerProcess();
        previousDataRef.current = currentString;
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isPanelActive) {
      setProcessProgress(0);
      return;
    }
    let startTimestamp: number | null = null;
    const TOTAL_DURATION = 23000;
    const animateProgress = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / TOTAL_DURATION, 1);
      setProcessProgress(progress * 100);
      if (progress < 1 && isProcessingRef.current) {
         requestAnimationFrame(animateProgress);
      }
    };
    requestAnimationFrame(animateProgress);
  }, [isPanelActive]);

  return (
    <LayoutGroup>
      {(loading || isFadingOut) && (
        <LoadingWrapper $isFadingOut={isFadingOut}>
          <LogoText>Smart Factory <span>Dashboard</span></LogoText>
          <ProgressContainer><ProgressBar width={progress} /></ProgressContainer>
          <StatusText><span>{statusText}</span><span>{Math.floor(progress)}%</span></StatusText>
        </LoadingWrapper>
      )}

      {!loading && (
        <DashboardContainer $show={!loading}>
          <Column>
            <FullHeightCard>
              <CardHeader>
                <div className="left-group"><span className="badge">01</span><h3>입고차량 인식</h3></div>
              </CardHeader>
              <ImageArea>
                <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', background: '#f1f5f9'}}>차량 사진 CCTV</div>
                <div className="label">📸 차량사진</div>
              </ImageArea>
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#475569', marginBottom: '15px' }}>차량 정보</h4>
                <InfoRow><span className="label">차량번호</span><span className="value" style={{fontSize: '1.5rem', color: '#2563eb'}}>12우 1545</span></InfoRow>
                <hr style={{borderColor: '#e2e8f0', margin: '20px 0'}}/>
                <InfoRow><span className="label">공급업체</span><span className="value">(주)퓨처로지스</span></InfoRow>
                <InfoRow><span className="label">도착시간</span><span className="value">12:12</span></InfoRow>
                <InfoRow><span className="label">출차예정</span><span className="value">13:12</span></InfoRow>
                <InfoRow><span className="label">운전자</span><span className="value">김철수 기사님</span></InfoRow>
              </div>
              <div style={{marginTop: 'auto', background:'#fff1f2', padding:'15px', borderRadius:'8px', border: '1px solid #fecdd3'}}>
                <p style={{margin:0, color:'#e11d48', fontSize:'0.9rem', fontWeight: 'bold'}}>⚠️ 특이사항</p>
                <p style={{margin:'5px 0 0 0', fontSize:'0.95rem', color: '#881337'}}>사전 입고 예약 확인됨.<br/>A게이트 진입 허가.</p>
              </div>
            </FullHeightCard>
          </Column>

          <Column>
            <ExpandableCard
              layout
              data-fullscreen={isFullScreen}
              $isFullScreen={isFullScreen}
              transition={{ 
                layout: { duration: 0.6, type: "spring", stiffness: 80, damping: 20 } 
              }}
            >
              <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', zIndex: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{background: streamStatus === 'ok' ? '#10b981' : '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', marginRight:'10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    {streamStatus === 'ok' ? 'Live' : 'Standby'}
                  </div>
                  <h3 style={{color: '#1e293b', margin: 0, fontSize: '1.1rem', fontWeight: 700}}>자재검수 화면</h3>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <TriggerButton 
                    onClick={triggerProcess} 
                    disabled={isProcessing}
                    className={isProcessing ? 'processing' : ''}
                  >
                    {isProcessing ? (
                        <>
                            <Loader2 className="spinner" size={12} /> 시스템 점검중...
                        </>
                    ) : (
                        <>
                            <LuPlay size={12} /> DB변경테스트
                        </>
                    )}
                  </TriggerButton>

                  <IpInputWrapper>
                    <span className="label">CAM IP</span>
                    <input value={streamHost} onChange={(e) => { setStreamHost(e.target.value.trim()); setStreamStatus("idle"); }} placeholder="192.168.xx.xx" />
                  </IpInputWrapper>
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
                <StreamContainer ref={containerRef}>
                  {streamStatus === "ok" && streamUrl ? (
                    <StyledIframe src={streamUrl} allow="fullscreen" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        {streamStatus === 'checking' ? 'Connecting...' : 'No Signal'}
                    </div>
                  )}

                  <AROverlayLayer>
                    <GlobalTintLayer $isActive={isActive} />
                    <BackgroundGrid $isActive={isActive} />

                    {streamStatus !== 'ok' && (
                        <WaitingScreen>
                          <PulseCircle>
                             {streamStatus === 'checking' ? <LuWifi size={32} /> : <LuWifiOff size={32} color="#94a3b8" />}
                          </PulseCircle>
                          <WaitingText>
                            <h4>Waiting for Video Feed</h4>
                            <p>Check IP connection...</p>
                          </WaitingText>
                        </WaitingScreen>
                    )}

                    <LayoutControl>
                      <span className="label">VIEW MODE</span>
                      <ToggleContainer onClick={(e) => { e.stopPropagation(); setIsCircularLayout(!isCircularLayout); }}>
                        <div className={`bg ${isCircularLayout ? 'left' : 'right'}`} />
                        <div className={`option ${isCircularLayout ? 'active' : ''}`}><CircleDashed size={14} /> AR</div>
                        <div className={`option ${!isCircularLayout ? 'active' : ''}`}><LayoutTemplate size={14} /> HUD</div>
                      </ToggleContainer>
                    </LayoutControl>

                    <CenterOrigin>
                      <AnimatePresence>
                        {showARNodes && DATA_NODES.map((node, index) => {
                          const pos = getCardPosition(index);
                          return <ARNodeItem key={node.id} data={node} x={pos.x} y={pos.y} index={index} />;
                        })}
                      </AnimatePresence>

                      <SVGOverlay>
                        <AnimatePresence>
                          {showARNodes && isCircularLayout && DATA_NODES.map((node, i) => {
                            const pos = getCardPosition(i);
                            return (
                              <motion.line
                                key={`line-${node.id}`}
                                x1={0} y1={0} x2={pos.x} y2={pos.y}
                                stroke={THEME.line} strokeWidth="1.5" strokeDasharray="4 4"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.6 }}
                                exit={{ pathLength: 0, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                              />
                            );
                          })}
                        </AnimatePresence>
                      </SVGOverlay>
                    </CenterOrigin>

                    <AnimatePresence>
                      {showScanner && (
                        <ScannerOverlay
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.2 }}
                          transition={{ duration: 0.4 }}
                        >
                          <div className="scanner-frame">
                            <motion.div 
                              className="laser-line"
                              animate={{ top: ['0%', '100%', '0%'] }}
                              transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                            />
                            <div className="corner top-left" />
                            <div className="corner top-right" />
                            <div className="corner bottom-left" />
                            <div className="corner bottom-right" />
                            
                            <div className="scan-info">
                                <span className="blink">SCANNING TARGET...</span>
                                <span style={{fontVariantNumeric: 'tabular-nums'}}>ID: 884-XJ-99</span>
                            </div>
                          </div>
                        </ScannerOverlay>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {isPanelActive && (
                        <ProcessingCard
                            layout
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <div className="header">
                                <div className="title-wrapper">
                                    <Zap size={20} color="#fbbf24" fill="#fbbf24" />
                                    <span className="main-title">AI VISION INSPECTION</span>
                                </div>
                                <span className="timer">{Math.round(processProgress)}%</span>
                            </div>
                            
                            <ProgressBarContainer>
                                {/* [수정 1] 프로그래스바 색상: 형광 네온 그린 (#39FF14) + 밝은 옐로우 (#FFFF00) */}
                                <ProgressBarFill 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${processProgress}%` }}
                                    transition={{ type: "spring", stiffness: 60, damping: 20 }}
                                />
                            </ProgressBarContainer>

                            <StepsList>
                            {PROCESS_STEPS.map((step) => {
                                let status = 'pending'; 
                                if (processStep === step.id) status = 'active'; 
                                else if (processStep > step.id || processStep === 6) status = 'done'; 
                                
                                return (
                                <StepItem key={step.id} $status={status}>
                                    <div className="icon-box">
                                    {status === 'active' ? (
                                        <Loader2 className="spinner" size={16} />
                                    ) : status === 'done' ? (
                                        <CheckCircle2 size={16} />
                                    ) : (
                                        step.icon
                                    )}
                                    </div>
                                    <span className="label">{step.label}</span>
                                    {status === 'active' && <span className="status-badge">처리 중</span>}
                                </StepItem>
                                )
                            })}
                            </StepsList>

                            {processStep === 6 && (
                            <CompletionOverlay
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <div className="success-circle">
                                <CheckCircle2 size={64} color="#10b981" />
                                </div>
                                <span className="success-text">모든 검사 완료</span>
                            </CompletionOverlay>
                            )}
                        </ProcessingCard>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showARNodes && (
                        <EmergencyAlert
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
                        >
                          <AlertHeader>
                            <ShieldAlert size={20} color={THEME.alert} />
                            <div><span className="alert-title">CRITICAL WARNING</span><span className="alert-time">Live</span></div>
                          </AlertHeader>
                          <AlertBody>
                            <div className="issue-row"><span className="issue-label">Issue:</span><span className="issue-value">Thermal Anomaly</span></div>
                            <p className="description">Object temperature rising (65°C). Check IR Sensor.</p>
                          </AlertBody>
                          <ActionGuideBox>
                            <span className="guide-label">ACTION:</span>
                            <div className="guide-step"><AlertCircle size={14} /><span>Cooling system activated.</span></div>
                          </ActionGuideBox>
                        </EmergencyAlert>
                      )}
                    </AnimatePresence>
                  </AROverlayLayer>

                  <div style={{position:'absolute', right:'20px', top:'20px', background:'rgba(255,255,255,0.85)', padding:'20px', borderRadius:'12px', fontSize:'0.9rem', color: '#334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', zIndex: 90, border: '1px solid rgba(255,255,255,0.6)', pointerEvents: 'none'}}>
                      <div style={{fontWeight: 'bold', marginBottom: '10px', fontSize:'1rem'}}>📦 AI 검사 항목</div>
                      <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>✅ 박스 규격: <span style={{color:'#059669', fontWeight:'bold'}}>완료</span></div>
                      <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>✅ 수량 확인: <span style={{color:'#059669', fontWeight:'bold'}}>완료</span></div>
                      <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>🔲 파손 여부: <span style={{color:'#2563eb', fontWeight:'bold'}}>검사중 (AI)</span></div>
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>🔲 라벨 일치: <span style={{color:'#94a3b8'}}>대기</span></div>
                  </div>

                  {/* 전체화면 버튼 */}
                  <FullScreenBtn onClick={toggleFullScreen}>
                    {isFullScreen ? <LuMinimize size={20} /> : <LuMaximize size={20} />}
                  </FullScreenBtn>

                </StreamContainer>
              </div>
            </ExpandableCard>

            <Card style={{ height: '320px', flexShrink: 0 }}>
              <CardHeader>
                <div className="left-group"><span className="badge" style={{backgroundColor: '#6366f1'}}>02</span><h3>자재검수 통계 및 이력</h3></div>
                <div style={{marginLeft: 'auto', fontSize:'0.8rem', color:'#64748b', display: 'flex', alignItems: 'center', gap: '5px'}}>
                    <span style={{width: 8, height: 8, background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 0 2px #fecaca'}}></span> 실시간 집계중
                </div>
              </CardHeader>
              <StatsContainer>
                <div className="chart-area">
                  <ScoreBoard>
                    <div><span className="title">합격률</span><span className="score pass">98.5%</span></div>
                    <div><span className="title">불량률</span><span className="score fail">1.5%</span></div>
                    <div style={{flex:1, textAlign:'left', paddingLeft:'20px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                        <span className="title" style={{textAlign: 'left'}}>검수번호</span><span className="score" style={{color:'#334155', fontSize: '1rem'}}>AJQ121..</span>
                    </div>
                  </ScoreBoard>
                  <div style={{ width: '100%', flex: 1 }}>
                    <ResponsiveContainer>
                      <BarChart data={[{ name: '1번업체', 합격: 85, 불량: 15 }, { name: '2번업체', 합격: 90, 불량: 10 }, { name: '3번업체', 합격: 95, 불량: 5 }, { name: '4번업체', 합격: 98, 불량: 2 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} itemStyle={{color: '#1e293b'}} cursor={{fill: 'rgba(0,0,0,0.03)'}}/>
                        <Bar dataKey="합격" fill="#10b981" barSize={30} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="불량" fill="#f43f5e" barSize={30} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="history-area">
                  <h4>최근 검수 이력</h4>
                  <HistoryItem status="ok"><div><div style={{fontWeight: 600}}>퓨처로지스</div><div className="time">10:30</div></div><div className="status"></div></HistoryItem>
                  <HistoryItem status="ok"><div><div style={{fontWeight: 600}}>글로벌테크</div><div className="time">10:45</div></div><div className="status"></div></HistoryItem>
                  <HistoryItem status="fail"><div><div style={{fontWeight: 600}}>에이치물산</div><div className="time">11:00</div></div><div className="status"></div></HistoryItem>
                  <HistoryItem status="ok"><div><div style={{fontWeight: 600}}>대성산업</div><div className="time">11:15</div></div><div className="status"></div></HistoryItem>
                </div>
              </StatsContainer>
            </Card>
          </Column>
        </DashboardContainer>
      )}
    </LayoutGroup>
  );
}

// ─── [Styles & Animations] ─────────────────────────────

const fadeIn = keyframes` from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;
const shimmer = keyframes` 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); }`;
const ripple = keyframes` 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); } 70% { box-shadow: 0 0 0 30px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } `;
const breathing = keyframes` 0% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.95); opacity: 0.8; } `;
const spin = keyframes` to { transform: rotate(360deg); } `;
const progressStripes = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 20px 0; }
`;

const LoadingWrapper = styled.div<{ $isFadingOut: boolean }>` position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999; transition: opacity 0.8s ease-in-out; opacity: ${props => (props.$isFadingOut ? 0 : 1)}; pointer-events: ${props => (props.$isFadingOut ? 'none' : 'all')}; `;
const LogoText = styled.div` font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 40px; letter-spacing: -0.5px; span { color: #3b82f6; } `;
const ProgressContainer = styled.div` width: 400px; height: 8px; background-color: #e2e8f0; border-radius: 10px; overflow: hidden; position: relative; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); `;
const ProgressBar = styled.div<{ width: number }>` height: 100%; width: ${props => props.width}%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 10px; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; &::after { content: ''; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%); animation: ${shimmer} 1.5s infinite; } `;
const StatusText = styled.div` margin-top: 15px; font-size: 0.9rem; color: #64748b; font-weight: 500; min-height: 1.2em; display: flex; justify-content: space-between; width: 400px; `;
const DashboardContainer = styled.div<{ $show: boolean }>` width: 100%; height: calc(100vh - 64px); background-color: #f1f5f9; color: #0f172a; padding: 20px; box-sizing: border-box; display: grid; grid-template-columns: 350px 1fr; gap: 20px; font-family: 'Pretendard', sans-serif; overflow: hidden; animation: ${props => (props.$show ? css`${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none')}; opacity: 0; `;
const Column = styled.div` display: flex; flex-direction: column; gap: 20px; height: 100%; min-height: 0; `;
const Card = styled.div` background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); display: flex; flex-direction: column; position: relative; `;
const FullHeightCard = styled(Card)` height: 100%; `;

// [수정 2] 전체화면 시 Nav Bar(64px) 제외하고 꽉 차게 수정
const ExpandableCard = styled(motion.div)<{ $isFullScreen: boolean }>`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  flex: 1;
  padding: 0;
  will-change: transform, width, height;

  ${({ $isFullScreen }) => $isFullScreen && css`
    position: fixed;
    top: 0px; /* Nav bar 높이만큼 띄움 */
    left: 0;
    width: 100vw;
    height: calc(100vh - 64px); /* 전체 높이에서 Nav bar 높이 뺌 */
    z-index: 999; /* Nav bar보다 아래 혹은 위에 오도록 적절히 조절 */
    border-radius: 0;
    border: none;
    margin: 0;
  `}
`;

const CardHeader = styled.div` display: flex; align-items: center; margin-bottom: 15px; flex-shrink: 0; justify-content: space-between; .left-group { display: flex; align-items: center; } .badge { background-color: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-right: 10px; } h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; } `;
const ImageArea = styled.div` width: 100%; height: 200px; background-color: #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; position: relative; border: 1px solid #cbd5e1; img { width: 100%; height: 100%; object-fit: cover; } .label { position: absolute; top: 10px; left: 10px; background: rgba(255, 255, 255, 0.9); color: #0f172a; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 10; } `;
const InfoRow = styled.div` display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; span.label { color: #64748b; font-size: 0.9rem; font-weight: 500; } span.value { color: #0f172a; font-weight: 600; font-size: 1rem; } `;
const StreamContainer = styled.div` flex: 1; width: 100%; height: 100%; background: #000; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; `;
const StyledIframe = styled.iframe` width: 100%; height: 100%; border: none; display: block; object-fit: cover; position: absolute; inset: 0; z-index: 1; `;
const IpInputWrapper = styled.div` display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 4px 12px; border-radius: 20px; border: 1px solid #e2e8f0; input { border: none; background: transparent; font-size: 0.85rem; width: 100px; color: #334155; outline: none; text-align: right; &::placeholder { color: #94a3b8; } } span.label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; } `;
const StatsContainer = styled.div` display: flex; gap: 20px; height: 100%; min-height: 0; .chart-area { flex: 2; min-width: 0; display: flex; flex-direction: column; } .history-area { flex: 1; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 15px; overflow-y: auto; h4 { margin-top: 0; margin-bottom: 10px; font-size: 0.9rem; color: #64748b; } } `;
const ScoreBoard = styled.div` display: flex; gap: 15px; margin-bottom: 10px; div { background: #f1f5f9; padding: 8px 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; .title { font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px; } .score { font-size: 1.1rem; font-weight: bold; } .score.pass { color: #059669; } .score.fail { color: #e11d48; } } `;
const HistoryItem = styled.div<HistoryStatusProps>` display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; color: #334155; &:last-child { border-bottom: none; } .time { color: #94a3b8; margin-top: 2px; font-size: 0.8rem; } .status { width: 8px; height: 8px; border-radius: 50%; background: ${props => props.status === 'ok' ? '#10b981' : '#f43f5e'}; box-shadow: 0 0 0 2px ${props => props.status === 'ok' ? '#d1fae5' : '#fee2e2'}; } `;
const AROverlayLayer = styled.div` position: absolute; inset: 0; width: 100%; height: 100%; z-index: 50; pointer-events: none; display: flex; align-items: center; justify-content: center; overflow: hidden; `;
const GlobalTintLayer = styled.div<{ $isActive: boolean }>` position: absolute; inset: 0; background-color: ${({ $isActive }) => $isActive ? 'rgba(0,0,0,0.3)' : 'transparent'}; z-index: 1; transition: background-color 0.6s ease; `;
const BackgroundGrid = styled.div<{ $isActive: boolean }>` position: absolute; inset: 0; background-image: radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px); background-size: 40px 40px; opacity: ${({ $isActive }) => $isActive ? 0.4 : 0}; z-index: 2; transition: opacity 0.6s ease; `;
const LayoutControl = styled.div` position: absolute; top: 30px; left: 30px; z-index: 100; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; pointer-events: auto; .label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.8); letter-spacing: 1px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); } `;
const ToggleContainer = styled.div` background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); border-radius: 99px; display: flex; padding: 4px; position: relative; cursor: pointer; backdrop-filter: blur(4px); .bg { position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px); background: ${THEME.primary}; border-radius: 99px; transition: left 0.3s ease; &.left { left: 4px; } &.right { left: 50%; } } .option { position: relative; z-index: 1; display: flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); transition: color 0.3s; &.active { color: white; } } `;
const CenterOrigin = styled.div` position: relative; width: 0; height: 0; display: flex; align-items: center; justify-content: center; z-index: 20; `;
const SVGOverlay = styled.svg` position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: visible; z-index: 10; `;

const ProcessingCard = styled(motion.div)`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 380px;
  background: rgba(10, 10, 25, 0.90);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.3);
  color: white;
  overflow: hidden;
  z-index: 200;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    
    .title-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .main-title { 
        font-size: 1.1rem; 
        font-weight: 800;
        color: #ffffff;
        letter-spacing: 0.5px;
        white-space: nowrap;
        text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }

    .timer { font-size: 18px; font-weight: 800; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
`;

// [수정 1] 프로그래스바 색상 극대화: 네온 그린(#39FF14) ~ 형광 노랑(#FFFF00)
const ProgressBarFill = styled(motion.div)`
  height: 100%;
  border-radius: 6px;
  position: relative;
  overflow: hidden; /* 내부 패턴이 튀어나가지 않게 함 */

  /* 1. 베이스: 밝은 네온색 배경 (box-shadow 삭제됨) */
  background: linear-gradient(90deg, #39FF14, #7FFF00, #FFFF00);

  /* 2. 오버레이: 빗살무늬 패턴 (가상 요소 사용으로 흑백 현상 방지) */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    
    /* 흰색 반투명 빗살무늬 */
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.4) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0.4) 75%,
      transparent 75%,
      transparent
    );
    background-size: 20px 20px; /* 패턴 크기 */
    
    /* 패턴 움직임 애니메이션 */
    animation: ${progressStripes} 1s linear infinite;
  }
`;
const StepsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
`;

const StepItem = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: all 0.3s;
  
  background: ${({ $status }) => $status === 'active' ? 'rgba(59, 130, 246, 0.15)' : 'transparent'};
  border: 1px solid ${({ $status }) => $status === 'active' ? 'rgba(59, 130, 246, 0.4)' : 'transparent'};
  opacity: ${({ $status }) => $status === 'pending' ? 0.3 : 1};
  transform: ${({ $status }) => $status === 'active' ? 'scale(1.02)' : 'scale(1)'};

  .icon-box {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: ${({ $status }) => $status === 'active' ? '#3b82f6' : $status === 'done' ? '#10b981' : 'rgba(255,255,255,0.05)'};
    color: ${({ $status }) => $status === 'active' || $status === 'done' ? 'white' : '#94a3b8'};
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${({ $status }) => $status === 'active' ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none'};
    
    .spinner { animation: ${spin} 1s linear infinite; }
  }

  .label { 
    font-size: 14px; 
    font-weight: ${({ $status }) => $status === 'active' ? '700' : '500'};
    color: ${({ $status }) => $status === 'active' ? 'white' : $status === 'done' ? '#d1fae5' : '#94a3b8'};
    text-shadow: ${({ $status }) => $status === 'active' ? '0 0 10px rgba(59,130,246,0.5)' : 'none'};
  }

  .status-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 800;
    color: #ffffff; 
    text-shadow: 0 0 5px rgba(59, 130, 246, 0.8);
    text-transform: uppercase;
    animation: ${breathing} 1.5s infinite;
  }
`;

const CompletionOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 25, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  z-index: 10;
  
  .success-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
    animation: ${breathing} 2s infinite;
  }

  .success-text {
    font-size: 18px;
    font-weight: 900;
    color: #34d399;
    letter-spacing: 2px;
    text-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
    text-transform: uppercase;
  }
`;

const ScannerOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 150;
  pointer-events: none;

  .scanner-frame {
    width: 600px;
    height: 400px;
    position: relative;
    border: 1px solid rgba(239, 68, 68, 0.4);
    background: rgba(239, 68, 68, 0.05);
    box-shadow: 0 0 60px rgba(239, 68, 68, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .laser-line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: #ef4444;
    box-shadow: 0 0 20px #ef4444;
  }

  .corner {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 4px solid #ef4444;
    box-shadow: 0 0 15px #ef4444;
  }
  .top-left { top: -2px; left: -2px; border-right: none; border-bottom: none; }
  .top-right { top: -2px; right: -2px; border-left: none; border-bottom: none; }
  .bottom-left { bottom: -2px; left: -2px; border-right: none; border-top: none; }
  .bottom-right { bottom: -2px; right: -2px; border-left: none; border-top: none; }

  .scan-info {
    position: absolute;
    bottom: 15px;
    width: 100%;
    text-align: center;
    color: #ef4444;
    font-family: monospace;
    font-size: 16px;
    font-weight: 800;
    display: flex;
    justify-content: space-between;
    padding: 0 30px;
    text-shadow: 0 0 10px rgba(239,68,68,0.5);
  }

  .blink {
    animation: ${breathing} 0.5s infinite alternate;
  }
`;

const EmergencyAlert = styled(motion.div)` position: absolute; bottom: 30px; left: 30px; width: 280px; background: rgba(255, 255, 255, 0.95); border-radius: 14px; padding: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border-left: 5px solid ${THEME.alert}; z-index: 100; display: flex; flex-direction: column; gap: 10px; backdrop-filter: blur(12px); pointer-events: auto; `;
const AlertHeader = styled.div` display: flex; align-items: center; gap: 10px; .alert-title { font-size: 13px; font-weight: 800; color: ${THEME.alert}; letter-spacing: 0.5px; } .alert-time { font-size: 11px; color: ${THEME.textSub}; margin-left: auto; font-weight: 500; } `;
const AlertBody = styled.div` display: flex; flex-direction: column; gap: 5px; .issue-row { display: flex; gap: 6px; font-size: 13px; } .issue-label { font-weight: 600; color: ${THEME.textSub}; } .issue-value { font-weight: 800; color: ${THEME.textMain}; } .description { font-size: 12px; color: ${THEME.textSub}; line-height: 1.4; margin-top: 2px; } `;
const ActionGuideBox = styled.div` background: rgba(254, 242, 242, 0.8); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; border: 1px dashed rgba(220, 38, 38, 0.2); .guide-label { font-size: 10px; font-weight: 700; color: ${THEME.alert}; margin-bottom: 2px; } .guide-step { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #991B1B; svg { min-width: 14px; } } `;
const CardPositioner = styled(motion.div)` position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 20; `;
const CardCentering = styled.div` position: absolute; top: 0; left: 0; width: 220px; transform: translate(-50%, -50%); `;
const ARCard = styled.div<{ $accentColor: string }>` background: ${THEME.cardBg}; backdrop-filter: blur(16px); border-radius: 14px; padding: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); border: 1px solid rgba(255, 255, 255, 0.5); border-left: 4px solid ${({ $accentColor }) => $accentColor}; pointer-events: auto; `;
const ARCardHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; .icon-group { display: flex; align-items: center; gap: 8px; } .title { font-size: 12px; font-weight: 700; color: ${THEME.textSub}; text-transform: uppercase; letter-spacing: 0.5px; } `;
const IconBox = styled.div<{ $color: string }>` width: 28px; height: 28px; border-radius: 6px; background-color: ${({ $color }) => `${$color}15`}; color: ${({ $color }) => $color}; display: flex; align-items: center; justify-content: center; `;
const ARCardBody = styled.div` .value { font-size: 18px; font-weight: 800; color: ${THEME.textMain}; line-height: 1.2; letter-spacing: -0.3px; } .sub-row { margin-top: 3px; } .sub-text { font-size: 12px; font-weight: 600; } `;
const ARCardFooter = styled.div` display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; padding-top: 8px; border-top: 1px solid ${THEME.line}30; `;
const Tag = styled.span` background: rgba(241, 245, 249, 0.8); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; color: ${THEME.textSub}; `;
const WaitingScreen = styled.div` position: absolute; inset: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); color: #475569; z-index: 5; pointer-events: auto; `;
const PulseCircle = styled.div` width: 80px; height: 80px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); margin-bottom: 24px; position: relative; color: #3b82f6; animation: ${ripple} 2s infinite; svg { z-index: 2; } `;
const WaitingText = styled.div` display: flex; flex-direction: column; align-items: center; animation: ${breathing} 3s ease-in-out infinite; h4 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #334155; margin-bottom: 6px; } p { margin: 0; font-size: 0.9rem; color: #64748b; } `;
const FullScreenBtn = styled.button` position: absolute; bottom: 20px; right: 20px; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.25); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); z-index: 1000; pointer-events: auto; transition: all 0.2s; &:hover { background: rgba(255, 255, 255, 0.4); transform: scale(1.1); } `;

const TriggerButton = styled.button`
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
        background: #2563eb;
        transform: translateY(-1px);
    }

    &:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        opacity: 0.8;
    }

    &.processing {
        background: #475569;
        color: #e2e8f0;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }

    .spinner {
        animation: ${spin} 1s linear infinite;
    }
`;