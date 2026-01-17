"use client";

import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { X, Send } from "lucide-react"; 
import { AnimatePresence, motion } from "framer-motion";

// --------------------------------------------------------------------------
// [설정] 로컬 이미지 경로 (public 폴더 내 위치)
// --------------------------------------------------------------------------
const BOT_IMAGE_SRC = "/images/my_bot_logo.png"; // 사용자 이미지 파일명 예시

// --------------------------------------------------------------------------
// 1. Animations (Efficient CSS Keyframes)
// --------------------------------------------------------------------------

// [핵심] 숨 쉬는 듯한 애니메이션 (Breathing Effect)
// 크기가 살짝 커지면서(Scale), 그림자가 몽환적으로 퍼지는(Shadow) 효과
const breathing = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  50% {
    transform: scale(1.05); /* 1.05배 부드럽게 확대 */
    /* 붉은 계열의 은은한 글로우 효과 (이미지 톤에 맞춤) */
    box-shadow: 0 8px 20px rgba(220, 38, 38, 0.25); 
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

// --------------------------------------------------------------------------
// 2. Styled Components
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

// [디자인] 메인 버튼 (FAB)
const FabButton = styled(motion.button)<{ $isOpen: boolean }>`
  pointer-events: auto;
  width: 58px;  /* 이미지 꽉 참을 고려해 적당한 크기 */
  height: 58px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  cursor: pointer;
  position: relative;
  padding: 8px;
  
  /* 배경은 흰색이지만 이미지가 덮으므로 크게 상관없음 */
  background: #ffffff;
  color: #1f2937;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 기본 그림자 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  /* 이미지가 둥근 버튼 밖으로 나가지 않게 잘라냄 */
  overflow: hidden; 

  ${(props) =>
    !props.$isOpen &&
    css`
      /* 닫혀있을 때만 숨 쉬는 애니메이션 (3초 주기) */
      animation: ${breathing} 3s ease-in-out infinite;
    `}

  /* 호버 시 애니메이션 멈추고 살짝 커진 상태 유지 (사용자 인터랙션 인지) */
  &:hover {
    animation-play-state: paused;
    transform: scale(1.1); 
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// [이미지] 1.6배 확대하여 꽉 차게 만들기
const BotImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1.6); /* 요청하신 대로 1.6배 확대 */
  transform-origin: center;
`;

const ChatContainer = styled(motion.div)`
  pointer-events: auto;
  width: 320px;
  height: 480px;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 20px;
  
  /* 깔끔하고 깊이감 있는 그림자 */
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 40px -5px rgba(0, 0, 0, 0.15);
  
  border: 1px solid rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
`;

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
      border-radius: 50%;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
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
  background: #f9fafb;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
          background: #dc2626;
          color: white;
          border-radius: 16px 16px 2px 16px;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
        `
      : css`
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
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
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
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "안녕하세요! 궁금한 점을 물어보세요.", isUser: false },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText("");

    setMessages((prev) => [...prev, { id: Date.now(), text, isUser: true }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "요청하신 내용을 확인하고 있습니다.", isUser: false },
      ]);
    }, 600);
  }, [inputText]);

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
            {/* Header: 로컬 이미지 */}
            <Header>
              <div className="bot-info">
                <div className="avatar">
                  <img src={BOT_IMAGE_SRC} alt="Bot Avatar" />
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

            <MessagesList>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </MessagesList>

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

      {/* Floating Action Button */}
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
              {/* 닫을 때는 X 아이콘 */}
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              // [중요] padding을 0으로 주어 이미지가 버튼에 꽉 차게 함
              style={{ width: "100%", height: "100%", padding: "0px" }}
            >
              {/* 평소에는 숨쉬는 로컬 이미지 */}
              <BotImg src={BOT_IMAGE_SRC} alt="Open Chat" />
            </motion.div>
          )}
        </AnimatePresence>
      </FabButton>
    </WidgetWrapper>
  );
}