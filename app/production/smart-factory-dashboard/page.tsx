'use client';

import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FiCpu, FiAlertCircle, FiCheckCircle, FiMoreHorizontal, FiSend, FiVideo, FiActivity } from 'react-icons/fi';

// --- Global Style for Font (Pretendard) ---
// 실제 프로젝트에서는 layout.tsx나 globals.css에 import 하는 것이 좋습니다.
const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
  
  body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  }
`;

// --- Type Definitions ---

interface StatusStyleProps {
  $isError?: boolean;
  $isWarning?: boolean;
}

interface MessageStyleProps {
  $isUser?: boolean;
}

interface ButtonStyleProps {
  $primary?: boolean;
  $danger?: boolean;
}

// --- Layout & Container ---

const DashboardContainer = styled.div`
  width: 100%;
  height: calc(100vh - 64px); /* 요청하신 높이 적용 */
  background-color: #F8FAFC; /* 배경을 조금 더 차분한 쿨톤 화이트로 변경 */
  padding: 24px;
  box-sizing: border-box;
  overflow: hidden; /* 내부 스크롤만 허용하고 전체 스크롤 방지 */
  color: #111827; /* 기본 텍스트를 진한 검정 계열로 변경 (가독성 UP) */
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  margin-bottom: 20px;
  flex-shrink: 0;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MainTitle = styled.h1`
  font-size: 26px;
  font-weight: 800; /* 폰트 두께 강화 */
  color: #111827;
  letter-spacing: -0.5px;
  margin: 0;
`;

const SubTitle = styled.p`
  font-size: 14px;
  color: #6B7280; /* 너무 연하지 않은 그레이로 변경 */
  font-weight: 500;
  margin: 0;
`;

const AlertBadge = styled.div`
  background-color: #FEF3C7; /* 따뜻한 노란색 배경 */
  color: #92400E; /* 진한 갈색 텍스트로 가독성 확보 */
  padding: 10px 24px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #FCD34D;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1.1fr 1fr; /* CCTV 영역을 조금 더 확보 */
  gap: 24px;
  height: calc(100% - 80px); /* 헤더 제외한 높이 꽉 채우기 */
`;

// --- Common Card Component ---

const Card = styled.div`
  background-color: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.03); /* 그림자를 은은하게 줄임 */
  border: 1px solid #E5E7EB; /* 경계선 추가로 가독성 확보 */
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-shrink: 0;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
`;

// --- Left Column: CCTV ---

const VideoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
`;

const VideoCard = styled(Card)`
  flex: 1;
  padding: 0;
  border: none;
  background-color: #000; /* 영상 로딩 전 검은 배경 */
`;

const VideoHeaderOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
  display: flex;
  justify-content: space-between;
  z-index: 10;
`;

const StreamTag = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const VideoPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background-color: #E5E7EB;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

// 시각적 가이드라인 (Overlay)
const DetectionBox = styled.div`
  position: absolute;
  top: 35%;
  left: 25%;
  width: 140px;
  height: 140px;
  border: 2px solid #10B981; /* 선명한 그린 */
  background-color: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
  
  &::after {
    content: 'Object ID: 8821';
    position: absolute;
    top: -24px;
    left: 0;
    background-color: #10B981;
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

// --- Middle Column: Status Grid ---

const StatusColumn = styled(Card)`
  height: 100%;
  overflow-y: auto;
  
  /* 스크롤바 숨김 (깔끔하게) */
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
  margin-top: 8px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 32px;
`;

const StatusItem = styled.div<StatusStyleProps>`
  background-color: ${(props) => (props.$isError ? '#FEF2F2' : props.$isWarning ? '#FFFBEB' : '#F3F4F6')};
  border: 1px solid ${(props) => (props.$isError ? '#FECACA' : props.$isWarning ? '#FDE68A' : 'transparent')};
  padding: 16px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 12px;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
`;

const SlotLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
`;

const StatusValue = styled.span<StatusStyleProps>`
  font-size: 17px;
  font-weight: 800; /* 숫자 강조 */
  color: ${(props) => (props.$isError ? '#DC2626' : props.$isWarning ? '#D97706' : '#111827')};
`;

