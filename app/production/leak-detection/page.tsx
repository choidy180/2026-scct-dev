"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Scan, CheckCircle, AlertCircle, Activity, Box, Layers, Monitor, Cpu, Eye, X, Volume2, VolumeX, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw, ClipboardX, Home } from 'lucide-react';

// --- 1. 상수 및 타입 (기존과 동일) ---
const SCOPE_SIZE = 250;
const ZOOM_LEVEL = 6;
const API_URL = "http://192.168.2.147:24828/api/DX_API000025";
const GUIDE_IMAGE_URL = "http://192.168.2.147:24828/images/DX_API000102/guide_2.jpg";

type InspectionStatus = '정상' | '점검필요' | '에러';
type CropPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type ScreenMode = 'FHD' | 'QHD';

interface HighlightRect {
  top: number; left: number; width: number; height: number;
}

interface CamData {
  id: string; 
  title: string; 
  status: InspectionStatus; 
  icon: React.ReactNode; 
  position: CropPosition;
  highlight: HighlightRect;
  specificImageUrl?: string;
}

interface TotalData {
    total_count: number;
    normal_count: number;
}

interface ApiResponse {
    success: boolean;
    data: Array<{
        TIMEVALUE: string;
        FILENAME1: string; FILENAME2: string; FILENAME3: string; 
        FILENAME4: string; FILENAME5: string; FILENAME6: string;
        FILEPATH1: string; FILEPATH2: string; FILEPATH3: string; 
        FILEPATH4: string; FILEPATH5: string; FILEPATH6: string;
        LABEL001: string; LABEL002: string; LABEL003: string; 
        LABEL004: string; LABEL005: string; LABEL006: string;
        RESULT: string;     
        COUNT_NUM: string;
    }>;
    total_data?: {
        total_count: number;
        normal_count: number;
    };
}

// --- 2. 테마 및 스타일 설정 (기존과 동일) ---
const THEME = {
  bg: '#F8FAFC', cardBg: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B',
  accent: '#3B82F6', border: '#E2E8F0',
  status: {
    ok: { bg: '#ECFDF5', text: '#059669', border: '#10B981' },
    ng: { bg: '#FEF2F2', text: '#DC2626', border: '#EF4444' },
    wait: { bg: '#F1F5F9', text: '#94A3B8', border: '#CBD5E1' }
  }
};

const LAYOUT_CONFIGS = {
  FHD: {
    padding: '20px', gap: '12px', cardHeight: '220px', cardPadding: '16px', 
    fontSize: { title: '16px', sub: '12px', badge: '11px' },
    iconSize: 20, logoSize: 20, overlap: '-60px', 
  },
  QHD: {
    padding: '32px', gap: '24px', cardHeight: '340px', cardPadding: '24px',
    fontSize: { title: '22px', sub: '16px', badge: '14px' },
    iconSize: 30, logoSize: 28, overlap: '-100px', 
  }
};

const GlobalStyles = () => (
    <style jsx global>{`
        @keyframes pulse-green-soft {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes pulse-red-soft {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
        }
        .animate-ok { animation: pulse-green-soft 2s infinite; }
        .animate-ng { animation: pulse-red-soft 2s infinite; }
        .animate-float { animation: float 4s ease-in-out infinite; }
    `}</style>
);

// --- 3. 초기 데이터 (기존과 동일) ---
const initialTopCards: CamData[] = [
  { id: 'CAM 02', title: 'Surface Check', status: '정상', icon: <Layers />, position: 'top-left', highlight: { top: 10, left: 5, width: 32, height: 18 } },
  { id: 'CAM 04', title: 'Dimension Check', status: '정상', icon: <Box />, position: 'top-center', highlight: { top: 5, left: 42, width: 16, height: 9 } },
  { id: 'CAM 06', title: 'Scratch Check', status: '정상', icon: <Scan />, position: 'top-right', highlight: { top: 15, left: 65, width: 32, height: 18 } },
];

