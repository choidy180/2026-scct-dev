"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, ZoomIn, X, RefreshCw, ImageOff, CheckCircle2, XCircle, Clock } from 'lucide-react';

// ─── [CONFIG] 디자인 테마 시스템 ───
const THEME = {
  bg: '#F8FAFC',          // 전체 배경
  white: '#FFFFFF',       // 카드 배경
  border: '#E2E8F0',      // 중립적인 테두리 색상
  textPrimary: '#0F172A', // 진한 글씨
  textSecondary: '#64748B', // 연한 글씨
  
  // 상태별 컬러 (아이콘 및 텍스트용)
  status: {
    ok: {
      bg: '#ECFDF5',      // 아이콘 배경 (연한 초록)
      text: '#059669',    // 텍스트 색상 (진한 초록)
    },
    ng: {
      bg: '#FEF2F2',      // 아이콘 배경 (연한 빨강)
      text: '#DC2626',    // 텍스트 색상 (진한 빨강)
    },
    wait: {
      bg: '#F1F5F9',
      text: '#94A3B8',
    }
  }
};

interface ApiData {
    TIMEVALUE: string;
    FILENAME1: string;
    FILEPATH1: string;
    CDGITEM: string | null;
    COUNT_NUM: string | null;
    RESULT: string;       
    STATUS002: string;
}

// ─── [GLOBAL STYLES] ───
// 맥박 애니메이션은 유지하되, 테두리 색상이 아닌 그림자만 은은하게 사용
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 2s linear infinite; }
        .animate-ok { animation: pulse-green-soft 2s infinite; }
        .animate-ng { animation: pulse-red-soft 2s infinite; }
    `}</style>
);

// ─── [COMPONENTS] ───

// [수정 1] 판정 박스: 두꺼운 테두리와 우측 컬러바 제거. 심플한 디자인 적용.
const StatusCard = ({ result }: { result: string | undefined }) => {
    const isPass = result === "정상" || result?.toUpperCase() === "OK";
    const isFail = !isPass && !!result;
    
    let currentStyle = THEME.status.wait;
    let Icon = Clock;
    let label = "대기중";
    let subLabel = "WAITING";
    let animClass = "";

    if (isPass) {
        currentStyle = THEME.status.ok;
        Icon = CheckCircle2;
        label = "정상 (OK)";
        subLabel = "PASSED";
        animClass = "animate-ok";
    } else if (isFail) {
        currentStyle = THEME.status.ng;
        Icon = XCircle;
        label = "불량 (NG)";
        subLabel = "FAILED";
        animClass = "animate-ng";
    }

    return (
        <div className={animClass} style={{
            width: '280px',
            backgroundColor: THEME.white,
            borderRadius: '16px',
            // [수정] 테두리를 중립적인 색상으로 변경
            border: `1px solid ${THEME.border}`,
            display: 'flex', alignItems: 'center', padding: '0 24px', gap: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            flexShrink: 0,
            position: 'relative', overflow: 'hidden'
        }}>
            {/* 왼쪽: 아이콘 영역 */}
            <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: currentStyle.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: currentStyle.text, flexShrink: 0
            }}>
                <Icon size={36} strokeWidth={2.5} />
            </div>

            {/* 오른쪽: 텍스트 영역 */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px', color: THEME.textSecondary, fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
                    판정 결과
                </span>
                <span style={{ fontSize: '26px', color: currentStyle.text, fontWeight: 800, lineHeight: 1 }}>
                    {label}
                </span>
                <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500, marginTop: '4px' }}>
                    {subLabel}
                </span>
            </div>
            {/* [수정] 우측 컬러바 제거됨 */}
        </div>
    );
};

// 2. 정보 테이블 (변경 없음)
const InfoTable = ({ data }: { data: ApiData | null }) => {
    const tableContainerStyle: React.CSSProperties = {
        flex: 1, backgroundColor: THEME.white,
        borderRadius: '16px', border: `1px solid ${THEME.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    };
    const headerCellStyle: React.CSSProperties = {
        flex: 1, backgroundColor: '#F1F5F9', color: THEME.textSecondary,
        fontSize: '14px', fontWeight: 700, textAlign: 'center', padding: '12px 0',
        borderRight: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center'
    };
    const valueCellStyle: React.CSSProperties = {
        flex: 1, backgroundColor: THEME.white, color: THEME.textPrimary,
        fontSize: '18px', fontWeight: 600, textAlign: 'center', padding: '16px 0',
        borderRight: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderTop: '1px solid #E2E8F0'
    };
    const safe = (v: any) => v || '-';

    return (
        <div style={tableContainerStyle}>
            <div style={{ display: 'flex', width: '100%' }}>
                <div style={headerCellStyle}>작업지시번호</div>
                <div style={headerCellStyle}>모델명</div>
                <div style={{ ...headerCellStyle, borderRight: 'none' }}>No.</div>
            </div>
            <div style={{ display: 'flex', width: '100%', flex: 1 }}>
                <div style={valueCellStyle}>{safe(data?.STATUS002)}</div>
                <div style={valueCellStyle}>{safe(data?.CDGITEM)}</div>
                <div style={{ ...valueCellStyle, borderRight: 'none' }}>{safe(data?.COUNT_NUM)}</div>
            </div>
        </div>
    );
};

