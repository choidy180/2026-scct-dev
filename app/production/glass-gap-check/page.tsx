"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Layers, Clock, FileText, CheckCircle, AlertTriangle, X, ZoomIn, Volume2, VolumeX, Siren, ChevronRight } from 'lucide-react';

// ─── [CONFIG] 설정 및 테마 ───
type ScreenMode = 'FHD' | 'QHD';

interface ApiData {
    TIMEVALUE: string;
    TIMEVALUE2: string;
    FILENAME1: string;
    FILENAME2: string;
    FILENAME3: string;
    FILENAME4: string;
    FILEPATH1: string;
    FILEPATH2: string;
    FILEPATH3: string;
    FILEPATH4: string;
    CDGITEM: string;
    WO: string;
    COUNT_NUM: string;
    RESULT: string;
    LABEL001: string;
    LABEL002: string;
    LABEL003: string;
    LABEL004: string;
}

const LAYOUT_CONFIGS = {
    FHD: {
        padding: '24px',
        gap: '20px',
        headerHeight: '64px',
        fontSize: { title: '20px', sub: '14px', badge: '13px', metaLabel: '12px', metaValue: '15px' },
        iconSize: 20,
        cornerCardWidth: '300px',
    },
    QHD: {
        padding: '40px',
        gap: '32px',
        headerHeight: '88px',
        fontSize: { title: '28px', sub: '18px', badge: '16px', metaLabel: '14px', metaValue: '18px' },
        iconSize: 28,
        cornerCardWidth: '450px',
    }
};

const theme = {
    bg: '#F3F4F6',
    cardBg: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    accent: '#7C3AED', // 조금 더 진한 보라색
    success: '#059669',
    danger: '#DC2626',
    border: '#E5E7EB',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
};

// ─── [NEW UI COMPONENTS] ───

// 1. [헤더] 사운드 제어 버튼 (컨트롤 패널 스타일)
const SoundControlButton = ({ isOn, onClick }: { isOn: boolean, onClick: () => void }) => {
    const [isHover, setIsHover] = useState(false);
    const [isPress, setIsPress] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => { setIsHover(false); setIsPress(false); }}
            onMouseDown={() => setIsPress(true)}
            onMouseUp={() => setIsPress(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '0 16px', height: '100%',
                borderRadius: '12px',
                border: isOn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                backgroundColor: isOn ? '#F5F3FF' : '#FFFFFF',
                color: isOn ? theme.accent : theme.textSecondary,
                cursor: 'pointer', outline: 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isOn 
                    ? `0 0 0 1px ${theme.accent} inset` 
                    : isHover ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transform: isPress ? 'scale(0.96)' : 'scale(1)',
                position: 'relative', overflow: 'hidden'
            }}
        >
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px',
                backgroundColor: isOn ? theme.accent : '#F3F4F6',
                color: isOn ? '#FFF' : '#9CA3AF',
                transition: 'all 0.2s'
            }}>
                {isOn ? <Volume2 size={18} strokeWidth={2.5} /> : <VolumeX size={18} strokeWidth={2.5} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingTop: '1px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: isOn ? theme.accent : '#9CA3AF', letterSpacing: '0.5px' }}>ALARM</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: isOn ? '#111827' : '#4B5563' }}>{isOn ? 'ON' : 'OFF'}</span>
            </div>
        </button>
    );
};

// 2. [카드] 이미지 확대 버튼 (플로팅 스타일)
const ZoomFloatingButton = ({ onClick }: { onClick: () => void }) => {
    const [isHover, setIsHover] = useState(false);
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            style={{
                position: 'absolute', bottom: '16px', right: '16px',
                width: '44px', height: '44px', borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.05)',
                color: theme.textPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isHover 
                    ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transform: isHover ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
        >
            <ZoomIn size={20} strokeWidth={2} />
        </button>
    );
};

