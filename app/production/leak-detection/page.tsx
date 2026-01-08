"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Scan, CheckCircle, AlertCircle, Activity, Box, Layers, Monitor, Cpu } from 'lucide-react';

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

// --- 2. 해상도별 레이아웃 설정 (헤더 높이 제거됨) ---
const LAYOUT_CONFIGS = {
  FHD: {
    padding: '20px',
    gap: '12px',
    cardHeight: '250px', 
    cardPadding: '16px',
    fontSize: { title: '16px', sub: '12px', badge: '11px' },
    iconSize: 20,
    logoSize: 20,
  },
  QHD: {
    padding: '32px',
    gap: '24px',
    cardHeight: '380px',
    cardPadding: '24px',
    fontSize: { title: '22px', sub: '16px', badge: '14px' },
    iconSize: 30,
    logoSize: 28,
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

// [NEW] 고품질 로딩 화면 컴포넌트
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("시스템 초기화 중...");

    useEffect(() => {
        const duration = 1500; 
        const interval = 15;
        const step = 100 / (duration / interval);

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + step;
                
                if (next > 20 && next < 50) setLoadingText("카메라 연결 중...");
                else if (next >= 50 && next < 80) setLoadingText("AI 비전 모델 로드...");
                else if (next >= 80) setLoadingText("대시보드 구성 완료...");

                if (next >= 100) {
                    clearInterval(timer);
                    setTimeout(onComplete, 300);
                    return 100;
                }
                return next;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#FFFFFF',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ position: 'relative', marginBottom: '40px' }}>
                <div style={{ 
                    position: 'absolute', inset: -10, borderRadius: '50%', 
                    border: `2px solid ${theme.accent}30`, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' 
                }} />
                <div style={{ 
                    padding: '20px', backgroundColor: '#EFF6FF', borderRadius: '24px',
                    boxShadow: `0 0 30px ${theme.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Cpu size={48} color={theme.accent} />
                </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: theme.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                    Estify Vision System
                </h2>
                <p style={{ fontSize: '14px', color: theme.textSecondary, fontWeight: 500, minWidth: '200px' }}>
                    {loadingText}
                </p>
            </div>

            <div style={{ width: '320px', position: 'relative' }}>
                <div style={{ 
                    width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '10px', overflow: 'hidden',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        height: '100%', width: `${progress}%`, 
                        background: `linear-gradient(90deg, ${theme.accent}, #60A5FA)`,
                        borderRadius: '10px', transition: 'width 0.1s linear',
                        boxShadow: `0 0 15px ${theme.accent}80`
                    }} />
                </div>
                <div style={{ 
                    display: 'flex', justifyContent: 'space-between', marginTop: '8px', 
                    fontSize: '12px', fontWeight: 700, color: theme.accent 
                }}>
                    <span>System Booting</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes ping {
                    75%, 100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const VisionDashboard = () => {
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');

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

  const mainImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop";

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

  const dynamicStyles = {
    container: {
      position: 'relative' as const, // For floating widget
      backgroundColor: theme.bg,
      height: 'calc(100vh - 64px)', 
      width: '100vw',
      padding: layout.padding,
      fontFamily: '"Inter", -apple-system, sans-serif',
      color: theme.textPrimary,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: layout.gap,
      boxSizing: 'border-box' as const,
      overflow: 'hidden',
    },
    // Header 제거됨
    mainGrid: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: layout.gap,
      flex: 1, 
      minHeight: 0, 
    },
    cardRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: layout.gap,
      height: layout.cardHeight, 
      flexShrink: 0,
    },
    mainViewContainer: {
      position: 'relative' as const,
      flex: 1, // 헤더가 빠진 만큼 더 넓어진 공간을 차지함
      width: '100%',
      backgroundColor: '#fff',
      borderRadius: '16px',
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'default',
    },
    // ✅ Floating Widget Style (우측 하단)
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
      zIndex: 100, // 카드 위에 뜸
      maxWidth: '400px',
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
      {/* 1. Header 제거됨 */}
      
      {/* 2. Floating Widget (우측 하단 모달 형태) */}
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
      </div>

      <div style={dynamicStyles.mainGrid}>
        {/* Top Cards */}
        <div style={dynamicStyles.cardRow}>
          {topCardsData.map((card) => (<StatusCard key={card.id} data={card} imageUrl={mainImageUrl} layout={layout} />))}
        </div>

        {/* Main Viewport (가운데 영역 확장됨) */}
        <div ref={containerRef} style={dynamicStyles.mainViewContainer} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <img ref={imageRef} src={mainImageUrl} alt="Inspection Target" style={styles.mainImage} onLoad={updateImageMetrics} />
          
          {imageMetrics.width > 0 && [...topCardsData, ...bottomCardsData].map((card) => (
            <div key={`box-${card.id}`} style={getHighlightBoxStyle(card.highlight, card.status)}>
              <div style={boxLabelStyle(card.status)}>{card.id}</div>
            </div>
          ))}
          
          <div ref={targetBoxRef} style={styles.targetBox} />

          <div ref={scopeRef} style={{...styles.scopeLens, backgroundImage: `url(${mainImageUrl})`}}>
            <div style={styles.reticleH} /><div style={styles.reticleV} />
          </div>
          <div style={styles.mainLabel}>Live Inspection View (x{ZOOM_LEVEL}) - {screenMode}</div>
        </div>

        {/* Bottom Cards */}
        <div style={dynamicStyles.cardRow}>
          {bottomCardsData.map((card) => (<StatusCard key={card.id} data={card} imageUrl={mainImageUrl} layout={layout} />))}
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

const StatusCard = ({ data, imageUrl, layout }: { data: CamData, imageUrl: string, layout: any }) => {
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

  const IconComponent = React.cloneElement(data.icon as React.ReactElement<{ size: number }>, { 
    size: layout.iconSize 
  });

  return (
    <div style={{...styles.card, padding: layout.cardPadding}}>
      <div style={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: theme.accent }}>{IconComponent}</span>
          <span style={{ fontWeight: 700, fontSize: layout.fontSize.title }}>{data.id}</span>
        </div>
        <Badge status={data.status} fontSize={layout.fontSize.badge} />
      </div>
      
      <div style={styles.cropContainer}>
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
  mainImage: { maxHeight: '98%', maxWidth: '98%', objectFit: 'contain', display: 'block', cursor: 'none' },
  mainLabel: { position: 'absolute', bottom: '20px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: theme.textSecondary, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', pointerEvents: 'none', zIndex: 60 },
  scopeLens: { position: 'absolute', top: 0, left: 0, width: `${SCOPE_SIZE}px`, height: `${SCOPE_SIZE}px`, borderRadius: '50%', border: `2px solid ${theme.accent}`, backgroundColor: '#fff', backgroundRepeat: 'no-repeat', backgroundSize: `${ZOOM_LEVEL * 100}%`, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 50, opacity: 0, transform: 'scale(0.8)', transition: 'opacity 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)', willChange: 'transform, opacity' },
  reticleH: { position: 'absolute', top: '50%', left: '15%', width: '70%', height: '1px', backgroundColor: theme.accent, opacity: 0.5 },
  reticleV: { position: 'absolute', left: '50%', top: '15%', height: '70%', width: '1px', backgroundColor: theme.accent, opacity: 0.5 },
  card: { backgroundColor: theme.cardBg, borderRadius: '12px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.2s', height: '100%', boxSizing: 'border-box' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  cropContainer: { width: '100%', flex: 1, minHeight: 0, borderRadius: '6px', overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}`, backgroundColor: '#f1f5f9' },
  cropImage: { width: '100%', height: '100%', backgroundRepeat: 'no-repeat' },
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