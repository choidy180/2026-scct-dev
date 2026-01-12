"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Scan, CheckCircle, AlertCircle, Activity, Box, Layers, Monitor, Cpu, Eye, X, Maximize2, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

// --- 1. 상수 및 타입 ---
const SCOPE_SIZE = 250;
const ZOOM_LEVEL = 6;

type InspectionStatus = '정상' | '점검필요' | '에러';
type CropPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type ScreenMode = 'FHD' | 'QHD';

interface HighlightRect {
  top: number; left: number; width: number; height: number;
}

interface CamData {
  id: string; title: string; status: InspectionStatus; icon: React.ReactNode; position: CropPosition;
  highlight: HighlightRect;
}

// [Sound] 비프음 재생 함수 (AudioContext 사용)
// 음량(Gain)을 0.05 -> 0.3으로 상향 조정
const playBeep = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        // 싱글톤 컨텍스트를 쓰거나 매번 생성하되, 여기서는 간단히 매번 생성 후 닫기 처리
        const ctx = new AudioContext();
        
        // suspended 상태면 재개 시도 (사용자 인터랙션 필요)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square'; // 경고음 성격의 강한 파형
        osc.frequency.setValueAtTime(880, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        
        // [수정] 볼륨 상향: 0.3 (기존 0.05)
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        
        // 메모리 누수 방지를 위해 재생 후 컨텍스트 정리 타이밍 잡기 (간단 구현)
        setTimeout(() => {
            if(ctx.state !== 'closed') ctx.close();
        }, 300);

    } catch (e) {
        console.error("Audio play failed", e);
    }
};

// --- 2. 해상도별 레이아웃 설정 ---
const LAYOUT_CONFIGS = {
  FHD: {
    padding: '20px',
    gap: '12px',
    cardHeight: '250px',
    cardPadding: '16px',
    fontSize: { title: '16px', sub: '12px', badge: '11px' },
    iconSize: 20,
    logoSize: 20,
    overlap: '-90px', 
  },
  QHD: {
    padding: '32px',
    gap: '24px',
    cardHeight: '380px',
    cardPadding: '24px',
    fontSize: { title: '22px', sub: '16px', badge: '14px' },
    iconSize: 30,
    logoSize: 28,
    overlap: '-120px', 
  }
};

const theme = {
  bg: '#F8FAFC', cardBg: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B',
  accent: '#3B82F6', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  border: '#E2E8F0', shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
};

const topCardsData: CamData[] = [
  { id: 'F2', title: 'Surface Check A', status: '정상', icon: <Layers />, position: 'top-left', highlight: { top: 10, left: 5, width: 32, height: 18 } },
  { id: 'F4', title: 'Dimension Check', status: '정상', icon: <Box />, position: 'top-center', highlight: { top: 5, left: 42, width: 16, height: 9 } },
  { id: 'F6', title: 'Scratch Check', status: '정상', icon: <Scan />, position: 'top-right', highlight: { top: 15, left: 65, width: 32, height: 18 } },
];

const bottomCardsData: CamData[] = [
  { id: 'F1', title: 'Edge Check L', status: '정상', icon: <Activity />, position: 'bottom-left', highlight: { top: 60, left: 5, width: 32, height: 18 } },
  { id: 'F3', title: 'Center Alignment', status: '점검필요', icon: <AlertCircle />, position: 'bottom-center', highlight: { top: 50, left: 42, width: 16, height: 9 } },
  { id: 'F5', title: 'Edge Check R', status: '정상', icon: <Activity />, position: 'bottom-right', highlight: { top: 65, left: 60, width: 32, height: 18 } },
];

// --- 3. 컴포넌트들 ---

// [NEW] 오디오 권한 요청 모달
const SoundPermissionModal = ({ onConfirm }: { onConfirm: () => void }) => {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 20000, 
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                backgroundColor: '#fff', padding: '32px', borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                maxWidth: '400px', width: '90%', textAlign: 'center',
                border: `1px solid ${theme.danger}`
            }}>
                <div style={{ 
                    width: '60px', height: '60px', backgroundColor: '#FEF2F2', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                }}>
                    <AlertTriangle size={32} color={theme.danger} />
                </div>
                
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: theme.textPrimary, marginBottom: '8px' }}>
                    시스템 경고 알림
                </h3>
                
                <p style={{ color: theme.textSecondary, marginBottom: '24px', lineHeight: '1.5' }}>
                    현재 공정 라인에 <strong style={{color: theme.danger}}>이상 징후(점검필요/에러)</strong>가 감지되었습니다.<br/>
                    알림음을 재생하기 위해 확인 버튼을 눌러주세요.
                </p>

                <button 
                    onClick={onConfirm}
                    style={{
                        backgroundColor: theme.danger, color: '#fff', border: 'none',
                        padding: '12px 24px', borderRadius: '8px', fontSize: '16px', fontWeight: 700,
                        cursor: 'pointer', width: '100%', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
                    }}
                >
                    확인 및 소리 켜기
                </button>
            </div>
             <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};


