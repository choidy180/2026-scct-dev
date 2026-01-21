"use client";

import React, { useState, useRef, useEffect, useMemo, memo } from "react";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import styled, { css, keyframes } from "styled-components";
import { 
  Send, Bot, Sparkles, MessageSquare, ChevronRight, BarChart3, X
} from "lucide-react";
import { 
  FaDolly, FaEye, FaCogs, FaChartLine, FaHardHat, FaTruck, FaArrowRight 
} from 'react-icons/fa';
import { AnimatePresence, motion } from "framer-motion";

// ==========================================
// 0. ANIMATION CONFIG (TS 에러 수정 & 튜닝)
// ==========================================
// [중요] 'as const'를 붙여야 type이 string이 아닌 "spring" 리터럴로 인식됩니다.
const SMOOTH_TRANSITION = {
  type: "spring" as const, 
  stiffness: 260, // 반응 속도 (높을수록 빠름)
  damping: 30,    // 반동 제어 (높을수록 덜 출렁거림)
  mass: 1         // 무게감
};

// ==========================================
// 1. DATA & CONFIG
// ==========================================

const AGENT_DATA: Record<string, any> = {
  "/master-dashboard": {
    role: "manager",
    name: "GMT 공장장 AI",
    description: "전체 공장 현황 총괄 브리핑",
    guide: "반갑습니다. 현재 전체 공장 가동률은 98%입니다. 핵심 지표 리포트가 준비되었습니다.",
    suggestions: ["가동률 상세 보고", "금일 생산 목표", "에너지 효율 분석"],
  },
  "default": {
    role: "specialist",
    name: "파트장 AI",
    description: "시스템 가이드 및 지원",
    guide: "우측 패널에서 실시간으로 업무 지원을 받으실 수 있습니다.",
    suggestions: ["이 페이지 사용법", "데이터 내보내기", "오류 리포트"],
  }
};

type CardData = {
  id: string; title: string; desc: string; icon: any; color: string; href: string;
};

const DASHBOARD_ITEMS: CardData[] = [
  { id: "01", title: "자재관리", desc: "입고 및 적재 효율화", icon: FaDolly, color: "#00E676", href: "/material/inbound-inspection" },
  { id: "02", title: "공정품질", desc: "AI 비전 기반 품질 판정", icon: FaEye, color: "#FF3D00", href: "/production/glass-gap-check" },
  { id: "03", title: "공정설비", desc: "설비 이상 징후 탐지", icon: FaCogs, color: "#2962FF", href: "/production/line-monitoring" },
  { id: "04", title: "생산관리", desc: "공정 시간 및 병목 분석", icon: FaChartLine, color: "#00C853", href: "/production/takttime-dashboard" },
  { id: "05", title: "작업관리", desc: "Physical AI 환경 최적화", icon: FaHardHat, color: "#FFAB00", href: "/production/pysical-ai" },
  { id: "06", title: "출하관리", desc: "실시간 물류 및 배송 추적", icon: FaTruck, color: "#6200EA", href: "/transport/warehouse-management" },
];

// ==========================================
// 2. STYLED COMPONENTS (LAYOUT)
// ==========================================

const PageContainer = styled.div`
  width: 100vw;
  height: calc(100vh - 64px);
  display: flex;
  overflow: hidden;
  background-color: #000;
  position: relative;

  &::before {
    content: '';
    position: absolute; inset: 0;
    background: 
      linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%),
      url('/images/gmt_back.png') no-repeat center center / cover;
    z-index: 0;
    pointer-events: none;
  }
`;

// 메인 콘텐츠
const MainContent = styled(motion.div)`
  flex: 1; 
  height: 100%;
  padding: 40px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  will-change: width; /* 성능 최적화 */
`;

// [NEW] 챗봇이 열렸을 때 메인 콘텐츠를 덮는 투명 오버레이 (클릭 감지용)
const ContentOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2); /* 살짝 어둡게 처리하여 비활성 상태임을 암시 */
  z-index: 10;
  cursor: pointer;
  backdrop-filter: blur(2px);
`;

const SidebarWrapper = styled(motion.div)`
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 20;
  overflow: hidden; 
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -10px 0 40px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  will-change: width;
`;

// [중요] 내부 컨텐츠가 애니메이션 중에 찌그러지지 않도록 min-width 설정
const SidebarInner = styled.div`
  width: 450px; 
  min-width: 450px; /* 이 설정이 있어야 스르륵 자연스럽게 나옵니다 */
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const FloatingButtonWrapper = styled.div`
  position: absolute;
  bottom: 30px;
  right: 30px;
  z-index: 100;
`;

