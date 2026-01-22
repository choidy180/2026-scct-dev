"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
    Monitor, Clock, CheckCircle2, XCircle, 
    ZoomIn, Volume2, VolumeX, Siren, X 
} from 'lucide-react';

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

// [CHANGE] 새로운 데이터 구조를 위한 인터페이스 추가
interface TotalData {
    total_count: number;
    normal_count: number;
}

const LAYOUT_CONFIGS = {
    FHD: {
        padding: '24px',
        gap: '20px',
        headerHeight: '110px',
        fontSize: { title: '20px', sub: '14px', badge: '13px', metaLabel: '12px', metaValue: '15px' },
        iconSize: 20,
        cornerCardWidth: '300px',
    },
    QHD: {
        padding: '40px',
        gap: '32px',
        headerHeight: '140px',
        fontSize: { title: '28px', sub: '18px', badge: '16px', metaLabel: '14px', metaValue: '18px' },
        iconSize: 28,
        cornerCardWidth: '450px',
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
        .animate-ok { animation: pulse-green-soft 2s infinite; }
        .animate-ng { animation: pulse-red-soft 2s infinite; }
    `}</style>
);

// ─── [UI COMPONENTS] ───

// 1. [헤더] 사운드 제어 버튼
const SoundControlButton = ({ isOn, onClick }: { isOn: boolean, onClick: () => void }) => {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '12px',
                border: isOn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`,
                backgroundColor: isOn ? '#EFF6FF' : '#F1F5F9',
                color: isOn ? theme.accent : theme.textSecondary,
                cursor: 'pointer', outline: 'none',
                transition: 'all 0.2s',
                marginLeft: 'auto'
            }}
        >
            {isOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span style={{ fontSize: '12px', fontWeight: 700 }}>{isOn ? 'ON' : 'MUTE'}</span>
        </button>
    );
};

// 2. [헤더] 대시보드 헤더
// [CHANGE] totalStats prop 추가
const DashboardHeader = ({ layout, data, totalStats, isSoundOn, onToggleSound }: { layout: any, data: ApiData | null, totalStats: TotalData | null, isSoundOn: boolean, onToggleSound: () => void }) => {
    // 판정 결과 로직
    const resultStr = data?.RESULT || '';
    const isPass = resultStr === '정상' || resultStr.toUpperCase() === 'OK';
    const isFail = !isPass && !!resultStr;

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

    // 데이터 안전 참조
    const timeValue = data?.TIMEVALUE || '00:00:00';
    const modelValue = data?.CDGITEM || '-';
    const woValue = data?.WO || '-';

    return (
        <div style={{ display: 'flex', gap: layout.gap, height: layout.headerHeight, marginBottom: layout.gap, flexShrink: 0 }}>
            {/* 1. 타이틀 & 로고 & 사운드 버튼 */}
            <div style={{ 
                width: '320px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px',
                boxShadow: theme.shadow
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Monitor size={28} color={theme.accent} />
                        <span style={{ fontSize: '22px', fontWeight: 800, color: theme.textPrimary }}>Estify<span style={{color:theme.accent}}>Vision</span></span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>유리틈새검사</span>
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
                {/* 헤더 Row */}
                <div style={{ display: 'flex', width: '100%', height: '40%', backgroundColor: '#F8FAFC', borderBottom: `1px solid ${theme.border}` }}>
                    <InfoHeaderCell text="검사 시간" />
                    {/* [CHANGE] 생산 수량 -> 검사 수량 */}
                    <InfoHeaderCell text="검사 수량" />
                    <InfoHeaderCell text="모델명 / WO" />
                    <InfoHeaderCell text="현재 상태" isLast />
                </div>
                {/* 값 Row */}
                <div style={{ display: 'flex', width: '100%', height: '60%' }}>
                    <InfoValueCell text={timeValue} />
                    {/* [CHANGE] 수량 표시 방식 변경 (정상 / 전체) */}
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

// 3. [카드] 이미지 확대 버튼
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
                boxShadow: isHover ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transform: isHover ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.3s'
            }}
        >
            <ZoomIn size={20} strokeWidth={2} />
        </button>
    );
};

// 4. [모달] 주요 액션 버튼
const PrimaryButton = ({ onClick, children, danger = false }: any) => {
    const baseColor = danger ? theme.danger : theme.accent;
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: baseColor, color: 'white', fontSize: '16px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: `0 4px 10px -4px ${baseColor}60`,
            }}
        >
            {children}
        </button>
    );
};

