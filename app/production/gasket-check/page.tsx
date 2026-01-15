"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, ScanLine, ZoomIn, X, RefreshCw } from 'lucide-react';

// ─── [CONFIG] 설정 및 테마 ───
type ScreenMode = 'FHD' | 'QHD';

const LAYOUT_CONFIGS = {
    FHD: {
        padding: '24px',
        gap: '24px',
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
    bg: '#FFFFFF',
    cardBg: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    accent: '#3B82F6',
    success: '#10B981',
    successBg: '#ECFDF5',
    danger: '#EF4444',
    dangerBg: '#FEF2F2',
    border: '#E5E7EB',
    headerGray: '#F9FAFB',
    shadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(0, 0, 0, 0.02)',
};

interface ApiData {
    TIMEVALUE: string;
    TIMEVALUE2: string;
    FILENAME1: string;
    FILEPATH1: string;
    CDGITEM: string | null;
    COUNT_NUM: string | null;
    RESULT: string;
    STATUS002: string;
}

// ─── [SUB COMPONENTS] ───

// LoadingScreen 컴포넌트 제거됨

const ImageModal = ({ isOpen, onClose, title, imgUrl }: { isOpen: boolean, onClose: () => void, title: string, imgUrl: string }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                width: '80vw', height: '80vh', backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px',
                display: 'flex', flexDirection: 'column', gap: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', border: `1px solid ${theme.border}`
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary }}>{title}</span>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            border: 'none', background: '#F3F4F6', cursor: 'pointer', padding: '8px', borderRadius: '50%',
                            transition: 'background 0.2s' 
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
                    >
                        <X size={24} color={theme.textPrimary} />
                    </button>
                </div>
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}` }}>
                    <img src={imgUrl} alt="Detail View" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            </div>
        </div>
    );
};

const OrderInfoTable = ({ data }: { data: ApiData | null }) => {
    const tableStyle = {
        display: 'flex', flexDirection: 'column' as const, flex: 2, 
        border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
    };
    
    const rowStyle = { display: 'flex', width: '100%' };
    
    const headerCellStyle = {
        flex: 1, backgroundColor: '#F3F4F6',
        color: '#4B5563', fontSize: '14px', fontWeight: 700,
        textAlign: 'center' as const, padding: '12px 8px',
        borderRight: '1px solid #FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    };

    const valueCellStyle = {
        flex: 1, backgroundColor: '#FFFFFF',
        color: '#111827', fontSize: '16px', fontWeight: 600,
        textAlign: 'center' as const, padding: '16px 8px',
        borderRight: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis'
    };

    const getValue = (val: string | null | undefined) => {
        if (!val || val.trim() === '') return <span style={{color: '#9CA3AF', fontSize: '14px'}}>데이터 없음</span>;
        return val;
    };

    return (
        <div style={tableStyle}>
            <div style={{...rowStyle, borderBottom: `1px solid ${theme.border}`}}>
                <div style={headerCellStyle}>작업지시번호</div>
                <div style={headerCellStyle}>모델명</div>
                <div style={{...headerCellStyle, borderRight: 'none'}}>No.</div>
            </div>
            <div style={rowStyle}>
                <div style={valueCellStyle}>{getValue(data?.STATUS002)}</div>
                <div style={valueCellStyle}>{getValue(data?.CDGITEM)}</div>
                <div style={{...valueCellStyle, borderRight: 'none'}}>{getValue(data?.COUNT_NUM)}</div>
            </div>
        </div>
    );
};

const Header = ({ layout, time }: { layout: any, time: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: layout.headerHeight, marginBottom: layout.gap, flexShrink: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div style={{ 
             padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '14px', 
             boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)', border: `1px solid ${theme.border}` 
         }}>
            <ScanLine size={layout.iconSize} color={theme.accent} strokeWidth={2.5} />
         </div>
         <div>
            <div style={{ fontWeight: 800, fontSize: layout.fontSize.title, color: theme.textPrimary, letterSpacing: '-0.5px' }}>
                Estify<span style={{ color: theme.accent }}>Vision</span>
            </div>
            <div style={{ fontSize: layout.fontSize.sub, color: theme.textSecondary, fontWeight: 500 }}>
                실시간 생산 품질 모니터링
            </div>
         </div>
    </div>
    
    <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
        <div style={{ 
            padding: '0 24px', backgroundColor: '#FFFFFF', borderRadius: '14px',
            boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: layout.fontSize.sub, fontWeight: 600, color: theme.textSecondary,
            border: `1px solid ${theme.border}`
        }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.success, boxShadow: `0 0 10px ${theme.success}` }} />
            SYSTEM ONLINE
        </div>
        <div style={{ 
            padding: '0 24px', backgroundColor: theme.accent, borderRadius: '14px',
            color: 'white', fontSize: layout.fontSize.sub, fontWeight: 600,
            display: 'flex', alignItems: 'center', boxShadow: `0 4px 15px ${theme.accent}40`
        }}>
            {time}
        </div>
    </div>
  </div>
);

const AutoFitImage = ({ src, alt, onZoom }: { src: string, alt: string, onZoom: () => void }) => (
    <div style={{ 
        width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
        backgroundColor: '#F9FAFB', borderRadius: '16px', overflow: 'hidden', position: 'relative',
        border: `1px solid ${theme.border}`
    }}>
        {src ? (
             <img src={src} alt={alt} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.05))' }} />
        ) : (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', color: theme.textSecondary, gap: '12px'}}>
                 <RefreshCw className="animate-spin" size={32} color="#CBD5E1" />
                 <span style={{fontWeight: 500, color: '#9CA3AF'}}>이미지 수신 대기 중...</span>
                 <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin { animation: spin 2s linear infinite; }`}</style>
            </div>
        )}
        
        {src && (
            <button 
                onClick={onZoom}
                style={{
                    position: 'absolute', top: '20px', right: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '10px 16px', borderRadius: '10px',
                    border: `1px solid ${theme.border}`, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <ZoomIn size={18} color={theme.textPrimary} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: theme.textPrimary }}>확대</span>
            </button>
        )}
    </div>
);

