'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { 
  FiCpu, FiMoreHorizontal, FiSend, FiVideo, 
  FiActivity, FiBox, FiCheckCircle, FiLoader, 
  FiClock, FiAlertCircle, FiList, FiFileText, FiCheckSquare, FiTag, FiLayers,
  FiUser, FiCalendar, FiPackage, FiTarget
} from 'react-icons/fi';

// --- 1. Global Style ---
const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
  
  * {
    box-sizing: border-box;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  }

  body {
    margin: 0;
    padding: 0;
    background-color: #F1F5F9;
    color: #1E293B;
    overflow: hidden;
  }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
`;

// --- 2. Theme ---
const theme = {
  primary: '#10B981', 
  blue: '#3B82F6',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  radius: '16px',
  shadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
  fixedGreen: '#4ADE80',
  accent: '#6366F1' // 작업정보 강조용
};

// --- API Interfaces ---
interface SlotDetail {
  slot_id: number;
  occupied: boolean;
  entry_time: string | null;
}

interface CameraData {
  total: number;
  occupied: number;
  empty_idxs: number[];
  slots_detail: SlotDetail[];
}

// [NEW] 작업 데이터 인터페이스
interface WorkingData {
  NoWkOrd: string;      // 작업지시번호
  PrjName: string;      // 프로젝트명
  ItemName: string;     // 품목명
  OrdQty: number;       // 지시수량
  ProdQty: number;      // 생산수량
  NmEmplo: string;      // 작업자명
  NmWrkState: string;   // 상태 (완료, 진행 등)
  NmProce: string;      // 공정명
  PlnSTime: string;     // 계획시작
  PlnETime: string;     // 계획종료
  WrkGongSu: number;    // 공수
}

// [UPDATED] API 전체 응답 구조
interface ApiResult {
  success: boolean;
  recent_time: string;
  working_data: WorkingData;
  camData: {
    [key: string]: CameraData;
  };
}

interface FlattenedSlotItem extends SlotDetail {
  camId: string;
}

interface LogItemType extends FlattenedSlotItem {
  logType: 'start' | 'end';
  timestampObj: Date;
  workOrderNo: string;
  productionQty: number;
}

// --- Animation Keyframes ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

const DashboardContainer = styled.div`
  width: 100%;
  height: calc(100vh - 64px);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  background-color: ${theme.bg};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const MainTitle = styled.h1`
  font-size: 22px;
  font-weight: 800;
  color: ${theme.textMain};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  background: #E0F2FE;
  color: #0284C7;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 700;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 1fr; 
  gap: 20px;
  flex: 1;
  min-height: 0;
`;

const Card = styled.div`
  background-color: ${theme.cardBg};
  border-radius: ${theme.radius};
  box-shadow: ${theme.shadow};
  border: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  position: relative;
`;

// --- Video Styles ---
const VideoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
`;

const VideoWrapper = styled(Card)`
  flex: 1;
  position: relative;
  background: #0f172a;
  border: none;
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
  transform: scale(1.12);
`;

const VideoOverlayTop = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  z-index: 10;
`;

const CamTag = styled.div`
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MiniDashboardOverlay = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 180px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0px;
`;

const MiniLabel = styled.div`
  font-size: 14px;
  color: #94A3B8; 
  text-transform: uppercase;
  font-weight: 700;
`;

const MiniTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #F1F5F9;
  margin-bottom: 4px;
`;

const MiniValueRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const MiniValueBig = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${theme.fixedGreen};
`;

const MiniValueSub = styled.span`
  font-size: 14px;
  color: #CBD5E1;
  padding-bottom: 2px;
`;

const MiniProgressBar = styled.div<{ percent: number }>`
  width: 100%;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  margin-top: 6px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => props.percent}%;
    background-color: ${theme.fixedGreen};
    border-radius: 2px;
    transition: width 0.5s ease;
  }
`;

// --- List Column Styles ---
const ListContainer = styled(Card)`
  background: #F8FAFC; 
`;