const ImageModal = ({ data, imageUrl, onClose }: { data: CamData, imageUrl: string, onClose: () => void }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const calculateZoomStyle = (highlight: HighlightRect): React.CSSProperties => {
        const { top, left, width, height } = highlight;
        const safeWidth = width <= 0.1 ? 0.1 : width;
        const safeHeight = height <= 0.1 ? 0.1 : height;
        const bgSizeX = (100 / safeWidth) * 100;
        const bgSizeY = (100 / safeHeight) * 100;
        const posX = (left / (100 - safeWidth)) * 100;
        const posY = (top / (100 - safeHeight)) * 100;

        return {
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
            backgroundPosition: `${posX}% ${posY}%`,
            backgroundRepeat: 'no-repeat',
        };
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000, 
            backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            
            <button style={{
                position: 'absolute', top: '32px', right: '32px',
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', transition: 'background 0.2s'
            }} onClick={onClose}>
                <X size={28} />
            </button>

            <div style={{
                width: '85vw', height: '85vh', 
                maxWidth: '1600px', maxHeight: '1000px',
                backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden',
                position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex', flexDirection: 'column',
                margin: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
                
                <div style={{
                    padding: '20px 32px', backgroundColor: '#1E293B', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid #334155'
                }}>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div style={{ color: theme.accent, padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                             {React.cloneElement(data.icon as React.ReactElement<any>, { size: 24 })}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 700 }}>{data.id} - Detail View</h3>
                            <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '14px' }}>{data.title} • {data.position.toUpperCase()}</p>
                        </div>
                    </div>
                    <Badge status={data.status} fontSize="14px" />
                </div>

                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#0f172a' }}>
                    <div style={{ 
                        width: '100%', height: '100%', 
                        transition: 'all 0.3s ease',
                        ...calculateZoomStyle(data.highlight) 
                    }} />
                    
                    <div style={{
                        position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                        padding: '8px 16px', background: 'rgba(0,0,0,0.6)', borderRadius: '20px',
                        color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <Maximize2 size={14} /> Full Resolution Inspection
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("시스템 초기화 중...");
    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + 2; 
                if (next > 20 && next < 50) setLoadingText("카메라 연결 중...");
                else if (next >= 50 && next < 80) setLoadingText("AI 비전 모델 로드...");
                else if (next >= 80) setLoadingText("대시보드 구성 완료...");
                if (next >= 100) { clearInterval(timer); setTimeout(onComplete, 300); return 100; }
                return next;
            });
        }, 10);
        return () => clearInterval(timer);
    }, [onComplete]);
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ position: 'relative', marginBottom: '40px' }}>
                <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: `2px solid ${theme.accent}30`, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                <div style={{ padding: '20px', backgroundColor: '#EFF6FF', borderRadius: '24px', boxShadow: `0 0 30px ${theme.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={48} color={theme.accent} />
                </div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: theme.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }}>Estify Vision System</h2>
                <p style={{ fontSize: '14px', color: theme.textSecondary, fontWeight: 500, minWidth: '200px' }}>{loadingText}</p>
            </div>
            <div style={{ width: '320px', position: 'relative' }}>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '10px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${theme.accent}, #60A5FA)`, borderRadius: '10px', transition: 'width 0.1s linear', boxShadow: `0 0 15px ${theme.accent}80` }} />
                </div>
            </div>
            <style jsx>{`@keyframes ping { 75%, 100% { transform: scale(1.5); opacity: 0; } }`}</style>
        </div>
    );
};

const VisionDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
  const [selectedCam, setSelectedCam] = useState<CamData | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  // [NEW] 권한 모달 표시 여부
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // [NEW] 진입 시 불량 검사 및 모달 띄우기
  useEffect(() => {
    if (!isLoading) {
        const allCards = [...topCardsData, ...bottomCardsData];
        const hasDefect = allCards.some(card => card.status === '점검필요' || card.status === '에러');
        
        // 불량이 있으면 권한 요청 모달 먼저 띄움 (자동 재생 정책 우회)
        if (hasDefect) {
            setShowPermissionModal(true);
        }
    }
  }, [isLoading]);

  // [NEW] 모달 확인 버튼 핸들러
  const handlePermissionConfirm = () => {
      // 1. 모달 닫기
      setShowPermissionModal(false);
      // 2. 소리 켜기 (이미 true여도 명시적으로)
      setIsSoundEnabled(true);
      // 3. [중요] 사용자 클릭 이벤트 내에서 첫 소리를 재생하여 AudioContext 활성화 (Unlock)
      playBeep(); 
  };

  // 반복 알림음 로직 (setInterval 사용)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // 모달이 떠있는 동안에는 자동 소리 루프를 돌리지 않음 (클릭 후 실행되도록)
    if (!isLoading && isSoundEnabled && !showPermissionModal) {
        const allCards = [...topCardsData, ...bottomCardsData];
        const hasDefect = allCards.some(card => card.status === '점검필요' || card.status === '에러');

        if (hasDefect) {
            // 이미 위에서 playBeep()을 한 번 호출했으므로, 1초 뒤부터 루프 시작
            intervalId = setInterval(() => {
                playBeep();
            }, 1000); 
        }
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading, isSoundEnabled, showPermissionModal]); // showPermissionModal 의존성 추가

  useEffect(() => {
    const handleResize = () => {
      setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const layout = LAYOUT_CONFIGS[screenMode];
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const targetBoxRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const [imageMetrics, setImageMetrics] = useState({ width: 0, height: 0, left: 0, top: 0 });

  const mainImageUrl = "/example_image.jpg"; 

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
      displayedWidth = containerRect.width;
      displayedHeight = containerRect.width / imageAspect;
      offsetLeft = 0;
      offsetTop = (containerRect.height - displayedHeight) / 2;
    } else {
      displayedWidth = containerRect.height * imageAspect;
      displayedHeight = containerRect.height;
      offsetLeft = (containerRect.width - displayedWidth) / 2;
      offsetTop = 0;
    }
    setImageMetrics({ width: displayedWidth, height: displayedHeight, left: offsetLeft, top: offsetTop });
  }, []);

  useEffect(() => {
    if (!isLoading) {
        updateImageMetrics();
        const timer = setTimeout(updateImageMetrics, 300);
        return () => clearTimeout(timer);
    }
  }, [screenMode, updateImageMetrics, isLoading]);

  useEffect(() => {
    window.addEventListener('resize', updateImageMetrics);
    if (imageRef.current?.complete) updateImageMetrics();
    return () => window.removeEventListener('resize', updateImageMetrics);
  }, [updateImageMetrics]);

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
        scopeRef.current.style.opacity = '0';
        scopeRef.current.style.transform = 'scale(0.8)';
        targetBoxRef.current.style.opacity = '0';
        return;
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
    if (scopeRef.current) {
      scopeRef.current.style.opacity = '0';
      scopeRef.current.style.transform = 'scale(0.8)';
    }
    if (targetBoxRef.current) {
      targetBoxRef.current.style.opacity = '0';
    }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const handleCardClick = (data: CamData) => {
    setSelectedCam(data);
  };

  const dynamicStyles = {
    container: {
      position: 'relative' as const,
      backgroundColor: theme.bg,
      height: 'calc(100vh - 64px)', 
      width: '100vw',
      padding: layout.padding,
      fontFamily: '"Inter", -apple-system, sans-serif',
      color: theme.textPrimary,
      display: 'flex',
      flexDirection: 'column' as const,
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
    },
    mainGrid: {
      display: 'flex',
      flexDirection: 'column' as const,
      flex: 1,
      minHeight: 0,
      position: 'relative' as const,
    },
    cardRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: layout.gap,
      height: layout.cardHeight,
      flexShrink: 0,
      position: 'relative' as const,
      zIndex: 5, 
    },
    mainViewContainer: {
      position: 'relative' as const,
      flex: 1.3,
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'default',
      zIndex: 1, 
      marginTop: layout.overlap,
      marginBottom: layout.overlap,
    },
    floatingWidget: {
      position: 'absolute' as const,
      bottom: '32px',
      right: '32px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      padding: '12px 24px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      border: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      zIndex: 100, 
    },
    logoText: {
        fontWeight: 800,
        fontSize: layout.fontSize.title,
        color: theme.textPrimary
    }
  };

  const getHighlightBoxStyle = (highlight: HighlightRect, status: InspectionStatus): React.CSSProperties => {
    let color = theme.accent;
    if (status === '점검필요') color = theme.warning;
    if (status === '에러') color = theme.danger;
    if (imageMetrics.width === 0) return { display: 'none' };
    const { width, height, left, top } = imageMetrics;
    return {
      position: 'absolute',
      left: `${left + (width * highlight.left / 100)}px`,
      top: `${top + (height * highlight.top / 100)}px`,
      width: `${width * highlight.width / 100}px`,
      height: `${height * highlight.height / 100}px`,
      border: `2px solid ${color}`, backgroundColor: `${color}33`, zIndex: 20, pointerEvents: 'none', boxSizing: 'border-box', boxShadow: `0 0 10px ${color}80`, borderRadius: '4px',
    };
  };

  const boxLabelStyle = (status: InspectionStatus): React.CSSProperties => {
    let color = theme.accent;
    if (status === '점검필요') color = theme.warning;
    if (status === '에러') color = theme.danger;
    return {
      position: 'absolute', top: '-24px', left: 0, backgroundColor: color, color: '#fff', fontSize: layout.fontSize.badge, fontWeight: 700, padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap',
    };
  };

  if (isLoading) {
      return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div style={dynamicStyles.container}>
      {/* [NEW] 권한 요청 모달 */}
      {showPermissionModal && (
          <SoundPermissionModal onConfirm={handlePermissionConfirm} />
      )}

      {selectedCam && (
          <ImageModal 
            data={selectedCam} 
            imageUrl={mainImageUrl} 
            onClose={() => setSelectedCam(null)} 
          />
      )}

      <div style={dynamicStyles.floatingWidget}>
        <div style={styles.logoGroup}>
          <Monitor size={layout.logoSize} color={theme.accent} />
          <span style={dynamicStyles.logoText}>Estify<span style={{color: theme.accent}}>Vision</span></span>
        </div>
        <div style={styles.vDivider} />
        <div style={styles.headerStats}>
          <HeaderItem label="System" value="OK" valueColor={theme.success} icon={<CheckCircle size={16} color={theme.success} />} layout={layout} />
          <HeaderItem label="Count" value="14,203" layout={layout} />
        </div>
        <div style={styles.vDivider} />
        <div style={styles.headerItem}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: theme.textSecondary, textTransform: 'uppercase' }}>Mode</span>
            <span style={{ fontSize: layout.fontSize.sub, fontWeight: 700, display: 'flex', alignItems: 'center', color: theme.textPrimary }}>
                <Eye size={16} style={{marginRight: '6px'}} /> 
                Live (x{ZOOM_LEVEL})
            </span>
        </div>
        
        <div style={styles.vDivider} />
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setIsSoundEnabled(!isSoundEnabled)}>
             {isSoundEnabled ? <Volume2 size={20} color={theme.accent} /> : <VolumeX size={20} color={theme.textSecondary} />}
        </div>
      </div>

      <div style={dynamicStyles.mainGrid}>
        <div style={dynamicStyles.cardRow}>
          {topCardsData.map((card) => (
            <StatusCard 
                key={card.id} 
                data={card} 
                imageUrl={mainImageUrl} 
                layout={layout} 
                onClick={() => handleCardClick(card)} 
            />
          ))}
        </div>

        <div ref={containerRef} style={dynamicStyles.mainViewContainer} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <img ref={imageRef} src={mainImageUrl} alt="Local Image" style={styles.mainImage} onLoad={updateImageMetrics} onError={(e) => e.currentTarget.style.display = 'none'} />
          
          {imageMetrics.width > 0 && [...topCardsData, ...bottomCardsData].map((card) => (
            <div key={`box-${card.id}`} style={getHighlightBoxStyle(card.highlight, card.status)}>
              <div style={boxLabelStyle(card.status)}>{card.id}</div>
            </div>
          ))}
          
          <div ref={targetBoxRef} style={styles.targetBox} />

          <div ref={scopeRef} style={{...styles.scopeLens, backgroundImage: `url(${mainImageUrl})`}}>
            <div style={styles.reticleH} /><div style={styles.reticleV} />
          </div>
        </div>

        <div style={dynamicStyles.cardRow}>
          {bottomCardsData.map((card) => (
            <StatusCard 
                key={card.id} 
                data={card} 
                imageUrl={mainImageUrl} 
                layout={layout} 
                onClick={() => handleCardClick(card)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const HeaderItem = ({ label, value, valueColor, icon, layout }: any) => (
  <div style={styles.headerItem}>
    <span style={{ fontSize: '10px', fontWeight: 600, color: theme.textSecondary, textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: layout.fontSize.sub, fontWeight: 700, display: 'flex', alignItems: 'center', color: valueColor || theme.textPrimary }}>
      {icon && <span style={{ marginRight: '4px', display: 'flex' }}>{icon}</span>}{value}
    </span>
  </div>
);

const StatusCard = ({ data, imageUrl, layout, onClick }: { data: CamData, imageUrl: string, layout: any, onClick?: () => void }) => {
  const calculateCropStyle = (highlight: HighlightRect): React.CSSProperties => {
    const { top, left, width, height } = highlight;
    const safeWidth = width <= 0.1 ? 0.1 : width;
    const safeHeight = height <= 0.1 ? 0.1 : height;
    const bgSizeX = (100 / safeWidth) * 100;
    const bgSizeY = (100 / safeHeight) * 100;
    const posX = (left / (100 - safeWidth)) * 100;
    const posY = (top / (100 - safeHeight)) * 100;
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat',
    };
  };

  const IconComponent = React.cloneElement(data.icon as React.ReactElement<any>, { 
    size: layout.iconSize 
  });

  return (
    <div style={{...styles.card, padding: layout.cardPadding}} onClick={onClick}>
      <div style={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: theme.accent }}>{IconComponent}</span>
          <span style={{ fontWeight: 700, fontSize: layout.fontSize.title }}>{data.id}</span>
        </div>
        <Badge status={data.status} fontSize={layout.fontSize.badge} />
      </div>
      
      <div style={{...styles.cropContainer, cursor: 'zoom-in' }}>
        <div style={{ ...styles.cropImage, ...calculateCropStyle(data.highlight) }} />
        <div style={styles.cropOverlay}>{data.position.replace('-', ' ').toUpperCase()} Area</div>
      </div>
      
      <div style={{ fontSize: layout.fontSize.sub, color: theme.textSecondary, fontWeight: 500, marginTop: '8px' }}>
        {data.title}
      </div>
    </div>
  );
};

const Badge = ({ status, fontSize }: { status: InspectionStatus, fontSize: string }) => {
  const colors = status === '정상' ? { bg: theme.success + '20', text: theme.success } : status === '점검필요' ? { bg: theme.warning + '20', text: theme.warning } : { bg: theme.danger + '20', text: theme.danger };
  return <span style={{ ...styles.badge, backgroundColor: colors.bg, color: colors.text, fontSize: fontSize }}>{status}</span>;
};

// --- Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  logoGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
  headerStats: { display: 'flex', alignItems: 'center', gap: '16px' },
  headerItem: { display: 'flex', flexDirection: 'column', gap: '0px' },
  vDivider: { width: '1px', height: '16px', backgroundColor: theme.border },
  mainImage: { maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block', cursor: 'none' },
  scopeLens: { position: 'absolute', top: 0, left: 0, width: `${SCOPE_SIZE}px`, height: `${SCOPE_SIZE}px`, borderRadius: '50%', border: `2px solid ${theme.accent}`, backgroundColor: '#fff', backgroundRepeat: 'no-repeat', backgroundSize: `${ZOOM_LEVEL * 100}%`, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 50, opacity: 0, transform: 'scale(0.8)', transition: 'opacity 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)', willChange: 'transform, opacity' },
  reticleH: { position: 'absolute', top: '50%', left: '15%', width: '70%', height: '1px', backgroundColor: theme.accent, opacity: 0.5 },
  reticleV: { position: 'absolute', left: '50%', top: '15%', height: '70%', width: '1px', backgroundColor: theme.accent, opacity: 0.5 },
  card: { backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.2s', height: '100%', boxSizing: 'border-box' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  cropContainer: { width: '100%', flex: 1, minHeight: 0, borderRadius: '6px', overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}`, backgroundColor: '#f1f5f9', transition: 'opacity 0.2s' },
  cropImage: { width: '100%', height: '100%', backgroundRepeat: 'no-repeat', transition: 'transform 0.5s ease' },
  cropOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', color: 'white', fontSize: '10px', fontWeight: 600, textAlign: 'center', letterSpacing: '0.5px' },
  badge: { padding: '2px 8px', borderRadius: '10px', fontWeight: 700 },
  targetBox: {
    position: 'absolute',
    top: 0, left: 0,
    width: '0px', height: '0px',
    border: `2px solid ${theme.accent}`,
    boxShadow: `0 0 10px ${theme.accent}`,
    backgroundColor: 'transparent',
    zIndex: 40,
    pointerEvents: 'none',
    opacity: 0,
    willChange: 'transform, width, height',
  }
};

export default VisionDashboard;