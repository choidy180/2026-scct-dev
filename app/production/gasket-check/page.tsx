"use client";

import React, { useState, useEffect } from 'react';
import { Monitor, CheckCircle, Box, Hash, Zap, BarChart2, X, ZoomIn, Loader2, Cpu, ScanLine } from 'lucide-react';

// ─── [CONFIG] 설정 및 테마 ───
type ScreenMode = 'FHD' | 'QHD';

const LAYOUT_CONFIGS = {
  FHD: {
    padding: '24px',
    gap: '20px',
    headerHeight: '60px',
    fontSize: { title: '24px', sub: '14px', badge: '14px', statValue: '20px', statLabel: '13px' },
    iconSize: 22,
    borderRadius: '16px',
  },
  QHD: {
    padding: '40px',
    gap: '32px',
    headerHeight: '80px',
    fontSize: { title: '32px', sub: '18px', badge: '16px', statValue: '28px', statLabel: '15px' },
    iconSize: 30,
    borderRadius: '24px',
  }
};

const theme = {
  bg: '#F3F4F6', 
  cardBg: '#FFFFFF', 
  textPrimary: '#111827', 
  textSecondary: '#6B7280',
  accent: '#EC4899',   
  success: '#10B981', 
  successBg: '#D1FAE5',
  border: '#F3F4F6',
  shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
};

// ─── [SUB COMPONENTS] ───

