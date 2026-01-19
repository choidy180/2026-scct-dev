"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import styled, { css, keyframes } from "styled-components";
import { Send, Bot, Activity, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Sliders } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// --------------------------------------------------------------------------
// 1. Mock Data
// --------------------------------------------------------------------------
type PageStatus = "danger" | "warning" | "normal";

interface PageContextData {
  title: string;
  status: PageStatus;
  message: string;
}

const MOCK_CONTEXTS: Record<string, PageContextData> = {
  "/factory/cooling-tower": {
    title: "냉각탑 제어 모듈",
    status: "danger",
    message: "경고: GR06 코어 온도 95°C. 즉시 밸브를 개방하십시오.",
  },
  "/master-dashboard": {
    title: "마스터 대시보드",
    status: "normal",
    message: "전체 시스템 가동률 98%. 모든 라인 정상입니다.",
  },
  "default": {
    title: "System Advisor",
    status: "warning",
    message: "현재 페이지의 데이터를 분석하고 있습니다...",
  }
};

// --------------------------------------------------------------------------
// 2. Styled Components (Clean Red Theme)
// --------------------------------------------------------------------------

// [NEW] 배지(Red Dot)가 두근거리는 애니메이션 (깔끔함 강조)
const heartbeat = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
`;

const WidgetWrapper = styled.div`
  position: relative;
  display: inline-block;
  font-family: 'Pretendard', sans-serif;
  z-index: 9999;
`;

// [NEW] 닫혀있을 때 Danger 상태면 나타나는 알림 배지 (빨간 점)
const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background-color: #dc2626; /* 선명한 레드 */
  border: 2px solid white;   /* 흰색 테두리로 분리감 줌 */
  border-radius: 50%;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  
  /* 심장박동 애니메이션 */
  animation: ${heartbeat} 1.5s infinite ease-in-out;
`;