// 3. [모달] 주요 액션 버튼 (Primary)
const PrimaryButton = ({ onClick, children, danger = false }: any) => {
    const [isHover, setIsHover] = useState(false);
    const [isPress, setIsPress] = useState(false);
    const baseColor = danger ? theme.danger : theme.accent;

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => { setIsHover(false); setIsPress(false); }}
            onMouseDown={() => setIsPress(true)}
            onMouseUp={() => setIsPress(false)}
            style={{
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: isHover ? baseColor : baseColor, // 그라디언트 제거하고 깔끔한 솔리드 컬러
                color: 'white', fontSize: '16px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: isHover ? `0 8px 20px -6px ${baseColor}80` : `0 4px 10px -4px ${baseColor}60`,
                transform: isPress ? 'scale(0.98)' : (isHover ? 'translateY(-2px)' : 'translateY(0)'),
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: isHover ? 'brightness(1.1)' : 'none'
            }}
        >
            {children}
        </button>
    );
};

// 4. [모달] 닫기 버튼
const ModalCloseButton = ({ onClick }: any) => {
    const [isHover, setIsHover] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            style={{
                width: '40px', height: '40px', borderRadius: '12px', border: 'none',
                backgroundColor: isHover ? '#F3F4F6' : 'transparent',
                color: theme.textPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s'
            }}
        >
            <X size={24} />
        </button>
    )
}

// ─── [SUB COMPONENTS] ───

const SoundPermissionModal = ({ onConfirm }: { onConfirm: () => void }) => {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <div style={{
                backgroundColor: '#FFFFFF', padding: '48px', borderRadius: '28px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px',
                maxWidth: '420px', width: '90%', textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    width: '88px', height: '88px', borderRadius: '50%', backgroundColor: '#FEF2F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 0 8px ${theme.danger}10, 0 0 0 16px ${theme.danger}05`,
                    animation: 'pulseRed 2s infinite'
                }}>
                    <Siren size={44} color={theme.danger} strokeWidth={1.5} />
                </div>

                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                        불량 알림 권한 요청
                    </h2>
                    <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: 1.6 }}>
                        현재 심각한 <strong style={{color: theme.danger}}>유격 불량이 감지</strong>되었습니다.<br />
                        관리자 알림을 위해 경고음을 켜시겠습니까?
                    </p>
                </div>

                <PrimaryButton onClick={onConfirm} danger={true}>
                    <Volume2 size={20} />
                    네, 경고음 켜기
                </PrimaryButton>
            </div>
            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes pulseRed { 0% { transform: scale(0.95); } 50% { transform: scale(1.05); } 100% { transform: scale(0.95); } }
            `}</style>
        </div>
    );
};

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
                if (next > 20 && next < 50) setLoadingText("API 데이터 수신 중...");
                else if (next >= 50 && next < 80) setLoadingText("이미지 리소스 최적화...");
                else if (next >= 80) setLoadingText("검사 UI 구성 완료...");
                if (next >= 100) { clearInterval(timer); setTimeout(onComplete, 300); return 100; }
                return next;
            });
        }, interval);
        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ padding: '24px', backgroundColor: '#F3E8FF', borderRadius: '28px', marginBottom: '40px', boxShadow: `0 20px 40px -10px ${theme.accent}30` }}>
                <Layers size={56} color={theme.accent} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: theme.textPrimary, marginBottom: '12px', letterSpacing: '-0.5px' }}>Estify Glass Inspection</h2>
            <p style={{ fontSize: '15px', color: theme.textSecondary, marginBottom: '32px', fontWeight: 500 }}>{loadingText}</p>
            <div style={{ width: '360px', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: theme.accent, borderRadius: '10px', transition: 'width 0.1s linear' }} />
            </div>
        </div>
    );
};

const ImageModal = ({ isOpen, onClose, title, imgUrl }: { isOpen: boolean, onClose: () => void, title: string, imgUrl: string }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <div style={{
                width: '90vw', height: '90vh', backgroundColor: '#FFFFFF',
                borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                            <ZoomIn size={24} color={theme.textPrimary} />
                        </div>
                        <div>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary, display: 'block' }}>{title}</span>
                            <span style={{ fontSize: '15px', color: theme.textSecondary }}>고해상도 원본 이미지 상세 보기</span>
                        </div>
                    </div>
                    <ModalCloseButton onClick={onClose} />
                </div>
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.border}`, backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imgUrl} alt="Detail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            </div>
        </div>
    );
};

