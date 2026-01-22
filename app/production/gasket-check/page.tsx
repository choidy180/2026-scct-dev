"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Layers, ZoomIn, X, RefreshCw, Monitor, Clock, 
    CheckCircle2, XCircle, Volume2, VolumeX, Siren,
    FileText, ChevronRight, Info, ScanLine, AlertTriangle // [FIX] AlertTriangle 추가됨
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
    warning: '#F59E0B',
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
    FILENAME1: string;
    FILEPATH1: string;
    CDGITEM: string | null;
    COUNT_NUM: string | null;
    RESULT: string;
    STATUS002: string;
}

interface TotalData {
    total_count: number;
    normal_count: number;
}

interface SystemLog {
    id: number;
    time: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    message: string;
}

// ─── [GLOBAL STYLES] 애니메이션 ───
const GlobalStyles = () => (
    <style jsx global>{`
        @keyframes pulse-green-soft {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes pulse-red-border {
            0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4), inset 0 0 0 2px rgba(220, 38, 38, 0.1); }
            50% { box-shadow: 0 0 10px 2px rgba(220, 38, 38, 0.2), inset 0 0 10px 2px rgba(220, 38, 38, 0.1); }
            100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4), inset 0 0 0 2px rgba(220, 38, 38, 0.1); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-ok { animation: pulse-green-soft 2s infinite; }
        .animate-ng { animation: pulse-red-soft 2s infinite; }
        .animate-spin { animation: spin 2s linear infinite; }
        .inspection-box { animation: pulse-red-border 2s infinite ease-in-out; }

        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 3px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background-color: #94A3B8; }
    `}</style>
);

// ─── [HELPER] 로그 생성기 (한글화) ───
const generateInitialLogs = (): SystemLog[] => {
    const logs: SystemLog[] = [];
    const messages = [
        { type: 'INFO', msg: '시스템 하트비트 점검 (정상)' },
        { type: 'SUCCESS', msg: '이미지 캡처 및 전처리 완료' },
        { type: 'INFO', msg: '비전 분석 프로세스 시작 (Batch #204)' },
        { type: 'SUCCESS', msg: '검사 결과 데이터베이스 저장됨' },
        { type: 'INFO', msg: 'MES 서버와 데이터 동기화 중...' },
        { type: 'WARNING', msg: '카메라 응답 지연 감지됨 (30ms)' },
        { type: 'INFO', msg: '조명 및 캘리브레이션 상태 확인' },
        { type: 'SUCCESS', msg: '모델 파일 업데이트 확인 (v1.2.4)' }
    ];

    let currentTime = new Date();
    
    for (let i = 0; i < 15; i++) {
        const diffMinutes = Math.floor(Math.random() * 6) + 5; 
        currentTime = new Date(currentTime.getTime() - diffMinutes * 60000);
        
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        logs.push({
            id: i,
            time: currentTime.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: randomMsg.type as any,
            message: randomMsg.msg
        });
    }
    return logs.sort((a, b) => a.id - b.id);
};

// ─── [COMPONENT] Inspection Overlay ───
const InspectionOverlay = ({ isVisible }: { isVisible: boolean }) => {
    if (!isVisible) return null;

    const boxStyle: React.CSSProperties = {
        position: 'absolute',
        top: '11%', 
        left: '20%', 
        width: '32%', 
        height: '85%',
        border: `3px solid ${theme.danger}`,
        borderRadius: '2px',
        boxShadow: `0 0 0 1px #fff, inset 0 0 0 1px #fff`,
        pointerEvents: 'none',
        zIndex: 10,
    };

    const innerBoxStyle: React.CSSProperties = {
        position: 'absolute',
        top: '4%',
        left: '6%',
        right: '6%',
        bottom: '4%',
        border: `1px solid ${theme.danger}`,
        opacity: 0.7
    };

    return (
        <div className="inspection-box" style={boxStyle}>
            <div style={innerBoxStyle}></div>
            <div style={{
                position: 'absolute', top: '-22px', left: '-2px',
                backgroundColor: theme.danger, color: 'white',
                fontSize: '10px', fontWeight: 'bold', padding: '2px 6px',
                borderRadius: '2px 2px 2px 0'
            }}>
                ROI: GASKET
            </div>
        </div>
    );
};

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

