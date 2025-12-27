"use client";

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Monitor, MousePointer2 } from "lucide-react"; // 아이콘 추가

// 기존 컴포넌트들
import ProcessMonitorPage from "@/components/bar-graph";
import LoadingGate from "@/components/loading/loading-spinner";
import LocalMapPage from "@/components/local-map";
import TopNavigation from "@/components/top-navigation";
import AiMaterialPlaceholder from "@/components/ai-material-placeholder";
import ChatbotWidget from "@/components/chatbot-widget";

// --------------------------------------------------------------------------
// 1. Mobile Blocker Components (트렌디한 안내 화면)
// --------------------------------------------------------------------------

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
`;

// 모바일/태블릿에서만 보이는 컨테이너
const MobileGuardContainer = styled.div`
  display: none; /* 기본적으로 숨김 (PC용) */
  
  @media (max-width: 1024px) {
    display: flex; /* 1024px 이하에서 보임 */
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    background: #0f172a; /* Deep Dark Blue */
    color: white;
    text-align: center;
    padding: 20px;
    position: fixed;
    top: 0; left: 0;
    z-index: 9999;
  }
`;

const IconCircle = styled.div`
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: ${float} 3s ease-in-out infinite;

  svg {
    color: #3b82f6;
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
  }
`;

const GuardTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 12px;
  background: linear-gradient(90deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.3;
`;

const GuardDesc = styled.p`
  font-size: 15px;
  color: #64748b;
  line-height: 1.6;
  max-width: 320px;
  margin: 0 auto 40px auto;
  word-break: keep-all;

  strong {
    color: #3b82f6;
    font-weight: 600;
  }
`;

const PcBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 30px;
  color: #60a5fa;
  font-size: 13px;
  font-weight: 600;
  animation: ${pulseGlow} 2s infinite;
`;

// --------------------------------------------------------------------------
// 2. Desktop Wrapper (PC에서만 보이는 컨테이너)
// --------------------------------------------------------------------------

const DesktopOnlyWrapper = styled.div`
  display: block;

  @media (max-width: 1024px) {
    display: none !important; /* 모바일/태블릿에서는 숨김 */
  }
`;

// --------------------------------------------------------------------------
// 3. Main Logic
// --------------------------------------------------------------------------

const ScctDevPage = () => {
  const [currentView, setCurrentView] = useState("AI 운송관리");

  return (
    <>
      {/* --- Case 1: 모바일/태블릿 화면 (안내 메시지) --- */}
      <MobileGuardContainer>
        <IconCircle>
          <Monitor size={48} strokeWidth={1.5} />
        </IconCircle>
        
        <GuardTitle>
          PC 환경에 최적화된<br />
          서비스입니다
        </GuardTitle>
        
        <GuardDesc>
          복잡한 공정 데이터와 실시간 관제 시스템은<br />
          <strong>넓은 PC 화면</strong>에서 가장 완벽하게 경험하실 수 있습니다.<br />
          PC로 접속하여 스마트한 관제를 시작해 보세요.
        </GuardDesc>

        <PcBadge>
          <MousePointer2 size={14} />
          Desktop Only Experience
        </PcBadge>
      </MobileGuardContainer>


      {/* --- Case 2: PC 화면 (실제 서비스) --- */}
      <DesktopOnlyWrapper>
        <LoadingGate isLoading={false}>
          
          <TopNavigation 
            activeTab={currentView} 
            onTabChange={setCurrentView} 
          />

          {currentView === "AI 생산관리" && <ProcessMonitorPage />}
          
          {currentView === "AI 운송관리" && <LocalMapPage />}

          {currentView === "AI 자재관리" && <AiMaterialPlaceholder />}
          <ChatbotWidget/>
        </LoadingGate>
      </DesktopOnlyWrapper>
    </>
  );
};

export default ScctDevPage;