const MetadataItem = ({ label, value, icon, layout }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', height: '100%', backgroundColor: theme.cardBg, borderRadius: '16px', boxShadow: theme.shadow, border: `1px solid ${theme.border}`, minWidth: '160px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            {icon} <span style={{ fontSize: layout.fontSize.metaLabel, color: theme.textSecondary, fontWeight: 700 }}>{label}</span>
        </div>
        <div style={{ fontSize: layout.fontSize.metaValue, color: theme.textPrimary, fontWeight: 800, letterSpacing: '-0.01em' }}>{value}</div>
    </div>
);

const Header = ({ layout, data, isSoundOn, onToggleSound }: { layout: any, data: ApiData | null, isSoundOn: boolean, onToggleSound: () => void }) => {
    const timeValue = data ? data.TIMEVALUE : "--:--:--";
    const woValue = data ? data.WO : "-";
    const modelValue = data ? data.CDGITEM : "-";

    return (
        <div style={{ display: 'flex', gap: layout.gap, height: layout.headerHeight, marginBottom: layout.gap, alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: 'auto', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: theme.cardBg, padding: '0 24px', height: '100%', borderRadius: '16px', boxShadow: theme.shadow, border: `1px solid ${theme.border}` }}>
                    <div style={{ padding: '10px', backgroundColor: '#EDE9FE', borderRadius: '10px' }}><Monitor size={layout.iconSize} color={theme.accent} strokeWidth={2.5} /></div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: layout.fontSize.title, color: theme.textPrimary, lineHeight: 1 }}>Estify<span style={{ color: theme.accent }}>Vision</span></div>
                        <div style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: 600, marginTop: '4px' }}>유리 틈새 확인 시스템</div>
                    </div>
                </div>
                
                {/* [NEW] 개선된 사운드 컨트롤 버튼 */}
                <SoundControlButton isOn={isSoundOn} onClick={onToggleSound} />
            </div>

            <MetadataItem layout={layout} label="현재 시간" value={timeValue} icon={<Clock size={16} color={theme.accent} />} />
            <MetadataItem layout={layout} label="작업지시번호" value={woValue} icon={<FileText size={16} color={theme.accent} />} />
            <MetadataItem layout={layout} label="모델명" value={modelValue} icon={<Layers size={16} color={theme.accent} />} />
        </div>
    );
};

// ─── [MAIN COMPONENT] ───

