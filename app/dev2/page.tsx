"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Scan, CheckCircle, AlertCircle, Activity, Box, Layers, Monitor } from 'lucide-react';

// --- 1. 상수 및 타입 ---
const SCOPE_SIZE = 250; // 돋보기 렌즈 크기 (px)
const ZOOM_LEVEL = 6;   // [수정] 줌 배율: 3배 -> 6배로 변경 (2배 더 확대됨)

type InspectionStatus = '정상' | '점검필요' | '에러';
type CropPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface HighlightRect {
  top: number; left: number; width: number; height: number;
}

interface CamData {
  id: string; title: string; status: InspectionStatus; icon: React.ReactNode; position: CropPosition;
  highlight: HighlightRect;
}

const theme = {
  bg: '#F8FAFC', cardBg: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B',
  accent: '#3B82F6', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  border: '#E2E8F0', shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
};

// --- 2. 데이터 (외부 박스 비율 16:9 유지) ---
const topCardsData: CamData[] = [
  { 
    id: 'F2', title: 'Surface Check A', status: '정상', icon: <Layers size={18} />, position: 'top-left',
    highlight: { top: 10, left: 5, width: 32, height: 18 } 
  },
  { 
    id: 'F4', title: 'Dimension Check', status: '정상', icon: <Box size={18} />, position: 'top-center',
    highlight: { top: 5, left: 42, width: 16, height: 9 }
  },
  { 
    id: 'F6', title: 'Scratch Check', status: '정상', icon: <Scan size={18} />, position: 'top-right',
    highlight: { top: 15, left: 65, width: 32, height: 18 }
  },
];

const bottomCardsData: CamData[] = [
  { 
    id: 'F1', title: 'Edge Check L', status: '정상', icon: <Activity size={18} />, position: 'bottom-left',
    highlight: { top: 60, left: 5, width: 32, height: 18 } 
  },
  { 
    id: 'F3', title: 'Center Alignment', status: '점검필요', icon: <AlertCircle size={18} />, position: 'bottom-center',
    highlight: { top: 50, left: 42, width: 16, height: 9 }
  },
  { 
    id: 'F5', title: 'Edge Check R', status: '정상', icon: <Activity size={18} />, position: 'bottom-right',
    highlight: { top: 65, left: 60, width: 32, height: 18 } 
  },
];

const VisionDashboard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const targetBoxRef = useRef<HTMLDivElement>(null); // 동적 타겟 박스
  const requestRef = useRef<number | null>(null);
  const [imageMetrics, setImageMetrics] = useState({ width: 0, height: 0, left: 0, top: 0 });

  const mainImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop";

  // --- 이미지 메트릭 계산 ---
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
    window.addEventListener('resize', updateImageMetrics);
    if (imageRef.current?.complete) updateImageMetrics();
    const timer = setTimeout(updateImageMetrics, 100);
    return () => { window.removeEventListener('resize', updateImageMetrics); clearTimeout(timer); };
  }, [updateImageMetrics]);

  // --- Zoom Logic ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageRef.current || !scopeRef.current || !targetBoxRef.current) return;
    const clientX = e.clientX; const clientY = e.clientY;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    requestRef.current = requestAnimationFrame(() => {
      if (!containerRef.current || !imageRef.current || !scopeRef.current || !targetBoxRef.current) return;
      
      const imageRect = imageRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // 마우스가 실제 이미지 영역 내부에 있는지 확인
      const isInsideImage = clientX >= imageRect.left && clientX <= imageRect.right && clientY >= imageRect.top && clientY <= imageRect.bottom;

      if (!isInsideImage) {
        scopeRef.current.style.opacity = '0';
        scopeRef.current.style.transform = 'scale(0.8)';
        targetBoxRef.current.style.opacity = '0'; // 타겟 박스 숨김
        return;
      }

      // 1. 스코프 렌즈 위치 이동
      const halfScope = SCOPE_SIZE / 2;
      const scopeLeft = clientX - containerRect.left - halfScope;
      const scopeTop = clientY - containerRect.top - halfScope;
      scopeRef.current.style.opacity = '1';
      scopeRef.current.style.transform = `translate3d(${scopeLeft}px, ${scopeTop}px, 0) scale(1)`;

      // 2. 렌즈 내부 배경 이미지 이동 (확대 효과)
      const relativeX = clientX - imageRect.left;
      const relativeY = clientY - imageRect.top;
      const bgX = (relativeX / imageRect.width) * 100;
      const bgY = (relativeY / imageRect.height) * 100;
      scopeRef.current.style.backgroundPosition = `${bgX}% ${bgY}%`;

      // 3. 동적 타겟 박스 위치 이동 (현재 확대중인 영역 표시)
      // ZOOM_LEVEL이 커질수록 타겟 박스는 작아져야 함
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

  // --- Helper: 정적 하이라이트 박스 스타일 ---
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
      position: 'absolute', top: '-20px', left: 0, backgroundColor: color, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap',
    };
  };

  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.header}>
        <div style={styles.logoGroup}>
          <Monitor size={24} color={theme.accent} />
          <span style={{ fontWeight: 800, fontSize: '20px', color: theme.textPrimary }}>Estify<span style={{color: theme.accent}}>Vision</span></span>
        </div>
        <div style={styles.headerStats}>
          <HeaderItem label="Status" value="PASS" valueColor={theme.success} icon={<CheckCircle size={16} color={theme.success} />} />
        </div>
      </header>
      <div style={styles.mainGrid}>
        <div style={styles.cardRow}>
          {topCardsData.map((card) => (<StatusCard key={card.id} data={card} imageUrl={mainImageUrl} />))}
        </div>
        <div ref={containerRef} style={styles.mainViewContainer} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <img ref={imageRef} src={mainImageUrl} alt="Inspection Target" style={styles.mainImage} onLoad={updateImageMetrics} />
          {/* 정적 박스들 */}
          {imageMetrics.width > 0 && [...topCardsData, ...bottomCardsData].map((card) => (
            <div key={`box-${card.id}`} style={getHighlightBoxStyle(card.highlight, card.status)}>
              <div style={boxLabelStyle(card.status)}>{card.id}</div>
            </div>
          ))}
          
          {/* [추가] 동적 타겟 박스 (현재 줌 영역 표시) */}
          <div ref={targetBoxRef} style={styles.targetBox} />

          {/* 줌 렌즈 */}
          <div ref={scopeRef} style={{...styles.scopeLens, backgroundImage: `url(${mainImageUrl})`}}>
            <div style={styles.reticleH} /><div style={styles.reticleV} />
          </div>
          <div style={styles.mainLabel}>Live Inspection View (x{ZOOM_LEVEL})</div>
        </div>
        <div style={styles.cardRow}>
          {bottomCardsData.map((card) => (<StatusCard key={card.id} data={card} imageUrl={mainImageUrl} />))}
        </div>
      </div>
    </div>
  );
};