const ListHeader = styled.div`
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ListTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: ${theme.textMain};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ViewToggle = styled.div`
  display: flex;
  background: #F1F5F9;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
  border: none;
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? theme.textMain : '#94A3B8'};
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: ${props => props.$active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
  transition: all 0.2s ease;

  &:hover {
    color: ${theme.textMain};
  }
`;

// --- [NEW] Working Info Styles ---
const WorkInfoCard = styled.div`
  margin: 16px 20px 0 20px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  animation: ${fadeIn} 0.5s ease-out;
`;

const WorkInfoTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5F9;
`;

const WorkInfoMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const WorkOrderBadge = styled.span`
  font-size: 11px;
  color: ${theme.textSub};
  background: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  gap: 4px;
`;

const ItemNameText = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.textMain};
  line-height: 1.3;
`;

const WorkStatusTag = styled.span`
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  height: fit-content;
`;

const WorkGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const WorkDetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const WorkLabel = styled.span`
  font-size: 14px;
  color: #94A3B8;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WorkValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #334155;
`;

const ProgressContainer = styled.div`
  margin-top: 14px;
`;

const ProgressLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.textSub};
`;

const ProgressBarBg = styled.div`
  width: 100%;
  height: 8px;
  background: #F1F5F9;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background: linear-gradient(90deg, ${theme.primary}, ${theme.fixedGreen});
  border-radius: 4px;
  transition: width 0.5s ease;
`;

const NoticeBanner = styled.div`
  margin: 12px 20px 0 20px;
  background: #FFFBEB;
  color: #92400E;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #FDE68A;
`;

const ListScrollArea = styled.div`
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const SlotItem = styled.div<{ $occupied: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${props => props.$occupied ? 'white' : '#F1F5F9'};
  border: ${props => props.$occupied ? '1px solid #10B981' : '1px solid #E2E8F0'};
  box-shadow: ${props => props.$occupied ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'};
  opacity: ${props => props.$occupied ? 1 : 0.7};
  filter: ${props => props.$occupied ? 'none' : 'grayscale(100%)'};
`;

