"use client";

import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { X, Send, Sparkles, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// --------------------------------------------------------------------------
// 1. Animations (Subtle & Premium)
// --------------------------------------------------------------------------

const hoverFloat = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(-4px); }
`;

// 버튼 주변으로 은은하게 퍼지는 붉은 파장 (너무 과하지 않게 수정)
const softPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
`;

// --------------------------------------------------------------------------
// 2. Styled Components (Refined Design)
// --------------------------------------------------------------------------

const WidgetWrapper = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: 'Pretendard', sans-serif;
  pointer-events: none;
`;

// [수정] 버튼 크기 축소 (58px -> 50px) 및 디자인 정제
const FabButton = styled(motion.button)<{ $isOpen: boolean }>`
  pointer-events: auto;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  position: relative;
  
  /* Deep & Modern Red Gradient */
  background: linear-gradient(135deg, #dc2626, #991b1b);
  color: white;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 부드러운 그림자 */
  box-shadow: 0 8px 20px rgba(185, 28, 28, 0.4);
  transition: transform 0.2s ease;

  ${(props) =>
    !props.$isOpen &&
    css`
      /* 닫혀있을 때만 은은한 맥동 효과 */
      animation: ${softPulse} 3s infinite;
    `}

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 25px rgba(185, 28, 28, 0.5);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const ChatContainer = styled(motion.div)`
  pointer-events: auto;
  width: 320px; /* 너비 최적화 */
  height: 480px; /* 높이 최적화 */
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 20px;
  
  /* 고급스러운 확산형 그림자 (진한 테두리 제거) */
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 40px -5px rgba(0, 0, 0, 0.15);
  
  border: 1px solid rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
`;

// [수정] 헤더 디자인 전면 수정 (연두색 UI 제거)
const Header = styled.div`
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .bot-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .text-area {
      display: flex;
      flex-direction: column;
      
      h3 {
        font-size: 15px;
        font-weight: 700;
        color: #111827;
        margin: 0;
        line-height: 1.2;
      }
      
      span {
        font-size: 11px;
        color: #9ca3af;
        font-weight: 500;
      }
    }
  }

  .close-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
    
    &:hover {
      background: #f3f4f6;
      color: #4b5563;
    }
  }
`;

const MessagesList = styled.div`
  flex: 1;
  padding: 16px;
  background: #f9fafb; /* 아주 연한 그레이 배경 */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;

  /* 스크롤바 숨김 */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const MessageRow = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  position: relative;
  
  ${(props) =>
    props.$isUser
      ? css`
          /* User: Gomotec Red Solid */
          background: #dc2626;
          color: white;
          border-radius: 16px 16px 2px 16px;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
        `
      : css`
          /* Bot: Clean White */
          background: white;
          color: #374151;
          border-radius: 16px 16px 16px 2px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        `}
`;

const InputWrapper = styled.form`
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    flex: 1;
    background: #f3f4f6;
    border: 1px solid transparent;
    border-radius: 20px;
    padding: 10px 14px;
    font-size: 13px;
    color: #1f2937;
    outline: none;
    transition: all 0.2s;

    &::placeholder { color: #9ca3af; }
    &:focus {
      background: white;
      border-color: #e5e7eb;
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.05);
    }
  }

  button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: 0.2s;
    
    &:hover { background: #fef2f2; }
    &:disabled { color: #d1d5db; cursor: default; background: transparent; }
  }
`;

// --------------------------------------------------------------------------
// 3. Logic & Component
// --------------------------------------------------------------------------

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

// [최적화] 메시지 컴포넌트 분리 및 메모이제이션
const ChatMessage = memo(({ msg }: { msg: Message }) => (
  <MessageRow $isUser={msg.isUser}>
    <Bubble $isUser={msg.isUser}>
      {msg.text}
    </Bubble>
  </MessageRow>
));
ChatMessage.displayName = "ChatMessage";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  // [수정] 봇 이름 반영
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "안녕하세요! GMT봇입니다. 궁금한 점을 물어보세요.", isUser: false },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 입력 핸들러 최적화
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText("");

    setMessages((prev) => [...prev, { id: Date.now(), text, isUser: true }]);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "요청하신 내용을 확인하고 있습니다.", isUser: false },
      ]);
    }, 600);
  }, [inputText]);

  // 자동 스크롤
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  return (
    <WidgetWrapper>
      <AnimatePresence>
        {isOpen && (
          <ChatContainer
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          >
            {/* Header: Clean & Minimal */}
            <Header>
              <div className="bot-info">
                <div className="avatar">
                  <Sparkles size={18} strokeWidth={2} />
                </div>
                <div className="text-area">
                  <h3>GMT봇</h3>
                  <span>Always Online</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </Header>

            {/* Chat Area */}
            <MessagesList>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </MessagesList>

            {/* Input Area */}
            <InputWrapper onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                value={inputText}
                onChange={handleInputChange}
              />
              <button type="submit" disabled={!inputText.trim()}>
                <Send size={18} />
              </button>
            </InputWrapper>
          </ChatContainer>
        )}
      </AnimatePresence>

      <FabButton
        $isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
        aria-label="GMT봇 열기"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex" }}
            >
              <MessageSquare size={24} fill="currentColor" fillOpacity={0.2} />
            </motion.div>
          )}
        </AnimatePresence>
      </FabButton>
    </WidgetWrapper>
  );
}