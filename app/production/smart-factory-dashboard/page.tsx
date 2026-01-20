'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle, css, keyframes } from 'styled-components';
import { 
  FiCpu, FiMoreHorizontal, FiSend, FiVideo, 
  FiActivity, FiBox, FiCheckCircle, FiLoader, 
  FiClock, FiAlertCircle, FiList, FiFileText, FiCheckSquare, FiTag, FiLayers
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

interface ApiResult {
  [key: string]: CameraData;
}

interface FlattenedSlotItem extends SlotDetail {
  camId: string;
}

// [수정] 로그용 데이터 인터페이스 확장 (지시번호, 수량 추가)
interface LogItemType extends FlattenedSlotItem {
  logType: 'start' | 'end';
  timestampObj: Date;
  workOrderNo: string;   // 작업지시번호
  productionQty: number; // 생산수량
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
  gap: 4px;
`;

const MiniLabel = styled.div`
  font-size: 11px;
  color: #94A3B8; 
  text-transform: uppercase;
  font-weight: 700;
`;

const MiniTitle = styled.div`
  font-size: 13px;
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
  font-size: 11px;
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

const NoticeBanner = styled.div`
  margin: 16px 20px 0 20px;
  background: #FEF3C7;
  color: #92400E;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #FDE68A;
  position: relative;
  animation: ${fadeIn} 0.5s ease-out;

  &::after {
    content: '';
    position: absolute;
    top: -6px;
    left: 24px;
    width: 10px;
    height: 10px;
    background: #FEF3C7;
    border-top: 1px solid #FDE68A;
    border-left: 1px solid #FDE68A;
    transform: rotate(45deg);
  }
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

// --- Log Style Components (Updated) ---
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
  margin-bottom: 8px; /* 간격 조정 */
`;

// [NEW] 작업지시번호, 수량 표시용 메타 로우
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

// --- Mock Data ---
const MOCK_DATA: ApiResult = {
  "207": {
    "total": 7,
    "occupied": 6,
    "empty_idxs": [7],
    "slots_detail": [
       { "slot_id": 1, "occupied": true, "entry_time": "2026-01-19T13:06:38" },
       { "slot_id": 2, "occupied": true, "entry_time": "2026-01-19T13:27:00" },
       { "slot_id": 3, "occupied": true, "entry_time": "2026-01-19T13:23:56" },
       { "slot_id": 4, "occupied": true, "entry_time": "2026-01-19T13:09:41" },
       { "slot_id": 5, "occupied": true, "entry_time": "2026-01-19T13:06:52" },
       { "slot_id": 6, "occupied": true, "entry_time": "2026-01-19T13:06:38" },
       { "slot_id": 7, "occupied": false, "entry_time": "" }
    ]
  },
  "218": {
    "total": 3,
    "occupied": 2,
    "empty_idxs": [3],
    "slots_detail": [
       { "slot_id": 1, "occupied": true, "entry_time": "2026-01-19T13:18:38" },
       { "slot_id": 2, "occupied": true, "entry_time": "2026-01-19T13:33:04" },
       { "slot_id": 3, "occupied": false, "entry_time": null }
    ]
  }
};

const SmartFactoryDashboard: React.FC = () => {
  const [apiData, setApiData] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'log'>('list');

  // Chat State
  const [messages, setMessages] = useState([
    { id: 1, text: "시스템 가동. 실시간 공정 데이터 수신중.", user: false },
    { id: 2, text: "설비 #207의 적재량이 80%를 초과했습니다.", user: false },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // API Fetch
  useEffect(() => {
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
      return date.toTimeString().split(' ')[0];
    } catch {
      return timeStr;
    }
  };

  // --- Data Logic ---
  const allSlots: FlattenedSlotItem[] = apiData 
    ? Object.entries(apiData).flatMap(([key, data]) => 
        data.slots_detail.map(slot => ({
          camId: key,
          ...slot
        }))
      )
    : [];

  // [중요] 로그 데이터 생성 (지시번호, 수량 추가됨)
  const generateMixedLogs = () => {
    // 1. Start 아이템 생성 (랜덤 지시번호, 수량 부여)
    const startItems: LogItemType[] = allSlots
      .filter(item => item.entry_time)
      .map(item => {
        // Mock 데이터 생성
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const workOrder = `WO-20240121-${randomNum}`;
        const qty = Math.floor(Math.random() * 450) + 50; // 50~500

        return {
          ...item,
          logType: 'start',
          timestampObj: new Date(item.entry_time!),
          workOrderNo: workOrder,
          productionQty: qty
        };
      });

    // 2. End 아이템 생성 (Start 아이템의 정보를 그대로 승계)
    const endItems: LogItemType[] = startItems.map(item => {
      const durationMin = 2 + Math.floor(Math.random() * 4); // 2~5분 후
      const endTime = new Date(item.timestampObj.getTime() + durationMin * 60000);
      
      return {
        ...item,
        logType: 'end',
        timestampObj: endTime,
        entry_time: endTime.toISOString()
      };
    });

    // 3. 합치고 최신순 정렬
    return [...startItems, ...endItems].sort((a, b) => 
      b.timestampObj.getTime() - a.timestampObj.getTime()
    );
  };

  const mixedLogData = generateMixedLogs();

  const cam207Data = apiData ? apiData["207"] : null;
  const cam207Ratio = cam207Data ? cam207Data.occupied / cam207Data.total : 0;
  const cam218Data = apiData ? apiData["218"] : null;
  const cam218Ratio = cam218Data ? cam218Data.occupied / cam218Data.total : 0;

  return (
    <>
      <GlobalStyle />
      <DashboardContainer>
        <Header>
          <MainTitle>
            <FiActivity color={theme.primary} />
            스마트 공정 모니터링 시스템
            <Badge>v2.6</Badge>
          </MainTitle>
          <HeaderRight>
            <span style={{ fontSize: 16, color: '#64748B' }}>{new Date().toLocaleDateString()}</span>
          </HeaderRight>
        </Header>

        <MainGrid>
          
          {/* 1. LEFT: Video Feed */}
          <VideoColumn>
            <VideoWrapper>
              <VideoOverlayTop>
                <CamTag><FiVideo /> 설비 #207 (조립)</CamTag>
                <FiMoreHorizontal color="white" />
              </VideoOverlayTop>
              
              <StyledVideo 
                autoPlay muted loop playsInline 
                src="http://1.254.24.170:24828/api/DX_API000031?videoName=207.mp4" 
              />

              {cam207Data && (
                <MiniDashboardOverlay>
                  <MiniLabel>실시간 적재 현황</MiniLabel>
                  <MiniTitle>공정 #207 (조립)</MiniTitle>
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
                <CamTag><FiVideo /> 설비 #218 (포장)</CamTag>
                <FiMoreHorizontal color="white" />
              </VideoOverlayTop>
              
              <StyledVideo 
                autoPlay muted loop playsInline 
                src="http://1.254.24.170:24828/api/DX_API000031?videoName=218.mp4" 
              />

              {cam218Data && (
                <MiniDashboardOverlay>
                  <MiniLabel>실시간 적재 현황</MiniLabel>
                  <MiniTitle>공정 #218 (포장)</MiniTitle>
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
                              
                              {/* [NEW] Meta Info Row */}
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