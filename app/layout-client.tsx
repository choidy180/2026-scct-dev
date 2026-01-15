"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { Monitor, MousePointer2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import TopNavigation from "@/components/navigation/top-navigation";
import { useViewContext } from "./view-context";
import GmtLoadingScreen from "@/components/loading/gmt-loading";
// import ChatbotWidget from "@/components/chatbot-widget"; 

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
  /* TopNavigation이 로딩화면 위에 보여야 하므로 가장 높은 z-index 부여 */
  z-index: 5000; 
`;

const MainContent = styled.main`
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
`;

// --------------------------------------------------------------------------
// 3. Main Component Logic
// --------------------------------------------------------------------------

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, setIsLoading } = useViewContext();

  useEffect(() => {
    setIsLoading(true);
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
        
        {/* ✅ 로딩 스크린 오버레이 */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="global-loader"
              style={{ 
                position: "fixed", 
                // [수정] top을 0으로 해서 전체 배경을 흰색으로 채움 (어두운 부분 제거)
                top: 0, 
                left: 0,
                right: 0,
                bottom: 0,
                // [중요] Nav(5000)보다 한 단계 낮게 설정 -> Nav가 로딩화면 위에 뜸
                zIndex: 4999, 
                background: "#ffffff" 
              }}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {/* padding-top으로 컨텐츠만 살짝 내려주면 Nav에 가려지지 않음 */}
              <div style={{ paddingTop: "64px", height: "100%" }}>
                <GmtLoadingScreen onComplete={() => setIsLoading(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <NavContainer>
          <TopNavigation isLoading={isLoading} />
        </NavContainer>
        
        <MainContent>
            {children}
        </MainContent>
        
        {/* <ChatbotWidget /> */}
      </DesktopOnlyWrapper>
    </>
  );
}