// [UPGRADE] 고퀄리티 로딩 스크린 (단계별 텍스트 + 애니메이션)
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("시스템 초기화 중...");

    useEffect(() => {
        const duration = 1500; // 1.5초 동안 진행 (너무 빠르면 안 보임)
        const interval = 15;
        const step = 100 / (duration / interval);

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev + step;
                
                // 진행률에 따른 텍스트 변경
                if (next > 20 && next < 50) setLoadingText("AI 모델 로드 중...");
                else if (next >= 50 && next < 80) setLoadingText("센서 데이터 동기화...");
                else if (next >= 80) setLoadingText("검사 환경 구성 완료...");

                if (next >= 100) {
                    clearInterval(timer);
                    setTimeout(onComplete, 300); // 100% 도달 후 잠시 보여줌
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
            {/* 로고 및 아이콘 애니메이션 */}
            <div style={{ position: 'relative', marginBottom: '40px' }}>
                <div style={{ 
                    position: 'absolute', inset: -10, borderRadius: '50%', 
                    border: `2px solid ${theme.accent}30`, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' 
                }} />
                <div style={{ 
                    padding: '20px', backgroundColor: '#FDF2F8', borderRadius: '24px',
                    boxShadow: `0 0 30px ${theme.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Cpu size={48} color={theme.accent} />
                </div>
            </div>

            {/* 텍스트 정보 */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: theme.textPrimary, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                    Estify Anomaly Detection
                </h2>
                <p style={{ fontSize: '14px', color: theme.textSecondary, fontWeight: 500, minWidth: '200px' }}>
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
                        background: `linear-gradient(90deg, ${theme.accent}, #F472B6)`,
                        borderRadius: '10px', transition: 'width 0.1s linear',
                        boxShadow: `0 0 15px ${theme.accent}80`
                    }} />
                </div>
                <div style={{ 
                    display: 'flex', justifyContent: 'space-between', marginTop: '8px', 
                    fontSize: '12px', fontWeight: 700, color: theme.accent 
                }}>
                    <span>Running Modules</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            </div>

            {/* CSS Animation 정의 (인라인 스타일용) */}
            <style jsx>{`
                @keyframes ping {
                    75%, 100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

// 이미지 확대 모달
const ImageModal = ({ isOpen, onClose, title, imgUrl }: { isOpen: boolean, onClose: () => void, title: string, imgUrl: string }) => {
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
                    width: '80vw', height: '80vh', 
                    backgroundColor: theme.cardBg,
                    borderRadius: '16px', padding: '32px',
                    display: 'flex', flexDirection: 'column', gap: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    transform: isOpen ? 'scale(1)' : 'scale(0.95)', 
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', backgroundColor: theme.bg, borderRadius: '8px' }}>
                            <ZoomIn size={28} color={theme.accent} />
                        </div>
                        <div>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary, display: 'block' }}>{title} 상세 분석</span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            border: 'none', background: '#F3F4F6', cursor: 'pointer', padding: '10px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    >
                        <X size={24} color={theme.textPrimary} />
                    </button>
                </div>
                <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${theme.border}`, position: 'relative', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
                    <div style={{ 
                        width: '100%', height: '100%', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: '#000'
                    }}>
                        <img src={imgUrl} alt="Detail View" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatWidget = ({ label, value, icon, color, layout }: any) => (
    <div style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', 
        backgroundColor: '#FAFAFA', padding: '12px 24px', borderRadius: '12px',
        border: `1px solid ${theme.border}`, flex: 1,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default'
    }}
    onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
    }}
    >
        <div style={{ 
            padding: '12px', borderRadius: '8px', backgroundColor: color + '15',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 10px ${color}20`
        }}>
            {React.cloneElement(icon, { size: layout.iconSize, color: color })}
        </div>
        <div>
            <div style={{ fontSize: layout.fontSize.statLabel, color: theme.textSecondary, fontWeight: 600, marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: layout.fontSize.statValue, color: theme.textPrimary, fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</div>
        </div>
    </div>
);

const Header = ({ layout, data }: { layout: any, data: any }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: layout.headerHeight, marginBottom: layout.gap, flexShrink: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
         <div style={{ padding: '10px', backgroundColor: theme.cardBg, borderRadius: '12px', boxShadow: theme.shadow }}>
            <ScanLine size={layout.iconSize} color={theme.accent} strokeWidth={2.5} />
         </div>
         <div>
            <div style={{ fontWeight: 800, fontSize: layout.fontSize.title, color: theme.textPrimary, letterSpacing: '-0.5px' }}>
                Anomaly<span style={{ color: theme.accent }}>Detection</span>
            </div>
            <div style={{ fontSize: layout.fontSize.sub, color: theme.textSecondary, fontWeight: 500 }}>
                실시간 가스켓 이상 분석
            </div>
         </div>
    </div>
    
    <div style={{ display: 'flex', gap: '12px', height: '100%' }}>
        <div style={{ 
            padding: '0 24px', backgroundColor: theme.cardBg, borderRadius: '12px',
            boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: layout.fontSize.sub, fontWeight: 600, color: theme.textSecondary
        }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.success, boxShadow: `0 0 10px ${theme.success}` }} />
            시스템 가동중
        </div>
        <div style={{ 
            padding: '0 24px', backgroundColor: theme.textPrimary, borderRadius: '12px',
            color: 'white', fontSize: layout.fontSize.sub, fontWeight: 600,
            display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
            {data.currentTime}
        </div>
    </div>
  </div>
);

const AutoFitImage = ({ src, alt, onZoom }: { src: string, alt: string, onZoom: () => void }) => (
    <div style={{ 
        width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
        backgroundColor: '#F8FAFC', borderRadius: '12px', overflow: 'hidden', position: 'relative'
    }}>
        <img src={src} alt={alt} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))' }} />
        
        {/* 확대 버튼 (오버레이) */}
        <button 
            onClick={onZoom}
            style={{
                position: 'absolute', top: '20px', right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px', borderRadius: '8px',
                border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
            <ZoomIn size={18} color={theme.textPrimary} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: theme.textPrimary }}>크게 보기</span>
        </button>
    </div>
);

// ─── [MAIN COMPONENT] ───

export default function GasketAnomalyDetection() {
    const [isLoading, setIsLoading] = useState(true);
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const layout = LAYOUT_CONFIGS[screenMode];
    const dummyData = { currentTime: '14:21:40' };
    const gasketImg = "https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=1000&auto=format&fit=crop";

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
            {/* 이미지 모달 */}
            <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="가스켓 정밀 분석" imgUrl={gasketImg} />

            <Header layout={layout} data={dummyData} />

            {/* 메인 카드 영역 */}
            <div style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', 
                backgroundColor: theme.cardBg, borderRadius: '12px',
                boxShadow: theme.shadow, padding: '30px', minHeight: 0
            }}>
                
                {/* 상단 통계 위젯 바 */}
                <div style={{ display: 'flex', gap: layout.gap, marginBottom: layout.gap }}>
                    {/* 종합 결과 카드 (그라데이션 강조) */}
                    <div style={{ 
                        flex: 1.5, display: 'flex', alignItems: 'center', gap: '15px', 
                        padding: '15px 25px', 
                        background: `linear-gradient(135deg, ${theme.successBg} 0%, #FFFFFF 100%)`, 
                        borderRadius: '12px', color: theme.success,
                        border: `1px solid ${theme.success}30`,
                        boxShadow: `0 4px 15px ${theme.success}15`
                    }}>
                        <div style={{ padding: '8px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <CheckCircle size={32} strokeWidth={2.5} fill={theme.successBg} />
                        </div>
                        <div>
                            <div style={{ fontSize: layout.fontSize.sub, fontWeight: 700, opacity: 0.8, color: '#059669' }}>최종 판정</div>
                            <div style={{ fontSize: layout.fontSize.title, fontWeight: 900, color: '#059669' }}>합격 (OK)</div>
                        </div>
                    </div>
                    
                    <StatWidget layout={layout} label="검사 영역" value="Zone A-전체" icon={<Box />} color="#6366F1" />
                    <StatWidget layout={layout} label="신뢰도 점수" value="99.8%" icon={<Hash />} color="#8B5CF6" />
                    <StatWidget layout={layout} label="처리 시간" value="124ms" icon={<Zap />} color="#F59E0B" />
                    <StatWidget layout={layout} label="금일 생산량" value="8,402" icon={<BarChart2 />} color="#EC4899" />
                </div>

                {/* 메인 이미지 뷰어 */}
                <div style={{ 
                    flex: 1, position: 'relative', 
                    border: `1px solid ${theme.border}`, borderRadius: '12px',
                    padding: '20px', overflow: 'hidden',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(180deg, #F3F4F6 0%, transparent 100%)', zIndex: 0 }} />
                  
                  <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                      <AutoFitImage src={gasketImg} alt="Gasket Detail" onZoom={() => setIsModalOpen(true)} />
                      
                      {/* 이미지 위 플로팅 라벨 */}
                      <div style={{ 
                          position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                          backgroundColor: 'rgba(17, 24, 39, 0.85)', padding: '10px 24px', borderRadius: '12px',
                          color: 'white', fontSize: layout.fontSize.sub, fontWeight: 600, backdropFilter: 'blur(4px)',
                          display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                          border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34D399', boxShadow: '0 0 10px #34D399' }} />
                            실시간 영상 피드 : CAM-01
                      </div>
                  </div>
                </div>
            </div>
        </div>
    );
}