const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const IconBox = styled.div<{ $occupied: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.$occupied ? '#ECFDF5' : '#E2E8F0'};
  color: ${props => props.$occupied ? '#10B981' : '#94A3B8'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ItemTitle = styled.span<{ $occupied: boolean }>`
  font-size: 15px;
  font-weight: 700;
  color: ${props => props.$occupied ? '#0F172A' : '#475569'};
  margin-bottom: 4px;
`;

const ItemSub = styled.span`
  font-size: 12px;
  color: #94A3B8;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusBadge = styled.span<{ $occupied: boolean }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  background: ${props => props.$occupied ? '#10B981' : '#E2E8F0'};
  color: ${props => props.$occupied ? 'white' : '#64748B'};
`;

// --- Log Style Components ---
const LogItem = styled.div`
  display: flex;
  gap: 16px;
  padding: 0 4px;
  position: relative;
`;

const LogTimeline = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 24px;

  &::after {
    content: '';
    width: 2px;
    flex: 1;
    background: #E2E8F0;
    margin-top: 4px;
  }
  ${LogItem}:last-child &::after {
    display: none;
  }
`;

const LogDot = styled.div<{ $type: 'start' | 'end' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$type === 'start' ? theme.primary : theme.blue};
  box-shadow: 0 0 0 4px ${props => props.$type === 'start' ? '#ECFDF5' : '#EFF6FF'};
  margin-top: 6px;
  z-index: 1;
`;

const LogContent = styled.div`
  flex: 1;
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #F1F5F9;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateX(4px);
  }
`;

const LogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const LogMetaRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const MetaTag = styled.span`
  background: #F1F5F9;
  color: #64748B;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LogTime = styled.span`
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LogMessage = styled.div`
  font-size: 13px;
  color: #334155;
  line-height: 1.5;
  
  strong {
    color: #0F172A;
    font-weight: 700;
  }
`;

// --- Chat Styles ---
const ChatContainer = styled(Card)`
  padding: 0;
  background: #FFFFFF;
`;

const ChatHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #F1F5F9;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChatBody = styled.div`
  flex: 1;
  background: #F8FAFC;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Bubble = styled.div<{ $isUser?: boolean }>`
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  background: ${props => props.$isUser ? '#3B82F6' : 'white'};
  color: ${props => props.$isUser ? 'white' : '#1E293B'};
  padding: 10px 14px;
  border-radius: 12px;
  border-bottom-right-radius: ${props => props.$isUser ? '2px' : '12px'};
  border-top-left-radius: ${props => props.$isUser ? '12px' : '2px'};
  font-size: 13px;
  max-width: 85%;
  line-height: 1.4;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  border: ${props => props.$isUser ? 'none' : '1px solid #E2E8F0'};
`;

const InputArea = styled.form`
  padding: 12px;
  background: white;
  border-top: 1px solid #F1F5F9;
  display: flex;
  gap: 8px;

  button {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const Input = styled.input`
  flex: 1;
  background: #F1F5F9;
  border: none;
  border-radius: 8px;
  padding: 0 12px;
  height: 36px;
  font-size: 13px;
  outline: none;
  &:focus { background: #E2E8F0; }
`;

// --- Mock Data (Updated to new structure) ---
const MOCK_DATA: ApiResult = {
  "success": true,
  "recent_time": "2026-01-21T14:58:09.000Z",
  "working_data": {
    "NoWkOrd": "WO26012000019",
    "IdWkOrd": "WO26012000019",
    "DtWkOrd": "2026-01-21",
    "PlnSTime": "2026-01-21 09:12:00",
    "PlnETime": "2026-01-21 15:40:00",
    "PrjCode": "MP-20004",
    "PrjName": "M-Next3 DID",
    "ItemCode": "ADD76419629",
    "ItemName": "Door Foam Assembly,Ref.(DID)",
    "CdGItem": "ADD76419629",
    "NmGItem": "Door Foam Assembly,Ref.(DID)",
    "DrwNumb": "ADD764196",
    "OrdQty": 535,
    "ProdQty": 535,
    "GoodQty": 535,
    "BadQty": 0,
    "RemQty": 0,
    "PackQty": "18",
    "CdEmpol": "GMT1651",
    "NmEmplo": "박태용",
    "WrkState": "E",
    "NmWrkState": "완료",
    "CdEquip": "YMC009",
    "NmEquip": "GR5-프레임도아",
    "CdProce": "PRC007",
    "NmProce": "총조립",
    "OrdType2": "388",
    "OrdType3": "A1",
    "ExpTime": 43.5,
    "WrkGongSu": 9,
    "WrkRate": null,
    "WrkCnt": 2,
    "BigOper": "조립",
    "OrderNo": null,
    "NumSort": 2,
    "Remarks": "",
    "WrkSTime": "2026-01-21 09:28:26",
    "WrkETime": "2026-01-21 16:35:34",
    "Update_Time": "2026-01-21T16:35:34.053Z"
  } as any, // as any to suppress loose mock data types vs strict interface if needed
  "camData": {
    "207": {
      "total": 7,
      "occupied": 0,
      "empty_idxs": [1, 2, 3, 4, 5, 6, 7],
      "slots_detail": [
        { "slot_id": 1, "occupied": false, "entry_time": null },
        { "slot_id": 2, "occupied": false, "entry_time": null },
        { "slot_id": 3, "occupied": false, "entry_time": null },
        { "slot_id": 4, "occupied": false, "entry_time": null },
        { "slot_id": 5, "occupied": false, "entry_time": null },
        { "slot_id": 6, "occupied": false, "entry_time": null },
        { "slot_id": 7, "occupied": false, "entry_time": null }
      ]
    },
    "218": {
      "total": 3,
      "occupied": 2,
      "empty_idxs": [1],
      "slots_detail": [
        { "slot_id": 1, "occupied": false, "entry_time": null },
        { "slot_id": 2, "occupied": true, "entry_time": "2026-01-21T23:58:09" },
        { "slot_id": 3, "occupied": true, "entry_time": "2026-01-21T20:06:21" }
      ]
    }
  }
};

const SmartFactoryDashboard: React.FC = () => {
  const [apiData, setApiData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'log'>('list');
  const [mounted, setMounted] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    { id: 1, text: "시스템 가동. 실시간 공정 데이터 수신중.", user: false },
    { id: 2, text: "현재 'Door Foam Assembly' 작업이 진행중입니다.", user: false },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // API Fetch
  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const res = await fetch('http://1.254.24.170:24828/api/DX_API000018');
        if (!res.ok) throw new Error('Fetch error');
        const data = await res.json();
        setApiData(data);
      } catch (err) {
        setApiData(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text: chatInput, user: true }]);
    setChatInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now()+1, text: "지시사항이 전달되었습니다.", user: false }]);
    }, 800);
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "-";
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return "-";
      return date.toTimeString().split(' ')[0];
    } catch {
      return "-";
    }
  };

  // --- Data Logic (Updated for camData) ---
  const allSlots: FlattenedSlotItem[] = useMemo(() => {
    if (!apiData || !apiData.camData) return [];

    // 1. 데이터 평탄화 (기존 로직)
    const list = Object.entries(apiData.camData).flatMap(([key, data]) => {
      const details = data?.slots_detail || [];
      return details.map(slot => ({
        camId: key,
        ...slot
      }));
    });

    // 2. [수정] 정렬 로직 추가 (작업중인 슬롯 우선)
    return list.sort((a, b) => {
      // (1) 작업중(occupied: true)인 것이 우선
      if (a.occupied !== b.occupied) {
        return a.occupied ? -1 : 1;
      }
      // (2) 상태가 같다면 공정 번호(camId) 순 정렬
      if (a.camId !== b.camId) {
        return a.camId.localeCompare(b.camId);
      }
      // (3) 공정도 같다면 슬롯 번호(slot_id) 순 정렬
      return a.slot_id - b.slot_id;
    });
  }, [apiData]);

  // Log Data Logic (Hydration Safe)
  const mixedLogData = useMemo(() => {
    if (allSlots.length === 0) return [];

    const startItems: LogItemType[] = allSlots
      .filter(item => item.entry_time)
      .map(item => {
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const workOrder = apiData?.working_data?.NoWkOrd || `WO-20240121-${randomNum}`;
        const qty = Math.floor(Math.random() * 450) + 50;

        const dateObj = new Date(item.entry_time!);
        const safeDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

        return {
          ...item,
          logType: 'start',
          timestampObj: safeDate,
          workOrderNo: workOrder,
          productionQty: qty
        };
      });

    const endItems: LogItemType[] = startItems.map(item => {
      const durationMin = 2 + Math.floor(Math.random() * 4);
      const endTime = new Date(item.timestampObj.getTime() + durationMin * 60000);
      
      return {
        ...item,
        logType: 'end',
        timestampObj: endTime,
        entry_time: endTime.toISOString()
      };
    });

    return [...startItems, ...endItems].sort((a, b) => 
      b.timestampObj.getTime() - a.timestampObj.getTime()
    );
  }, [allSlots, apiData]);

  // [UPDATED] Cam Data References
  const cam207Data = apiData?.camData ? apiData.camData["207"] : null;
  const cam207Ratio = cam207Data ? cam207Data.occupied / cam207Data.total : 0;
  const cam218Data = apiData?.camData ? apiData.camData["218"] : null;
  const cam218Ratio = cam218Data ? cam218Data.occupied / cam218Data.total : 0;
  
  // [NEW] Working Data
  const wkData = apiData?.working_data;
  const progressPercent = wkData ? Math.min((wkData.ProdQty / wkData.OrdQty) * 100, 100) : 0;

  return (
    <>
      <GlobalStyle />
      <DashboardContainer>
        <Header>
          <MainTitle>
            <FiActivity color={theme.primary} />
            스마트 공정 모니터링 시스템
            <Badge>v2.7</Badge>
          </MainTitle>
          <HeaderRight>
            <span style={{ fontSize: 16, color: '#64748B' }}>
              {mounted ? new Date().toLocaleDateString() : '...'}
            </span>
          </HeaderRight>
        </Header>

        <MainGrid>
          
          {/* 1. LEFT: Video Feed */}
          <VideoColumn>
            <VideoWrapper>
              <VideoOverlayTop>
                {/* [UPDATED] Video Label Changed */}
                <CamTag><FiVideo /> GR5 가조립 자재 #1</CamTag>
                <FiMoreHorizontal color="white" />
              </VideoOverlayTop>
              
              <StyledVideo 
                autoPlay muted loop playsInline 
                src="http://1.254.24.170:24828/api/DX_API000031?videoName=207.mp4" 
              />

              {cam207Data && (
                <MiniDashboardOverlay>
                  <MiniLabel>실시간 적재 현황</MiniLabel>
                  <MiniTitle>GR5 가조립 자재 #1</MiniTitle>
                  <MiniValueRow>
                    <MiniValueBig>{Math.round(cam207Ratio * 100)}%</MiniValueBig>
                    <MiniValueSub>{cam207Data.occupied} / {cam207Data.total} EA</MiniValueSub>
                  </MiniValueRow>
                  <MiniProgressBar percent={cam207Ratio * 100} />
                </MiniDashboardOverlay>
              )}
            </VideoWrapper>

            <VideoWrapper>
              <VideoOverlayTop>
                <CamTag><FiVideo /> GR5 가조립 자재 #2</CamTag>
                <FiMoreHorizontal color="white" />
              </VideoOverlayTop>
              
              <StyledVideo 
                autoPlay muted loop playsInline 
                src="http://1.254.24.170:24828/api/DX_API000031?videoName=218.mp4" 
              />

              {cam218Data && (
                <MiniDashboardOverlay>
                  <MiniLabel>실시간 적재 현황</MiniLabel>
                  <MiniTitle>GR5 가조립 자재 #2</MiniTitle>
                  <MiniValueRow>
                    <MiniValueBig>{Math.round(cam218Ratio * 100)}%</MiniValueBig>
                    <MiniValueSub>{cam218Data.occupied} / {cam218Data.total} EA</MiniValueSub>
                  </MiniValueRow>
                  <MiniProgressBar percent={cam218Ratio * 100} />
                </MiniDashboardOverlay>
              )}
            </VideoWrapper>
          </VideoColumn>

          {/* 2. CENTER: Slot Detail List & Logs */}
          <ListContainer>
            <ListHeader>
              <ListTitle>
                <FiBox color={theme.primary} /> 
                {viewMode === 'list' ? '실시간 생산/적재 데이터' : '공정 작업 이력 (Logs)'}
              </ListTitle>
              
              <ViewToggle>
                <ToggleBtn 
                  $active={viewMode === 'list'} 
                  onClick={() => setViewMode('list')}
                >
                  <FiList /> 리스트
                </ToggleBtn>
                <ToggleBtn 
                  $active={viewMode === 'log'} 
                  onClick={() => setViewMode('log')}
                >
                  <FiFileText /> 로그
                </ToggleBtn>
              </ViewToggle>
            </ListHeader>
            
            {/* [NEW] Working Data UI - Detailed & Korean */}
            {wkData && (
              <WorkInfoCard>
                <WorkInfoTitleRow>
                  <WorkInfoMain>
                    <WorkOrderBadge><FiFileText size={10}/> {wkData.NoWkOrd}</WorkOrderBadge>
                    <ItemNameText>{wkData.ItemName}</ItemNameText>
                  </WorkInfoMain>
                  <WorkStatusTag>
                    <FiActivity size={12}/> {wkData.NmWrkState}
                  </WorkStatusTag>
                </WorkInfoTitleRow>

                <WorkGrid>
                  <WorkDetailItem>
                    <WorkLabel><FiUser size={10}/> 작업자</WorkLabel>
                    <WorkValue>{wkData.NmEmplo}</WorkValue>
                  </WorkDetailItem>
                  <WorkDetailItem>
                    <WorkLabel><FiTarget size={10}/> 공정명</WorkLabel>
                    <WorkValue>{wkData.NmProce}</WorkValue>
                  </WorkDetailItem>
                  <WorkDetailItem>
                    <WorkLabel><FiCalendar size={10}/> 계획 시작</WorkLabel>
                    <WorkValue>{formatTime(wkData.PlnSTime)}</WorkValue>
                  </WorkDetailItem>
                  <WorkDetailItem>
                    <WorkLabel><FiCalendar size={10}/> 계획 종료</WorkLabel>
                    <WorkValue>{formatTime(wkData.PlnETime)}</WorkValue>
                  </WorkDetailItem>
                </WorkGrid>

                <ProgressContainer>
                  <ProgressLabelRow>
                    <span>생산 진행률</span>
                    <span style={{color: theme.primary}}>{wkData.ProdQty} / {wkData.OrdQty} EA</span>
                  </ProgressLabelRow>
                  <ProgressBarBg>
                    <ProgressBarFill $percent={progressPercent} />
                  </ProgressBarBg>
                </ProgressContainer>
              </WorkInfoCard>
            )}

            <NoticeBanner>
              <FiAlertCircle size={16} />
              <span>알림 정책: 자재 1분 이상 미투입 / 공대차 5분 이상 대기 시 자동 경보</span>
            </NoticeBanner>

            <ListScrollArea>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><FiLoader className="spin" /></div>
              ) : (
                <>
                  {/* VIEW 1: Slot List Mode */}
                  {viewMode === 'list' && (
                    <ContentWrapper>
                      {allSlots.length > 0 ? (
                        allSlots.map((item, idx) => (
                          <SlotItem key={`list-${item.camId}-${item.slot_id}-${idx}`} $occupied={item.occupied}>
                            <ItemLeft>
                              <IconBox $occupied={item.occupied}>
                                {item.occupied ? <FiCheckCircle /> : <FiBox />}
                              </IconBox>
                              <ItemInfo>
                                <ItemTitle $occupied={item.occupied}>
                                  공정 #{item.camId} - 슬롯 {item.slot_id}
                                </ItemTitle>
                                <ItemSub>
                                  <FiClock size={10} /> 
                                  {item.occupied ? `입고: ${formatTime(item.entry_time)}` : "데이터 없음"}
                                </ItemSub>
                              </ItemInfo>
                            </ItemLeft>
                            <div>
                              <StatusBadge $occupied={item.occupied}>
                                {item.occupied ? '작업중' : '빈 슬롯'}
                              </StatusBadge>
                            </div>
                          </SlotItem>
                        ))
                      ) : (
                        <div style={{textAlign: 'center', padding: 20, color: '#94A3B8'}}>데이터가 없습니다.</div>
                      )}
                    </ContentWrapper>
                  )}

                  {/* VIEW 2: Log Mode (Extended Info) */}
                  {viewMode === 'log' && (
                    <ContentWrapper>
                      {mixedLogData.length > 0 ? (
                        mixedLogData.map((item, idx) => (
                          <LogItem key={`log-${item.camId}-${item.slot_id}-${idx}-${item.logType}`}>
                            <LogTimeline>
                              <LogDot $type={item.logType} />
                            </LogTimeline>
                            <LogContent>
                              <LogHeader>
                                <strong style={{fontSize: 14, color: '#0F172A'}}>
                                  공정 #{item.camId}
                                </strong>
                                <LogTime><FiClock size={10} /> {formatTime(item.entry_time)}</LogTime>
                              </LogHeader>
                              
                              <LogMetaRow>
                                <MetaTag><FiTag size={10} /> {item.workOrderNo}</MetaTag>
                                <MetaTag><FiLayers size={10} /> {item.productionQty} EA</MetaTag>
                              </LogMetaRow>

                              <LogMessage>
                                {item.logType === 'start' ? (
                                  <>
                                    <strong>슬롯 {item.slot_id}번</strong>에 자재가 투입되어<br/>
                                    <span style={{color: theme.primary, fontWeight: 700}}>작업이 시작되었습니다.</span>
                                  </>
                                ) : (
                                  <>
                                    <strong>슬롯 {item.slot_id}번</strong>의 공정이 종료되어<br/>
                                    <span style={{color: theme.blue, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4}}>
                                      작업이 마무리되었습니다. <FiCheckSquare />
                                    </span>
                                  </>
                                )}
                              </LogMessage>
                            </LogContent>
                          </LogItem>
                        ))
                      ) : (
                        <div style={{textAlign: 'center', padding: 20, color: '#94A3B8'}}>최근 기록된 로그가 없습니다.</div>
                      )}
                    </ContentWrapper>
                  )}
                </>
              )}
            </ListScrollArea>
          </ListContainer>

          {/* 3. RIGHT: AI Chat */}
          <ChatContainer>
            <ChatHeader>
              <FiCpu color="#3B82F6" size={18} /> AI 관제 도우미
            </ChatHeader>
            <ChatBody>
              {messages.map((m) => (
                <Bubble key={m.id} $isUser={m.user}>{m.text}</Bubble>
              ))}
              <div ref={chatEndRef} />
            </ChatBody>
            <InputArea onSubmit={handleSend}>
              <Input 
                placeholder="지시사항 입력..." 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
              />
              <button 
                type="submit" 
                style={{ background: '#3B82F6', border: 'none', borderRadius: 8, color: 'white', width: 36, cursor: 'pointer' }}
              >
                <FiSend />
              </button>
            </InputArea>
          </ChatContainer>

        </MainGrid>
      </DashboardContainer>
    </>
  );
};

export default SmartFactoryDashboard;