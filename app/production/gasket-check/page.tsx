"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    CheckCircle, AlertTriangle, ScanLine, ZoomIn, X, RefreshCw, 
    Monitor, Clock, CheckCircle2, XCircle, Volume2, VolumeX, Siren 
} from 'lucide-react';

// ─── [CONFIG] 설정 및 테마 ───
type ScreenMode = 'FHD' | 'QHD';

const LAYOUT_CONFIGS = {
    FHD: {
        padding: '24px',
        gap: '20px',
        headerHeight: '110px',
        fontSize: { title: '20px', sub: '14px', badge: '13px', metaLabel: '12px', metaValue: '15px' },
        iconSize: 20,
        borderRadius: '16px',
    },
    QHD: {
        padding: '40px',
        gap: '32px',
        headerHeight: '140px',
        fontSize: { title: '28px', sub: '18px', badge: '16px', metaLabel: '14px', metaValue: '18px' },
        iconSize: 28,
        borderRadius: '24px',
    }
};

const theme = {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    accent: '#3B82F6',
    success: '#059669',
    danger: '#DC2626',
    border: '#E2E8F0',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    status: {
        ok: { bg: '#ECFDF5', text: '#059669', border: '#10B981' },
        ng: { bg: '#FEF2F2', text: '#DC2626', border: '#EF4444' },
        wait: { bg: '#F1F5F9', text: '#94A3B8', border: '#CBD5E1' }
    }
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

// ─── [GLOBAL STYLES] 애니메이션 ───
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
        .animate-ok { animation: pulse-green-soft 2s infinite; }
        .animate-ng { animation: pulse-red-soft 2s infinite; }
        .animate-spin { animation: spin 2s linear infinite; }
    `}</style>
);

// ─── [UI COMPONENTS] ───

const SoundControlButton = ({ isOn, onClick }: { isOn: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '12px',
            border: isOn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
            backgroundColor: isOn ? '#EFF6FF' : '#F1F5F9',
            color: isOn ? theme.accent : theme.textSecondary,
            cursor: 'pointer', outline: 'none', transition: 'all 0.2s', marginLeft: 'auto'
        }}
    >
        {isOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        <span style={{ fontSize: '12px', fontWeight: 700 }}>{isOn ? 'ON' : 'MUTE'}</span>
    </button>
);

const DashboardHeader = ({ layout, data, isSoundOn, onToggleSound }: { layout: any, data: ApiData | null, isSoundOn: boolean, onToggleSound: () => void }) => {
    // [수정] 판정 결과 로직: "정상"일 경우 OK
    const resultVal = data?.RESULT || '';
    const isPass = resultVal === "정상";
    const isFail = !isPass && !!resultVal;

    let style = theme.status.wait;
    let Icon = Clock;
    let label = "READY";
    let subLabel = "SYSTEM STANDBY";
    let animClass = "";

    if (isPass) {
        style = theme.status.ok;
        Icon = CheckCircle2;
        label = "OK (정상)";
        subLabel = "PASSED";
        animClass = "animate-ok";
    } else if (isFail) {
        style = theme.status.ng;
        Icon = XCircle;
        label = "NG (불량)";
        subLabel = "FAILED";
        animClass = "animate-ng";
    }

    // 데이터 바인딩 (Null 처리 강화)
    const timeValue = data?.TIMEVALUE || '00:00:00';
    const countValue = data?.COUNT_NUM ? data.COUNT_NUM : '0'; // null일 경우 0
    const modelValue = data?.CDGITEM ? data.CDGITEM : '-';     // null일 경우 -
    const woValue = data?.STATUS002 ? data.STATUS002 : '-';    // null일 경우 -

    return (
        <div style={{ display: 'flex', gap: layout.gap, height: layout.headerHeight, marginBottom: layout.gap, flexShrink: 0 }}>
            {/* 1. 로고 영역 */}
            <div style={{ 
                width: '320px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px',
                boxShadow: theme.shadow
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ScanLine size={28} color={theme.accent} />
                        <span style={{ fontSize: '22px', fontWeight: 800, color: theme.textPrimary }}>Estify<span style={{color:theme.accent}}>Vision</span></span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>가스켓 이상 탐지</span>
                    <SoundControlButton isOn={isSoundOn} onClick={onToggleSound} />
                </div>
            </div>

            {/* 2. 판정 결과 박스 */}
            <div className={animClass} style={{
                width: '320px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', padding: '0 32px', gap: '24px', position: 'relative', overflow: 'hidden',
                boxShadow: theme.shadow
            }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%', backgroundColor: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.text, flexShrink: 0
                }}>
                    <Icon size={36} strokeWidth={2.5} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>TOTAL RESULT</span>
                    <span style={{ fontSize: '28px', color: style.text, fontWeight: 800, lineHeight: 1.1 }}>{label}</span>
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>{subLabel}</span>
                </div>
            </div>

            {/* 3. 정보 테이블 */}
            <div style={{ 
                flex: 1, backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`,
                display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: theme.shadow
            }}>
                <div style={{ display: 'flex', width: '100%', height: '40%', backgroundColor: '#F8FAFC', borderBottom: `1px solid ${theme.border}` }}>
                    <InfoHeaderCell text="검사 시간" />
                    <InfoHeaderCell text="생산 수량" />
                    <InfoHeaderCell text="모델명 / 작업지시번호" />
                    <InfoHeaderCell text="현재 상태" isLast />
                </div>
                <div style={{ display: 'flex', width: '100%', height: '60%' }}>
                    <InfoValueCell text={timeValue} />
                    <InfoValueCell text={`${countValue} EA`} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${theme.border}` }}>
                         <span style={{fontSize: '15px', fontWeight: 700, color: theme.textPrimary}}>{modelValue}</span>
                         <span style={{fontSize: '11px', fontWeight: 500, color: theme.textSecondary}}>{woValue}</span>
                    </div>
                    <InfoValueCell text="RUNNING" isLast color={theme.accent} />
                </div>
            </div>
        </div>
    );
};

const InfoHeaderCell = ({ text, isLast }: { text: string, isLast?: boolean }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: theme.textSecondary, borderRight: isLast ? 'none' : `1px solid ${theme.border}` }}>{text}</div>
);
const InfoValueCell = ({ text, isLast, color }: { text: string, isLast?: boolean, color?: string }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: color || theme.textPrimary, borderRight: isLast ? 'none' : `1px solid ${theme.border}` }}>{text}</div>
);

const AutoFitImage = ({ src, alt, onZoom }: { src: string, alt: string, onZoom: () => void }) => (
    <div style={{ 
        width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
        backgroundColor: '#F8FAFC', borderRadius: '12px', overflow: 'hidden', position: 'relative',
        border: `1px solid ${theme.border}`
    }}>
        {src ? (
             <img src={src} alt={alt} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.05))' }} />
        ) : (
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', color: theme.textSecondary, gap: '12px'}}>
                 <RefreshCw className="animate-spin" size={32} color="#CBD5E1" />
                 <span style={{fontWeight: 500, color: '#9CA3AF'}}>이미지 수신 대기 중...</span>
            </div>
        )}
        
        {src && (
            <button 
                onClick={(e) => { e.stopPropagation(); onZoom(); }}
                style={{
                    position: 'absolute', bottom: '24px', right: '24px',
                    backgroundColor: '#FFFFFF', width: '48px', height: '48px', borderRadius: '14px',
                    border: `1px solid ${theme.border}`, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s',
                    color: theme.textPrimary
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <ZoomIn size={22} strokeWidth={2} />
            </button>
        )}
    </div>
);

const ModalCloseButton = ({ onClick }: any) => (
    <button onClick={onClick} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={24} color={theme.textPrimary} />
    </button>
);

const ImageModal = ({ isOpen, onClose, title, imgUrl }: { isOpen: boolean, onClose: () => void, title: string, imgUrl: string }) => {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ width: '90vw', height: '90vh', backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <ZoomIn size={24} />
                        <span style={{ fontSize: '24px', fontWeight: 800 }}>{title}</span>
                    </div>
                    <ModalCloseButton onClick={onClose} />
                </div>
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}` }}>
                    <img src={imgUrl} alt="Detail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            </div>
        </div>
    );
};