const DashboardHeader = ({ layout, data, totalStats, isSoundOn, onToggleSound }: { layout: any, data: ApiData | null, totalStats: TotalData | null, isSoundOn: boolean, onToggleSound: () => void }) => {
    const resultVal = data?.RESULT || '';
    const isPass = resultVal === "정상" || resultVal.toUpperCase() === "OK";
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

    const timeValue = data?.TIMEVALUE || '00:00:00';
    const countValue = data?.COUNT_NUM || '0';
    const modelValue = data?.CDGITEM || '-';
    const woValue = data?.STATUS002 || '-';

    return (
        <div style={{ display: 'flex', gap: layout.gap, height: layout.headerHeight, marginBottom: layout.gap, flexShrink: 0 }}>
            <div style={{ 
                width: '320px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px',
                boxShadow: theme.shadow
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={28} color={theme.accent} />
                        <span style={{ fontSize: '22px', fontWeight: 800, color: theme.textPrimary }}>Estify<span style={{color:theme.accent}}>Vision</span></span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>필름부착확인</span>
                    <SoundControlButton isOn={isSoundOn} onClick={onToggleSound} />
                </div>
            </div>

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

            <div style={{ 
                flex: 1, backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`,
                display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: theme.shadow
            }}>
                <div style={{ display: 'flex', width: '100%', height: '40%', backgroundColor: '#F8FAFC', borderBottom: `1px solid ${theme.border}` }}>
                    <InfoHeaderCell text="검사 시간" />
                    <InfoHeaderCell text="검사 수량" />
                    <InfoHeaderCell text="모델명 / 작업지시번호" />
                    <InfoHeaderCell text="현재 상태" isLast />
                </div>
                <div style={{ display: 'flex', width: '100%', height: '60%' }}>
                    <InfoValueCell text={timeValue} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${theme.border}` }}>
                        {totalStats ? (
                             <div style={{ fontSize: '18px', fontWeight: 700, color: theme.textPrimary }}>
                                <span style={{ color: theme.success }}>{totalStats.normal_count}</span>
                                <span style={{ color: '#CBD5E1', margin: '0 6px' }}>/</span>
                                <span>{totalStats.total_count}</span>
                             </div>
                        ) : (
                            <span style={{ fontSize: '18px', fontWeight: 700, color: theme.textSecondary }}>-</span>
                        )}
                    </div>
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
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: theme.textSecondary, borderRight: isLast ? 'none' : `1px solid ${theme.border}` }}>{text}</div>
);
const InfoValueCell = ({ text, isLast, color }: { text: string, isLast?: boolean, color?: string }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: color || theme.textPrimary, borderRight: isLast ? 'none' : `1px solid ${theme.border}` }}>{text}</div>
);