const initialBottomCards: CamData[] = [
  { id: 'CAM 01', title: 'Edge Check L', status: '정상', icon: <Activity />, position: 'bottom-left', highlight: { top: 60, left: 5, width: 32, height: 18 } },
  { id: 'CAM 03', title: 'Alignment', status: '정상', icon: <AlertCircle />, position: 'bottom-center', highlight: { top: 50, left: 42, width: 16, height: 9 } },
  { id: 'CAM 05', title: 'Edge Check R', status: '정상', icon: <Activity />, position: 'bottom-right', highlight: { top: 65, left: 60, width: 32, height: 18 } },
];

// --- 4. 컴포넌트 구현 ---

// [NEW] 전체 화면 Empty State 컴포넌트
const FullScreenEmptyState = ({ onNavigateHome }: { onNavigateHome: () => void }) => {
    return (
        <div style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999, // 최상위 레벨
            backgroundColor: '#F8FAFC', // 대시보드 배경색과 동일하게 (불투명)
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontFamily: '"Inter", -apple-system, sans-serif'
        }}>
            {/* 상단 장식 라인 */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${THEME.accent}, #60A5FA)` }} />
            
            {/* 로고 표시 (선택사항) */}
            <div style={{ position: 'absolute', top: '40px', left: '40px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
                 <Monitor size={24} color={THEME.textSecondary} />
                 <span style={{ fontSize: '20px', fontWeight: 800, color: THEME.textSecondary }}>Estify<span style={{color: THEME.textSecondary}}>Vision</span></span>
            </div>

            {/* 메인 아이콘 */}
            <div className="animate-float" style={{ 
                width: '140px', height: '140px', borderRadius: '50%', 
                backgroundColor: '#EFF6FF', // Soft Blue
                color: THEME.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '40px',
                boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.2)' // 부드러운 그림자
            }}>
                <ClipboardX size={64} strokeWidth={1.2} />
            </div>

            {/* 텍스트 영역 */}
            <h2 style={{ 
                fontSize: '36px', fontWeight: 800, color: THEME.textPrimary, margin: '0 0 20px 0', letterSpacing: '-0.5px'
            }}>
                금일 검사 데이터가 없습니다
            </h2>
            <p style={{ 
                fontSize: '18px', color: THEME.textSecondary, lineHeight: '1.6', margin: '0 0 56px 0', 
                textAlign: 'center', maxWidth: '600px', wordBreak: 'keep-all'
            }}>
                현재 시스템에 등록된 검사 기록이 확인되지 않습니다.<br/>
                생산 라인이 가동 중인지 확인하거나, 잠시 후 다시 시도해 주세요.
            </p>

            {/* 버튼 영역 */}
            <button 
                onClick={onNavigateHome}
                style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    backgroundColor: '#fff', 
                    color: THEME.textPrimary,
                    border: `1px solid ${THEME.border}`, 
                    padding: '16px 40px', borderRadius: '16px', 
                    fontWeight: 700, fontSize: '16px',
                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.15)';
                    e.currentTarget.style.borderColor = THEME.accent;
                    e.currentTarget.style.color = THEME.accent;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = THEME.border;
                    e.currentTarget.style.color = THEME.textPrimary;
                }}
            >
                <Home size={20} />
                메인 화면으로 이동
            </button>
            
            <div style={{ position: 'absolute', bottom: '40px', fontSize: '14px', color: '#94A3B8' }}>
                System Status: <span style={{ color: '#10B981', fontWeight: 600 }}>Standby</span>
            </div>
        </div>
    );
};