const IconWrapper = styled.div<StatusStyleProps>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${(props) => (props.$isError ? '#FEE2E2' : props.$isWarning ? '#FEF3C7' : '#FFFFFF')};
  color: ${(props) => (props.$isError ? '#DC2626' : props.$isWarning ? '#D97706' : '#10B981')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

// --- Right Column: Chat ---

const ChatColumn = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0; /* 채팅창은 내부 패딩을 다르게 가져감 */
`;

const ChatHeaderContainer = styled.div`
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #F3F4F6;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChatAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
`;

const ChatBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #FAFAFA; /* 채팅 영역 배경을 아주 연한 회색으로 */

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #E5E7EB;
    border-radius: 3px;
  }
`;

const MessageBubble = styled.div<MessageStyleProps>`
  max-width: 90%;
  padding: 14px 18px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.6; /* 줄간격 넉넉하게 */
  position: relative;
  
  /* User: Blue / AI: White with border */
  align-self: ${(props) => (props.$isUser ? 'flex-end' : 'flex-start')};
  background-color: ${(props) => (props.$isUser ? '#2563EB' : '#FFFFFF')};
  color: ${(props) => (props.$isUser ? '#FFFFFF' : '#374151')};
  border: ${(props) => (props.$isUser ? 'none' : '1px solid #E5E7EB')};
  
  border-bottom-right-radius: ${(props) => (props.$isUser ? '4px' : '18px')};
  border-top-left-radius: ${(props) => (props.$isUser ? '18px' : '4px')};
  
  box-shadow: ${(props) => (props.$isUser 
    ? '0 4px 12px rgba(37, 99, 235, 0.2)' 
    : '0 2px 4px rgba(0,0,0,0.03)')};
`;

const TimeStamp = styled.div<MessageStyleProps>`
  font-size: 11px;
  color: ${(props) => (props.$isUser ? 'rgba(255,255,255,0.8)' : '#9CA3AF')};
  margin-top: 6px;
  text-align: right;
  font-weight: 500;
`;

const ChatFooter = styled.div`
  padding: 16px 20px;
  background-color: #FFFFFF;
  border-top: 1px solid #F3F4F6;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ActionButton = styled.button<ButtonStyleProps>`
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  /* Primary: Green / Secondary: Gray / Danger: Red Outline */
  background-color: ${(props) => (props.$primary ? '#10B981' : '#F3F4F6')};
  color: ${(props) => (props.$primary ? '#FFFFFF' : '#4B5563')};
  
  &:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
  }
`;

const InputWrapper = styled.div`
  background-color: #F3F4F6;
  border-radius: 24px;
  padding: 6px 6px 6px 16px;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  
  &:focus-within {
    border-color: #2563EB;
    background-color: #FFFFFF;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const ChatInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #111827;
  font-family: 'Pretendard', sans-serif;
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const SendBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #2563EB;
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background-color: #1D4ED8;
  }