// ─── [MAIN COMPONENT] ───

export default function GasketAnomalyDetection() {
    // isLoading 상태 및 LoadingScreen 제거됨
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // API 데이터 상태
    const [apiData, setApiData] = useState<ApiData | null>(null);

    // API 호출 함수
    const fetchData = useCallback(async () => {
        try {
            const response = await fetch("http://1.254.24.170:24828/api/DX_API000026");
            const json = await response.json();
            
            if (json.success && json.data && json.data.length > 0) {
                setApiData(json.data[0]);
            }
        } catch (error) {
            console.error("API Fetch Error:", error);
        }
    }, []);

    // 컴포넌트 마운트 시 최초 1회 즉시 호출
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleResize = () => setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const layout = LAYOUT_CONFIGS[screenMode];
    
    // API 결과 판정 로직
    const isPass = apiData?.RESULT === "1";
    const resultText = apiData ? (isPass ? "합격 (OK)" : "불량 (NG)") : "대기 중..."; // 데이터 없을 때 텍스트 처리 보완
    const resultColor = apiData ? (isPass ? theme.success : theme.danger) : theme.textSecondary;
    const resultBg = apiData ? (isPass ? theme.successBg : theme.dangerBg) : '#F3F4F6';
    const ResultIcon = isPass ? CheckCircle : AlertTriangle;

    return (
        <div style={{ 
            backgroundColor: '#F8FAFC',
            boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            fontFamily: '"Pretendard", -apple-system, sans-serif',
            width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding
        }}>
            <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="상세 이미지 분석" imgUrl={apiData?.FILEPATH1 || ''} />

            <Header layout={layout} time={apiData?.TIMEVALUE || "00:00:00"} />

            {/* 메인 카드 영역 */}
            <div style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', 
                backgroundColor: '#FFFFFF', borderRadius: '20px',
                boxShadow: theme.shadow, padding: '32px', minHeight: 0,
                border: `1px solid ${theme.border}`
            }}>
                
                {/* 상단 정보 바 (판정 + 작업지시 테이블) */}
                <div style={{ display: 'flex', gap: layout.gap, marginBottom: layout.gap }}>
                    {/* 1. 최종 결과 카드 */}
                    <div style={{ 
                        flex: 0.8, display: 'flex', alignItems: 'center', gap: '20px', 
                        padding: '15px 30px', 
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px', color: resultColor,
                        border: `2px solid ${resultBg}`,
                        boxShadow: `0 8px 20px -5px ${resultColor}15`
                    }}>
                        <div style={{ padding: '12px', backgroundColor: resultBg, borderRadius: '50%' }}>
                            <ResultIcon size={36} strokeWidth={2.5} color={resultColor} />
                        </div>
                        <div>
                            <div style={{ fontSize: layout.fontSize.sub, fontWeight: 700, color: theme.textSecondary, marginBottom: '2px' }}>최종 판정</div>
                            <div style={{ fontSize: layout.fontSize.title, fontWeight: 900 }}>{resultText}</div>
                        </div>
                    </div>
                    
                    {/* 2. 작업지시 정보 테이블 */}
                    <OrderInfoTable data={apiData} />
                </div>

                {/* 메인 이미지 뷰어 */}
                <div style={{ 
                    flex: 1, position: 'relative', 
                    border: `1px solid ${theme.border}`, borderRadius: '16px',
                    padding: '24px', overflow: 'hidden',
                    background: '#FFFFFF'
                }}>
                  
                <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                  <AutoFitImage 
                    src={apiData?.FILEPATH1 || ''} 
                    alt="Inspection Result" 
                    onZoom={() => setIsModalOpen(true)} 
                  />
                  
                  {/* 하단 파일명 오버레이 */}
                  {apiData?.FILENAME1 && (
                    <div style={{ 
                        position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px 20px', borderRadius: '12px',
                        color: theme.textPrimary, fontSize: layout.fontSize.sub, fontWeight: 600, backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: `1px solid ${theme.border}`
                    }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.accent, boxShadow: `0 0 10px ${theme.accent}60` }} />
                          {apiData.FILENAME1}
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
    );
}