const NavbarTrigger = styled(motion.button)`
  display: flex; align-items: center; gap: 8px;
  padding: 12px 24px; height: 52px; border-radius: 26px;
  border: none;
  background: #ffffff; color: #374151;
  font-weight: 600; font-size: 15px; cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: all 0.2s cubic-bezier(0.2, 0, 0.2, 1);

  &:hover {
    background: #FFF0F3; color: #D31145; 
    box-shadow: 0 8px 25px rgba(211, 17, 69, 0.3);
    transform: translateY(-2px);
  }
  svg { color: #D31145; }
`;

// ==========================================
// 3. STYLED COMPONENTS (DASHBOARD & CHAT)
// ==========================================

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  transition: all 0.5s ease;

  @media (max-width: 1600px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;

const CardLink = styled(Link)` text-decoration: none; color: inherit; display: block; height: 100%; `;

const Card = styled.div<{ $color: string; $index: number }>`
  position: relative; height: 240px;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 28px; border-radius: 24px;
  background: rgba(20, 20, 20, 0.45); 
  backdrop-filter: blur(12px); 
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  
  animation: ${fadeInUp} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  animation-delay: ${props => props.$index * 0.05}s;
  opacity: 0; 

  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), background 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-8px);
    background: rgba(30, 30, 30, 0.85);
    border-color: ${props => props.$color}80; 
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  }
`;

const IconBox = styled.div<{ $color: string }>`
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: ${props => props.$color}; transition: all 0.3s ease;
  ${Card}:hover & { background: ${props => props.$color}15; border-color: ${props => props.$color}40; transform: scale(1.05); }
`;

const CardHeader = styled.div` display: flex; align-items: flex-start; gap: 18px; `;
const TextContent = styled.div` display: flex; flex-direction: column; gap: 8px; padding-top: 2px; `;
const Title = styled.h2` font-size: 20px; font-weight: 700; color: #ffffff; margin: 0; `;
const Description = styled.p` 
  font-size: 15px; color: rgba(255, 255, 255, 0.6); margin: 0; word-break: keep-all; transition: color 0.3s;
  ${Card}:hover & { color: rgba(255, 255, 255, 0.85); }
`;
const CardFooter = styled.div` display: flex; justify-content: flex-end; `;
const ActionButton = styled.div<{ $color: string }>`
  display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 20px;
  font-size: 14px; font-weight: 600; background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease; .arrow-icon { font-size: 10px; transition: transform 0.3s ease; }
  ${Card}:hover & { background: ${props => props.$color}; color: #fff; box-shadow: 0 4px 12px ${props => props.$color}40; }
  ${Card}:hover & .arrow-icon { transform: translateX(4px); }
`;

// --- Chat UI Styles ---
const ChatHeader = styled.div`
  padding: 24px; background: transparent; border-bottom: 1px solid #f3f4f6;
  display: flex; justify-content: space-between; align-items: flex-start;
  .header-content {
    display: flex; gap: 14px; align-items: center;
    .avatar-box {
      width: 48px; height: 48px; border-radius: 14px; background: #FFF0F3; color: #D31145;
      display: flex; align-items: center; justify-content: center; font-size: 24px;
    }
    .text-box {
      h2 { margin: 0; font-size: 17px; font-weight: 700; color: #111; display: flex; align-items: center; gap: 6px; }
      p { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    }
  }
  .close-btn {
    width: 36px; height: 36px; border-radius: 50%;
    background: #f3f4f6; border: none; color: #9ca3af; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    &:hover { background: #e5e7eb; color: #374151; transform: scale(1.1); }
  }
`;

const MessageList = styled.div`
  flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: transparent;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
`;

const Bubble = styled(motion.div)<{ $isUser: boolean }>`
  max-width: 88%; padding: 12px 16px; font-size: 14px; line-height: 1.5; border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  ${props => props.$isUser ? css`
    align-self: flex-end; background: #D31145; color: white; border-bottom-right-radius: 4px;
  ` : css`
    align-self: flex-start; background: #ffffff; color: #1f2937; border-top-left-radius: 4px; border: 1px solid #f3f4f6;
  `}
`;

const SuggestionArea = styled.div` display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; `;
const Chip = styled.button`
  background: #fff; border: 1px solid #e5e7eb; padding: 6px 12px; border-radius: 16px;
  font-size: 12px; color: #4b5563; cursor: pointer; display: flex; align-items: center; gap: 4px;
  transition: all 0.2s;
  &:hover { border-color: #D31145; color: #D31145; background: #FFF0F3; transform: translateY(-1px); }
`;
const InputArea = styled.form`
  padding: 20px 24px; background: transparent; border-top: 1px solid #f3f4f6; display: flex; gap: 10px; align-items: center;
  input {
    flex: 1; padding: 14px 18px; border-radius: 24px; border: 1px solid #e5e7eb; background: #ffffff; outline: none;
    font-size: 14px; transition: all 0.2s;
    &:focus { border-color: #D31145; box-shadow: 0 0 0 3px rgba(211, 17, 69, 0.1); }
  }
  button {
    width: 48px; height: 48px; border-radius: 50%; background: #111; color: white; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    &:hover { background: #D31145; transform: scale(1.1); }
  }
`;

// ==========================================
// 4. OPTIMIZED COMPONENTS
// ==========================================

const ChatInterface = memo(({ onClose }: { onClose: () => void }) => {
  const pathname = usePathname();
  const currentPath = pathname || "";
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(() => {
    if (currentPath.includes("/master-dashboard")) return AGENT_DATA["/master-dashboard"];
    return AGENT_DATA["default"];
  }, [currentPath]);

  useEffect(() => {
    setMessages([{ 
      id: Date.now(), text: ctx.guide, isUser: false, suggestions: ctx.suggestions 
    }]);
  }, [ctx.guide, ctx.suggestions]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    if(!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text, isUser: true }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, text: "요청하신 데이터를 분석 중입니다.", isUser: false 
      }]);
    }, 800);
  };

  return (
    <SidebarInner>
      <ChatHeader>
        <div className="header-content">
          <div className="avatar-box">
            {ctx.role === 'manager' ? <BarChart3 size={24}/> : <Bot size={24}/>}
          </div>
          <div className="text-box">
            <h2>{ctx.name} <Sparkles size={14} fill="#FFD700" color="#FFD700"/></h2>
            <p>{ctx.description}</p>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}><X size={20}/></button>
      </ChatHeader>

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
            {!m.isUser && m.suggestions && (
              <SuggestionArea>
                {m.suggestions.map((sug: string) => (
                  <Chip key={sug} onClick={() => handleSend(sug)}>
                    <MessageSquare size={12} /> {sug} <ChevronRight size={12} style={{opacity: 0.5}}/>
                  </Chip>
                ))}
              </SuggestionArea>
            )}
          </div>
        ))}
        <div ref={scrollRef}/>
      </MessageList>

      <InputArea onSubmit={(e) => { e.preventDefault(); handleSend(input); }}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="AI에게 업무 지시..." />
        <button type="submit"><Send size={18}/></button>
      </InputArea>
    </SidebarInner>
  );
});
ChatInterface.displayName = "ChatInterface";

