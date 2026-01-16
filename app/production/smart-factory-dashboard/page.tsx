'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle, keyframes, css } from 'styled-components';
import { 
  FiCpu, FiAlertCircle, FiCheckCircle, FiMoreHorizontal, 
  FiSend, FiVideo, FiActivity, FiBox, FiTruck, FiSettings, FiMenu 
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

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 3px;
  }
`;

// --- 2. Theme & Types ---
const theme = {
  primary: '#10B981',
  primaryGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  error: '#EF4444',
  warning: '#F59E0B',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  textMain: '#0F172A',
  textSub: '#64748B',
  radius: '20px',
  shadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
};

// --- API Interfaces (User Request) ---
interface SlotDetail {
  slot_id: string;
  occupied: boolean;
  entry_time: string;
}

interface CameraData {
  total: number;       // "총 슬롯 수량" (API는 문자열일수도 있으나 number로 변환 처리 예정)
  occupied: number;    // "작동 슬롯 수량"
  empty_idxs: number[]; // [빈 슬롯 리스트]
  slots_detail: SlotDetail[];
}

// API 결과가 { "카메라명": { ...Data } } 형태이므로 인덱스 시그니처 사용
interface ApiResult {
  [cameraName: string]: CameraData;
}

interface StatusProps {
  $level?: 'normal' | 'warning' | 'error';
}

interface MessageProps {
  $isUser?: boolean;
}

// --- Layout Components ---

const DashboardContainer = styled.div`
  width: 100%;
  height: calc(100vh - 64px);
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  background-color: ${theme.bg};
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  flex-shrink: 0;
  margin-bottom: 20px;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const SubTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${theme.textSub};
  margin-bottom: 2px;
  letter-spacing: -0.2px;
`;

const MainTitle = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: ${theme.textMain};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AlertBanner = styled.div`
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #DC2626;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
    70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;
`;

// --- Common Card ---
const Card = styled.div`
  background-color: ${theme.cardBg};
  border-radius: ${theme.radius};
  box-shadow: ${theme.shadow};
  border: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
`;

const CardHeader = styled.div`
  padding: 20px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const CardTitle = styled.h2`
  font-size: 17px;
  font-weight: 700;
  color: ${theme.textMain};
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
`;

// --- Column 1: CCTV (Video) ---
const VideoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  min-height: 0;
`;

const VideoWrapper = styled(Card)`
  flex: 1;
  position: relative;
  background: #000;
  border: none;
  overflow: hidden;
`;

// 비디오 태그 스타일링
const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.9;
`;

const OverlayTop = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
`;

const CamBadge = styled.div`
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255,255,255,0.1);
`;

const StatusOverlay = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: #EF4444; 
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
`;

// --- Column 2: Status (Dynamic Data) ---
const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px 24px;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${theme.textSub};
  margin-top: 24px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;

  &:first-child { margin-top: 8px; }

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #F1F5F9;
  }
