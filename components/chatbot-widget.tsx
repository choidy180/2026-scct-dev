"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import styled, { css } from "styled-components";
import { Send, Bot, X, Sparkles, MessageSquare, ChevronRight, BarChart3 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// --- Mock Data ---
const AGENT_DATA: Record<string, any> = {
  "/master-dashboard": {
    role: "manager",
    name: "GMT 공장장 AI",
    description: "전체 공장 현황 총괄 브리핑",
    guide: "반갑습니다. 현재 전체 공장 가동률은 98%입니다. 핵심 지표 리포트가 준비되었습니다.",
    suggestions: ["가동률 상세 보고", "금일 생산 목표", "에너지 효율 분석"],
    answers: {}
  },
  "default": {
    role: "specialist",
    name: "파트장 AI",
    description: "시스템 가이드 및 지원",
    guide: "현재 페이지를 분석 중입니다. 궁금한 점이 있으시면 언제든 말씀해주세요.",
    suggestions: ["이 페이지 사용법", "데이터 내보내기", "오류 리포트"],
    answers: {}
  }
};

// --- Portal ---
const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (typeof window === "undefined" || !mounted) return null;
  return createPortal(children, document.body);
};

// --- Styled Components (Modern White & Red Theme) ---

// 네비게이션 바 트리거 버튼
const NavbarTrigger = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0.2, 1);
  font-family: 'Pretendard', sans-serif;
  
  /* 미세한 그림자 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);

  &:hover {
    background: #FFF0F3; /* 아주 연한 레드 배경 */
    border-color: #FECDD3;
    color: #D31145; /* GMT 레드 */
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(211, 17, 69, 0.1); /* 레드 빛 그림자 */
  }

  svg {
    color: #D31145;
    transition: transform 0.2s;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
`;

// [디자인 변경] 어두운 배경 대신 -> 밝은 블러 배경
const ModalOverlay = styled(motion.div)`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw; height: 100vh;
  /* 밝은 반투명 배경 + 강한 블러 */
  background: rgba(255, 255, 255, 0.4); 
  backdrop-filter: blur(12px); 
  z-index: 999999;
  display: flex; align-items: center; justify-content: center;
`;

// [디자인 변경] 그림자를 깊게 주어 흰 배경에서도 뜨게 만듦
const ModalPanel = styled(motion.div)`
  width: 500px; 
  height: 720px; 
  background: #ffffff;
  border-radius: 28px; 
  /* 부드럽고 깊은 그림자 */
  box-shadow: 
    0 10px 40px -10px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0,0,0,0.05); /* 미세한 테두리 */
  display: flex; flex-direction: column; overflow: hidden;
  position: relative;
`;

const ChatContainer = styled.div`
  display: flex; flex-direction: column; height: 100%; 
  font-family: 'Pretendard', sans-serif; 
  background: #fff;