const ToggleBtn = styled.button<{ $isOpen: boolean; $isDanger: boolean }>`
  position: relative; /* 배지 위치 기준점 */
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* 기본 스타일 (Clean White) */
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #374151;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);

  /* [열림 상태] */
  ${(props) => props.$isOpen && css`
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fca5a5;
  `}

  /* [닫힘 & Danger 상태] -> 번지는 그림자 제거, 선명한 테두리와 텍스트 적용 */
  ${(props) => !props.$isOpen && props.$isDanger && css`
      color: #dc2626;          /* 글자색 레드 */
      border: 2px solid #dc2626; /* 테두리 굵고 선명한 레드 */
      background: #fff;        /* 배경은 깨끗한 화이트 유지 */
  `}

  &:hover { 
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const PanelContainer = styled(motion.div)<{ $opacity: number }>`
  position: absolute;
  top: calc(100% + 14px);
  left: 0;
  width: 380px;
  
  opacity: ${(props) => props.$opacity};
  
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  /* 패널 그림자는 은은하게 유지 */
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 40px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(254, 202, 202, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: top left;

  &::before {
    content: "";
    position: absolute;
    top: -6px;
    left: 24px;
    width: 12px;
    height: 12px;
    background: inherit;
    border-top: 1px solid rgba(254, 202, 202, 0.5);
    border-left: 1px solid rgba(254, 202, 202, 0.5);
    transform: rotate(45deg);
  }
`;

const Header = styled.div<{ $status: PageStatus }>`
  padding: 16px 20px;
  background: ${(props) => 
    props.$status === 'danger' ? 'rgba(254, 226, 226, 0.8)' : 'rgba(255, 241, 242, 0.6)'};
  border-bottom: 1px solid rgba(254, 202, 202, 0.4);

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #dc2626;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
      }
      div {
        display: flex;
        flex-direction: column;
        h3 { font-size: 11px; color: #991b1b; font-weight: 700; margin: 0; }
        h2 { font-size: 15px; color: #450a0a; font-weight: 800; margin: 0; }
      }
    }
    
    .slider-group {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: rgba(255,255,255,0.6);
      border-radius: 12px;
      border: 1px solid rgba(254, 202, 202, 0.5);
      input { width: 60px; height: 4px; accent-color: #dc2626; cursor: grab; }
    }
  }

  .alert-card {
    background: rgba(255,255,255,0.7);
    border-radius: 12px;
    padding: 12px;
    border: 1px solid rgba(254, 202, 202, 0.8);
    display: flex;
    gap: 10px;
    align-items: flex-start;
    .icon { flex-shrink: 0; color: ${(props) => props.$status === 'danger' ? '#dc2626' : props.$status === 'normal' ? '#059669' : '#d97706'}; }
    span { font-size: 13px; line-height: 1.4; color: #374151; font-weight: 500; }
  }
`;

const ChatList = styled.div`
  height: 280px;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 241, 242, 0.2);
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const ChatBubble = styled.div<{ $isUser: boolean }>`
  max-width: 85%;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  align-self: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  
  ${(props) => props.$isUser ? css`
    background: #dc2626;
    color: white;
    border-radius: 16px 16px 2px 16px;
    box-shadow: 0 2px 5px rgba(220, 38, 38, 0.2);
  ` : css`
    background: white;
    color: #1f2937;
    border: 1px solid #fee2e2;
    border-radius: 16px 16px 16px 2px;
  `}
`;

const InputArea = styled.form`
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(254, 202, 202, 0.4);
  display: flex;
  gap: 8px;
  input { flex: 1; background: rgba(255, 241, 242, 0.8); border: 1px solid transparent; border-radius: 20px; padding: 10px 14px; font-size: 13px; outline: none; color: #450a0a; &:focus { background: white; border-color: #fca5a5; } }
  button { background: #dc2626; color: white; width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; &:hover { background: #b91c1c; } }
`;

// --------------------------------------------------------------------------
// 3. Logic
// --------------------------------------------------------------------------
interface Message { id: number; text: string; isUser: boolean; }

export default function ContextBot() {
  const pathname = usePathname(); 
  const currentPath = pathname || "";

  // [NEW] 외부 클릭 감지를 위한 ref
  const widgetRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [opacity, setOpacity] = useState(0.6); 
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(() => {
    if (currentPath.includes("/master-dashboard")) return MOCK_CONTEXTS["/master-dashboard"];
    if (MOCK_CONTEXTS[currentPath]) return MOCK_CONTEXTS[currentPath];
    return MOCK_CONTEXTS["default"];
  }, [currentPath]);

  // [NEW] 외부 영역 클릭 시 닫기 (Event Listener)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 위젯 영역(widgetRef) 밖을 클릭했고, 현재 열려있다면 -> 닫기
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // 마우스 누를 때 감지 (mousedown이 click보다 반응 빠름)
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    setOpacity(0.6); 
    setMessages([]); 

    let timer: NodeJS.Timeout;
    if (!currentPath.includes("/master-dashboard")) {
      timer = setTimeout(() => {
        setIsOpen(true);
        const initMsg = ctx.status === 'danger' 
          ? "🚨 긴급: 현재 페이지 데이터에 이상이 있습니다. 확인해주세요." 
          : `[${ctx.title}] 분석 완료. 정상 작동 중입니다.`;
        setMessages([{ id: Date.now(), text: initMsg, isUser: false }]);
      }, 3000); 
    }
    return () => clearTimeout(timer);
  }, [currentPath, ctx.status, ctx.title]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text: input, isUser: true }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now(), text: "확인했습니다.", isUser: false }]);
    }, 600);
  };

  return (
    // [NEW] ref 연결
    <WidgetWrapper ref={widgetRef}>
      
      <ToggleBtn 
        onClick={() => setIsOpen(!isOpen)} 
        $isOpen={isOpen}
        $isDanger={ctx.status === 'danger'}
      >
        <Bot size={18} />
        <span>GMT Advisor</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}

        {/* [NEW] 닫혀있고 Danger 상태일 때만 보이는 '심장박동' 배지 */}
        {!isOpen && ctx.status === 'danger' && (
          <NotificationBadge />
        )}
      </ToggleBtn>

      <AnimatePresence>
        {isOpen && (
          <PanelContainer
            $opacity={opacity}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: opacity, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Header $status={ctx.status}>
              <div className="controls">
                <div className="title-group">
                  <div className="avatar"><Bot size={20}/></div>
                  <div>
                    <h3>Factory AI</h3>
                    <h2>{ctx.title}</h2>
                  </div>
                </div>
                <div className="slider-group">
                  <Sliders size={12} color="#991b1b"/>
                  <input 
                    type="range" min="0.2" max="1" step="0.1" 
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="alert-card">
                {ctx.status === 'danger' ? <AlertCircle className="icon" size={18} /> : 
                ctx.status === 'normal' ? <CheckCircle2 className="icon" size={18} /> : 
                <Activity className="icon" size={18} />}
                <span>{ctx.message}</span>
              </div>
            </Header>

            <ChatList>
              {messages.map(m => (
                <ChatBubble key={m.id} $isUser={m.isUser}>{m.text}</ChatBubble>
              ))}
              <div ref={scrollRef} />
            </ChatList>

            <InputArea onSubmit={handleSend}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="질문을 입력하세요..." />
              <button><Send size={14}/></button>
            </InputArea>
          </PanelContainer>
        )}
      </AnimatePresence>
    </WidgetWrapper>
  );
}