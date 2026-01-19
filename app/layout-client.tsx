"use client";

import React, { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { Monitor, MousePointer2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import TopNavigation from "@/components/navigation/top-navigation";
import { useViewContext } from "./view-context";
import GmtLoadingScreen from "@/components/loading/gmt-loading";

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

const MainContent = styled.main<{ $isHidden: boolean }>`
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px);
  
  /* 로딩 중일 때 컨텐츠 투명 처리 */
  opacity: ${(props) => (props.$isHidden ? 0 : 1)};
  pointer-events: ${(props) => (props.$isHidden ? "none" : "auto")};
  transition: opacity 0.2s ease-in;
`;

// --------------------------------------------------------------------------
// 3. Main Component Logic
// --------------------------------------------------------------------------

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, setIsLoading } = useViewContext();
  
  // 경로 변경 감지용 Ref
  const prevPathRef = useRef(pathname);

  // [수정 1] 로딩 애니메이션을 건너뛸 경로인지 확인
  // master-dashboard가 포함된 모든 하위 경로에서도 로딩을 끄려면 includes 사용
  // 정확히 해당 페이지만 끄려면 pathname === '/master-dashboard' 사용
  const isSkipLoading = pathname?.includes("master-dashboard");

  // [수정 2] useLayoutEffect에서 예외 처리 적용
  useLayoutEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;

      // master-dashboard 경로가 아닐 때만 로딩 시작
      if (!isSkipLoading) {
        setIsLoading(true);
      } else {
        // 혹시 모를 상태 꼬임 방지를 위해 예외 경로에서는 확실하게 끔
        setIsLoading(false);
      }
    }
  }, [pathname, setIsLoading, isSkipLoading]);

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
          {/* [수정 3] isSkipLoading일 경우 렌더링 자체를 막음 */}
          {isLoading && !isSkipLoading && (
            <motion.div
              key="global-loader"
              style={{ 
                position: "fixed", 
                top: 0, 
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 4999, 
                background: "#ffffff" 
              }}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <div style={{ paddingTop: "64px", height: "100%" }}>
                <GmtLoadingScreen onComplete={() => setIsLoading(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <NavContainer>
          <TopNavigation isLoading={isLoading && !isSkipLoading} />
        </NavContainer>
        {/* 로딩 중일 때 내용 숨김 ($isHidden) - 예외 경로면 숨기지 않음 */}
        <MainContent $isHidden={isLoading && !isSkipLoading}>
            {children}
        </MainContent>
        
      </DesktopOnlyWrapper>
    </>
  );
}