"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, ZoomIn, X, RefreshCw } from 'lucide-react';

// ─── [CONFIG] 설정 및 테마 ───
type ScreenMode = 'FHD' | 'QHD';

const LAYOUT_CONFIGS = {
  FHD: {
    padding: '24px',
    headerHeight: '60px',
    fontSize: { title: '24px', sub: '14px', tableHeader: '14px', tableValue: '16px' },
    iconSize: 22,
    borderRadius: '16px',
  },
  QHD: {
    padding: '40px',
    headerHeight: '80px',
    fontSize: { title: '32px', sub: '18px', tableHeader: '16px', tableValue: '20px' },
    iconSize: 30,
    borderRadius: '24px',
  }
};

const theme = {
  bg: '#F8FAFC',        // 아주 연한 블루그레이 배경
  cardBg: '#FFFFFF',    // 카드 배경 (순수 화이트)
  textPrimary: '#1E293B', 
  textSecondary: '#64748B',
  accent: '#3B82F6',    // 포인트 컬러 (블루)
  success: '#10B981',   // [수정] 누락된 success 컬러 추가
  border: '#E2E8F0',    // 테두리 색상
  tableHeaderBg: '#E2E8F0', // 테이블 헤더 배경 (이미지의 회색 톤)
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
};

// API 데이터 타입 정의
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

const ImageModal = ({ isOpen, onClose, title, imgUrl }: { isOpen: boolean, onClose: () => void, title: string, imgUrl: string }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                width: '85vw', height: '85vh', backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px',
                display: 'flex', flexDirection: 'column', gap: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)', border: `1px solid ${theme.border}`
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary }}>{title}</span>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            border: 'none', background: '#F1F5F9', cursor: 'pointer', padding: '10px', borderRadius: '50%',
                            transition: 'background 0.2s' 
                        }}
                    >
                        <X size={24} color={theme.textPrimary} />
                    </button>
                </div>
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}` }}>
                    <img src={imgUrl} alt="Detail View" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            </div>
        </div>
    );
};

// 상단 데이터 테이블 컴포넌트
const InfoTable = ({ data, layout }: { data: ApiData | null, layout: any }) => {
    const containerStyle: React.CSSProperties = {
        width: '100%',
        border: `1px solid #CBD5E1`,
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        marginBottom: '20px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    };

    const rowStyle: React.CSSProperties = {
        display: 'flex',
        width: '100%',
    };

    const headerCellStyle: React.CSSProperties = {
        flex: 1,
        backgroundColor: theme.tableHeaderBg,
        color: '#475569',
        fontSize: layout.fontSize.tableHeader,
        fontWeight: 700,
        textAlign: 'center',
        padding: '10px 0',
        borderRight: '1px solid #FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const valueCellStyle: React.CSSProperties = {
        flex: 1,
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        fontSize: layout.fontSize.tableValue,
        fontWeight: 600,
        textAlign: 'center',
        padding: '14px 0',
        borderTop: `1px solid #CBD5E1`,
        borderRight: `1px solid #CBD5E1`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    };

    const getValue = (val: string | null | undefined) => {
        if (!val || val.trim() === '') return <span style={{color: '#CBD5E1', fontSize: '14px', fontWeight: 400}}>데이터 없음</span>;
        return val;
    };

    return (
        <div style={containerStyle}>
            {/* Header Row */}
            <div style={rowStyle}>
                <div style={headerCellStyle}>작업지시번호</div>
                <div style={headerCellStyle}>모델명</div>
                <div style={{...headerCellStyle, borderRight: 'none'}}>No.</div>
            </div>
            {/* Value Row */}
            <div style={rowStyle}>
                <div style={valueCellStyle}>{getValue(data?.STATUS002)}</div>
                <div style={valueCellStyle}>{getValue(data?.CDGITEM)}</div>
                <div style={{...valueCellStyle, borderRight: 'none'}}>{getValue(data?.COUNT_NUM)}</div>
            </div>
        </div>
    );
};