`;

// 헤더: 그라데이션 대신 깔끔한 화이트 + 하단 보더
const Header = styled.div`
  padding: 24px 28px;
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-shrink: 0;

  .header-content {
    display: flex; gap: 16px; align-items: center;
    
    .avatar-box {
      width: 52px; height: 52px;
      border-radius: 16px;
      background: #FFF0F3; /* 연한 레드 */
      color: #D31145;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    
    .text-box {
      display: flex; flex-direction: column; gap: 4px;
      h2 { 
        margin: 0; font-size: 18px; font-weight: 700; color: #111; 
        display: flex; align-items: center; gap: 6px;
      }
      p { margin: 0; font-size: 13px; color: #6b7280; font-weight: 400; }
    }
  }

  .close-btn {
    background: #f3f4f6;
    border: none;
    color: #9ca3af;
    width: 32px; height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    
    &:hover {
      background: #e5e7eb;
      color: #374151;
    }
  }
`;

const MessageList = styled.div`
  flex: 1; 
  padding: 28px; 
  overflow-y: auto; 
  display: flex; flex-direction: column; gap: 20px; 
  background: #fff;
  
  /* 스크롤바 숨김 */
  &::-webkit-scrollbar { display: none; }
`;

// 말풍선 디자인 개선
const Bubble = styled(motion.div)<{ $isUser: boolean }>`
  max-width: 82%; 
  padding: 14px 18px; 
  font-size: 15px; 
  line-height: 1.6;
  border-radius: 20px;
  position: relative;
  
  ${props => props.$isUser ? css`
    align-self: flex-end;
    background: #D31145; /* 브랜드 레드 */
    color: white;
    border-bottom-right-radius: 4px;
    box-shadow: 0 4px 12px rgba(211, 17, 69, 0.2);
  ` : css`
    align-self: flex-start;
    background: #f8f9fa; /* 아주 연한 그레이 */
    color: #1f2937;
    border-top-left-radius: 4px;
    border: 1px solid #f3f4f6;
  `}
`;

// 추천 질문 칩 (Chips)
const SuggestionArea = styled.div`
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
`;

const Chip = styled.button`
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-weight: 500;
  display: flex; align-items: center; gap: 4px;

  &:hover {
    border-color: #D31145;
    color: #D31145;
    background: #FFF0F3;
  }
`;

const InputArea = styled.form`
  padding: 20px 28px;
  background: #fff;
  /* 상단에 옅은 그라데이션 그림자 */
  box-shadow: 0 -10px 30px rgba(0,0,0,0.02); 
  display: flex; gap: 12px;
  align-items: center;

  .input-wrapper {
    flex: 1;
    position: relative;
    display: flex; align-items: center;
    
    input {
      width: 100%;
      padding: 14px 20px;
      padding-right: 48px;
      border-radius: 24px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      font-size: 15px;
      outline: none;
      transition: all 0.2s;
      font-family: inherit;
      
      &:focus {
        background: #fff;
        border-color: #D31145;
        box-shadow: 0 0 0 3px rgba(211, 17, 69, 0.1);
      }
      
      &::placeholder { color: #9ca3af; }
    }
  }

  button { 
    width: 48px; height: 48px; 
    border-radius: 50%; 
    background: #111; /* 전송 버튼은 블랙으로 무게감 */
    color: white; 
    border: none; 
    cursor: pointer; 
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s, background 0.2s;
    
    &:hover { 
      transform: scale(1.05); 
      background: #D31145; /* 호버시 레드로 변경 */
    } 
  }
`;

export default function AIAgentSystem() {
  const pathname = usePathname();
  const currentPath = pathname || "";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 현재 경로가 마스터 대시보드인지 확인 (포함 여부로 체크)
  const isMasterDashboard = currentPath.includes("/master-dashboard");

  const ctx = useMemo(() => {
    if (isMasterDashboard) return AGENT_DATA["/master-dashboard"];
    return AGENT_DATA["default"];
  }, [isMasterDashboard]);

  // 페이지 이동시 리셋
  useEffect(() => {
    setMessages([{ 
      id: Date.now(), 
      text: ctx.guide, 
      isUser: false,
      suggestions: ctx.suggestions 
    }]);
  }, [ctx, isOpen]);

  // 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    if(!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text, isUser: true }]);
    setInput("");
    
    // AI 응답 시뮬레이션
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "요청하신 내용을 확인했습니다. 관련 데이터를 분석하여 결과를 표시합니다.", 
        isUser: false 
      }]);
    }, 600);
  };

  const ChatUI = () => (
    <ChatContainer>
      <Header>
        <div className="header-content">
          <div className="avatar-box">
            {ctx.role === 'manager' ? <BarChart3 size={26}/> : <Bot size={26}/>}
          </div>
          <div className="text-box">
            <h2>{ctx.name} <Sparkles size={14} fill="#FFD700" color="#FFD700"/></h2>
            <p>{ctx.description}</p>
          </div>
        </div>
        <button className="close-btn" onClick={() => setIsOpen(false)}><X size={18}/></button>
      </Header>

      <MessageList>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.isUser ? 'flex-end' : 'flex-start' }}>
            <Bubble 
              $isUser={m.isUser}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {m.text}
            </Bubble>
            {/* AI 답변에만 추천 칩 표시 */}
            {!m.isUser && m.suggestions && (
              <SuggestionArea>
                {m.suggestions.map((sug: string) => (
                  <Chip key={sug} onClick={() => handleSend(sug)}>
                    <MessageSquare size={13} />
                    {sug}
                    <ChevronRight size={13} style={{opacity: 0.5}}/>
                  </Chip>
                ))}
              </SuggestionArea>
            )}
          </div>
        ))}
        <div ref={scrollRef}/>
      </MessageList>

      <InputArea onSubmit={(e) => { e.preventDefault(); handleSend(input); }}>
        <div className="input-wrapper">
          <input 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            placeholder="무엇이든 물어보세요..." 
          />
        </div>
        <button type="submit"><Send size={20}/></button>
      </InputArea>
    </ChatContainer>
  );

  return (
    <>
      {/* 마스터 대시보드가 아닐 때만 버튼을 렌더링합니다.
        조건: !isMasterDashboard 
      */}
      {!isMasterDashboard && (
        <NavbarTrigger 
          onClick={() => setIsOpen(true)}
          whileTap={{ scale: 0.95 }}
        >
          <Bot size={20} />
          <span>AI Advisor</span>
        </NavbarTrigger>
      )}

      <Portal>
        <AnimatePresence>
          {isOpen && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            >
              <ModalPanel
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              >
                <ChatUI />
              </ModalPanel>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}