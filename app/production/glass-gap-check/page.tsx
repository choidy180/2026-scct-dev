"use client";

import React, { useState, useEffect } from 'react';
import { Monitor, Layers, Clock, FileText, CheckCircle, X, ZoomIn, Scan, Activity } from 'lucide-react';

// ─── [CONFIG] 설정 및 테마 ───
type ScreenMode = 'FHD' | 'QHD';
type InspectionStatus = '정상' | '불량' | '미감지';

const LAYOUT_CONFIGS = {
  FHD: {
    padding: '24px',
    gap: '20px',
    headerHeight: '60px',
    fontSize: { title: '20px', sub: '14px', badge: '13px', metaLabel: '12px', metaValue: '15px' },
    iconSize: 20,
    cornerCardWidth: '300px',
    borderRadius: '16px',
  },
  QHD: {
    padding: '40px',
    gap: '32px',
    headerHeight: '80px',
    fontSize: { title: '28px', sub: '18px', badge: '16px', metaLabel: '14px', metaValue: '18px' },
    iconSize: 28,
    cornerCardWidth: '450px',
    borderRadius: '24px',
  }
};

const theme = {
  bg: '#F3F4F6',          
  cardBg: '#FFFFFF',      
  textPrimary: '#111827', 
  textSecondary: '#6B7280', 
  accent: '#8B5CF6',      
  success: '#10B981',     
  danger: '#EF4444',      
  border: '#E5E7EB',      
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', 
};

// ─── [SUB COMPONENTS] ───

