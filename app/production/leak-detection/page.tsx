"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Scan, CheckCircle, AlertCircle, Activity, Box, Layers, Monitor, Cpu, Eye, X, 
    Volume2, VolumeX, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw, 
    ClipboardX, Home, Calendar, FileText, ChevronDown, ChevronLeft, ChevronRight,
    ZoomIn // [FIX] 누락되었던 ZoomIn 추가
} from 'lucide-react';

// --- 1. 상수 및 타입 ---
const SCOPE_SIZE = 250;
const ZOOM_LEVEL = 6;
const API_URL = "http://192.168.2.147:24828/api/DX_API000025";
const GUIDE_IMAGE_URL = "http://192.168.2.147:24828/images/DX_API000102/guide_2.jpg";

type InspectionStatus = '정상' | '점검필요' | '에러';
type CropPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type ScreenMode = 'FHD' | 'QHD';

interface HighlightRect {
    top: number; left: number; width: number; height: number;
}

interface CamData {
    id: string; 
    title: string; 
    status: InspectionStatus; 
    icon: React.ReactNode; 
    position: CropPosition;
    highlight: HighlightRect;
    specificImageUrl?: string;
}

interface TotalData {
    total_count: number;
    normal_count: number;
}

interface ApiDataItem {
    TIMEVALUE: string;
    FILENAME1: string; FILENAME2: string; FILENAME3: string; 
    FILENAME4: string; FILENAME5: string; FILENAME6: string;
    FILEPATH1: string; FILEPATH2: string; FILEPATH3: string; 
    FILEPATH4: string; FILEPATH5: string; FILEPATH6: string;
    LABEL001: string; LABEL002: string; LABEL003: string; 
    LABEL004: string; LABEL005: string; LABEL006: string;
    RESULT: string;     
    COUNT_NUM: string;
}

interface ApiResponse {
    success: boolean;
    data: ApiDataItem[];
    total_data?: TotalData;
}

