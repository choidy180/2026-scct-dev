"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Layers, ZoomIn, X, RefreshCw, Monitor, Clock, 
    CheckCircle2, XCircle, Volume2, VolumeX, Siren,
    FileText, ChevronRight, Info, ScanLine, AlertTriangle,
    ClipboardX, Home, Calendar, ChevronDown, ChevronLeft // [NEW] 아이콘 추가
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

// ─── [GLOBAL STYLES] 애니메이션 및 커스텀 UI ───
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
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
        }
        @keyframes slideDownFade {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-ok { animation: pulse-green-soft 2s infinite; }
        .animate-ng { animation: pulse-red-border 2s infinite ease-in-out; }
        .animate-spin { animation: spin 2s linear infinite; }
        .inspection-box { animation: pulse-red-border 2s infinite ease-in-out; }
        .animate-float { animation: float 4s ease-in-out infinite; }

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
        top: '11%', left: '20%', width: '32%', height: '85%',
        border: `3px solid ${theme.danger}`,
        borderRadius: '2px',
        boxShadow: `0 0 0 1px #fff, inset 0 0 0 1px #fff`,
        pointerEvents: 'none', zIndex: 10,
    };

    const innerBoxStyle: React.CSSProperties = {
        position: 'absolute',
        top: '4%', left: '6%', right: '6%', bottom: '4%',
        border: `1px solid ${theme.danger}`, opacity: 0.7
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

// 1. 커스텀 Date Picker
const CustomDatePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const initialDate = value ? new Date(value) : new Date();
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); 
    
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) { days.push(null); }
    for (let i = 1; i <= daysInMonth; i++) { days.push(i); }

    const formattedDate = useMemo(() => {
        if (!value) return "날짜를 선택하세요";
        const [y, m, d] = value.split('-');
        return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
    }, [value]);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } 
        else { setViewMonth(viewMonth - 1); }
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } 
        else { setViewMonth(viewMonth + 1); }
    };

    const handleSelectDate = (day: number) => {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        onChange(`${viewYear}-${mm}-${dd}`);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px',
                    background: '#FFFFFF', border: `1.5px solid ${isOpen ? theme.accent : '#E2E8F0'}`,
                    borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
            >
                <Calendar size={20} color={theme.accent} />
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.3px' }}>
                    {formattedDate}
                </span>
                <ChevronDown size={18} color={theme.textSecondary} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%',
                    background: '#FFFFFF', borderRadius: '16px', border: `1px solid ${theme.border}`,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 100, padding: '16px', animation: 'slideDownFade 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <ChevronLeft size={20} color={theme.textPrimary} />
                        </button>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: theme.textPrimary }}>
                            {viewYear}년 {viewMonth + 1}월
                        </span>
                        <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <ChevronRight size={20} color={theme.textPrimary} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                            <div key={day} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: idx === 0 ? theme.danger : (idx === 6 ? theme.accent : theme.textSecondary) }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} />;
                            const isSelected = value === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            return (
                                <button
                                    key={day}
                                    onClick={() => handleSelectDate(day)}
                                    style={{
                                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isSelected ? theme.accent : 'transparent',
                                        color: isSelected ? '#FFFFFF' : theme.textPrimary,
                                        border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: isSelected ? 800 : 600,
                                        cursor: 'pointer', transition: 'all 0.1s'
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// 2. 데이터 없음 반투명 모달
const EmptyStateModal = ({ onNavigateHome }: { onNavigateHome: () => void }) => {
    return (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90000,
            backgroundColor: 'rgba(248, 250, 252, 0.65)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Inter", -apple-system, sans-serif'
        }}>
            <div style={{
                backgroundColor: theme.cardBg, padding: '48px', borderRadius: '24px',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: `1px solid ${theme.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                maxWidth: '460px', position: 'relative', overflow: 'hidden'
            }}>
                <div className="animate-float" style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#EFF6FF', color: theme.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
                    boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.2)'
                }}>
                    <ClipboardX size={48} strokeWidth={1.5} />
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary, margin: '0 0 12px 0' }}>금일 검사 데이터가 없습니다</h2>
                <p style={{ fontSize: '15px', color: theme.textSecondary, lineHeight: '1.6', margin: '0 0 32px 0', wordBreak: 'keep-all' }}>
                    생산 라인이 가동 중인지 확인하거나,<br/>잠시 후 다시 시도해 주세요.
                </p>

                <button 
                    onClick={onNavigateHome}
                    style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        backgroundColor: '#fff', color: theme.textPrimary, border: `1px solid ${theme.border}`, 
                        padding: '12px 32px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textPrimary; }}
                >
                    <Home size={18} /> 메인 화면으로 이동
                </button>
            </div>
        </div>
    );
};

// 3. 이전 기록 조회 모달 (본문 이미지 갯수(1개)에 맞춰 단일 이미지 뷰 제공)
const HistoryModal = ({ isOpen, onClose, onImageClick }: { isOpen: boolean; onClose: () => void; onImageClick: (title: string, url: string) => void }) => {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

    const dummyLogs = useMemo(() => {
        if (!selectedDate) return [];
        return [
            { 
                id: "log_1", time: "09:12:34", model: "MODEL-A", wo: "WO-A901", result: "ok", detail: "필름 부착 상태 정상 확인. 특이사항 없음.",
                image: "https://dummyimage.com/800x600/020617/cbd5e1&text=Film+Attachment+Normal"
            },
            { 
                id: "log_2", time: "10:05:22", model: "MODEL-A", wo: "WO-A901", result: "ng", detail: "가스켓 부위 부착 불량 감지. 재작업 요망.",
                image: "https://dummyimage.com/800x600/7f1d1d/fca5a5&text=Film+Attachment+Defect"
            }
        ];
    }, [selectedDate]);

    const selectedLog = useMemo(() => dummyLogs.find((l) => l.id === selectedLogId) || null, [dummyLogs, selectedLogId]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                width: '1000px', height: '700px', backgroundColor: theme.bg,
                borderRadius: '24px', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: `1px solid rgba(255,255,255,0.2)`
            }} onClick={(e) => e.stopPropagation()}>
                
                {/* 헤더 */}
                <div style={{
                    padding: '20px 24px', backgroundColor: '#fff', borderBottom: `1px solid ${theme.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: theme.textPrimary }}>
                        <Calendar size={22} color={theme.accent} />
                        <span style={{ fontSize: '18px', fontWeight: 800 }}>이전 검사기록 조회</span>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                {/* 바디 */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* 좌측 리스트 */}
                    <div style={{ width: '320px', backgroundColor: '#fff', borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}`, backgroundColor: '#F8FAFC' }}>
                            <CustomDatePicker value={selectedDate} onChange={(val) => { setSelectedDate(val); setSelectedLogId(null); }} />
                        </div>
                        <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {dummyLogs.length > 0 ? dummyLogs.map((log) => {
                                const isActive = selectedLogId === log.id;
                                return (
                                    <div
                                        key={log.id} onClick={() => setSelectedLogId(log.id)}
                                        style={{
                                            padding: '16px', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${isActive ? theme.accent : theme.border}`,
                                            backgroundColor: isActive ? '#EFF6FF' : '#fff', transition: 'all 0.2s', boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.1)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 800, color: isActive ? theme.accent : theme.textPrimary }}>{log.time}</span>
                                            <span style={{ fontWeight: 800, fontSize: '13px', color: log.result === 'ok' ? theme.status.ok.text : theme.status.ng.text }}>
                                                {log.result.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#60A5FA' : theme.textSecondary }}>{log.model} / {log.wo}</div>
                                    </div>
                                )
                            }) : (
                                <div style={{ textAlign: 'center', color: theme.textSecondary, marginTop: '40px', fontWeight: 600 }}>해당 날짜의 기록이 없습니다.</div>
                            )}
                        </div>
                    </div>

                    {/* 우측 상세 (단일 이미지 표시) */}
                    <div className="custom-scroll" style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: theme.bg }}>
                        {selectedLog ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={32} color={theme.textSecondary} /></div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 900, color: theme.textPrimary }}>{selectedLog.model}</h3>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: theme.textSecondary }}>작업지시서: {selectedLog.wo}</p>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}`, marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 700, color: theme.textSecondary }}>검사 일시</span>
                                        <span style={{ fontWeight: 800, color: theme.textPrimary }}>{selectedDate.split('-')[0]}년 {selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일 {selectedLog.time}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}`, marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 700, color: theme.textSecondary }}>최종 판정</span>
                                        <span style={{ fontWeight: 900, color: selectedLog.result === 'ok' ? theme.status.ok.text : theme.status.ng.text }}>{selectedLog.result === 'ok' ? '정상 (OK)' : '불량 (NG)'}</span>
                                    </div>
                                    <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '16px' }}>
                                        <strong style={{ display: 'block', marginBottom: '8px', color: theme.textPrimary, fontWeight: 800 }}>상세 내용</strong>
                                        <p style={{ margin: 0, color: theme.textSecondary, lineHeight: '1.6', fontWeight: 600 }}>{selectedLog.detail}</p>
                                    </div>

                                    {/* 이미지 영역 (본문 구조와 동일하게 1장) */}
                                    <div style={{ marginTop: '32px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.textPrimary }}>검사 이미지</h4>
                                            <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>* 클릭 시 확대됩니다</span>
                                        </div>
                                        <div
                                            onClick={() => onImageClick('검사 상세 이미지', selectedLog.image)}
                                            style={{
                                                width: '100%', height: '300px', backgroundColor: '#020617', borderRadius: '16px',
                                                cursor: 'pointer', border: `1px solid ${theme.border}`,
                                                backgroundImage: `url(${selectedLog.image})`,
                                                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', position: 'relative'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ZoomIn size={18} color={theme.textPrimary} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSecondary, fontWeight: 600 }}>좌측에서 조회할 로그를 선택해주세요.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ImageModal = ({ isOpen, onClose, title, imgUrl }: { isOpen: boolean, onClose: () => void, title: string, imgUrl: string }) => {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110000, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ width: '90vw', height: '90vh', backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <ZoomIn size={24} />
                        <span style={{ fontSize: '24px', fontWeight: 800 }}>{title}</span>
                    </div>
                    <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={24} color={theme.textPrimary} />
                    </button>
                </div>
                <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}` }}>
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
                <p style={{ color: '#6B7280' }}>부착 불량이 감지되었습니다.<br />경고음을 켜시겠습니까?</p>
            </div>
            <button onClick={onConfirm} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: theme.danger, color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
                네, 경고음 켜기
            </button>
        </div>
    </div>
);

const SoundControlButton = ({ isOn, onClick }: { isOn: boolean, onClick: () => void }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', border: isOn ? `1px solid ${theme.accent}` : `1px solid ${theme.border}`, backgroundColor: isOn ? '#EFF6FF' : '#F1F5F9', color: isOn ? theme.accent : theme.textSecondary, cursor: 'pointer', outline: 'none', transition: 'all 0.2s', marginLeft: 'auto' }}>
        {isOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        <span style={{ fontSize: '12px', fontWeight: 700 }}>{isOn ? 'ON' : 'MUTE'}</span>
    </button>
);

const DashboardHeader = ({ layout, data, totalStats, isSoundOn, onToggleSound, onNavigateHome }: { layout: any, data: ApiData | null, totalStats: TotalData | null, isSoundOn: boolean, onToggleSound: () => void, onNavigateHome: () => void }) => {
    const resultVal = data?.RESULT || '';
    const isPass = resultVal === "정상" || resultVal.toUpperCase() === "OK";
    const isFail = !isPass && !!resultVal;

    let style = theme.status.wait;
    let Icon = Clock;
    let label = "READY";
    let subLabel = "SYSTEM STANDBY";
    let animClass = "";

    if (isPass) {
        style = theme.status.ok; Icon = CheckCircle2; label = "OK (정상)"; subLabel = "PASSED"; animClass = "animate-ok";
    } else if (isFail) {
        style = theme.status.ng; Icon = XCircle; label = "NG (불량)"; subLabel = "FAILED"; animClass = "animate-ng";
    }

    const timeValue = data?.TIMEVALUE || '00:00:00';
    const modelValue = data?.CDGITEM || '-';
    const woValue = data?.STATUS002 || '-';

    return (
        <div style={{ display: 'flex', gap: layout.gap, height: layout.headerHeight, marginBottom: layout.gap, flexShrink: 0 }}>
            <div onClick={onNavigateHome} style={{ width: '320px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', boxShadow: theme.shadow, cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={28} color={theme.accent} />
                        <span style={{ fontSize: '22px', fontWeight: 800, color: theme.textPrimary }}>Estify<span style={{color:theme.accent}}>Vision</span></span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>필름부착확인</span>
                    <div onClick={(e) => e.stopPropagation()}><SoundControlButton isOn={isSoundOn} onClick={onToggleSound} /></div>
                </div>
            </div>

            <div className={animClass} style={{ width: '320px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: '24px', position: 'relative', overflow: 'hidden', boxShadow: theme.shadow }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.text, flexShrink: 0 }}><Icon size={36} strokeWidth={2.5} /></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>TOTAL RESULT</span>
                    <span style={{ fontSize: '28px', color: style.text, fontWeight: 800, lineHeight: 1.1 }}>{label}</span>
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>{subLabel}</span>
                </div>
            </div>

            <div style={{ flex: 1, backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: theme.shadow }}>
                <div style={{ display: 'flex', width: '100%', height: '40%', backgroundColor: '#F8FAFC', borderBottom: `1px solid ${theme.border}` }}>
                    <InfoHeaderCell text="검사 시간" /><InfoHeaderCell text="검사 수량" /><InfoHeaderCell text="모델명 / 작업지시번호" /><InfoHeaderCell text="현재 상태" isLast />
                </div>
                <div style={{ display: 'flex', width: '100%', height: '60%' }}>
                    <InfoValueCell text={timeValue} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${theme.border}` }}>
                        {totalStats ? (
                             <div style={{ fontSize: '18px', fontWeight: 700, color: theme.textPrimary }}>
                                <span style={{ color: theme.success }}>{totalStats.normal_count}</span><span style={{ color: '#CBD5E1', margin: '0 6px' }}>/</span><span>{totalStats.total_count}</span>
                             </div>
                        ) : (<span style={{ fontSize: '18px', fontWeight: 700, color: theme.textSecondary }}>-</span>)}
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
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}` }}>
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
            <button onClick={(e) => { e.stopPropagation(); onZoom(); }} style={{ position: 'absolute', bottom: '24px', right: '24px', backgroundColor: '#FFFFFF', width: '48px', height: '48px', borderRadius: '14px', border: `1px solid ${theme.border}`, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', color: theme.textPrimary }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <ZoomIn size={22} strokeWidth={2} />
            </button>
        )}
    </div>
);

const LogItem = ({ log }: { log: SystemLog }) => {
    let icon = <Info size={14} color={theme.textSecondary} />;
    if (log.type === 'SUCCESS') { icon = <CheckCircle2 size={14} color={theme.success} />; }
    else if (log.type === 'WARNING') { icon = <AlertTriangle size={14} color={theme.warning} />; }
    else if (log.type === 'ERROR') { icon = <XCircle size={14} color={theme.danger} />; }

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
    const router = useRouter(); 

    const [isMounted, setIsMounted] = useState(false);
    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    
    // 공통 이미지 확대 모달 state
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, title: string, imgUrl: string } | null>(null);
    
    const [apiData, setApiData] = useState<ApiData | null>(null);
    const [totalStats, setTotalStats] = useState<TotalData | null>(null);
    const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

    const [isDefectMode, setIsDefectMode] = useState(false);
    const [audioAllowed, setAudioAllowed] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleNavigateHome = () => { router.push('/'); };

    const handleImageClick = (title: string, url: string) => {
        if (!url) return;
        setModalInfo({ isOpen: true, title, imgUrl: url });
    };

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (isMounted) setSystemLogs(generateInitialLogs());
    }, [isMounted]);

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
        if (!isMounted) return;
        fetchData();
        const id = setInterval(fetchData, 3000);
        return () => clearInterval(id);
    }, [fetchData, isMounted]);

    useEffect(() => {
        if (!isMounted) return;
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
    }, [isDefectMode, audioAllowed, isMounted]);

    useEffect(() => {
        if (!isMounted) return;
        const handleResize = () => setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMounted]);

    if (!isMounted) return null;

    const layout = LAYOUT_CONFIGS[screenMode];
    const isPass = apiData?.RESULT === "정상" || apiData?.RESULT === "OK";
    const borderStyle = (apiData && !isPass && apiData.RESULT) ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`;

    return (
        <div style={{ 
            backgroundColor: theme.bg, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
            fontFamily: '"Inter", -apple-system, sans-serif', width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding, position: 'relative'
        }}>
            <GlobalStyles />

            {totalStats && totalStats.total_count === 0 && (
                <EmptyStateModal onNavigateHome={handleNavigateHome} />
            )}

            {/* 하단 고정: 이전 검사기록 조회 버튼 */}
            <button
                onClick={() => setIsHistoryOpen(true)}
                style={{
                    position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 95000,
                    display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.accent, color: '#fff',
                    padding: '14px 28px', borderRadius: '99px', fontSize: '15px', fontWeight: 800,
                    border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-50%) translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(59, 130, 246, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(-50%) translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.5)'; }}
            >
                <Calendar size={18} strokeWidth={2.5} /> 이전 검사기록 조회
            </button>

            <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onImageClick={handleImageClick} />
            {showPermissionModal && <SoundPermissionModal onConfirm={() => { setAudioAllowed(true); setShowPermissionModal(false); }} />}
            {modalInfo && <ImageModal isOpen={modalInfo.isOpen} onClose={() => setModalInfo(null)} title={modalInfo.title} imgUrl={modalInfo.imgUrl} />}

            <DashboardHeader 
                layout={layout} 
                data={apiData} 
                totalStats={totalStats}
                isSoundOn={audioAllowed} 
                onToggleSound={() => setAudioAllowed(!audioAllowed)} 
                onNavigateHome={handleNavigateHome}
            />

            <div style={{ flex: 1, display: 'flex', gap: layout.gap, minHeight: 0 }}>
                
                {/* 1. 이미지 뷰어 */}
                <div style={{ 
                    flex: 3, display: 'flex', flexDirection: 'column', backgroundColor: theme.cardBg, borderRadius: '24px',
                    boxShadow: theme.shadow, padding: '24px', border: borderStyle, transition: 'border 0.3s'
                }}>
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <AutoFitImage 
                            src={apiData?.FILEPATH1 || ''} 
                            alt="Inspection Result" 
                            onZoom={() => handleImageClick("Film Attachment Detail", apiData?.FILEPATH1 || '')}
                            showOverlay={!!apiData?.FILEPATH1}
                        />
                        {apiData?.FILENAME1 && (
                            <div style={{ 
                                position: 'absolute', top: '24px', left: '24px', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '10px 16px', borderRadius: '12px',
                                color: theme.textSecondary, fontSize: '13px', fontWeight: 600, backdropFilter: 'blur(8px)',
                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: `1px solid ${theme.border}`
                            }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: theme.accent }} />
                                {apiData.FILENAME1}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. 로그 패널 */}
                <div style={{ 
                    flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: theme.cardBg, borderRadius: '24px',
                    boxShadow: theme.shadow, border: `1px solid ${theme.border}`, overflow: 'hidden'
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
                            width: '100%', padding: '12px', borderRadius: '10px', border: `1px dashed ${theme.border}`, backgroundColor: 'transparent',
                            color: theme.textSecondary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            전체 로그 보기 <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}