const DashboardGrid = memo(() => (
  <GridWrapper>
    {DASHBOARD_ITEMS.map((item, index) => (
      <CardLink href={item.href} key={item.id}>
        <Card $color={item.color} $index={index}>
          <CardHeader>
            <IconBox $color={item.color}><item.icon /></IconBox>
            <TextContent>
              <Title>{item.title}</Title>
              <Description>{item.desc}</Description>
            </TextContent>
          </CardHeader>
          <CardFooter>
            <ActionButton $color={item.color}>
              <span>대시보드</span>
              <FaArrowRight className="arrow-icon" />
            </ActionButton>
          </CardFooter>
        </Card>
      </CardLink>
    ))}
  </GridWrapper>
));
DashboardGrid.displayName = "DashboardGrid";

// ==========================================
// 5. FINAL PAGE EXPORT
// ==========================================

export default function IntegratedDashboard() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <PageContainer>
      {/* 1. 메인 콘텐츠 */}
      <MainContent
        layout
        transition={SMOOTH_TRANSITION}
      >
        <DashboardGrid />

        {/* 바깥 영역 클릭시 닫히는 오버레이 (조건부 렌더링) */}
        <AnimatePresence>
          {isChatOpen && (
            <ContentOverlay 
              onClick={() => setIsChatOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </MainContent>

      {/* 2. 사이드바 (Push Effect) */}
      <AnimatePresence mode="wait">
        {isChatOpen && (
          <SidebarWrapper
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 450, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={SMOOTH_TRANSITION}
          >
            <ChatInterface onClose={() => setIsChatOpen(false)} />
          </SidebarWrapper>
        )}
      </AnimatePresence>
      
      {/* 3. 플로팅 트리거 버튼 */}
      <AnimatePresence>
        {!isChatOpen && (
          <FloatingButtonWrapper>
            <NavbarTrigger 
              onClick={() => setIsChatOpen(true)}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 20 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Bot size={20} />
              <span>AI Advisor</span>
            </NavbarTrigger>
          </FloatingButtonWrapper>
        )}
      </AnimatePresence>

    </PageContainer>
  );
}