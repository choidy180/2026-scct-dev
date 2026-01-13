'use client';

import React from 'react';
import styled, { createGlobalStyle, css } from 'styled-components';
import { 
  FiCpu, FiAlertCircle, FiCheckCircle, FiMoreHorizontal, 
  FiSend, FiVideo, FiActivity, FiBox, FiTruck, FiSettings, FiMenu 
} from 'react-icons/fi';

// --- 1. Global Style (Pretendard & Reset) ---
const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
  
  * {
    box-sizing: border-box;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  }

  body {
    margin: 0;
    padding: 0;
    background-color: #F1F5F9; /* 배경: 차분한 그레이 */
    color: #1E293B;
    overflow: hidden; /* 전체 페이지 스크롤 방지 */
  }

  /* 스크롤바 디자인 */
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

// --- 2. Theme Definitions ---
const theme = {
  primary: '#10B981', // Emerald Green
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

// --- Types ---
interface StatusProps {
  $level?: 'normal' | 'warning' | 'error';
}

interface MessageProps {
  $isUser?: boolean;
}

// --- Layout Components ---

const DashboardContainer = styled.div`
  width: 100%;
  height: calc(100vh - 64px); /* 요청하신 높이 고정 */
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  background-color: ${theme.bg};
  overflow: hidden; /* 내부 요소가 넘쳐도 전체 스크롤 안 생기게 */
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
  grid-template-columns: 1.3fr 1.1fr 1fr; /* 비율 조정: CCTV 넓게, 채팅 좁게 */
  gap: 20px;
  flex: 1; /* 남은 높이 모두 차지 */
  min-height: 0; /* Grid 자식 스크롤 처리를 위한 필수 속성 */
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
  height: 100%; /* 부모 그리드 높이 꽉 채움 */
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

// --- Column 1: CCTV (Visuals) ---
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
`;

const VideoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
  transition: opacity 0.3s;
  
  ${VideoWrapper}:hover & {
    opacity: 1;
  }
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
  background: #EF4444; /* Recording Red */
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DetectionBox = styled.div`
  position: absolute;
  top: 35%;
  left: 45%;
  width: 100px;
  height: 100px;
  border: 2px solid #10B981;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 4px;

  &::after {
    content: 'ID:8821 (정상)';
    position: absolute;
    top: -22px;
    left: -2px;
    background: #10B981;
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 2px;
    white-space: nowrap;
  }
`;

// --- Column 2: Status (Scrollable) ---
const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px 24px;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${theme.textSub};
  margin-top: 8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;

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
  min-width: 80px;
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
  }
`;

// --- Column 3: Chat ---
const ChatContainer = styled(Card)`
  padding: 0; /* 내부 패딩 제거 */
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
  
  /* 말풍선 꼬리 효과 */
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

