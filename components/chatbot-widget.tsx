"use client";

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiMessageSquare, 
  FiSend, 
  FiCpu, 
  FiActivity, 
  FiClock, 
  FiX 
} from 'react-icons/fi';

// --------------------------------------------------------------------------
// 1. Types
// --------------------------------------------------------------------------

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: string;
}

// --------------------------------------------------------------------------
// 2. Chatbot Styled Components (스타일은 기존과 동일)
// --------------------------------------------------------------------------

const ChatWidgetWrapper = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
`;

const ChatButton = styled.button<{ $isOpen: boolean }>`
  width: 64px;
  height: 64px;
  background-color: #172033;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: white;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
    background-color: #1e293b;
  }
  &:active { transform: scale(0.95); }

  svg {
    transition: transform 0.3s ease;
    transform: ${props => props.$isOpen ? 'rotate(90deg)' : 'rotate(0deg)'};
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 22px;
    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }
`;

const ChatWindow = styled.div<{ $isOpen: boolean }>`
  width: 380px;
  height: 600px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  
  opacity: ${props => props.$isOpen ? 1 : 0};
  transform: ${props => props.$isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)'};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #2a2a5a 0%, #151530 100%);
  padding: 24px;
  color: white;
  position: relative;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    pointer-events: none;
  }

  .header-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .title-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .text-info {
    display: flex;
    flex-direction: column;
  }

  .name {
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px #10b981;
  }

  .status-text {
    font-size: 12px;
    opacity: 0.7;
    margin-top: 2px;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: rgba(255, 255, 255, 0.2); }
  }
`;

const ChatBody = styled.div`
  flex: 1;
  background-color: #f8fafc;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 4px;
  }
`;

const MessageBubble = styled.div<{ $isUser?: boolean }>`
  max-width: 85%;
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  
  .bubble {
    background: ${props => props.$isUser ? '#1e293b' : '#fff'};
    color: ${props => props.$isUser ? '#fff' : '#1e293b'};
    padding: 14px 16px;
    border-radius: 18px;
    border-top-left-radius: ${props => !props.$isUser ? '4px' : '18px'};
    border-top-right-radius: ${props => props.$isUser ? '4px' : '18px'};
    box-shadow: ${props => props.$isUser ? 'none' : '0 2px 10px rgba(0,0,0,0.03)'};
    font-size: 14px;
    line-height: 1.5;
    border: ${props => props.$isUser ? 'none' : '1px solid #e2e8f0'};
  }

  .timestamp {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 6px;
    margin-left: 4px;
    display: block;
    text-align: ${props => props.$isUser ? 'right' : 'left'};
  }
`;

const LoadingBubble = styled.div`
  align-self: flex-start;
  background: #fff;
  padding: 12px 16px;
  border-radius: 18px;
  border-top-left-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  border: 1px solid #e2e8f0;
  display: flex;
  gap: 4px;

  span {
    width: 6px;
    height: 6px;
    background: #cbd5e1;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }
  
  span:nth-child(1) { animation-delay: -0.32s; }
  span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

const QuickReplies = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  &::-webkit-scrollbar { display: none; }
`;

const ReplyChip = styled.button`
  background: #fff;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #0f172a;
  }
  svg { color: #64748b; }
`;

const ChatFooter = styled.div`
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const InputField = styled.input`
  flex: 1;
  background: #f1f5f9;
  border: none;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  color: #1e293b;
  outline: none;
  transition: box-shadow 0.2s;

  &::placeholder { color: #94a3b8; }
  &:focus { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  background: #1e293b;
  border-radius: 12px;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: #0f172a; }
`;

// --------------------------------------------------------------------------
// 3. Logic & Export
// --------------------------------------------------------------------------

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // 초기 메시지 상태
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "안녕하세요! AI 공정 모니터링 챗봇입니다.\n현재 GR2 라인의 특이사항이 감지되었습니다. 무엇을 도와드릴까요?",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤 자동 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 메시지 전송 핸들러
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 1. 유저 메시지 추가
    const newUserMsg: Message = {
      id: Date.now(),
      text: text,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsTyping(true); // 봇 타이핑 시작

    // 2. AI 응답 시뮬레이션 (1.5초 딜레이)
    setTimeout(() => {
      const botResponseText = getSimulatedResponse(text);
      const newBotMsg: Message = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newBotMsg]);
      setIsTyping(false); // 봇 타이핑 종료
    }, 1200);
  };

  // 간단한 키워드 기반 응답 로직
  const getSimulatedResponse = (input: string): string => {
    if (input.includes('상태') || input.includes('공정')) {
      return "현재 공정 효율은 98.5%이며, 모든 라인이 정상 가동 중입니다. 다만 R액 압력이 다소 높게 측정되고 있습니다.";
    }
    if (input.includes('데이터') || input.includes('모니터링')) {
      return "실시간 데이터 요약:\n- R액 압력: 120.3 kg/m²\n- 탱크온도: 16.9°C\n- 발포시간: 1.64초\n\n특이사항 없이 안정적인 수치입니다.";
    }
    if (input.includes('안녕')) {
      return "반갑습니다! 오늘도 안전한 공정 운영을 지원하겠습니다.";
    }
    return "죄송합니다. 해당 질문에 대한 정확한 데이터를 찾고 있습니다. 다시 한 번 말씀해 주시겠습니까?";
  };

  return (
    <ChatWidgetWrapper>
      <ChatWindow $isOpen={isOpen}>
        
        {/* Header */}
        <ChatHeader>
          <div className="header-content">
            <div className="title-area">
              <div className="avatar"><FiCpu /></div>
              <div className="text-info">
                <div className="name">
                  AI 어시스턴트
                  <div className="status-dot" />
                </div>
                <div className="status-text">● 실시간 공정 분석 중</div>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <FiX size={16} />
            </button>
          </div>
        </ChatHeader>

        {/* Body */}
        <ChatBody>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} $isUser={msg.sender === 'user'}>
              <div className="bubble">
                {msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== msg.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <span className="timestamp">{msg.timestamp}</span>
            </MessageBubble>
          ))}

          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <LoadingBubble>
              <span /><span /><span />
            </LoadingBubble>
          )}
          
          <div ref={messagesEndRef} />
        </ChatBody>

        {/* Quick Replies (항상 노출되어 클릭 유도) */}
        <div style={{ padding: '0 20px 10px 20px', backgroundColor:'#f8fafc' }}>
          <div style={{fontSize:'12px', color:'#64748b', fontWeight:600, marginBottom:'8px'}}>추천 질문</div>
          <QuickReplies>
            <ReplyChip onClick={() => handleSendMessage('현재 공정 상태는?')}>
              <FiActivity size={14}/>현재 공정 상태는?
            </ReplyChip>
            <ReplyChip onClick={() => handleSendMessage('실시간 모니터링 데이터 알려줘')}>
              <FiClock size={14}/>실시간 모니터링 데이터
            </ReplyChip>
          </QuickReplies>
        </div>

        {/* Footer */}
        <ChatFooter>
          <InputField 
            placeholder="메시지를 입력하세요..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
          />
          <SendButton onClick={() => handleSendMessage(inputText)}>
            <FiSend size={18} style={{marginLeft:'-2px'}} />
          </SendButton>
        </ChatFooter>

      </ChatWindow>

      {/* Floating Button */}
      <ChatButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        {isOpen ? (
          <FiX size={28} />
        ) : (
          <FiMessageSquare size={28} style={{ marginTop: '2px' }} />
        )}
      </ChatButton>
    </ChatWidgetWrapper>
  );
}