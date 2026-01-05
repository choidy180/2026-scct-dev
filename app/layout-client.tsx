"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { Monitor, MousePointer2 } from "lucide-react";
import TopNavigation from "@/components/navigation/top-navigation";
import ChatbotWidget from "@/components/chatbot-widget";
import { useViewContext } from "./view-context"; // 경로 확인 필요

// --------------------------------------------------------------------------
// ✅ 0. 로딩 시간 설정 (각 메뉴별 딜레이)
// --------------------------------------------------------------------------

const DEFAULT_LOADING_TIME = 500; // 기본 0.5초

// 메뉴명은 TopNavigation의 메뉴명이나 URL path 기준과 매칭됨
const LOADING_CONFIG: Record<string, number> = {
  "AI 생산관리": 1000, // 데이터 로드 시뮬레이션: 1초
  "AI 운송관리": 400,  // 가벼움: 0.4초
  "AI 자재관리": 700,  // 중간: 0.7초
};

// --------------------------------------------------------------------------
// 1. Mobile Blocker Styles (모바일 차단 화면 스타일)
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
// 2. Desktop Wrapper Styles (PC 화면 스타일)
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
  min-height: calc(100vh - 64px); /* 네비게이션 높이 제외 */
`;

// --------------------------------------------------------------------------
// 3. Main Component Logic
// --------------------------------------------------------------------------

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  // ✅ 1. URL 감지 (Next.js Navigation)
  const pathname = usePathname();
  
  // ✅ 2. Context 사용 (Provider 내부여야 함)
  const { isLoading, setIsLoading } = useViewContext();

  // URL 경로를 메뉴 이름으로 변환하는 헬퍼 함수
  const getMenuNameFromPath = (path: string) => {
    if (path.startsWith("/production")) return "AI 생산관리";
    if (path.startsWith("/transport")) return "AI 운송관리";
    if (path.startsWith("/material")) return "AI 자재관리";
    return "";
  };

  // ✅ 3. URL이 변경될 때마다 로딩 효과 실행 (리프레시 없는 SPA 효과)
  useEffect(() => {
    const currentMenu = getMenuNameFromPath(pathname);
    
    // 로딩 시작
    setIsLoading(true);

    // 메뉴별 설정된 시간만큼 대기
    const delayTime = LOADING_CONFIG[currentMenu] ?? DEFAULT_LOADING_TIME;

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delayTime);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => clearTimeout(timer);
  }, [pathname, setIsLoading]);

  return (
    <>
      {/* 1. 모바일 접속 시 차단 화면 */}
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

      {/* 2. PC 접속 시 메인 화면 */}
      <DesktopOnlyWrapper>
        <NavContainer>
          {/* TopNavigation은 내부적으로 URL을 감지하여 탭을 표시합니다.
              isLoading만 전달하여 로딩 중 클릭을 방지합니다. */}
          <TopNavigation isLoading={isLoading} />
        </NavContainer>
        
        <MainContent>
            {children}
        </MainContent>
        
        <ChatbotWidget />
      </DesktopOnlyWrapper>
    </>
  );
}