`;

const StatusList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StatusItem = styled.div<StatusProps>`
  background: ${(props) => 
    props.$level === 'error' ? '#FEF2F2' : 
    props.$level === 'warning' ? '#FFFBEB' : 
    '#F8FAFC'};
  border: 1px solid ${(props) => 
    props.$level === 'error' ? '#FECACA' : 
    props.$level === 'warning' ? '#FDE68A' : 
    'transparent'};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s;

  &:hover {
    transform: translateX(4px);
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ItemName = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: ${theme.textMain};
`;

const ItemSub = styled.span`
  font-size: 12px;
  color: ${theme.textSub};
`;

const ItemValueGroup = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 90px;
`;

const ValueText = styled.span<StatusProps>`
  font-size: 16px;
  font-weight: 800;
  color: ${(props) => 
    props.$level === 'error' ? theme.error : 
    props.$level === 'warning' ? theme.warning : 
    theme.primary};
`;

const ProgressBar = styled.div<StatusProps>`
  width: 100%;
  height: 6px;
  background: rgba(0,0,0,0.05);
  border-radius: 3px;
  overflow: hidden;
  
  div {
    height: 100%;
    background: ${(props) => 
      props.$level === 'error' ? theme.error : 
      props.$level === 'warning' ? theme.warning : 
      theme.primary};
    transition: width 0.5s ease-in-out;
  }
`;

// --- Column 3: Chat ---
const ChatContainer = styled(Card)`
  padding: 0;
`;

const ChatHeaderArea = styled.div`
  padding: 20px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
`;

const BotIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${theme.primaryGradient};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
`;

const ChatMessages = styled.div`
  flex: 1;
  background: #F8FAFC;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Bubble = styled.div<MessageProps>`
  max-width: 85%;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.5;
  border-radius: 16px;
  position: relative;
  
  align-self: ${(props) => props.$isUser ? 'flex-end' : 'flex-start'};
  background: ${(props) => props.$isUser ? '#3B82F6' : '#FFFFFF'};
  color: ${(props) => props.$isUser ? '#FFFFFF' : '#334155'};
  border: ${(props) => props.$isUser ? 'none' : '1px solid #E2E8F0'};
  
  border-top-left-radius: ${(props) => !props.$isUser ? '4px' : '16px'};
  border-bottom-right-radius: ${(props) => props.$isUser ? '4px' : '16px'};

  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
`;

const TimeStamp = styled.div<MessageProps>`
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.7;
  text-align: right;
`;

const ChatInputArea = styled.div`
  padding: 16px;
  background: white;
  border-top: 1px solid #F1F5F9;
`;

const SuggestionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  &::-webkit-scrollbar { display: none; }
`;

const Chip = styled.button`
  background: #F1F5F9;
  color: #475569;
  border: 1px solid transparent;
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: #E2E8F0;
    color: #1E293B;
  }
`;

const InputBox = styled.form`
  display: flex;
  align-items: center;
  background: #F8FAFC;
  border-radius: 24px;
  padding: 8px 8px 8px 20px;
  border: 1px solid #E2E8F0;

  &:focus-within {
    border-color: #3B82F6;
    background: white;
  }
`;

const InputField = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #1E293B;
`;

const SendBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3B82F6;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover { background: #2563EB; }
`;

// --- Dummy Data for Fallback & Chat ---

// API 호출 실패 시 사용할 더미 데이터
const MOCK_API_DATA: ApiResult = {
  "CAM_01_조립": {
    total: 100,
    occupied: 85,
    empty_idxs: [],
    slots_detail: Array(15).fill({ slot_id: "A-xx", occupied: true, entry_time: "09:00" })
  },
  "CAM_02_물류": {
    total: 50,
    occupied: 12,
    empty_idxs: [1,2,3,4,5],
    slots_detail: []
  },
  "CAM_03_포장": {
    total: 200,
    occupied: 198,
    empty_idxs: [1],
    slots_detail: []
  }
};

const INITIAL_CHAT = [
  { id: 1, text: "시스템 초기화 완료. DX_API000018 연결 성공.", user: false, time: "오전 08:30" },
  { id: 2, text: "[자동 감지] CAM_02 물류 구역의 재고율이 24%로 떨어졌습니다.", user: false, time: "오전 09:15" },
  { id: 3, text: "물류팀에 자재 보충 요청 메시지 발송해줘.", user: true, time: "오전 09:20" },
  { id: 4, text: "확인되었습니다. 물류팀(Team_Logistics) 그룹 채널에 알림을 발송했습니다. (예상 도착: 10분 후)", user: false, time: "오전 09:20" },
];

// --- Main Component ---

const SmartFactoryDashboard: React.FC = () => {
  // 1. Data State
  const [apiData, setApiData] = useState<ApiResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 2. Chat State
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 3. API Fetch Effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 실제 요청 (CORS 이슈나 네트워크 환경에 따라 실패할 수 있음)
        const response = await fetch('http://1.254.24.170:24828/api/DX_API000018');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setApiData(data);
      } catch (error) {
        console.warn("API Fetch failed (using mock data for demo):", error);
        // 실패 시 더미 데이터 사용 (화면 표시 보장)
        setApiData(MOCK_API_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // 5초마다 폴링한다고 가정하려면 setInterval 사용 가능
  }, []);

  // 4. Chat Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Chat Handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = {
      id: Date.now(),
      text: inputValue,
      user: true,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue("");

    // AI Dummy Response Simulation
    setTimeout(() => {
      const responseMsg = {
        id: Date.now() + 1,
        text: `명령을 수신했습니다: "${newMsg.text}" \n현재 시스템 부하가 없어 즉시 처리하겠습니다.`,
        user: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, responseMsg]);
    }, 1000);
  };

  // Helper to calculate status level
  const getStatusLevel = (occupied: number, total: number) => {
    const ratio = occupied / total;
    if (ratio < 0.3) return 'error'; // 30% 미만 위험
    if (ratio < 0.6) return 'warning'; // 60% 미만 경고
    return 'normal';
  };

  return (
    <>
      <GlobalStyle />
      <DashboardContainer>
        
        {/* Header */}
        <Header>
          <TitleGroup>
            <SubTitle>실시간 공정 모니터링 시스템</SubTitle>
            <MainTitle>공정재고 GR5</MainTitle>
          </TitleGroup>

          <HeaderActions>
            <AlertBanner>
              <FiAlertCircle size={16} />
              <span>시스템 상태: API 연결 {isLoading ? '시도중...' : '정상'}</span>
            </AlertBanner>
            <div style={{ padding: 10, background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
              <FiSettings color="#64748B" size={20} />
            </div>
          </HeaderActions>
        </Header>

        {/* Main Grid Content */}
        <MainGrid>
          
          {/* 1. CCTV Monitoring (Videos) */}
          <VideoColumn>
            <VideoWrapper>
              <OverlayTop>
                <CamBadge><FiVideo /> CAM-01 조립 라인 A</CamBadge>
                <FiMoreHorizontal color="white" style={{ cursor: 'pointer' }} />
              </OverlayTop>
              {/* Video 1: URL 직접 입력 필요 */}
              <StyledVideo 
                autoPlay muted loop playsInline 
                src="http://1.254.24.170:24828/api/DX_API000031?videoName=207.mp4" // <-- 여기에 비디오 URL 넣으세요 (예: .mp4)
              />
              <StatusOverlay>● REC</StatusOverlay>
            </VideoWrapper>

            <VideoWrapper>
              <OverlayTop>
                <CamBadge><FiVideo /> CAM-02 자재 창고 B</CamBadge>
                <FiMoreHorizontal color="white" style={{ cursor: 'pointer' }} />
              </OverlayTop>
              {/* Video 2: URL 직접 입력 필요 */}
              <StyledVideo 
                autoPlay muted loop playsInline 
                src="http://1.254.24.170:24828/api/DX_API000031?videoName=218.mp4" // <-- 여기에 비디오 URL 넣으세요
              />
              <StatusOverlay style={{ background: '#3B82F6' }}>● LIVE</StatusOverlay>
            </VideoWrapper>
          </VideoColumn>

          {/* 2. Status Data (From API) */}
          <Card>
            <CardHeader>
              <CardTitle><FiBox color="#10B981" /> 자재 적재 현황</CardTitle>
              <FiMoreHorizontal color="#94A3B8" style={{ cursor: 'pointer' }} />
            </CardHeader>
            
            <ScrollContent>
              {apiData && Object.entries(apiData).map(([camName, data], idx) => {
                // API 데이터 파싱 및 비율 계산
                const total = Number(data.total) || 100;
                const occupied = Number(data.occupied) || 0;
                const percentage = Math.round((occupied / total) * 100);
                const status = getStatusLevel(occupied, total);
                
                return (
                  <div key={idx}>
                    <SectionLabel>
                       {idx === 0 ? <FiActivity /> : <FiBox />} {camName}
                    </SectionLabel>
                    <StatusList>
                      <StatusItem $level={status}>
                        <ItemInfo>
                          <ItemName>{camName} 슬롯</ItemName>
                          <ItemSub>
                             {occupied} / {total} (Empty: {data.empty_idxs?.length || 0})
                          </ItemSub>
                        </ItemInfo>
                        <ItemValueGroup>
                          <ValueText $level={status}>
                            {status === 'error' ? '부족' : status === 'warning' ? '주의' : '정상'} 
                            ({percentage}%)
                          </ValueText>
                          <ProgressBar $level={status}>
                            <div style={{ width: `${percentage}%` }} />
                          </ProgressBar>
                        </ItemValueGroup>
                      </StatusItem>
                    </StatusList>
                  </div>
                );
              })}
              
              {!apiData && !isLoading && (
                <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>
                  데이터가 없습니다.
                </div>
              )}
            </ScrollContent>
          </Card>

          {/* 3. AI Chat (Dummy Simulated) */}
          <ChatContainer>
            <ChatHeaderArea>
              <BotIcon><FiCpu /></BotIcon>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>AI 관제 어시스턴트</span>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>● 온라인 (응답 가능)</span>
              </div>
            </ChatHeaderArea>

            <ChatMessages>
              {messages.map((msg) => (
                <Bubble key={msg.id} $isUser={msg.user}>
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>{line}<br/></span>
                  ))}
                  <TimeStamp $isUser={msg.user}>{msg.time}</TimeStamp>
                </Bubble>
              ))}
              <div ref={chatEndRef} />
            </ChatMessages>

            <ChatInputArea>
              <SuggestionRow>
                <Chip onClick={() => setInputValue("CCTV 1번 확대해줘")}>CCTV 확대</Chip>
                <Chip onClick={() => setInputValue("현재 경고 상황 리포트해줘")}>경고 리포트</Chip>
                <Chip onClick={() => setInputValue("담당자 호출해")}>담당자 호출</Chip>
              </SuggestionRow>
              <InputBox onSubmit={handleSendMessage}>
                <InputField 
                  placeholder="작업 지시사항을 입력하세요..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <SendBtn type="button" onClick={handleSendMessage}><FiSend size={14} /></SendBtn>
              </InputBox>
            </ChatInputArea>
          </ChatContainer>

        </MainGrid>
      </DashboardContainer>
    </>
  );
};

export default SmartFactoryDashboard;