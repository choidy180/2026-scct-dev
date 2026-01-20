"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import styled, { css, keyframes } from "styled-components";
import { 
  Send, Bot, Sparkles, MessageSquare, ChevronRight, BarChart3, 
} from "lucide-react";
import { 
  FaDolly, FaEye, FaCogs, FaChartLine, FaHardHat, FaTruck, FaArrowRight 
} from 'react-icons/fa';
import { AnimatePresence, motion } from "framer-motion";

// ==========================================
// 1. DATA & CONFIG
// ==========================================

// --- Mock Data (AI Agent) ---
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

// --- Mock Data (Dashboard Cards) ---
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
// 2. STYLED COMPONENTS
// ==========================================

// --- Layout Containers ---
const PageContainer = styled.div`
  width: 100vw;
  height: calc(100vh - 64px);
  display: flex;
  overflow: hidden;
  font-family: "Pretendard", -apple-system, sans-serif;
  background-color: #000;
  position: relative;

  /* 배경 이미지 (전체 적용) */
  &::before {
    content: '';
    position: absolute; inset: 0;
    background: 
      linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%),
      url('/images/gmt_back.png') no-repeat center center / cover;
    z-index: 0;
  }
`;

const MainContent = styled.div`
  flex: 1; /* 남은 공간 차지 */
  padding: 40px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const SidePanel = styled.div`
  width: 420px; /* 고정 너비 */
  height: 100%;
  background: #fff;
  border-left: 1px solid rgba(255,255,255,0.1);
  position: relative;
  z-index: 2;
  box-shadow: -10px 0 30px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;

  @media (max-width: 1100px) {
    display: none; /* 화면이 너무 작으면 숨김 (옵션) */
  }
`;

// --- Dashboard Styles ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const GridWrapper = styled.div`
  display: grid;
  /* 우측 패널이 공간을 차지하므로 컬럼 반응형 기준 조정 */
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 1400px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;

const CardLink = styled(Link)`
  text-decoration: none; color: inherit; display: block; height: 100%;
`;

const Card = styled.div<{ $color: string; $index: number }>`
  position: relative; height: 220px;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 24px;
  border-radius: 20px;
  background: rgba(20, 20, 20, 0.45); 
  backdrop-filter: blur(12px); 
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  opacity: 0;
  animation: ${fadeInUp} 0.5s ease-out forwards;
  animation-delay: ${props => props.$index * 0.07}s;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: translateY(-6px);
    background: rgba(30, 30, 30, 0.85);
    border-color: ${props => props.$color}80; 
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }
`;

const IconBox = styled.div<{ $color: string }>`
  width: 48px; height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: ${props => props.$color};
  transition: all 0.3s ease;

  ${Card}:hover & {
    background: ${props => props.$color}15;
    border-color: ${props => props.$color}40;
    transform: scale(1.05);
  }
`;

const CardHeader = styled.div`
  display: flex; align-items: flex-start; gap: 16px;
`;

const TextContent = styled.div`
  display: flex; flex-direction: column; gap: 6px; padding-top: 2px;
`;

const Title = styled.h2`
  font-size: 19px; font-weight: 700; color: #ffffff; margin: 0;
`;

const Description = styled.p`
  font-size: 14px; color: rgba(255, 255, 255, 0.6); margin: 0; word-break: keep-all;
  transition: color 0.3s;
  ${Card}:hover & { color: rgba(255, 255, 255, 0.85); }
`;

const CardFooter = styled.div`
  display: flex; justify-content: flex-end;
`;

const ActionButton = styled.div<{ $color: string }>`
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 600;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  .arrow-icon { font-size: 10px; transition: transform 0.3s ease; }

  ${Card}:hover & {
    background: ${props => props.$color}; color: #fff;
    box-shadow: 0 4px 12px ${props => props.$color}40;
  }
  ${Card}:hover & .arrow-icon { transform: translateX(4px); }
`;

// --- Chat Styles (Refined for Sidebar) ---
const ChatHeader = styled.div`
  padding: 24px;
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
  
  .header-content {
    display: flex; gap: 14px; align-items: center;
    .avatar-box {
      width: 48px; height: 48px; border-radius: 14px;
      background: #FFF0F3; color: #D31145;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .text-box {
      h2 { margin: 0; font-size: 17px; font-weight: 700; color: #111; display: flex; align-items: center; gap: 6px; }
      p { margin: 4px 0 0; font-size: 13px; color: #6b7280; }
    }
  }
`;

const MessageList = styled.div`
  flex: 1; padding: 24px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 16px; background: #fff;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
`;

const Bubble = styled(motion.div)<{ $isUser: boolean }>`
  max-width: 88%; padding: 12px 16px; font-size: 14px; line-height: 1.5; border-radius: 18px;
  ${props => props.$isUser ? css`
    align-self: flex-end; background: #D31145; color: white; border-bottom-right-radius: 4px;
  ` : css`
    align-self: flex-start; background: #f8f9fa; color: #1f2937; border-top-left-radius: 4px; border: 1px solid #f3f4f6;
  `}
`;

const SuggestionArea = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
`;

const Chip = styled.button`
  background: #fff; border: 1px solid #e5e7eb; padding: 6px 12px;
  border-radius: 16px; font-size: 12px; color: #4b5563; cursor: pointer;
  display: flex; align-items: center; gap: 4px; transition: all 0.2s;
  &:hover { border-color: #D31145; color: #D31145; background: #FFF0F3; }
`;

const InputArea = styled.form`
  padding: 16px 24px; background: #fff; border-top: 1px solid #f3f4f6;
  display: flex; gap: 10px; align-items: center;
  
  input {
    flex: 1; padding: 12px 16px; border-radius: 20px;
    border: 1px solid #e5e7eb; background: #f9fafb; font-size: 14px; outline: none;
    &:focus { background: #fff; border-color: #D31145; }
  }
  
  button {
    width: 42px; height: 42px; border-radius: 50%; background: #111; color: white;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    &:hover { background: #D31145; transform: scale(1.05); }
  }
`;

// ==========================================
// 3. COMPONENTS
// ==========================================

// [우측] 챗봇 컴포넌트
const AIChatSidebar = () => {
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
  }, [ctx]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    if(!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), text, isUser: true }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "요청하신 데이터를 분석 중입니다. 잠시만 기다려주세요.", 
        isUser: false 
      }]);
    }, 800);
  };

  return (
    <SidePanel>
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
      </ChatHeader>

      <MessageList>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.isUser ? 'flex-end' : 'flex-start' }}>
            <Bubble 
              $isUser={m.isUser}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
        <input 
          value={input} 
          onChange={e=>setInput(e.target.value)} 
          placeholder="AI에게 업무 지시..." 
        />
        <button type="submit"><Send size={18}/></button>
      </InputArea>
    </SidePanel>
  );
};

// [좌측] 대시보드 그리드 컴포넌트
const DashboardGrid = () => {
  return (
    <GridWrapper>
      {DASHBOARD_ITEMS.map((item, index) => (
        <CardLink href={item.href} key={item.id}>
          <Card $color={item.color} $index={index}>
            <CardHeader>
              <IconBox $color={item.color}>
                <item.icon />
              </IconBox>
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
  );
};

// ==========================================
// 4. FINAL PAGE EXPORT
// ==========================================
export default function IntegratedDashboard() {
  return (
    <PageContainer>
      {/* 왼쪽 메인 콘텐츠 */}
      <MainContent>
        <DashboardGrid />
      </MainContent>
      
      {/* 오른쪽 AI 사이드바 (항상 노출) */}
      <AIChatSidebar />
    </PageContainer>
  );
}