// --- 2. 테마 및 스타일 설정 ---
const THEME = {
    bg: '#F8FAFC', 
    cardBg: '#FFFFFF', 
    textPrimary: '#1E293B', 
    textSecondary: '#64748B',
    accent: '#3B82F6', 
    success: '#059669', // 누락되었던 속성 추가
    danger: '#DC2626',  // 누락되었던 속성 추가
    border: '#E2E8F0',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // 누락되었던 속성 추가
    status: {
        ok: { bg: '#ECFDF5', text: '#059669', border: '#10B981' },
        ng: { bg: '#FEF2F2', text: '#DC2626', border: '#EF4444' },
        wait: { bg: '#F1F5F9', text: '#94A3B8', border: '#CBD5E1' }
    }
};
const LAYOUT_CONFIGS = {
    FHD: {
        padding: '20px', gap: '12px', cardHeight: '220px', cardPadding: '16px', 
        fontSize: { title: '16px', sub: '12px', badge: '11px' },
        iconSize: 20, logoSize: 20, overlap: '-60px', 
    },
    QHD: {
        padding: '32px', gap: '24px', cardHeight: '340px', cardPadding: '24px',
        fontSize: { title: '22px', sub: '16px', badge: '14px' },
        iconSize: 30, logoSize: 28, overlap: '-100px', 
    }
};

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

        .date-picker-wrapper {
            position: relative;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 14px;
            overflow: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            cursor: pointer;
        }
        .date-picker-wrapper:hover {
            border-color: #3B82F6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
            transform: translateY(-1px);
        }
        .date-picker-content {
            display: flex;
            align-items: center;
            padding: 14px 16px;
            gap: 12px;
            pointer-events: none; 
        }
        .date-text {
            flex: 1;
            font-size: 15px;
            font-weight: 700;
            color: #1E293B;
            letter-spacing: -0.3px;
        }
    `}</style>
);

// --- 3. 초기 데이터 ---
const initialTopCards: CamData[] = [
  { id: 'CAM 02', title: 'Surface Check', status: '정상', icon: <Layers />, position: 'top-left', highlight: { top: 10, left: 5, width: 32, height: 18 } },
  { id: 'CAM 04', title: 'Dimension Check', status: '정상', icon: <Box />, position: 'top-center', highlight: { top: 5, left: 42, width: 16, height: 9 } },
  { id: 'CAM 06', title: 'Scratch Check', status: '정상', icon: <Scan />, position: 'top-right', highlight: { top: 15, left: 65, width: 32, height: 18 } },
];

const initialBottomCards: CamData[] = [
  { id: 'CAM 01', title: 'Edge Check L', status: '정상', icon: <Activity />, position: 'bottom-left', highlight: { top: 60, left: 5, width: 32, height: 18 } },
  { id: 'CAM 03', title: 'Alignment', status: '정상', icon: <AlertCircle />, position: 'bottom-center', highlight: { top: 50, left: 42, width: 16, height: 9 } },
  { id: 'CAM 05', title: 'Edge Check R', status: '정상', icon: <Activity />, position: 'bottom-right', highlight: { top: 65, left: 60, width: 32, height: 18 } },
];

// --- 4. 공통 컴포넌트 ---

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
                    background: '#FFFFFF', border: `1.5px solid ${isOpen ? THEME.accent : '#E2E8F0'}`,
                    borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                }}
            >
                <Calendar size={20} color={THEME.accent} />
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.3px' }}>
                    {formattedDate}
                </span>
                <ChevronDown size={18} color={THEME.textSecondary} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%',
                    background: '#FFFFFF', borderRadius: '16px', border: `1px solid ${THEME.border}`,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 100, padding: '16px', animation: 'slideDownFade 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <ChevronLeft size={20} color={THEME.textPrimary} />
                        </button>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: THEME.textPrimary }}>
                            {viewYear}년 {viewMonth + 1}월
                        </span>
                        <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <ChevronRight size={20} color={THEME.textPrimary} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                            <div key={day} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: idx === 0 ? THEME.danger : (idx === 6 ? THEME.accent : THEME.textSecondary) }}>
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
                                        background: isSelected ? THEME.accent : 'transparent',
                                        color: isSelected ? '#FFFFFF' : THEME.textPrimary,
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
                backgroundColor: THEME.cardBg,
                padding: '48px',
                borderRadius: '24px',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                border: `1px solid ${THEME.border}`,
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
                    color: THEME.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.2)'
                }}>
                    <ClipboardX size={48} strokeWidth={1.5} />
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 800, color: THEME.textPrimary, margin: '0 0 12px 0' }}>
                    금일 검사 데이터가 없습니다
                </h2>
                <p style={{ fontSize: '15px', color: THEME.textSecondary, lineHeight: '1.6', margin: '0 0 32px 0', wordBreak: 'keep-all' }}>
                    생산 라인이 가동 중인지 확인하거나,<br/>잠시 후 다시 시도해 주세요.
                </p>

                <button 
                    onClick={onNavigateHome}
                    style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        backgroundColor: '#fff', color: THEME.textPrimary,
                        border: `1px solid ${THEME.border}`, 
                        padding: '12px 32px', borderRadius: '12px', 
                        fontWeight: 700, fontSize: '15px',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = THEME.accent;
                        e.currentTarget.style.color = THEME.accent;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = THEME.border;
                        e.currentTarget.style.color = THEME.textPrimary;
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
                    main: GUIDE_IMAGE_URL,
                    cam02: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+02+Normal",
                    cam04: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+04+Normal",
                    cam06: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+06+Normal",
                    cam01: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+01+Normal",
                    cam03: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+03+Normal",
                    cam05: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+05+Normal"
                }
            },
            { 
                id: "log_2", time: "10:05:22", model: "GL-100", wo: "WO-A901", result: "ng", detail: "Surface Check(CAM 02) 불량 감지. 점검이 필요합니다.",
                images: {
                    main: GUIDE_IMAGE_URL,
                    cam02: "https://dummyimage.com/600x400/7f1d1d/fca5a5&text=CAM+02+Defect",
                    cam04: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+04+Normal",
                    cam06: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+06+Normal",
                    cam01: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+01+Normal",
                    cam03: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+03+Normal",
                    cam05: "https://dummyimage.com/600x400/020617/cbd5e1&text=CAM+05+Normal"
                }
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
                width: '1100px', height: '800px', backgroundColor: THEME.bg,
                borderRadius: '24px', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                border: `1px solid rgba(255,255,255,0.2)`
            }} onClick={(e) => e.stopPropagation()}>
                
                {/* 헤더 */}
                <div style={{
                    padding: '20px 24px', backgroundColor: '#fff', borderBottom: `1px solid ${THEME.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: THEME.textPrimary }}>
                        <Calendar size={22} color={THEME.accent} />
                        <span style={{ fontSize: '18px', fontWeight: 800 }}>이전 검사기록 조회</span>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: THEME.textSecondary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                {/* 바디 */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* 좌측 리스트 */}
                    <div style={{
                        width: '320px', backgroundColor: '#fff', borderRight: `1px solid ${THEME.border}`,
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '16px', borderBottom: `1px solid ${THEME.border}`, backgroundColor: '#F8FAFC' }}>
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
                                            border: `1px solid ${isActive ? THEME.accent : THEME.border}`,
                                            backgroundColor: isActive ? '#EFF6FF' : '#fff',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.1)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 800, color: isActive ? THEME.accent : THEME.textPrimary }}>{log.time}</span>
                                            <span style={{ 
                                                fontWeight: 800, fontSize: '13px',
                                                color: log.result === 'ok' ? THEME.status.ok.text : THEME.status.ng.text
                                            }}>
                                                {log.result.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#60A5FA' : THEME.textSecondary }}>
                                            {log.model} / {log.wo}
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div style={{ textAlign: 'center', color: THEME.textSecondary, marginTop: '40px', fontWeight: 600 }}>
                                    해당 날짜의 기록이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 우측 상세 */}
                    <div className="custom-scrollbar" style={{ flex: 1, padding: '32px', overflowY: 'auto', backgroundColor: THEME.bg }}>
                        {selectedLog ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={32} color={THEME.textSecondary} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 900, color: THEME.textPrimary }}>{selectedLog.model}</h3>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: THEME.textSecondary }}>작업지시서: {selectedLog.wo}</p>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', border: `1px solid ${THEME.border}`, boxShadow: THEME.shadow }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${THEME.border}`, marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 700, color: THEME.textSecondary }}>검사 일시</span>
                                        <span style={{ fontWeight: 800, color: THEME.textPrimary }}>
                                            {selectedDate.split('-')[0]}년 {selectedDate.split('-')[1]}월 {selectedDate.split('-')[2]}일 {selectedLog.time}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${THEME.border}`, marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 700, color: THEME.textSecondary }}>최종 판정</span>
                                        <span style={{ fontWeight: 900, color: selectedLog.result === 'ok' ? THEME.status.ok.text : THEME.status.ng.text }}>
                                            {selectedLog.result === 'ok' ? '정상 (OK)' : '불량 (NG)'}
                                        </span>
                                    </div>
                                    <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '16px' }}>
                                        <strong style={{ display: 'block', marginBottom: '8px', color: THEME.textPrimary, fontWeight: 800 }}>상세 내용</strong>
                                        <p style={{ margin: 0, color: THEME.textSecondary, lineHeight: '1.6', fontWeight: 600 }}>{selectedLog.detail}</p>
                                    </div>

                                    {/* 이미지 영역 (1메인 + 6서브 = 7장) */}
                                    <div style={{ marginTop: '32px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: THEME.textPrimary }}>검사 이미지</h4>
                                            <span style={{ fontSize: '13px', color: THEME.textSecondary, fontWeight: 600 }}>* 클릭 시 확대됩니다</span>
                                        </div>

                                        {/* 메인 1장 */}
                                        <div
                                            onClick={() => onImageClick('메인 검사 이미지', selectedLog.images.main)}
                                            style={{
                                                width: '100%', height: '240px', backgroundColor: '#020617', borderRadius: '16px',
                                                marginBottom: '16px', cursor: 'pointer', border: `1px solid ${THEME.border}`,
                                                backgroundImage: `url(${selectedLog.images.main})`,
                                                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ZoomIn size={18} color={THEME.textPrimary} />
                                            </div>
                                        </div>

                                        {/* 서브 카메라 6장 (3열) */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                            {[
                                                { key: 'cam02', title: 'Top-Left (CAM 02)' },
                                                { key: 'cam04', title: 'Top-Center (CAM 04)' },
                                                { key: 'cam06', title: 'Top-Right (CAM 06)' },
                                                { key: 'cam01', title: 'Bottom-Left (CAM 01)' },
                                                { key: 'cam03', title: 'Bottom-Center (CAM 03)' },
                                                { key: 'cam05', title: 'Bottom-Right (CAM 05)' },
                                            ].map((corner) => (
                                                <div
                                                    key={corner.key}
                                                    onClick={() => onImageClick(corner.title, selectedLog.images[corner.key as keyof typeof selectedLog.images])}
                                                    style={{
                                                        height: '130px', backgroundColor: '#020617', borderRadius: '16px', cursor: 'pointer',
                                                        border: `1px solid ${THEME.border}`, position: 'relative',
                                                        backgroundImage: `url(${selectedLog.images[corner.key as keyof typeof selectedLog.images]})`,
                                                        backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
                                                    }}
                                                >
                                                    <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                                                        {corner.title}
                                                    </div>
                                                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ZoomIn size={14} color={THEME.textPrimary} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.textSecondary, fontWeight: 600 }}>
                                좌측에서 조회할 로그를 선택해주세요.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 공통 이미지 확대 모달 (z-index 제일 높음)
const ImageModal = ({ isOpen, onClose, title, imgUrl }: { isOpen: boolean, onClose: () => void, title: string, imgUrl: string }) => {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110000, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ width: '90vw', height: '90vh', backgroundColor: '#000', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', backgroundColor: '#1E293B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#fff' }}>
                        <ZoomIn size={24} />
                        <span style={{ fontSize: '24px', fontWeight: 800 }}>{title}</span>
                    </div>
                    <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={28} />
                    </button>
                </div>
                <div style={{ flex: 1, backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <img src={imgUrl} alt="Detail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
            </div>
        </div>
    );
};

const SoundPermissionModal = ({ onConfirm }: { onConfirm: () => void }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '400px', textAlign: 'center', border: '1px solid #EF4444' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#FEF2F2', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={32} color="#EF4444" /></div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>시스템 경고 알림</h3>
            <p style={{ color: '#64748B', marginBottom: '24px' }}>이상 징후가 감지되었습니다.<br/>소리 알림을 켜시겠습니까?</p>
            <button onClick={onConfirm} style={{ backgroundColor: '#EF4444', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, width: '100%', cursor: 'pointer' }}>확인</button>
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
                border: isOn ? `1px solid ${THEME.accent}` : `1px solid ${THEME.border}`,
                backgroundColor: isOn ? '#EFF6FF' : '#F1F5F9',
                color: isOn ? THEME.accent : THEME.textSecondary,
                cursor: 'pointer', outline: 'none', transition: 'all 0.2s', marginLeft: 'auto'
            }}
        >
            {isOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span style={{ fontSize: '12px', fontWeight: 700 }}>{isOn ? 'ON' : 'MUTE'}</span>
        </button>
    );
};

const DashboardHeader = ({ apiData, totalStats, layout, onNavigateHome }: { apiData: ApiDataItem | null, totalStats: TotalData | null, layout: any, onNavigateHome: () => void }) => {
    const resultStr = apiData?.RESULT || '';
    const isPass = resultStr === '정상' || resultStr.toUpperCase() === 'OK';
    const isFail = !isPass && !!resultStr;

    let style = THEME.status.wait;
    let Icon = Clock;
    let label = "READY";
    let subLabel = "SYSTEM STANDBY";
    let animClass = "";

    if (isPass) {
        style = THEME.status.ok;
        Icon = CheckCircle2;
        label = "OK (정상)";
        subLabel = "PASSED";
        animClass = "animate-ok";
    } else if (isFail) {
        style = THEME.status.ng;
        Icon = XCircle;
        label = "NG (불량)";
        subLabel = "FAILED";
        animClass = "animate-ng";
    }

    return (
        <div style={{ display: 'flex', gap: layout.gap, height: '100px', marginBottom: layout.gap, flexShrink: 0 }}>
            <div 
                onClick={onNavigateHome}
                style={{ 
                    width: '240px', backgroundColor: THEME.cardBg, borderRadius: '16px', border: `1px solid ${THEME.border}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border; }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Monitor size={24} color={THEME.accent} />
                    <span style={{ fontSize: '20px', fontWeight: 800, color: THEME.textPrimary }}>Estify<span style={{color:THEME.accent}}>Vision</span></span>
                </div>
                <span style={{ fontSize: '12px', color: THEME.textSecondary, fontWeight: 600 }}>Multi-Cam Inspection System</span>
            </div>

            <div className={animClass} style={{
                width: '280px', backgroundColor: THEME.cardBg, borderRadius: '16px', border: `1px solid ${THEME.border}`,
                display: 'flex', alignItems: 'center', padding: '0 24px', gap: '20px', position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '50%', backgroundColor: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.text, flexShrink: 0
                }}>
                    <Icon size={32} strokeWidth={2.5} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: THEME.textSecondary, fontWeight: 600 }}>TOTAL RESULT</span>
                    <span style={{ fontSize: '24px', color: style.text, fontWeight: 800, lineHeight: 1.1 }}>{label}</span>
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{subLabel}</span>
                </div>
            </div>

            <div style={{ 
                flex: 1, backgroundColor: THEME.cardBg, borderRadius: '16px', border: `1px solid ${THEME.border}`,
                display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', width: '100%', height: '40%', backgroundColor: '#F8FAFC', borderBottom: `1px solid ${THEME.border}` }}>
                    <InfoHeaderCell text="검사 시간" />
                    <InfoHeaderCell text="검사 수량" />
                    <InfoHeaderCell text="현재 상태" isLast />
                </div>
                <div style={{ display: 'flex', width: '100%', height: '60%' }}>
                    <InfoValueCell text={apiData?.TIMEVALUE || '00:00:00'} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${THEME.border}` }}>
                        {totalStats ? (
                             <div style={{ fontSize: '18px', fontWeight: 700, color: THEME.textPrimary }}>
                                <span style={{ color: THEME.status.ok.text }}>{totalStats.normal_count}</span>
                                <span style={{ color: '#CBD5E1', margin: '0 6px' }}>/</span>
                                <span>{totalStats.total_count}</span>
                             </div>
                        ) : (
                            <span style={{ fontSize: '18px', fontWeight: 700, color: THEME.textSecondary }}>-</span>
                        )}
                    </div>
                    <InfoValueCell text="RUNNING" isLast color={THEME.accent} />
                </div>
            </div>
        </div>
    );
};

const InfoHeaderCell = ({ text, isLast }: { text: string, isLast?: boolean }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: THEME.textSecondary, borderRight: isLast ? 'none' : `1px solid ${THEME.border}` }}>{text}</div>
);
const InfoValueCell = ({ text, isLast, color }: { text: string, isLast?: boolean, color?: string }) => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: color || THEME.textPrimary, borderRight: isLast ? 'none' : `1px solid ${THEME.border}` }}>{text}</div>
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
                color: THEME.textPrimary,
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

const PrimaryButton = ({ onClick, children, danger = false }: { onClick: () => void, children: React.ReactNode, danger?: boolean }) => {
    const baseColor = danger ? THEME.danger : THEME.accent;
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

const ModalCloseButton = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={24} />
    </button>
);

// --- MAIN COMPONENT ---
export default function VisionDashboard() {
  const router = useRouter();

  // hydration 에러 방지용 mounted 체크
  const [isMounted, setIsMounted] = useState(false);

  const [screenMode, setScreenMode] = useState<ScreenMode>('FHD');
  const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, title: string, imgUrl: string } | null>(null);

  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [rawApiData, setRawApiData] = useState<ApiDataItem | null>(null);
  const [totalStats, setTotalStats] = useState<TotalData | null>(null);

  const [topCards, setTopCards] = useState<CamData[]>(initialTopCards);
  const [bottomCards, setBottomCards] = useState<CamData[]>(initialBottomCards);

  // [FIX] 사용하지 않던 imageMetrics 관련 로직 복구
  const [, setImageMetrics] = useState({ width: 0, height: 0, left: 0, top: 0 });
  
  const fetchData = useCallback(async () => {
    try {
        const response = await fetch(API_URL);
        const json: ApiResponse = await response.json();

        if (json.success) {
            if (json.data.length > 0) {
                const d = json.data[0];
                setRawApiData(d);
                const getStatus = (label: string): InspectionStatus => label === '정상' ? '정상' : '점검필요';
                setTopCards([
                    { ...initialTopCards[0], status: getStatus(d.LABEL002), specificImageUrl: d.FILEPATH2 },
                    { ...initialTopCards[1], status: getStatus(d.LABEL004), specificImageUrl: d.FILEPATH4 },
                    { ...initialTopCards[2], status: getStatus(d.LABEL006), specificImageUrl: d.FILEPATH6 }
                ]);
                setBottomCards([
                    { ...initialBottomCards[0], status: getStatus(d.LABEL001), specificImageUrl: d.FILEPATH1 },
                    { ...initialBottomCards[1], status: getStatus(d.LABEL003), specificImageUrl: d.FILEPATH3 },
                    { ...initialBottomCards[2], status: getStatus(d.LABEL005), specificImageUrl: d.FILEPATH5 }
                ]);
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
  }, []);

  // Hydration 에러 방지 처리 (마운트 후 렌더링)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => { 
      if(isMounted) fetchData(); 
  }, [fetchData, isMounted]);

  const handleNavigateHome = () => { router.push('/'); };

  const handleImageClick = (title: string, url: string) => {
      setModalInfo({ isOpen: true, title, imgUrl: url });
  };

  useEffect(() => {
    if (!isMounted) return;

    let intervalId: NodeJS.Timeout;
    if (isSoundEnabled && !showPermissionModal) {
        const allCards = [...topCards, ...bottomCards];
        const hasDefect = allCards.some(card => card.status === '점검필요' || card.status === '에러');
        if (hasDefect) {
            intervalId = setInterval(() => {
                try {
                    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                    if (!AudioContext) return;
                    const ctx = new AudioContext();
                    if (ctx.state === 'suspended') ctx.resume();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(880, ctx.currentTime); 
                    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
                    setTimeout(() => { if(ctx.state !== 'closed') ctx.close(); }, 300);
                } catch (e) {}
            }, 1000); 
        }
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isMounted, isSoundEnabled, showPermissionModal, topCards, bottomCards]);

  useEffect(() => {
    if (!isMounted) return;
    const handleResize = () => setScreenMode(window.innerWidth > 2200 ? 'QHD' : 'FHD');
    handleResize(); window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  const layout = LAYOUT_CONFIGS[screenMode];
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const targetBoxRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  const updateImageMetrics = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const container = containerRef.current;
    if (img.naturalWidth === 0) return;
    const imageAspect = img.naturalWidth / img.naturalHeight;
    const containerRect = container.getBoundingClientRect();
    const containerAspect = containerRect.width / containerRect.height;
    
    let displayedWidth, displayedHeight, offsetLeft, offsetTop;
    if (imageAspect > containerAspect) {
      displayedWidth = containerRect.width; 
      displayedHeight = containerRect.width / imageAspect; 
      offsetLeft = 0; 
      offsetTop = (containerRect.height - displayedHeight) / 2;
    } else {
      displayedWidth = containerRect.height * imageAspect; 
      displayedHeight = containerRect.height; 
      offsetLeft = (containerRect.width - displayedWidth) / 2; 
      offsetTop = 0;
    }
    // [FIX] 다시 setImageMetrics 업데이트 하여 unused 제거
    setImageMetrics({ width: displayedWidth, height: displayedHeight, left: offsetLeft, top: offsetTop });
  }, []);

  useEffect(() => { 
      if(!isMounted) return;
      updateImageMetrics(); 
      const t = setTimeout(updateImageMetrics, 300); 
      return () => clearTimeout(t); 
  }, [screenMode, updateImageMetrics, isMounted]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageRef.current || !scopeRef.current || !targetBoxRef.current) return;
    const clientX = e.clientX; const clientY = e.clientY;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(() => {
      if (!containerRef.current || !imageRef.current || !scopeRef.current || !targetBoxRef.current) return;
      const imageRect = imageRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const isInsideImage = clientX >= imageRect.left && clientX <= imageRect.right && clientY >= imageRect.top && clientY <= imageRect.bottom;
      if (!isInsideImage) {
        scopeRef.current.style.opacity = '0'; scopeRef.current.style.transform = 'scale(0.8)'; targetBoxRef.current.style.opacity = '0'; return;
      }
      const halfScope = SCOPE_SIZE / 2;
      const scopeLeft = clientX - containerRect.left - halfScope;
      const scopeTop = clientY - containerRect.top - halfScope;
      scopeRef.current.style.opacity = '1';
      scopeRef.current.style.transform = `translate3d(${scopeLeft}px, ${scopeTop}px, 0) scale(1)`;
      const relativeX = clientX - imageRect.left;
      const relativeY = clientY - imageRect.top;
      const bgX = (relativeX / imageRect.width) * 100;
      const bgY = (relativeY / imageRect.height) * 100;
      scopeRef.current.style.backgroundPosition = `${bgX}% ${bgY}%`;
      const targetSize = SCOPE_SIZE / ZOOM_LEVEL;
      const halfTarget = targetSize / 2;
      const targetLeft = clientX - containerRect.left - halfTarget;
      const targetTop = clientY - containerRect.top - halfTarget;
      targetBoxRef.current.style.opacity = '1';
      targetBoxRef.current.style.width = `${targetSize}px`;
      targetBoxRef.current.style.height = `${targetSize}px`;
      targetBoxRef.current.style.transform = `translate3d(${targetLeft}px, ${targetTop}px, 0)`;
    });
  };

  const handleMouseLeave = () => {
    if (scopeRef.current) { scopeRef.current.style.opacity = '0'; scopeRef.current.style.transform = 'scale(0.8)'; }
    if (targetBoxRef.current) { targetBoxRef.current.style.opacity = '0'; }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  if (!isMounted) return null;

  return (
    <div style={{ 
        position: 'relative', backgroundColor: THEME.bg, height: 'calc(100vh - 64px)', width: '100vw', padding: layout.padding,
        fontFamily: '"Inter", -apple-system, sans-serif', color: THEME.textPrimary, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' 
    }}>
      <GlobalStyles />
      
      {totalStats && totalStats.total_count === 0 && (
          <EmptyStateModal onNavigateHome={handleNavigateHome} />
      )}

      {/* 중앙 하단 플로팅 버튼 */}
      <button
          onClick={() => setIsHistoryOpen(true)}
          style={{
              position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 95000,
              display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: THEME.accent, color: '#fff',
              padding: '14px 28px', borderRadius: '99px', fontSize: '15px', fontWeight: 800,
              border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
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

      {/* 모달들 */}
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} onImageClick={handleImageClick} />
      {showPermissionModal && <SoundPermissionModal onConfirm={() => { setShowPermissionModal(false); setIsSoundEnabled(true); }} />}
      {modalInfo && <ImageModal isOpen={modalInfo.isOpen} onClose={() => setModalInfo(null)} title={modalInfo.title} imgUrl={modalInfo.imgUrl} />}

      <DashboardHeader apiData={rawApiData} totalStats={totalStats} layout={layout} onNavigateHome={handleNavigateHome} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: layout.gap, height: layout.cardHeight, flexShrink: 0, position: 'relative', zIndex: 5 }}>
          {topCards.map((card) => <StatusCard key={card.id} data={card} layout={layout} onClick={() => handleImageClick(`${card.id} - Detail View`, card.specificImageUrl || GUIDE_IMAGE_URL)} />)}
        </div>

        <div ref={containerRef} style={{ position: 'relative', flex: 1.3, width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'default', zIndex: 1, marginTop: layout.overlap, marginBottom: layout.overlap }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <img ref={imageRef} src={GUIDE_IMAGE_URL} alt="Guide" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block', cursor: 'none' }} onLoad={updateImageMetrics} onError={(e) => e.currentTarget.style.display = 'none'} />
          <div ref={targetBoxRef} style={styles.targetBox} />
          <div ref={scopeRef} style={{...styles.scopeLens, backgroundImage: `url(${GUIDE_IMAGE_URL})`}}>
            <div style={styles.reticleH} /><div style={styles.reticleV} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: layout.gap, height: layout.cardHeight, flexShrink: 0, position: 'relative', zIndex: 5 }}>
          {bottomCards.map((card) => <StatusCard key={card.id} data={card} layout={layout} onClick={() => handleImageClick(`${card.id} - Detail View`, card.specificImageUrl || GUIDE_IMAGE_URL)} />)}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '32px', right: '32px', display: 'flex', gap: '12px', zIndex: 100 }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '12px 20px', borderRadius: '12px', border: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <Eye size={16} /> <span style={{fontSize: '14px', fontWeight: 600}}>Live Mode (x{ZOOM_LEVEL})</span>
        </div>
        <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} style={{ 
            backgroundColor: isSoundEnabled ? THEME.accent : '#fff', color: isSoundEnabled ? '#fff' : '#64748B', 
            border: `1px solid ${THEME.border}`, borderRadius: '12px', width: '46px', height: '46px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' 
        }}>
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
    </div>
  );
}

const StatusCard = ({ data, layout, onClick }: { data: CamData, layout: any, onClick?: () => void }) => {
  const hasSpecificImage = !!data.specificImageUrl;
  const imageStyle: React.CSSProperties = hasSpecificImage ? {
      backgroundImage: `url(${data.specificImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
  } : {
    backgroundImage: `url(${GUIDE_IMAGE_URL})`, backgroundSize: '300%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
  };
  const IconComponent = React.cloneElement(data.icon as React.ReactElement<any>, { size: layout.iconSize });
  return (
    <div style={{ backgroundColor: THEME.cardBg, borderRadius: '12px', border: `1px solid ${THEME.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: layout.cardPadding, height: '100%', boxSizing: 'border-box', cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: THEME.accent }}>{IconComponent}</span>
          <span style={{ fontWeight: 700, fontSize: layout.fontSize.title }}>{data.id}</span>
        </div>
        <Badge status={data.status} fontSize={layout.fontSize.badge} />
      </div>
      <div style={{ width: '100%', flex: 1, minHeight: 0, borderRadius: '6px', overflow: 'hidden', position: 'relative', border: `1px solid ${THEME.border}`, backgroundColor: '#f1f5f9' }}>
        <div style={{ width: '100%', height: '100%', ...imageStyle, transition: 'transform 0.5s ease' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', color: 'white', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>{data.position.replace('-', ' ').toUpperCase()}</div>
      </div>
      <div style={{ fontSize: layout.fontSize.sub, color: THEME.textSecondary, fontWeight: 500, marginTop: '8px' }}>{data.title}</div>
    </div>
  );
};

const Badge = ({ status, fontSize }: { status: string, fontSize: string }) => {
  const colors = status === '정상' ? { bg: THEME.status.ok.bg, text: THEME.status.ok.text } : { bg: THEME.status.ng.bg, text: THEME.status.ng.text };
  return <span style={{ padding: '2px 8px', borderRadius: '10px', fontWeight: 700, backgroundColor: colors.bg, color: colors.text, fontSize }}>{status}</span>;
};

const styles: { [key: string]: React.CSSProperties } = {
  scopeLens: { position: 'absolute', top: 0, left: 0, width: `${SCOPE_SIZE}px`, height: `${SCOPE_SIZE}px`, borderRadius: '50%', border: `2px solid ${THEME.accent}`, backgroundColor: '#fff', backgroundRepeat: 'no-repeat', backgroundSize: `${ZOOM_LEVEL * 100}%`, boxShadow: '0 20px 50px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 50, opacity: 0, transform: 'scale(0.8)', transition: 'opacity 0.25s, transform 0.25s', willChange: 'transform, opacity' },
  reticleH: { position: 'absolute', top: '50%', left: '15%', width: '70%', height: '1px', backgroundColor: THEME.accent, opacity: 0.5 },
  reticleV: { position: 'absolute', left: '50%', top: '15%', height: '70%', width: '1px', backgroundColor: THEME.accent, opacity: 0.5 },
  targetBox: { position: 'absolute', top: 0, left: 0, width: '0px', height: '0px', border: `2px solid ${THEME.accent}`, boxShadow: `0 0 10px ${THEME.accent}`, backgroundColor: 'transparent', zIndex: 40, pointerEvents: 'none', opacity: 0 }
};