const SoundPermissionModal = ({ onConfirm }: { onConfirm: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '48px', borderRadius: '28px', width: '90%', maxWidth: '420px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '50%', backgroundColor: '#FEF2F2', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Siren size={44} color={theme.danger} />
            </div>
            <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>불량 알림 권한 요청</h2>
                <p style={{ color: '#6B7280' }}>이물 불량이 감지되었습니다.<br />경고음을 켜시겠습니까?</p>
            </div>
            <button onClick={onConfirm} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.danger, color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
                네, 경고음 켜기
            </button>
        </div>
    </div>
);

// ─── [MAIN COMPONENT] ───

export default function GasketAnomalyDetection() {
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [apiData, setApiData] = useState<ApiData | null>(null);

    // 사운드 관련 상태
    const [isDefectMode, setIsDefectMode] = useState(false);
    const [audioAllowed, setAudioAllowed] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch("http://1.254.24.170:24828/api/DX_API000026");
            const json = await response.json();
            
            if (json.success && json.data && json.data.length > 0) {
                const data = json.data[0];
                setApiData(data);

                // [수정] "정상"이 아닐 때만 불량 모드(소리 알림) 활성화
                const hasError = data.RESULT !== "정상";
                setIsDefectMode(hasError);
                
                if (hasError && !audioAllowed && !showPermissionModal && !audioCtxRef.current) {
                    setShowPermissionModal(true);
                }
            }
        } catch (error) {
            console.error("API Fetch Error:", error);
        }
    }, [audioAllowed, showPermissionModal]);

    // 주기적 호출
    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 3000);
        return () => clearInterval(id);
    }, [fetchData]);

    // 사운드 재생 로직
    useEffect(() => {
        if (isDefectMode && audioAllowed) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();

            const playBeep = () => {
                const ctx = audioCtxRef.current;
                if (!ctx) return;
                if (ctx.state === 'suspended') ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
                osc.stop(ctx.currentTime + 0.15);
            };
            playBeep();
            intervalRef.current = setInterval(playBeep, 500);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isDefectMode, audioAllowed]);

    useEffect(() => {
        const handleResize = () => setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const layout = LAYOUT_CONFIGS[screenMode];
    
    // [수정] 테두리 스타일도 RESULT: "정상" 여부에 따라 변경
    const isPass = apiData?.RESULT === "정상";
    const borderStyle = (apiData && !isPass) ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`;

    return (
        <div style={{ 
            backgroundColor: theme.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            fontFamily: '"Inter", -apple-system, sans-serif', width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding
        }}>
            <GlobalStyles />
            {showPermissionModal && <SoundPermissionModal onConfirm={() => { setAudioAllowed(true); setShowPermissionModal(false); }} />}
            <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gasket Analysis Detail" imgUrl={apiData?.FILEPATH1 || ''} />

            <DashboardHeader layout={layout} data={apiData} isSoundOn={audioAllowed} onToggleSound={() => setAudioAllowed(!audioAllowed)} />

            {/* 메인 콘텐츠 영역 */}
            <div style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', 
                backgroundColor: theme.cardBg, borderRadius: '24px',
                boxShadow: theme.shadow, padding: '24px', minHeight: 0,
                border: borderStyle,
                transition: 'border 0.3s'
            }}>
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <AutoFitImage 
                        src={apiData?.FILEPATH1 || ''} 
                        alt="Inspection Result" 
                        onZoom={() => setIsModalOpen(true)} 
                    />
                    
                    {/* 파일명 오버레이 */}
                    {apiData?.FILENAME1 && (
                        <div style={{ 
                            position: 'absolute', top: '24px', left: '24px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '10px 16px', borderRadius: '12px',
                            color: theme.textSecondary, fontSize: '13px', fontWeight: 600, backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            border: `1px solid ${theme.border}`
                        }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.accent }} />
                            {apiData.FILENAME1}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}