// --- Components ---
const HeaderItem = ({ label, value, valueColor, icon }: any) => (
  <div style={styles.headerItem}>
    <span style={styles.headerLabel}>{label}</span>
    <span style={{ ...styles.headerValue, color: valueColor || theme.textPrimary }}>{icon && <span style={{ marginRight: '6px', display: 'flex' }}>{icon}</span>}{value}</span>
  </div>
);

const StatusCard = ({ data, imageUrl }: { data: CamData, imageUrl: string }) => {
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
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: theme.accent }}>{data.icon}</span>
          <span style={styles.cardTitle}>{data.id}</span>
        </div>
        <Badge status={data.status} />
      </div>
      <div style={styles.cropContainer}>
        <div style={{ ...styles.cropImage, ...calculateCropStyle(data.highlight) }} />
        <div style={styles.cropOverlay}>{data.position.replace('-', ' ').toUpperCase()} Area</div>
      </div>
      <div style={styles.cardFooter}>{data.title}</div>
    </div>
  );
};

const Badge = ({ status }: { status: InspectionStatus }) => {
  const colors = status === '정상' ? { bg: theme.success + '20', text: theme.success } : status === '점검필요' ? { bg: theme.warning + '20', text: theme.warning } : { bg: theme.danger + '20', text: theme.danger };
  return <span style={{ ...styles.badge, backgroundColor: colors.bg, color: colors.text }}>{status}</span>;
};

// --- Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  dashboardContainer: { backgroundColor: theme.bg, minHeight: '100vh', padding: '32px', fontFamily: '"Inter", -apple-system, sans-serif', color: theme.textPrimary, display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: theme.shadow, border: `1px solid ${theme.border}` },
  logoGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  headerStats: { display: 'flex', alignItems: 'center', gap: '32px' },
  headerItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
  headerLabel: { fontSize: '11px', fontWeight: 600, color: theme.textSecondary, textTransform: 'uppercase' },
  headerValue: { fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center' },
  vDivider: { width: '1px', height: '20px', backgroundColor: theme.border },
  mainGrid: { display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 },
  cardRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  mainViewContainer: { position: 'relative', width: '100%', height: '500px', backgroundColor: '#fff', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'default' },
  mainImage: { maxHeight: '90%', maxWidth: '90%', objectFit: 'contain', display: 'block', cursor: 'none' },
  mainLabel: { position: 'absolute', bottom: '20px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: theme.textSecondary, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', pointerEvents: 'none', zIndex: 60 },
  scopeLens: { position: 'absolute', top: 0, left: 0, width: `${SCOPE_SIZE}px`, height: `${SCOPE_SIZE}px`, borderRadius: '50%', border: `2px solid ${theme.accent}`, backgroundColor: '#fff', backgroundRepeat: 'no-repeat', backgroundSize: `${ZOOM_LEVEL * 100}%`, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 50, opacity: 0, transform: 'scale(0.8)', transition: 'opacity 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)', willChange: 'transform, opacity' },
  reticleH: { position: 'absolute', top: '50%', left: '15%', width: '70%', height: '1px', backgroundColor: theme.accent, opacity: 0.5 },
  reticleV: { position: 'absolute', left: '50%', top: '15%', height: '70%', width: '1px', backgroundColor: theme.accent, opacity: 0.5 },
  card: { backgroundColor: theme.cardBg, borderRadius: '16px', padding: '16px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow, display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: 700, fontSize: '15px' },
  cropContainer: { width: '100%', aspectRatio: '16 / 9', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}`, backgroundColor: '#f1f5f9' },
  cropImage: { width: '100%', height: '100%', backgroundRepeat: 'no-repeat' },
  cropOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', color: 'white', fontSize: '11px', fontWeight: 600, textAlign: 'center', letterSpacing: '1px' },
  cardFooter: { fontSize: '13px', color: theme.textSecondary, fontWeight: 500 },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 },
  
  // [추가] 동적 타겟 박스 스타일
  targetBox: {
    position: 'absolute',
    top: 0, left: 0,
    width: '0px', height: '0px', // JS로 제어
    border: `2px solid ${theme.accent}`, // 파란색 실선
    boxShadow: `0 0 10px ${theme.accent}`, // 네온 효과
    backgroundColor: 'transparent',
    zIndex: 40,
    pointerEvents: 'none',
    opacity: 0,
    willChange: 'transform, width, height',
  }
};

export default VisionDashboard;