// ... (DashboardHeader, InfoHeaderCell, InfoValueCell 등 기존 컴포넌트 유지) ...
const DashboardHeader = ({ apiData, totalStats, layout, onNavigateHome }: { apiData: any, totalStats: any, layout: any, onNavigateHome: () => void }) => {
    // ... (기존 판정 로직 동일) ...
    const resultStr = apiData?.RESULT || '';
    const isPass = resultStr === '정상' || resultStr.toUpperCase() === 'OK';
    const isFail = !isPass && !!resultStr;

    let style = THEME.status.wait;
    let Icon = Clock;
    let label = "READY";
    let subLabel = "SYSTEM STANDBY";
    let animClass = "";

    if (isPass) {
        style = THEME.status.ok;
        Icon = CheckCircle2;
        label = "OK (정상)";
        subLabel = "PASSED";
        animClass = "animate-ok";
    } else if (isFail) {
        style = THEME.status.ng;
        Icon = XCircle;
        label = "NG (불량)";
        subLabel = "FAILED";
        animClass = "animate-ng";
    }

    return (
        <div style={{ display: 'flex', gap: layout.gap, height: '100px', marginBottom: layout.gap, flexShrink: 0 }}>
            <div 
                onClick={onNavigateHome}
                style={{ 
                    width: '240px', backgroundColor: THEME.cardBg, borderRadius: '16px', border: `1px solid ${THEME.border}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Monitor size={24} color={THEME.accent} />
                    <span style={{ fontSize: '20px', fontWeight: 800, color: THEME.textPrimary }}>Estify<span style={{color:THEME.accent}}>Vision</span></span>
                </div>
                <span style={{ fontSize: '12px', color: THEME.textSecondary, fontWeight: 600 }}>Multi-Cam Inspection System</span>
            </div>

            <div className={animClass} style={{
                width: '280px', backgroundColor: THEME.cardBg, borderRadius: '16px', border: `1px solid ${THEME.border}`,
                display: 'flex', alignItems: 'center', padding: '0 24px', gap: '20px', position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '50%', backgroundColor: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.text, flexShrink: 0
                }}>
                    <Icon size={32} strokeWidth={2.5} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: THEME.textSecondary, fontWeight: 600 }}>TOTAL RESULT</span>
                    <span style={{ fontSize: '24px', color: style.text, fontWeight: 800, lineHeight: 1.1 }}>{label}</span>
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{subLabel}</span>
                </div>
            </div>

            <div style={{ 
                flex: 1, backgroundColor: THEME.cardBg, borderRadius: '16px', border: `1px solid ${THEME.border}`,
                display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', width: '100%', height: '40%', backgroundColor: '#F8FAFC', borderBottom: `1px solid ${THEME.border}` }}>
                    <InfoHeaderCell text="검사 시간" />
                    <InfoHeaderCell text="검사 수량" />
                    <InfoHeaderCell text="현재 상태" isLast />
                </div>
                <div style={{ display: 'flex', width: '100%', height: '60%' }}>
                    <InfoValueCell text={apiData?.TIMEVALUE || '00:00:00'} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${THEME.border}` }}>
                        {totalStats ? (
                             <div style={{ fontSize: '18px', fontWeight: 700, color: THEME.textPrimary }}>
                                <span style={{ color: THEME.status.ok.text }}>{totalStats.normal_count}</span>
                                <span style={{ color: '#CBD5E1', margin: '0 6px' }}>/</span>
                                <span>{totalStats.total_count}</span>
                             </div>
                        ) : (
                            <span style={{ fontSize: '18px', fontWeight: 700, color: THEME.textSecondary }}>-</span>
                        )}
                    </div>
                    <InfoValueCell text="RUNNING" isLast color={THEME.accent} />
                </div>
            </div>
        </div>
    );
};

const InfoHeaderCell = ({ text, isLast }: { text: string, isLast?: boolean }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: THEME.textSecondary, borderRight: isLast ? 'none' : `1px solid ${THEME.border}` }}>{text}</div>
);
const InfoValueCell = ({ text, isLast, color }: { text: string, isLast?: boolean, color?: string }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: color || THEME.textPrimary, borderRight: isLast ? 'none' : `1px solid ${THEME.border}` }}>{text}</div>
);

// 비프음 재생 함수
const playBeep = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        setTimeout(() => { if(ctx.state !== 'closed') ctx.close(); }, 300);
    } catch (e) { console.error(e); }
};