const Header = ({ layout, time }: { layout: any, time: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: layout.headerHeight, marginBottom: '24px', flexShrink: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
         <div style={{ 
             padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '12px', 
             boxShadow: theme.shadow, border: `1px solid ${theme.border}` 
         }}>
            <Layers size={layout.iconSize} color={theme.accent} strokeWidth={2.5} />
         </div>
         <div>
            <div style={{ fontWeight: 800, fontSize: layout.fontSize.title, color: theme.textPrimary, letterSpacing: '-0.5px' }}>
                필름부착확인
            </div>
            <div style={{ fontSize: layout.fontSize.sub, color: theme.textSecondary, fontWeight: 500 }}>
                Estify Vision System
            </div>
         </div>
    </div>
    
    <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
        <div style={{ 
            padding: '0 24px', backgroundColor: '#FFFFFF', borderRadius: '12px',
            boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: layout.fontSize.sub, fontWeight: 600, color: theme.textSecondary,
            border: `1px solid ${theme.border}`
        }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.success, boxShadow: `0 0 10px ${theme.success}` }} />
            MONITORING
        </div>
        <div style={{ 
            padding: '0 24px', backgroundColor: theme.textPrimary, borderRadius: '12px',
            color: 'white', fontSize: layout.fontSize.sub, fontWeight: 600,
            display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            {time}
        </div>
    </div>
  </div>
);

const AutoFitImage = ({ src, alt, onZoom }: { src: string, alt: string, onZoom: () => void }) => (
    <div style={{ 
        width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
        backgroundColor: '#F8FAFC', borderRadius: '12px', overflow: 'hidden', position: 'relative',
        border: `1px solid ${theme.border}`, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)'
    }}>
        {src ? (
             <img src={src} alt={alt} style={{ maxWidth: '98%', maxHeight: '98%', objectFit: 'contain' }} />
        ) : (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', color: theme.textSecondary, gap: '12px'}}>
                 <RefreshCw className="animate-spin" size={32} color="#94A3B8" />
                 <span style={{fontWeight: 500, color: '#94A3B8'}}>검사 이미지를 기다리는 중입니다...</span>
                 <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin { animation: spin 2s linear infinite; }`}</style>
            </div>
        )}
       
        {src && (
            <button 
                onClick={onZoom}
                style={{
                    position: 'absolute', top: '20px', right: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px 16px', borderRadius: '8px',
                    border: `1px solid ${theme.border}`, cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <ZoomIn size={18} color={theme.textPrimary} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: theme.textPrimary }}>확대 보기</span>
            </button>
        )}
    </div>
);

// ─── [MAIN COMPONENT] ───

export default function FilmAttachmentCheck() {
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // API 데이터 상태
    const [apiData, setApiData] = useState<ApiData | null>(null);

    // API 호출 (최초 1회)
    const fetchData = useCallback(async () => {
        try {
            const response = await fetch("http://1.254.24.170:24828/api/DX_API000027");
            const json = await response.json();
            
            if (json.success && json.data && json.data.length > 0) {
                setApiData(json.data[0]);
            }
        } catch (error) {
            console.error("API Fetch Error:", error);
        }
    }, []);

    // 마운트 시 즉시 실행
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

    return (
        <div style={{ 
            backgroundColor: theme.bg, 
            boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            fontFamily: '"Pretendard", -apple-system, sans-serif',
            width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding
        }}>
            <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="필름 부착 상태 상세" imgUrl={apiData?.FILEPATH1 || ''} />

            <Header layout={layout} time={apiData?.TIMEVALUE || "00:00:00"} />

            {/* 메인 컨텐츠 영역 */}
            <div style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', 
                backgroundColor: '#FFFFFF', borderRadius: '16px',
                boxShadow: theme.shadow, padding: '32px', minHeight: 0,
                border: `1px solid ${theme.border}`
            }}>
                
                {/* 1. 상단 정보 테이블 */}
                <InfoTable data={apiData} layout={layout} />

                {/* 2. 메인 이미지 뷰어 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <AutoFitImage 
                        src={apiData?.FILEPATH1 || ''} 
                        alt="Film Check Result" 
                        onZoom={() => setIsModalOpen(true)} 
                    />
                </div>

                {/* 하단 파일명 정보 */}
                {apiData?.FILENAME1 && (
                    <div style={{ 
                        marginTop: '16px', padding: '12px', backgroundColor: '#F8FAFC', 
                        borderRadius: '8px', border: `1px solid ${theme.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        color: theme.textSecondary, fontSize: '14px', fontWeight: 500
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.accent }} />
                        파일명: {apiData.FILENAME1}
                    </div>
                )}
            </div>
        </div>
    );
}