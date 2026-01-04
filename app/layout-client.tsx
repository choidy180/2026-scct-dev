"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import { Monitor, MousePointer2 } from "lucide-react";
import TopNavigation from "@/components/navigation/top-navigation";
import ChatbotWidget from "@/components/chatbot-widget";
import { useViewContext } from "./view-context";

// --------------------------------------------------------------------------
// ✅ 0. 로딩 시간 설정 (여기서 URL/메뉴별 시간을 제어하세요)
// --------------------------------------------------------------------------

// 기본 로딩 시간 (설정되지 않은 메뉴에 적용)
const DEFAULT_LOADING_TIME = 100; 

// 특정 메뉴별 로딩 시간 (단위: ms)
// 키 값은 TopNavigation의 메뉴명과 정확히 일치해야 합니다.
const LOADING_CONFIG: Record<string, number> = {
  "AI 생산관리": 100,  // 데이터가 많아서 4초
  "AI 운송관리": 0,  // 가벼워서 1.5초
  "AI 자재관리": 100,  // 적당히 3초
};

// --------------------------------------------------------------------------
// 1. Mobile Blocker Styles
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

const MobileGuardContainer = styled.div`
  display: none;
  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    background: #0f172a;
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
// 2. Desktop Wrapper Styles
// --------------------------------------------------------------------------

const DesktopOnlyWrapper = styled.div`
  display: block;
  width: 100%;
  height: 100%;
  position: relative;
  
  @media (max-width: 1024px) {
    display: none !important;
  }
`;

const NavContainer = styled.div`
  position: relative;
  z-index: 5000; 
`;

const MainContent = styled.main`
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
`;

// --------------------------------------------------------------------------
// 3. Main Logic
// --------------------------------------------------------------------------

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView, isLoading, setIsLoading } = useViewContext();

  const handleTabChange = (newTab: string) => {
    if (newTab === currentView) return;

    // 1. 내비게이션 즉시 잠금
    setIsLoading(true);
    
    // 2. 뷰 변경
    setCurrentView(newTab);

    // ✅ 3. 설정된 시간 가져오기 (없으면 기본값 사용)
    // newTab("AI 생산관리" 등)이 키값이 됩니다.
    const delayTime = LOADING_CONFIG[newTab] ?? DEFAULT_LOADING_TIME;

    // 4. 해당 시간만큼 대기 후 잠금 해제
    setTimeout(() => {
        setIsLoading(false);
    }, delayTime);
  };

  return (
    <>
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
          <strong>넓은 PC 화면</strong>에서 가장 완벽하게 경험하실 수 있습니다.
        </GuardDesc>
        <PcBadge>
          <MousePointer2 size={14} />
          Desktop Only Experience
        </PcBadge>
      </MobileGuardContainer>

      <DesktopOnlyWrapper>
        <NavContainer>
          <TopNavigation 
            activeTab={currentView} 
            onTabChange={handleTabChange} 
            isLoading={isLoading} 
          />
        </NavContainer>
        
        <MainContent>
            {children}
        </MainContent>
        
        <ChatbotWidget />
      </DesktopOnlyWrapper>
    </>
  );
}