const InputBox = styled.div`
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

// --- Main Component ---

const SmartFactoryDashboard: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <DashboardContainer>
        
        {/* Header */}
        <Header>
          <TitleGroup>
            <SubTitle>실시간 공정 모니터링 시스템</SubTitle>
            <MainTitle>Smart Factory Ops</MainTitle>
          </TitleGroup>

          <HeaderActions>
            {/* 알림 배너 */}
            <AlertBanner>
              <FiAlertCircle size={16} />
              <span>경고: 2번 라인 자재 공급 지연 (3분 경과)</span>
            </AlertBanner>
            
            {/* 설정 아이콘 */}
            <div style={{ padding: 10, background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
              <FiSettings color="#64748B" size={20} />
            </div>
          </HeaderActions>
        </Header>

        {/* Main Grid Content */}
        <MainGrid>
          
          {/* 1. CCTV Monitoring */}
          <VideoColumn>
            <VideoWrapper>
              <OverlayTop>
                <CamBadge><FiVideo /> CAM-01 조립 라인 A</CamBadge>
                <FiMoreHorizontal color="white" style={{ cursor: 'pointer' }} />
              </OverlayTop>
              {/* 이미지: 공장 로봇 팔 */}
              <VideoImage src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" alt="Assembly Line" />
              <DetectionBox />
              <StatusOverlay>● 실시간 녹화중</StatusOverlay>
            </VideoWrapper>

            <VideoWrapper>
              <OverlayTop>
                <CamBadge><FiVideo /> CAM-02 자재 창고 B</CamBadge>
                <FiMoreHorizontal color="white" style={{ cursor: 'pointer' }} />
              </OverlayTop>
              {/* 이미지: 물류 창고 */}
              <VideoImage src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" alt="Warehouse" />
              <StatusOverlay style={{ background: '#3B82F6' }}>● 모니터링 중</StatusOverlay>
            </VideoWrapper>
          </VideoColumn>

          {/* 2. Status Data */}
          <Card>
            <CardHeader>
              <CardTitle><FiBox color="#10B981" /> 자재 적재 현황</CardTitle>
              <FiMoreHorizontal color="#94A3B8" style={{ cursor: 'pointer' }} />
            </CardHeader>
            
            <ScrollContent>
              <SectionLabel>A구역: 조립 공정 (GR-51)</SectionLabel>
              <StatusList>
                <StatusItem $level="normal">
                  <ItemInfo>
                    <ItemName>적재함 A-01</ItemName>
                    <ItemSub>볼트/너트 (규격 12mm)</ItemSub>
                  </ItemInfo>
                  <ItemValueGroup>
                    <ValueText $level="normal">정상 (94%)</ValueText>
                    <ProgressBar $level="normal"><div style={{ width: '94%' }} /></ProgressBar>
                  </ItemValueGroup>
                </StatusItem>

                <StatusItem $level="normal">
                  <ItemInfo>
                    <ItemName>적재함 A-02</ItemName>
                    <ItemSub>메인 프레임 패널</ItemSub>
                  </ItemInfo>
                  <ItemValueGroup>
                    <ValueText $level="normal">충분 (82%)</ValueText>
                    <ProgressBar $level="normal"><div style={{ width: '82%' }} /></ProgressBar>
                  </ItemValueGroup>
                </StatusItem>
              </StatusList>

              <SectionLabel style={{ marginTop: 24, color: '#F59E0B' }}>
                <FiAlertCircle /> B구역: 물류 보관 (LOG-04)
              </SectionLabel>
              <StatusList>
                <StatusItem $level="error">
                  <ItemInfo>
                    <ItemName>적재함 B-04</ItemName>
                    <ItemSub style={{ color: '#EF4444', fontWeight: 600 }}>전자 회로 기판 (PCB)</ItemSub>
                  </ItemInfo>
                  <ItemValueGroup>
                    <ValueText $level="error">재고 없음</ValueText>
                    <ProgressBar $level="error"><div style={{ width: '5%' }} /></ProgressBar>
                  </ItemValueGroup>
                </StatusItem>

                <StatusItem $level="warning">
                  <ItemInfo>
                    <ItemName>적재함 B-05</ItemName>
                    <ItemSub>배터리 모듈</ItemSub>
                  </ItemInfo>
                  <ItemValueGroup>
                    <ValueText $level="warning">부족 (15%)</ValueText>
                    <ProgressBar $level="warning"><div style={{ width: '15%' }} /></ProgressBar>
                  </ItemValueGroup>
                </StatusItem>
              </StatusList>
            </ScrollContent>
          </Card>

          {/* 3. AI Chat */}
          <ChatContainer>
            <ChatHeaderArea>
              <BotIcon><FiCpu /></BotIcon>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>AI 관제 어시스턴트</span>
                <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>● 온라인 (대기중)</span>
              </div>
            </ChatHeaderArea>

            <ChatMessages>
              <Bubble>
                <strong>[자동 감지]</strong> B-04 적재함(PCB) 재고가 소진되었습니다. 공정 지연이 예상됩니다.
                <TimeStamp>오전 10:05</TimeStamp>
              </Bubble>
              
              <Bubble $isUser>
                예비 자재 창고에서 AGV(무인운송차) 배차해줘.
                <TimeStamp $isUser>오전 10:08</TimeStamp>
              </Bubble>

              <Bubble>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <FiTruck size={14} color="#10B981" />
                  <span style={{ fontWeight: 700 }}>명령 확인</span>
                </div>
                AGV #04호기를 배차했습니다. 예상 도착 시간은 <strong>3분</strong>입니다.
                <TimeStamp>오전 10:09</TimeStamp>
              </Bubble>
            </ChatMessages>

            <ChatInputArea>
              <SuggestionRow>
                <Chip>CCTV 화면 확대</Chip>
                <Chip>물류팀 호출</Chip>
                <Chip>보고서 생성</Chip>
              </SuggestionRow>
              <InputBox>
                <InputField placeholder="작업 지시사항을 입력하세요..." />
                <SendBtn><FiSend size={14} /></SendBtn>
              </InputBox>
            </ChatInputArea>
          </ChatContainer>

        </MainGrid>
      </DashboardContainer>
    </>
  );
};

export default SmartFactoryDashboard;