`;

// --- Main Component ---

const SmartFactoryDashboard: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <DashboardContainer>
        {/* Header */}
        <Header>
          <TitleSection>
            <SubTitle>Real-time Monitoring System</SubTitle>
            <MainTitle>Smart Factory Ops</MainTitle>
          </TitleSection>
          
          <AlertBadge>
            <FiAlertCircle size={18} />
            <span>Line 2: 자재 공급 지연 감지 (Critical)</span>
          </AlertBadge>
        </Header>

        <MainGrid>
          {/* 1. Video Feeds */}
          <VideoColumn>
            <VideoCard>
              <VideoHeaderOverlay>
                <StreamTag><FiVideo /> CAM-207: 조립 라인 A</StreamTag>
                <FiMoreHorizontal color="#fff" size={24} style={{ cursor: 'pointer' }} />
              </VideoHeaderOverlay>
              <VideoPlaceholder>
                {/* Simulated Video Content */}
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(120deg, #f3f4f6 30%, #e5e7eb 50%, #f3f4f6 70%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
                <DetectionBox />
              </VideoPlaceholder>
            </VideoCard>

            <VideoCard>
              <VideoHeaderOverlay>
                <StreamTag><FiVideo /> CAM-217: 물류 이동로</StreamTag>
                <FiMoreHorizontal color="#fff" size={24} style={{ cursor: 'pointer' }} />
              </VideoHeaderOverlay>
              <VideoPlaceholder>
                <div style={{ width: '100%', height: '100%', background: '#F3F4F6' }} />
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>LIVE</div>
              </VideoPlaceholder>
            </VideoCard>
          </VideoColumn>

          {/* 2. Status Data */}
          <StatusColumn>
            <CardHeader>
              <CardTitle><FiActivity size={20} color="#2563EB" /> 자재 적재 현황</CardTitle>
              <FiMoreHorizontal size={20} color="#9CA3AF" style={{ cursor: 'pointer' }} />
            </CardHeader>

            <SectionTitle>Zone GR51 (Assembly)</SectionTitle>
            <StatusGrid>
              <StatusItem>
                <StatusHeader>
                  <SlotLabel>Slot 01</SlotLabel>
                  <IconWrapper>
                    <FiCheckCircle />
                  </IconWrapper>
                </StatusHeader>
                <StatusValue>정상 (100%)</StatusValue>
              </StatusItem>
              
              <StatusItem>
                <StatusHeader>
                  <SlotLabel>Slot 07</SlotLabel>
                  <IconWrapper>
                    <FiCheckCircle />
                  </IconWrapper>
                </StatusHeader>
                <StatusValue>85% 잔여</StatusValue>
              </StatusItem>
            </StatusGrid>

            <SectionTitle>Zone GR52 (Logistics)</SectionTitle>
            <StatusGrid>
              <StatusItem $isError>
                <StatusHeader>
                  <SlotLabel>Slot 07</SlotLabel>
                  <IconWrapper $isError>
                    <FiAlertCircle />
                  </IconWrapper>
                </StatusHeader>
                <StatusValue $isError>보급 필요</StatusValue>
              </StatusItem>

              <StatusItem $isWarning>
                <StatusHeader>
                  <SlotLabel>Slot 02</SlotLabel>
                  <IconWrapper $isWarning>
                    <FiAlertCircle />
                  </IconWrapper>
                </StatusHeader>
                <StatusValue $isWarning>지연 예측</StatusValue>
              </StatusItem>
              
              <StatusItem>
                <StatusHeader>
                  <SlotLabel>Slot 03</SlotLabel>
                  <IconWrapper>
                    <FiCheckCircle />
                  </IconWrapper>
                </StatusHeader>
                <StatusValue>정상</StatusValue>
              </StatusItem>

              <StatusItem>
                <StatusHeader>
                  <SlotLabel>Slot 04</SlotLabel>
                  <IconWrapper>
                    <FiCheckCircle />
                  </IconWrapper>
                </StatusHeader>
                <StatusValue>대기 중</StatusValue>
              </StatusItem>
            </StatusGrid>
          </StatusColumn>

          {/* 3. AI Chat */}
          <ChatColumn>
            <ChatHeaderContainer>
              <ChatAvatar><FiCpu /></ChatAvatar>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>AI 관제 어시스턴트</span>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>● Online</span>
              </div>
            </ChatHeaderContainer>

            <ChatBody>
              <MessageBubble>
                <strong>[자동 감지]</strong> CAM-207 구역에서 자재 적재 오류가 발생했습니다. Slot 32 소진율이 예상보다 15% 빠릅니다.
                <TimeStamp>10:05 AM</TimeStamp>
              </MessageBubble>

              <MessageBubble>
                <strong>[예측 경고]</strong> 현재 속도라면 10분 내로 라인 정지 가능성이 있습니다. (확률 85%)
                <TimeStamp>10:07 AM</TimeStamp>
              </MessageBubble>
              
              <MessageBubble $isUser>
                GR-Panel A 구역으로 예비 자재 배차해줘.
                <TimeStamp $isUser>10:08 AM</TimeStamp>
              </MessageBubble>

               <MessageBubble>
                확인했습니다. 현재 가용 가능한 AGV 3대 중 <strong>#04호기</strong>를 배차합니다. 예상 도착 시간은 3분입니다.
                <TimeStamp>10:08 AM</TimeStamp>
              </MessageBubble>
            </ChatBody>

            <ChatFooter>
              <ActionButtons>
                <ActionButton $primary>승인: AGV #04 배차 시작</ActionButton>
                <ButtonGroup>
                  <ActionButton>CCTV 상세 보기</ActionButton>
                  <ActionButton>물류팀 호출</ActionButton>
                </ButtonGroup>
              </ActionButtons>
              
              <InputWrapper>
                <ChatInput placeholder="지시 사항을 입력하세요..." />
                <SendBtn><FiSend size={16} /></SendBtn>
              </InputWrapper>
            </ChatFooter>

          </ChatColumn>
        </MainGrid>
      </DashboardContainer>
    </>
  );
};

export default SmartFactoryDashboard;