export default function GlassGapInspection() {
    const [isLoading, setIsLoading] = useState(true);
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, title: string, imgUrl: string } | null>(null);
    const [apiData, setApiData] = useState<ApiData | null>(null);

    const [isDefectMode, setIsDefectMode] = useState(false); 
    const [audioAllowed, setAudioAllowed] = useState(false); 
    const [showPermissionModal, setShowPermissionModal] = useState(false); 

    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleResize = () => setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://1.254.24.170:24828/api/DX_API000023');
                const json = await response.json();
                if (json.success && json.data && json.data.length > 0) {
                    const data: ApiData = json.data[0];
                    setApiData(data);
                    const hasError = data.RESULT !== '정상';
                    setIsDefectMode(hasError);
                    if (hasError && !audioAllowed && !showPermissionModal && !audioCtxRef.current) {
                        setShowPermissionModal(true);
                    }
                }
            } catch (error) { console.error(error); }
        };
        fetchData();
        const intervalId = setInterval(fetchData, 3000);
        return () => clearInterval(intervalId);
    }, [audioAllowed]);

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

    const handlePermissionConfirm = () => {
        setAudioAllowed(true);
        setShowPermissionModal(false);
    };

    const toggleSound = () => setAudioAllowed(prev => !prev);
    const layout = LAYOUT_CONFIGS[screenMode];
    const guideImgUrl = "http://1.254.24.170:24828/images/DX_API000102/guide_img.png";

    const CornerCard = ({ title, status, imgUrl }: { title: string, status: string, imgUrl: string }) => {
        const isOk = status === '정상';
        const statusColor = isOk ? theme.success : theme.danger;
        
        return (
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                backgroundColor: theme.cardBg, borderRadius: '20px',
                boxShadow: theme.shadow, overflow: 'hidden', position: 'relative',
                border: !isOk ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`
            }}>
                <div style={{
                    padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: !isOk ? '#FEF2F2' : '#FFFFFF'
                }}>
                    <span style={{ fontSize: layout.fontSize.sub, fontWeight: 700, color: theme.textPrimary }}>{title}</span>
                    <span style={{
                        fontSize: layout.fontSize.badge, fontWeight: 800, color: statusColor,
                        backgroundColor: isOk ? '#ECFDF5' : '#FFFFFF', padding: '6px 12px', borderRadius: '8px',
                        border: isOk ? `1px solid ${theme.success}30` : `1px solid ${theme.danger}40`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                    }}>
                        {status}
                    </span>
                </div>
                <div style={{ flex: 1, margin: '16px', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}`, backgroundColor: '#020617' }}>
                    <div style={{ width: '100%', height: '100%', backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
                    {/* [NEW] 플로팅 액션 버튼 */}
                    <ZoomFloatingButton onClick={() => setModalInfo({ isOpen: true, title, imgUrl })} />
                </div>
            </div>
        );
    };

    if (isLoading) return <LoadingScreen onComplete={() => setIsLoading(false)} />;

    return (
        <div style={{
            backgroundColor: theme.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            fontFamily: '"Pretendard", -apple-system, sans-serif', width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding
        }}>
            {showPermissionModal && <SoundPermissionModal onConfirm={handlePermissionConfirm} />}
            {modalInfo && <ImageModal isOpen={modalInfo.isOpen} onClose={() => setModalInfo(prev => prev ? { ...prev, isOpen: false } : null)} title={modalInfo.title} imgUrl={modalInfo.imgUrl} />}

            <Header layout={layout} data={apiData} isSoundOn={audioAllowed} onToggleSound={toggleSound} />

            <div style={{ flex: 1, display: 'flex', gap: layout.gap, minHeight: 0 }}>
                <div style={{ width: layout.cornerCardWidth, display: 'flex', flexDirection: 'column', gap: layout.gap }}>
                    <CornerCard title="좌측 상단 (A1)" status={apiData ? apiData.LABEL001 : "-"} imgUrl={apiData ? apiData.FILEPATH1 : ""} />
                    <CornerCard title="좌측 하단 (A3)" status={apiData ? apiData.LABEL003 : "-"} imgUrl={apiData ? apiData.FILEPATH3 : ""} />
                </div>

                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: theme.cardBg, borderRadius: '24px',
                    boxShadow: theme.shadow, overflow: 'hidden', padding: '24px',
                    border: isDefectMode ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            backgroundColor: isDefectMode ? '#FEF2F2' : '#ECFDF5',
                            padding: '12px 32px', borderRadius: '16px',
                            boxShadow: isDefectMode ? `0 8px 20px -4px ${theme.danger}40` : '0 8px 20px -4px rgba(16, 185, 129, 0.2)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            border: `1px solid ${isDefectMode ? theme.danger : theme.success}30`,
                            animation: isDefectMode ? 'pulseBorder 2s infinite' : 'none'
                        }}>
                            {isDefectMode ? (
                                <>
                                    <AlertTriangle size={28} color={theme.danger} fill="#FEE2E2" />
                                    <span style={{ fontSize: layout.fontSize.title, fontWeight: 800, color: theme.danger }}>종합 판정: 불량 (NG)</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={28} color={theme.success} fill="#DCFCE7" />
                                    <span style={{ fontSize: layout.fontSize.title, fontWeight: 800, color: theme.textPrimary }}>종합 판정: 합격 (OK)</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}`, backgroundColor: '#F8FAFC' }}>
                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                             <img src={guideImgUrl} alt="Main Glass Guide" style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))' }} />
                        </div>
                    </div>
                </div>

                <div style={{ width: layout.cornerCardWidth, display: 'flex', flexDirection: 'column', gap: layout.gap }}>
                    <CornerCard title="우측 상단 (A2)" status={apiData ? apiData.LABEL002 : "-"} imgUrl={apiData ? apiData.FILEPATH2 : ""} />
                    <CornerCard title="우측 하단 (A4)" status={apiData ? apiData.LABEL004 : "-"} imgUrl={apiData ? apiData.FILEPATH4 : ""} />
                </div>
            </div>
            <style jsx>{` @keyframes pulseBorder { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } } `}</style>
        </div>
    );
}