const SoundPermissionModal = ({ onConfirm }: { onConfirm: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 20000, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '400px', textAlign: 'center', border: '1px solid #EF4444' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#FEF2F2', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={32} color="#EF4444" /></div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>시스템 경고 알림</h3>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>이상 징후가 감지되었습니다.<br/>소리 알림을 켜시겠습니까?</p>
            <button onClick={onConfirm} style={{ backgroundColor: '#EF4444', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, width: '100%', cursor: 'pointer' }}>확인</button>
        </div>
    </div>
);

const ImageModal = ({ data, onClose }: { data: any, onClose: () => void }) => {
    const displayImage = data.specificImageUrl || GUIDE_IMAGE_URL;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ width: '85vw', height: '85vh', backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '20px 32px', backgroundColor: '#1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <h3 style={{ color: '#fff', margin: 0 }}>{data.id} - Detail View</h3>
                     <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={28} /></button>
                </div>
                <div style={{ flex: 1, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={displayImage} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            </div>
        </div>
    );
};

// 메인 대시보드
const VisionDashboard = () => {
  const router = useRouter();

  const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
  const [selectedCam, setSelectedCam] = useState<CamData | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  const [rawApiData, setRawApiData] = useState<any>(null);
  const [totalStats, setTotalStats] = useState<any>(null);

  const [topCards, setTopCards] = useState<CamData[]>(initialTopCards);
  const [bottomCards, setBottomCards] = useState<CamData[]>(initialBottomCards);
  
  const fetchData = useCallback(async () => {
    try {
        const response = await fetch(API_URL);
        const json: ApiResponse = await response.json();

        if (json.success) {
            if (json.data.length > 0) {
                const d = json.data[0];
                setRawApiData(d);
                const getStatus = (label: string): InspectionStatus => label === '정상' ? '정상' : '점검필요';
                setTopCards([
                    { ...initialTopCards[0], status: getStatus(d.LABEL002), specificImageUrl: d.FILEPATH2 },
                    { ...initialTopCards[1], status: getStatus(d.LABEL004), specificImageUrl: d.FILEPATH4 },
                    { ...initialTopCards[2], status: getStatus(d.LABEL006), specificImageUrl: d.FILEPATH6 }
                ]);
                setBottomCards([
                    { ...initialBottomCards[0], status: getStatus(d.LABEL001), specificImageUrl: d.FILEPATH1 },
                    { ...initialBottomCards[1], status: getStatus(d.LABEL003), specificImageUrl: d.FILEPATH3 },
                    { ...initialBottomCards[2], status: getStatus(d.LABEL005), specificImageUrl: d.FILEPATH5 }
                ]);
            }
            if (json.total_data) {
                setTotalStats({
                    total_count: json.total_data.total_count,
                    normal_count: json.total_data.normal_count
                });
            }
        }
    } catch (error) {
        console.error("API Fetch Error:", error);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleNavigateHome = () => {
      router.push('/'); 
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isSoundEnabled && !showPermissionModal) {
        const allCards = [...topCards, ...bottomCards];
        const hasDefect = allCards.some(card => card.status === '점검필요' || card.status === '에러');
        if (hasDefect) intervalId = setInterval(() => playBeep(), 1000); 
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isSoundEnabled, showPermissionModal, topCards, bottomCards]);

  useEffect(() => {
    const handleResize = () => setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
    handleResize(); window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const layout = LAYOUT_CONFIGS[screenMode];
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const targetBoxRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const [imageMetrics, setImageMetrics] = useState({ width: 0, height: 0, left: 0, top: 0 });

  const updateImageMetrics = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const container = containerRef.current;
    if (img.naturalWidth === 0) return;
    const imageAspect = img.naturalWidth / img.naturalHeight;
    const containerRect = container.getBoundingClientRect();
    const containerAspect = containerRect.width / containerRect.height;
    let displayedWidth, displayedHeight, offsetLeft, offsetTop;
    if (imageAspect > containerAspect) {
      displayedWidth = containerRect.width; displayedHeight = containerRect.width / imageAspect; offsetLeft = 0; offsetTop = (containerRect.height - displayedHeight) / 2;
    } else {
      displayedWidth = containerRect.height * imageAspect; displayedHeight = containerRect.height; offsetLeft = (containerRect.width - displayedWidth) / 2; offsetTop = 0;
    }
    setImageMetrics({ width: displayedWidth, height: displayedHeight, left: offsetLeft, top: offsetTop });
  }, []);

  useEffect(() => { updateImageMetrics(); const t = setTimeout(updateImageMetrics, 300); return () => clearTimeout(t); }, [screenMode, updateImageMetrics]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageRef.current || !scopeRef.current || !targetBoxRef.current) return;
    const clientX = e.clientX; const clientY = e.clientY;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(() => {
      if (!containerRef.current || !imageRef.current || !scopeRef.current || !targetBoxRef.current) return;
      const imageRect = imageRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const isInsideImage = clientX >= imageRect.left && clientX <= imageRect.right && clientY >= imageRect.top && clientY <= imageRect.bottom;
      if (!isInsideImage) {
        scopeRef.current.style.opacity = '0'; scopeRef.current.style.transform = 'scale(0.8)'; targetBoxRef.current.style.opacity = '0'; return;
      }
      const halfScope = SCOPE_SIZE / 2;
      const scopeLeft = clientX - containerRect.left - halfScope;
      const scopeTop = clientY - containerRect.top - halfScope;
      scopeRef.current.style.opacity = '1';
      scopeRef.current.style.transform = `translate3d(${scopeLeft}px, ${scopeTop}px, 0) scale(1)`;
      const relativeX = clientX - imageRect.left;
      const relativeY = clientY - imageRect.top;
      const bgX = (relativeX / imageRect.width) * 100;
      const bgY = (relativeY / imageRect.height) * 100;
      scopeRef.current.style.backgroundPosition = `${bgX}% ${bgY}%`;
      const targetSize = SCOPE_SIZE / ZOOM_LEVEL;
      const halfTarget = targetSize / 2;
      const targetLeft = clientX - containerRect.left - halfTarget;
      const targetTop = clientY - containerRect.top - halfTarget;
      targetBoxRef.current.style.opacity = '1';
      targetBoxRef.current.style.width = `${targetSize}px`;
      targetBoxRef.current.style.height = `${targetSize}px`;
      targetBoxRef.current.style.transform = `translate3d(${targetLeft}px, ${targetTop}px, 0)`;
    });
  };

  const handleMouseLeave = () => {
    if (scopeRef.current) { scopeRef.current.style.opacity = '0'; scopeRef.current.style.transform = 'scale(0.8)'; }
    if (targetBoxRef.current) { targetBoxRef.current.style.opacity = '0'; }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  return (
    <div style={{ 
        position: 'relative', backgroundColor: THEME.bg, height: 'calc(100vh - 64px)', width: '100vw', padding: layout.padding,
        fontFamily: '"Inter", -apple-system, sans-serif', color: THEME.textPrimary, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' 
    }}>
      <GlobalStyles />
      
      {/* [CHANGED] 전체 화면 Empty State 컴포넌트 사용 */}
      {totalStats && totalStats.total_count === 0 && (
          <FullScreenEmptyState onNavigateHome={handleNavigateHome} />
      )}

      {showPermissionModal && <SoundPermissionModal onConfirm={() => { setShowPermissionModal(false); setIsSoundEnabled(true); playBeep(); }} />}
      {selectedCam && <ImageModal data={selectedCam} onClose={() => setSelectedCam(null)} />}

      <DashboardHeader 
        apiData={rawApiData} 
        totalStats={totalStats} 
        layout={layout} 
        onNavigateHome={handleNavigateHome}
      />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: layout.gap, height: layout.cardHeight, flexShrink: 0, position: 'relative', zIndex: 5 }}>
          {topCards.map((card) => <StatusCard key={card.id} data={card} layout={layout} onClick={() => setSelectedCam(card)} />)}
        </div>

        <div ref={containerRef} style={{ position: 'relative', flex: 1.3, width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'default', zIndex: 1, marginTop: layout.overlap, marginBottom: layout.overlap }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <img ref={imageRef} src={GUIDE_IMAGE_URL} alt="Guide" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block', cursor: 'none' }} onLoad={updateImageMetrics} onError={(e) => e.currentTarget.style.display = 'none'} />
          <div ref={targetBoxRef} style={styles.targetBox} />
          <div ref={scopeRef} style={{...styles.scopeLens, backgroundImage: `url(${GUIDE_IMAGE_URL})`}}>
            <div style={styles.reticleH} /><div style={styles.reticleV} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: layout.gap, height: layout.cardHeight, flexShrink: 0, position: 'relative', zIndex: 5 }}>
          {bottomCards.map((card) => <StatusCard key={card.id} data={card} layout={layout} onClick={() => setSelectedCam(card)} />)}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '32px', right: '32px', display: 'flex', gap: '12px', zIndex: 100 }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '12px 20px', borderRadius: '12px', border: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <Eye size={16} /> <span style={{fontSize: '14px', fontWeight: 600}}>Live Mode (x{ZOOM_LEVEL})</span>
        </div>
        <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} style={{ 
            backgroundColor: isSoundEnabled ? THEME.accent : '#fff', color: isSoundEnabled ? '#fff' : '#64748B', 
            border: `1px solid ${THEME.border}`, borderRadius: '12px', width: '46px', height: '46px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' 
        }}>
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
    </div>
  );
};