const AutoFitImage = ({ src, alt, onZoom, showOverlay }: { src: string, alt: string, onZoom: () => void, showOverlay: boolean }) => (
    <div style={{ 
        width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', 
        backgroundColor: '#F8FAFC', borderRadius: '12px', overflow: 'hidden', position: 'relative',
        border: `1px solid ${theme.border}`
    }}>
        {src ? (
             <div style={{ position: 'relative', width: 'auto', height: '95%', display: 'flex' }}>
                 <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.05))' }} />
                 <InspectionOverlay isVisible={showOverlay} />
             </div>
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
                    <div style={{ position: 'relative', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img src={imgUrl} alt="Detail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
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
                <p style={{ color: '#6B7280' }}>부착 불량이 감지되었습니다.<br />경고음을 켜시겠습니까?</p>
            </div>
            <button onClick={onConfirm} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.danger, color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
                네, 경고음 켜기
            </button>
        </div>
    </div>
);

const LogItem = ({ log }: { log: SystemLog }) => {
    let icon = <Info size={14} color={theme.textSecondary} />;
    
    if (log.type === 'SUCCESS') {
        icon = <CheckCircle2 size={14} color={theme.success} />;
    } else if (log.type === 'WARNING') {
        icon = <AlertTriangle size={14} color={theme.warning} />;
    } else if (log.type === 'ERROR') {
        icon = <XCircle size={14} color={theme.danger} />;
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ minWidth: '70px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>{log.time}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: '13px', color: theme.textPrimary, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</div>
        </div>
    );
}

// ─── [MAIN COMPONENT] ───

export default function FilmAttachmentCheck() {
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [apiData, setApiData] = useState<ApiData | null>(null);
    const [totalStats, setTotalStats] = useState<TotalData | null>(null);
    const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

    const [isDefectMode, setIsDefectMode] = useState(false);
    const [audioAllowed, setAudioAllowed] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setSystemLogs(generateInitialLogs());
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch("http://1.254.24.170:24828/api/DX_API000026");
            const json = await response.json();
            
            if (json.success) {
                if (json.data && json.data.length > 0) {
                    const data = json.data[0];
                    setApiData(data);
                    const resultVal = data.RESULT;
                    const isPass = resultVal === "정상" || resultVal === "OK";
                    const hasError = !isPass && !!resultVal;
                    
                    setIsDefectMode(hasError);
                    if (hasError && !audioAllowed && !showPermissionModal && !audioCtxRef.current) {
                        setShowPermissionModal(true);
                    }
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
    }, [audioAllowed, showPermissionModal]);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, 3000);
        return () => clearInterval(id);
    }, [fetchData]);

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
    const isPass = apiData?.RESULT === "정상" || apiData?.RESULT === "OK";
    const borderStyle = (apiData && !isPass && apiData.RESULT) ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`;

    return (
        <div style={{ 
            backgroundColor: theme.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            fontFamily: '"Inter", -apple-system, sans-serif', width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding
        }}>
            <GlobalStyles />
            {showPermissionModal && <SoundPermissionModal onConfirm={() => { setAudioAllowed(true); setShowPermissionModal(false); }} />}
            <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Film Attachment Detail" imgUrl={apiData?.FILEPATH1 || ''} />

            <DashboardHeader 
                layout={layout} 
                data={apiData} 
                totalStats={totalStats}
                isSoundOn={audioAllowed} 
                onToggleSound={() => setAudioAllowed(!audioAllowed)} 
            />

            <div style={{ flex: 1, display: 'flex', gap: layout.gap, minHeight: 0 }}>
                
                {/* 1. 이미지 뷰어 (Overlay 포함) */}
                <div style={{ 
                    flex: 3, display: 'flex', flexDirection: 'column', 
                    backgroundColor: theme.cardBg, borderRadius: '24px',
                    boxShadow: theme.shadow, padding: '24px',
                    border: borderStyle, transition: 'border 0.3s'
                }}>
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <AutoFitImage 
                            src={apiData?.FILEPATH1 || ''} 
                            alt="Inspection Result" 
                            onZoom={() => setIsModalOpen(true)}
                            showOverlay={!!apiData?.FILEPATH1}
                        />
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

                {/* 2. 로그 패널 */}
                <div style={{ 
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: theme.cardBg, borderRadius: '24px',
                    boxShadow: theme.shadow, border: `1px solid ${theme.border}`,
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} color={theme.textPrimary} />
                            <span style={{ fontWeight: 700, fontSize: '16px', color: theme.textPrimary }}>시스템 로그</span>
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textSecondary, backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${theme.border}` }}>
                            실시간
                        </div>
                    </div>
                    
                    <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
                            {systemLogs.map((log) => (
                                <LogItem key={log.id} log={log} />
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: '16px 24px', borderTop: `1px solid ${theme.border}`, backgroundColor: '#F8FAFC' }}>
                        <button style={{ 
                            width: '100%', padding: '12px', borderRadius: '10px', 
                            border: `1px dashed ${theme.border}`, backgroundColor: 'transparent',
                            color: theme.textSecondary, fontSize: '13px', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            전체 로그 보기 <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}