// [UPGRADE] 고퀄리티 로딩 스크린 (유리 틈새 확인 전용)
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("시스템 초기화 중...");

    useEffect(() => {
        const duration = 1500; // 1.5초
        const interval = 15; 
        const step = 100 / (duration / interval);

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + step;

                // 유리 틈새 확인에 맞는 로딩 텍스트 시나리오
                if (next > 20 && next < 50) setLoadingText("멀티 카메라 동기화 중...");
                else if (next >= 50 && next < 80) setLoadingText("엣지 검출 알고리즘 최적화...");
                else if (next >= 80) setLoadingText("검사 UI 구성 완료...");

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
            {/* 로고 애니메이션 */}
            <div style={{ position: 'relative', marginBottom: '40px' }}>
                <div style={{ 
                    position: 'absolute', inset: -10, borderRadius: '50%', 
                    border: `2px solid ${theme.accent}30`, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' 
                }} />
                <div style={{ 
                    padding: '20px', backgroundColor: '#F3E8FF', borderRadius: '24px',
                    boxShadow: `0 0 30px ${theme.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Layers size={48} color={theme.accent} />
                </div>
            </div>

            {/* 텍스트 정보 */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: theme.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                    Estify Glass Inspection
                </h2>
                <p style={{ fontSize: '14px', color: theme.textSecondary, fontWeight: 500, minWidth: '220px' }}>
                    {loadingText}
                </p>
            </div>

            {/* 고급 프로그래스 바 */}
            <div style={{ width: '320px', position: 'relative' }}>
                <div style={{ 
                    width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '10px', overflow: 'hidden',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        height: '100%', width: `${progress}%`, 
                        background: `linear-gradient(90deg, ${theme.accent}, #A78BFA)`,
                        borderRadius: '10px', transition: 'width 0.1s linear',
                        boxShadow: `0 0 15px ${theme.accent}80`
                    }} />
                </div>
                <div style={{ 
                    display: 'flex', justifyContent: 'space-between', marginTop: '8px', 
                    fontSize: '12px', fontWeight: 700, color: theme.accent 
                }}>
                    <span>System Ready</span>
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

// 이미지 확대 모달
const ImageModal = ({ isOpen, onClose, title, bgPos, imgUrl }: { isOpen: boolean, onClose: () => void, title: string, bgPos: string, imgUrl: string }) => {
    if (!isOpen) return null;

    return (
        <div 
            style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isOpen ? 1 : 0, transition: 'opacity 0.3s ease'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    width: '80vw', height: '80vh', backgroundColor: theme.cardBg,
                    borderRadius: '24px', padding: '32px',
                    display: 'flex', flexDirection: 'column', gap: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    transform: isOpen ? 'scale(1)' : 'scale(0.95)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', backgroundColor: theme.bg, borderRadius: '12px' }}>
                            <ZoomIn size={28} color={theme.accent} />
                        </div>
                        <div>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary, display: 'block' }}>{title} 상세 분석</span>
                            <span style={{ fontSize: '14px', color: theme.textSecondary }}>고해상도 크롭 이미지 뷰어</span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            border: 'none', background: '#F3F4F6', cursor: 'pointer', padding: '10px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    >
                        <X size={24} color={theme.textPrimary} />
                    </button>
                </div>
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.border}`, position: 'relative', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ 
                        width: '100%', height: '100%', 
                        backgroundImage: `url(${imgUrl})`, 
                        backgroundSize: '300%', 
                        backgroundPosition: bgPos, 
                        backgroundRepeat: 'no-repeat' 
                    }} />
                </div>
            </div>
        </div>
    );
};

const MetadataItem = ({ label, value, icon, layout }: any) => (
  <div style={{ 
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    padding: '0 20px', height: '100%', backgroundColor: theme.cardBg, 
    borderRadius: '12px', boxShadow: theme.shadow,
    border: `1px solid ${theme.border}`, minWidth: '140px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
      {icon}
      <span style={{ fontSize: layout.fontSize.metaLabel, color: theme.textSecondary, fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: layout.fontSize.metaValue, color: theme.textPrimary, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
  </div>
);

const Header = ({ layout, data }: { layout: any, data: any }) => (
  <div style={{ display: 'flex', gap: layout.gap, height: layout.headerHeight, marginBottom: layout.gap, alignItems: 'center', flexShrink: 0 }}>
    <div style={{ 
        display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto', 
        backgroundColor: theme.cardBg, padding: '0 24px', height: '100%', borderRadius: '12px',
        boxShadow: theme.shadow
    }}>
        <div style={{ padding: '8px', backgroundColor: '#EDE9FE', borderRadius: '8px' }}>
            <Monitor size={layout.iconSize} color={theme.accent} strokeWidth={2.5} />
        </div>
        <div>
            <div style={{ fontWeight: 800, fontSize: layout.fontSize.title, color: theme.textPrimary, lineHeight: 1 }}>
                Estify<span style={{ color: theme.accent }}>Vision</span>
            </div>
            <div style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: 600, marginTop: '4px' }}>유리 틈새 확인 시스템</div>
        </div>
    </div>

    <MetadataItem layout={layout} label="현재 시간" value={data.currentTime} icon={<Clock size={14} color={theme.accent} />} />
    <MetadataItem layout={layout} label="작업지시번호" value={data.meta['작업지시번호']} icon={<FileText size={14} color={theme.accent} />} />
    <MetadataItem layout={layout} label="모델명" value={data.meta['모델명']} icon={<Layers size={14} color={theme.accent} />} />
  </div>
);

const AutoFitImage = ({ src, alt }: { src: string, alt: string }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', overflow: 'hidden', position: 'relative' }}>
        <img src={src} alt={alt} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }} />
    </div>
);

// ─── [MAIN COMPONENT] ───

export default function GlassGapInspection() {
    const [isLoading, setIsLoading] = useState(true);
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, title: string, bgPos: string } | null>(null);

    useEffect(() => {
        const handleResize = () => setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const layout = LAYOUT_CONFIGS[screenMode];
    const dummyData = {
        currentTime: '14:20:05',
        meta: { '작업지시번호': 'WO-260108-01', '모델명': 'GLS-Type-A' }
    };
    const glassImg = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1000&auto=format&fit=crop"; 

    const openModal = (title: string, bgPos: string) => {
        setModalInfo({ isOpen: true, title, bgPos });
    };

    const closeModal = () => {
        setModalInfo(prev => prev ? { ...prev, isOpen: false } : null);
    };

    const CornerCard = ({ title, status, position }: { title: string, status: InspectionStatus, position: string }) => {
        const isOk = status === '정상';
        const statusColor = isOk ? theme.success : theme.danger;
        const bgPos = { 'Top-Left': '0% 0%', 'Top-Right': '100% 0%', 'Bottom-Left': '0% 100%', 'Bottom-Right': '100% 100%' }[position] || 'center';

        return (
            <div style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', 
                backgroundColor: theme.cardBg, borderRadius: '12px',
                boxShadow: theme.shadow, overflow: 'hidden', position: 'relative'
            }}>
                <div style={{ 
                    padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: `1px solid ${theme.border}`
                }}>
                    <span style={{ fontSize: layout.fontSize.sub, fontWeight: 700, color: theme.textPrimary }}>{title}</span>
                    <span style={{ 
                        fontSize: layout.fontSize.badge, fontWeight: 800, color: statusColor,
                        backgroundColor: isOk ? '#ECFDF5' : '#FEF2F2', padding: '4px 10px', borderRadius: '8px'
                    }}>
                        {status}
                    </span>
                </div>
                <div style={{ flex: 1, margin: '12px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}` }}>
                    <div style={{ 
                        width: '100%', height: '100%', 
                        backgroundImage: `url(${glassImg})`, backgroundSize: '300%', backgroundPosition: bgPos, backgroundRepeat: 'no-repeat',
                        transition: 'transform 0.3s ease',
                    }} />
                    
                    <button 
                        onClick={() => openModal(title, bgPos)}
                        style={{ 
                            position: 'absolute', bottom: '8px', right: '8px', 
                            backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px', borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                    >
                        <ZoomIn size={16} color={theme.textPrimary} />
                    </button>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return <LoadingScreen onComplete={() => setIsLoading(false)} />;
    }

    return (
        <div style={{ 
            backgroundColor: theme.bg, 
            boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            fontFamily: '"Pretendard", -apple-system, sans-serif',
            width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding
        }}>
            {/* 모달 렌더링 */}
            {modalInfo && <ImageModal isOpen={modalInfo.isOpen} onClose={closeModal} title={modalInfo.title} bgPos={modalInfo.bgPos} imgUrl={glassImg} />}

            <Header layout={layout} data={dummyData} />
            
            <div style={{ flex: 1, display: 'flex', gap: layout.gap, minHeight: 0 }}>
                {/* 좌측 */}
                <div style={{ width: layout.cornerCardWidth, display: 'flex', flexDirection: 'column', gap: layout.gap }}>
                    <CornerCard title="좌측 상단 (A1)" status="정상" position="Top-Left" />
                    <CornerCard title="좌측 하단 (A3)" status="정상" position="Bottom-Left" />
                </div>

                {/* 중앙 메인 */}
                <div style={{ 
                    flex: 1, display: 'flex', flexDirection: 'column', 
                    backgroundColor: theme.cardBg, borderRadius: '12px',
                    boxShadow: theme.shadow, overflow: 'hidden', padding: '24px'
                }}>
                    <div style={{ 
                        display: 'flex', justifyContent: 'center', marginBottom: '20px',
                        alignItems: 'center', gap: '12px'
                    }}>
                        <div style={{ 
                            backgroundColor: '#ECFDF5', padding: '10px 24px', borderRadius: '12px',
                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)',
                            display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${theme.success}30`
                        }}>
                          <CheckCircle size={22} color={theme.success} fill="#DCFCE7" />
                          <span style={{ fontSize: layout.fontSize.title, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.5px' }}>
                              종합 판정: 합격
                          </span>
                        </div>
                    </div>

                    <div style={{ 
                        flex: 1, borderRadius: '12px', overflow: 'hidden', 
                        position: 'relative', border: `1px solid ${theme.border}`,
                        backgroundColor: '#F8FAFC'
                    }}>
                        <AutoFitImage src={glassImg} alt="Main Glass" />
                    </div>
                </div>

                {/* 우측 */}
                <div style={{ width: layout.cornerCardWidth, display: 'flex', flexDirection: 'column', gap: layout.gap }}>
                    <CornerCard title="우측 상단 (A2)" status="정상" position="Top-Right" />
                    <CornerCard title="우측 하단 (A4)" status="정상" position="Bottom-Right" />
                </div>
            </div>
        </div>
    );
}