const StatusCard = ({ data, layout, onClick }: { data: CamData, layout: any, onClick?: () => void }) => {
  const hasSpecificImage = !!data.specificImageUrl;
  const imageStyle: React.CSSProperties = hasSpecificImage ? {
      backgroundImage: `url(${data.specificImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
  } : {
    backgroundImage: `url(${GUIDE_IMAGE_URL})`, backgroundSize: '300%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
  };
  const IconComponent = React.cloneElement(data.icon as React.ReactElement<any>, { size: layout.iconSize });
  return (
    <div style={{ backgroundColor: THEME.cardBg, borderRadius: '12px', border: `1px solid ${THEME.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: layout.cardPadding, height: '100%', boxSizing: 'border-box', cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: THEME.accent }}>{IconComponent}</span>
          <span style={{ fontWeight: 700, fontSize: layout.fontSize.title }}>{data.id}</span>
        </div>
        <Badge status={data.status} fontSize={layout.fontSize.badge} />
      </div>
      <div style={{ width: '100%', flex: 1, minHeight: 0, borderRadius: '6px', overflow: 'hidden', position: 'relative', border: `1px solid ${THEME.border}`, backgroundColor: '#f1f5f9' }}>
        <div style={{ width: '100%', height: '100%', ...imageStyle, transition: 'transform 0.5s ease' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', color: 'white', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>{data.position.replace('-', ' ').toUpperCase()}</div>
      </div>
      <div style={{ fontSize: layout.fontSize.sub, color: THEME.textSecondary, fontWeight: 500, marginTop: '8px' }}>{data.title}</div>
    </div>
  );
};

const Badge = ({ status, fontSize }: { status: string, fontSize: string }) => {
  const colors = status === '정상' ? { bg: THEME.status.ok.bg, text: THEME.status.ok.text } : { bg: THEME.status.ng.bg, text: THEME.status.ng.text };
  return <span style={{ padding: '2px 8px', borderRadius: '10px', fontWeight: 700, backgroundColor: colors.bg, color: colors.text, fontSize }}>{status}</span>;
};

const styles: { [key: string]: React.CSSProperties } = {
  scopeLens: { position: 'absolute', top: 0, left: 0, width: `${SCOPE_SIZE}px`, height: `${SCOPE_SIZE}px`, borderRadius: '50%', border: `2px solid ${THEME.accent}`, backgroundColor: '#fff', backgroundRepeat: 'no-repeat', backgroundSize: `${ZOOM_LEVEL * 100}%`, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 50, opacity: 0, transform: 'scale(0.8)', transition: 'opacity 0.25s, transform 0.25s', willChange: 'transform, opacity' },
  reticleH: { position: 'absolute', top: '50%', left: '15%', width: '70%', height: '1px', backgroundColor: THEME.accent, opacity: 0.5 },
  reticleV: { position: 'absolute', left: '50%', top: '15%', height: '70%', width: '1px', backgroundColor: THEME.accent, opacity: 0.5 },
  targetBox: { position: 'absolute', top: 0, left: 0, width: '0px', height: '0px', border: `2px solid ${THEME.accent}`, boxShadow: `0 0 10px ${THEME.accent}`, backgroundColor: 'transparent', zIndex: 40, pointerEvents: 'none', opacity: 0 }
};

export default VisionDashboard;