// 5. [모달] 닫기 버튼
const ModalCloseButton = ({ onClick }: any) => (
    <button onClick={onClick} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={24} />
    </button>
);

// ─── [SUB COMPONENTS] ───

const SoundPermissionModal = ({ onConfirm }: { onConfirm: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '48px', borderRadius: '28px', width: '90%', maxWidth: '420px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '50%', backgroundColor: '#FEF2F2', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Siren size={44} color={theme.danger} />
            </div>
            <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>불량 알림 권한 요청</h2>
                <p style={{ color: '#6B7280' }}>심각한 <strong style={{color: theme.danger}}>유격 불량이 감지</strong>되었습니다.<br />경고음을 켜시겠습니까?</p>
            </div>
            <PrimaryButton onClick={onConfirm} danger={true}><Volume2 size={20} />네, 경고음 켜기</PrimaryButton>
        </div>
    </div>
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
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imgUrl} alt="Detail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            </div>
        </div>
    );
};

// ─── [MAIN COMPONENT] ───

export default function GlassGapInspection() {
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, title: string, imgUrl: string } | null>(null);
    const [apiData, setApiData] = useState<ApiData | null>(null);
    // [CHANGE] 전체 수량 정보 State 추가
    const [totalStats, setTotalStats] = useState<TotalData | null>(null);

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
                
                // 1. 검사 상세 데이터 파싱
                if (json.success && json.data && json.data.length > 0) {
                    const data: ApiData = json.data[0];
                    setApiData(data);
                    const hasError = data.RESULT !== '정상';
                    setIsDefectMode(hasError);
                    if (hasError && !audioAllowed && !showPermissionModal && !audioCtxRef.current) {
                        setShowPermissionModal(true);
                    }
                }

                // 2. [CHANGE] 전체 수량/정상 수량 데이터 파싱
                if (json.success && json.total_data) {
                    setTotalStats({
                        total_count: json.total_data.total_count,
                        normal_count: json.total_data.normal_count
                    });
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
                    <ZoomFloatingButton onClick={() => setModalInfo({ isOpen: true, title, imgUrl })} />
                </div>
            </div>
        );
    };

    return (
        <div style={{
            backgroundColor: theme.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            fontFamily: '"Inter", -apple-system, sans-serif', width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding
        }}>
            <GlobalStyles />
            {showPermissionModal && <SoundPermissionModal onConfirm={handlePermissionConfirm} />}
            {modalInfo && <ImageModal isOpen={modalInfo.isOpen} onClose={() => setModalInfo(prev => prev ? { ...prev, isOpen: false } : null)} title={modalInfo.title} imgUrl={modalInfo.imgUrl} />}

            {/* [CHANGE] totalStats prop 전달 */}
            <DashboardHeader 
                layout={layout} 
                data={apiData} 
                totalStats={totalStats} 
                isSoundOn={audioAllowed} 
                onToggleSound={toggleSound} 
            />

            <div style={{ flex: 1, display: 'flex', gap: layout.gap, minHeight: 0 }}>
                {/* Left Column */}
                <div style={{ width: layout.cornerCardWidth, display: 'flex', flexDirection: 'column', gap: layout.gap }}>
                    <CornerCard title="좌측 상단 (A1)" status={apiData ? apiData.LABEL001 : "-"} imgUrl={apiData ? apiData.FILEPATH3 : ""} />
                    <CornerCard title="좌측 하단 (A3)" status={apiData ? apiData.LABEL003 : "-"} imgUrl={apiData ? apiData.FILEPATH1 : ""} />
                </div>

                {/* Center Column */}
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    backgroundColor: theme.cardBg, borderRadius: '24px',
                    boxShadow: theme.shadow, overflow: 'hidden', padding: '24px',
                    border: isDefectMode ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`
                }}>
                    <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}`, backgroundColor: '#F8FAFC' }}>
                        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                            <img src={guideImgUrl} alt="Main Glass Guide" style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))' }} />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ width: layout.cornerCardWidth, display: 'flex', flexDirection: 'column', gap: layout.gap }}>
                    <CornerCard title="우측 상단 (A2)" status={apiData ? apiData.LABEL002 : "-"} imgUrl={apiData ? apiData.FILEPATH2 : ""} />
                    <CornerCard title="우측 하단 (A4)" status={apiData ? apiData.LABEL004 : "-"} imgUrl={apiData ? apiData.FILEPATH4 : ""} />
                </div>
            </div>
        </div>
    );
}