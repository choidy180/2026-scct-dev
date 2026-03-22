"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Monitor, Clock, CheckCircle2, XCircle, 
    ZoomIn, Volume2, VolumeX, Siren, X,
    ClipboardX, Home, Calendar, FileText, 
    ChevronDown, ChevronLeft, ChevronRight // [NEW] Left, Right 아이콘 추가
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
    accent: '#3B82F6', // 블루 계열 포인트 컬러
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

// ─── [GLOBAL STYLES] ───
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
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        @keyframes slideDownFade {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-ok { animation: pulse-green-soft 2s infinite; }
        .animate-ng { animation: pulse-red-soft 2s infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
    `}</style>
);

// ─── [UI COMPONENTS] ───

// [NEW] 100% 커스텀 Date Picker 컴포넌트
const CustomDatePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // value를 기준으로 현재 보여줄 달력의 연/월을 관리
    const initialDate = value ? new Date(value) : new Date();
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0 ~ 11

    const containerRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 달력 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 달력 데이터 생성 로직
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0(일) ~ 6(토)
    
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null); // 앞쪽 빈 칸
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const formattedDate = useMemo(() => {
        if (!value) return "날짜를 선택하세요";
        const dateObj = new Date(value);
        return dateObj.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    }, [value]);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const handleSelectDate = (day: number) => {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        onChange(`${viewYear}-${mm}-${dd}`);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {/* 셀렉트 박스 UI */}
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

            {/* 커스텀 달력 팝업 */}
            {isOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%',
                    background: '#FFFFFF', borderRadius: '16px', border: `1px solid ${theme.border}`,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 100, padding: '16px', animation: 'slideDownFade 0.2s ease-out'
                }}>
                    {/* 달력 헤더 */}
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

                    {/* 요일 헤더 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                            <div key={day} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: idx === 0 ? theme.danger : (idx === 6 ? theme.accent : theme.textSecondary) }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* 날짜 그리드 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} />;
                            
                            const isSelected = value === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isToday = new Date().toDateString() === new Date(viewYear, viewMonth, day).toDateString();
                            
                            return (
                                <button
                                    key={day}
                                    onClick={() => handleSelectDate(day)}
                                    style={{
                                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isSelected ? theme.accent : (isToday ? '#EFF6FF' : 'transparent'),
                                        color: isSelected ? '#FFFFFF' : (isToday ? theme.accent : theme.textPrimary),
                                        border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: isSelected || isToday ? 800 : 600,
                                        cursor: 'pointer', transition: 'all 0.1s'
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = isToday ? '#EFF6FF' : 'transparent'; }}
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

const EmptyStateModal = ({ onNavigateHome }: { onNavigateHome: () => void }) => {
    return (
        <div style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 90000,
            backgroundColor: 'rgba(248, 250, 252, 0.65)', 
            backdropFilter: 'blur(8px)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontFamily: '"Inter", -apple-system, sans-serif'
        }}>
            <div style={{
                backgroundColor: theme.cardBg,
                padding: '48px',
                borderRadius: '24px',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                border: `1px solid ${theme.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                maxWidth: '460px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="animate-float" style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', 
                    backgroundColor: '#EFF6FF',
                    color: theme.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.2)'
                }}>
                    <ClipboardX size={48} strokeWidth={1.5} />
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary, margin: '0 0 12px 0' }}>
                    금일 검사 데이터가 없습니다
                </h2>
                <p style={{ fontSize: '15px', color: theme.textSecondary, lineHeight: '1.6', margin: '0 0 32px 0', wordBreak: 'keep-all' }}>
                    생산 라인이 가동 중인지 확인하거나,<br/>잠시 후 다시 시도해 주세요.
                </p>

                <button 
                    onClick={onNavigateHome}
                    style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        backgroundColor: '#fff', color: theme.textPrimary,
                        border: `1px solid ${theme.border}`, 
                        padding: '12px 32px', borderRadius: '12px', 
                        fontWeight: 700, fontSize: '15px',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.accent;
                        e.currentTarget.style.color = theme.accent;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.border;
                        e.currentTarget.style.color = theme.textPrimary;
                    }}
                >
                    <Home size={18} />
                    메인 화면으로 이동
                </button>
            </div>
        </div>
    );
};

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
                id: "log_1", time: "09:12:34", model: "GL-100", wo: "WO-A901", result: "ok", detail: "전 항목 정상 판정 완료. 특이사항 없음.",
                images: {
                    main: "http://1.254.24.170:24828/images/DX_API000102/guide_img.png",
                    a1: "https://dummyimage.com/600x400/020617/cbd5e1&text=A1+Normal",
                    a2: "https://dummyimage.com/600x400/020617/cbd5e1&text=A2+Normal",
                    a3: "https://dummyimage.com/600x400/020617/cbd5e1&text=A3+Normal",
                    a4: "https://dummyimage.com/600x400/020617/cbd5e1&text=A4+Normal"
                }
            },
            { 
                id: "log_2", time: "10:05:22", model: "GL-100", wo: "WO-A901", result: "ng", detail: "좌측 상단(A1) 모서리 들뜸 현상 감지됨. 재검사 요망.",
                images: {
                    main: "http://1.254.24.170:24828/images/DX_API000102/guide_img.png",
                    a1: "https://dummyimage.com/600x400/7f1d1d/fca5a5&text=A1+Defect",
                    a2: "https://dummyimage.com/600x400/020617/cbd5e1&text=A2+Normal",
                    a3: "https://dummyimage.com/600x400/020617/cbd5e1&text=A3+Normal",
                    a4: "https://dummyimage.com/600x400/020617/cbd5e1&text=A4+Normal"
                }
            },
            { 
                id: "log_3", time: "13:30:00", model: "GL-PRO", wo: "WO-B122", result: "ok", detail: "전 항목 정상 판정 완료.",
                images: {
                    main: "http://1.254.24.170:24828/images/DX_API000102/guide_img.png",
                    a1: "https://dummyimage.com/600x400/020617/cbd5e1&text=A1+Normal",
                    a2: "https://dummyimage.com/600x400/020617/cbd5e1&text=A2+Normal",
                    a3: "https://dummyimage.com/600x400/020617/cbd5e1&text=A3+Normal",
                    a4: "https://dummyimage.com/600x400/020617/cbd5e1&text=A4+Normal"
                }
            },
            { 
                id: "log_4", time: "15:45:10", model: "GL-PRO", wo: "WO-B122", result: "ng", detail: "우측 하단(A4) 틈새 불량 (오차 범위 초과).",
                images: {
                    main: "http://1.254.24.170:24828/images/DX_API000102/guide_img.png",
                    a1: "https://dummyimage.com/600x400/020617/cbd5e1&text=A1+Normal",
                    a2: "https://dummyimage.com/600x400/020617/cbd5e1&text=A2+Normal",
                    a3: "https://dummyimage.com/600x400/020617/cbd5e1&text=A3+Normal",
                    a4: "https://dummyimage.com/600x400/7f1d1d/fca5a5&text=A4+Defect"
                }
            },
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
                width: '1000px', height: '750px', backgroundColor: theme.bg,
                borderRadius: '24px', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                border: `1px solid rgba(255,255,255,0.2)`
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
                    <div style={{
                        width: '320px', backgroundColor: '#fff', borderRight: `1px solid ${theme.border}`,
                        display: 'flex', flexDirection: 'column'
                    }}>
                        {/* [APPLIED] 커스텀 데이트 피커 적용 */}
                        <div style={{ padding: '16px', borderBottom: `1px solid ${theme.border}`, backgroundColor: '#F8FAFC' }}>
                            <CustomDatePicker 
                                value={selectedDate} 
                                onChange={(val) => {
                                    setSelectedDate(val);
                                    setSelectedLogId(null);
                                }} 
                            />
                        </div>

                        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {dummyLogs.length > 0 ? dummyLogs.map((log) => {
                                const isActive = selectedLogId === log.id;
                                return (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLogId(log.id)}
                                        style={{
                                            padding: '16px', borderRadius: '14px', cursor: 'pointer',
                                            border: `1px solid ${isActive ? theme.accent : theme.border}`,
                                            backgroundColor: isActive ? '#EFF6FF' : '#fff',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.1)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 800, color: isActive ? theme.accent : theme.textPrimary }}>{log.time}</span>
                                            <span style={{ 
                                                fontWeight: 800, fontSize: '13px',
                                                color: log.result === 'ok' ? theme.success : theme.danger
                                            }}>
                                                {log.result.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#60A5FA' : theme.textSecondary }}>
                                            {log.model} / {log.wo}
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div style={{ textAlign: 'center', color: theme.textSecondary, marginTop: '40px', fontWeight: 600 }}>
                                    해당 날짜의 기록이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 우측 상세 */}
                    <div className="custom-scrollbar" style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: theme.bg }}>
                        {selectedLog ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={32} color={theme.textSecondary} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 900, color: theme.textPrimary }}>{selectedLog.model}</h3>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: theme.textSecondary }}>작업지시서: {selectedLog.wo}</p>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}`, marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 700, color: theme.textSecondary }}>검사 일시</span>
                                        <span style={{ fontWeight: 800, color: theme.textPrimary }}>{selectedDate} {selectedLog.time}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${theme.border}`, marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 700, color: theme.textSecondary }}>최종 판정</span>
                                        <span style={{ fontWeight: 900, color: selectedLog.result === 'ok' ? theme.success : theme.danger }}>
                                            {selectedLog.result === 'ok' ? '정상 (OK)' : '불량 (NG)'}
                                        </span>
                                    </div>
                                    <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '16px' }}>
                                        <strong style={{ display: 'block', marginBottom: '8px', color: theme.textPrimary, fontWeight: 800 }}>상세 내용</strong>
                                        <p style={{ margin: 0, color: theme.textSecondary, lineHeight: '1.6', fontWeight: 600 }}>{selectedLog.detail}</p>
                                    </div>

                                    <div style={{ marginTop: '32px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: theme.textPrimary }}>검사 이미지</h4>
                                            <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>* 클릭 시 확대됩니다</span>
                                        </div>

                                        <div
                                            onClick={() => onImageClick('메인 검사 이미지', selectedLog.images.main)}
                                            style={{
                                                width: '100%', height: '240px', backgroundColor: '#020617', borderRadius: '16px',
                                                marginBottom: '16px', cursor: 'pointer', border: `1px solid ${theme.border}`,
                                                backgroundImage: `url(${selectedLog.images.main})`,
                                                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ZoomIn size={18} color={theme.textPrimary} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            {[
                                                { key: 'a1', title: '좌측 상단 (A1)' },
                                                { key: 'a2', title: '우측 상단 (A2)' },
                                                { key: 'a3', title: '좌측 하단 (A3)' },
                                                { key: 'a4', title: '우측 하단 (A4)' },
                                            ].map((corner) => (
                                                <div
                                                    key={corner.key}
                                                    onClick={() => onImageClick(corner.title, selectedLog.images[corner.key as keyof typeof selectedLog.images])}
                                                    style={{
                                                        height: '140px', backgroundColor: '#020617', borderRadius: '16px', cursor: 'pointer',
                                                        border: `1px solid ${theme.border}`, position: 'relative',
                                                        backgroundImage: `url(${selectedLog.images[corner.key as keyof typeof selectedLog.images]})`,
                                                        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
                                                    }}
                                                >
                                                    <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                                                        {corner.title}
                                                    </div>
                                                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ZoomIn size={14} color={theme.textPrimary} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSecondary, fontWeight: 600 }}>
                                좌측에서 조회할 로그를 선택해주세요.
                            </div>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 110000, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
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

const DashboardHeader = ({ layout, data, totalStats, isSoundOn, onToggleSound, onNavigateHome }: { layout: any, data: ApiData | null, totalStats: TotalData | null, isSoundOn: boolean, onToggleSound: () => void, onNavigateHome: () => void }) => {
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

    const timeValue = data?.TIMEVALUE || '00:00:00';
    const modelValue = data?.CDGITEM || '-';
    const woValue = data?.WO || '-';

    return (
        <div style={{ display: 'flex', gap: layout.gap, height: layout.headerHeight, marginBottom: layout.gap, flexShrink: 0 }}>
            <div 
                onClick={onNavigateHome}
                style={{ 
                    width: '320px', backgroundColor: theme.cardBg, borderRadius: '16px', border: `1px solid ${theme.border}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px',
                    boxShadow: theme.shadow, cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Monitor size={28} color={theme.accent} />
                        <span style={{ fontSize: '22px', fontWeight: 800, color: theme.textPrimary }}>Estify<span style={{color:theme.accent}}>Vision</span></span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: theme.textSecondary, fontWeight: 600 }}>유리틈새검사</span>
                    <div onClick={(e) => e.stopPropagation()}>
                        <SoundControlButton isOn={isSoundOn} onClick={onToggleSound} />
                    </div>
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
                    <InfoHeaderCell text="모델명 / WO" />
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

const ModalCloseButton = ({ onClick }: any) => (
    <button onClick={onClick} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={24} />
    </button>
);

// ─── [MAIN COMPONENT] ───
export default function GlassGapInspection() {
    const router = useRouter(); 

    const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, title: string, imgUrl: string } | null>(null);
    const [apiData, setApiData] = useState<ApiData | null>(null);
    const [totalStats, setTotalStats] = useState<TotalData | null>(null);

    const [isDefectMode, setIsDefectMode] = useState(false); 
    const [audioAllowed, setAudioAllowed] = useState(false); 
    const [showPermissionModal, setShowPermissionModal] = useState(false); 
    const [isHistoryOpen, setIsHistoryOpen] = useState(false); 

    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleNavigateHome = () => {
        router.push('/');
    };

    const handleImageClick = (title: string, url: string) => {
        setModalInfo({ isOpen: true, title, imgUrl: url });
    };

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
            fontFamily: '"Inter", -apple-system, sans-serif', width: '100%', height: 'calc(100vh - 64px)', padding: layout.padding,
            position: 'relative'
        }}>
            <GlobalStyles />

            {totalStats && totalStats.total_count === 0 && (
                <EmptyStateModal onNavigateHome={handleNavigateHome} />
            )}

            <button
                onClick={() => setIsHistoryOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 95000,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: theme.accent, color: '#fff',
                    padding: '14px 28px', borderRadius: '99px',
                    fontSize: '15px', fontWeight: 800,
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(-50%) translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.5)';
                }}
            >
                <Calendar size={18} strokeWidth={2.5} />
                이전 검사기록 조회
            </button>

            <HistoryModal 
                isOpen={isHistoryOpen} 
                onClose={() => setIsHistoryOpen(false)} 
                onImageClick={handleImageClick}
            />
            {showPermissionModal && <SoundPermissionModal onConfirm={handlePermissionConfirm} />}
            {modalInfo && <ImageModal isOpen={modalInfo.isOpen} onClose={() => setModalInfo(prev => prev ? { ...prev, isOpen: false } : null)} title={modalInfo.title} imgUrl={modalInfo.imgUrl} />}

            <DashboardHeader 
                layout={layout} 
                data={apiData} 
                totalStats={totalStats} 
                isSoundOn={audioAllowed} 
                onToggleSound={toggleSound}
                onNavigateHome={handleNavigateHome}
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