// [수정 2] 이미지 모달: 이미지가 박스 밖으로 튀어나가는 현상 수정
const ImageModal = ({ isOpen, onClose, imgUrl }: any) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            <div style={{ 
                width: '100%', maxWidth: '1200px', height: '90vh', background: '#fff', borderRadius: '16px', padding: '20px', 
                display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{fontSize: '18px', fontWeight: 700, color: THEME.textPrimary}}>이미지 상세 보기</span>
                    <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                        <X size={24} color={THEME.textPrimary} />
                    </button>
                </div>

                {/* [수정] overflow: hidden 및 명확한 크기 제한 적용 */}
                <div style={{ 
                    flex: 1, background: '#0F172A', borderRadius: '12px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', // 중요: 이미지가 튀어나가지 않도록 함
                    width: '100%', height: '100%'
                }}>
                    {imgUrl ? (
                        <img src={imgUrl} style={{ 
                            maxWidth: '100%', maxHeight: '100%', 
                            objectFit: 'contain', // 비율 유지하며 컨테이너에 맞춤
                            width: 'auto', height: 'auto' 
                        }} alt="Full Detail" />
                    ) : (
                         <span style={{color: 'white'}}>이미지를 불러올 수 없습니다.</span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── [MAIN PAGE] ───
export default function FilmAttachmentCheck() {
    const [apiData, setApiData] = useState<ApiData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch("http://1.254.24.170:24828/api/DX_API000027");
            const json = await response.json();
            if (json.success && json.data && json.data.length > 0) {
                setApiData(json.data[0]);
            } else {
                setApiData(null);
            }
        } catch (error) { console.error(error); } 
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <>
            <GlobalStyles />
            <div style={{ 
                width: '100%', height: '100vh', padding: '32px', backgroundColor: THEME.bg,
                fontFamily: '"Pretendard", -apple-system, sans-serif', boxSizing: 'border-box',
                display: 'flex', flexDirection: 'column'
            }}>
                <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imgUrl={apiData?.FILEPATH1} />

                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', height: '60px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                            <Layers size={24} color="#3B82F6" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 800, color: THEME.textPrimary, margin: 0, letterSpacing: '-0.5px' }}>필름 부착 확인</h1>
                            <span style={{ fontSize: '14px', color: THEME.textSecondary, fontWeight: 500 }}>Vision Inspection System</span>
                        </div>
                    </div>
                    <div style={{ 
                        padding: '10px 24px', background: '#1E293B', color: '#FFF', borderRadius: '12px',
                        fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                    }}>
                        <RefreshCw size={18} className={isLoading ? "spin-icon" : ""} />
                        {apiData?.TIMEVALUE || "00:00:00"}
                    </div>
                </div>

                {/* 메인 컨텐츠 */}
                <div style={{ 
                    flex: 1, backgroundColor: THEME.white, borderRadius: '24px', padding: '32px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', border: `1px solid ${THEME.border}`,
                    display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden'
                }}>
                    
                    {/* [Row 1] 판정 박스 + 정보 테이블 */}
                    <div style={{ display: 'flex', gap: '24px', height: '120px', marginBottom: '24px', flexShrink: 0 }}>
                        <StatusCard result={apiData?.RESULT} />
                        <InfoTable data={apiData} />
                    </div>

                    {/* [Row 2] 이미지 뷰어 */}
                    <div style={{ 
                        flex: 1, backgroundColor: '#F8FAFC', borderRadius: '20px', 
                        border: `1px solid ${THEME.border}`, position: 'relative', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {apiData?.FILEPATH1 ? (
                            <>
                                {/* 메인 화면 이미지도 튀어나가지 않도록 maxWidth/maxHeight 적용 */}
                                <img src={apiData.FILEPATH1} alt="Result" style={{ maxWidth: '98%', maxHeight: '98%', objectFit: 'contain' }} />
                                <button onClick={() => setIsModalOpen(true)} style={{
                                    position: 'absolute', top: '24px', right: '24px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '12px 20px', borderRadius: '12px',
                                    border: `1px solid ${THEME.border}`, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: THEME.textPrimary,
                                    fontSize: '14px', transition: 'transform 0.2s'
                                }}>
                                    <ZoomIn size={18} /> 이미지 확대
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#94A3B8' }}>
                                <ImageOff size={56} strokeWidth={1.5} />
                                <span style={{ fontSize: '18px', fontWeight: 500 }}>검사 이미지가 없습니다</span>
                            </div>
                        )}
                    </div>

                    {/* 하단 파일명 */}
                    {apiData?.FILENAME1 && (
                        <div style={{ 
                            marginTop: '20px', textAlign: 'center', fontSize: '14px', color: THEME.textSecondary, 
                            fontWeight: 500, background: '#F1F5F9', padding: '12px', borderRadius: '12px', flexShrink: 0
                        }}>
                            📁 파일명: {apiData.FILENAME1}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}