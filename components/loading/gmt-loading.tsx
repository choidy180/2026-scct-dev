'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image'; // [최적화] Next.js Image 컴포넌트 도입

// --- Props ---
interface GmtLoadingScreenProps {
  onComplete?: () => void;
}

// --- Assets ---
const LOGO_URL = '/logo/gmt_logo.png'; 

// --- Keyframes ---
const pulseGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3); }
  70% { box-shadow: 0 0 0 50px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// --- Styled Components ---

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%; 
  height: calc(100vh - 64px); 
  margin-top: 64px; 

  background-color: #ffffff;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  position: relative;
  overflow: hidden;
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  z-index: 50; 
`;

const EcoBackground = styled(motion.div)`
  position: absolute;
  width: 900px;
  height: 900px;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.06) 0%, rgba(255, 255, 255, 0) 60%);
  border-radius: 50%;
  z-index: 1;
  pointer-events: none;
  will-change: transform, opacity; /* [최적화] GPU 가속 힌트 */
`;

const ContentWrapper = styled.div`
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transform: translateY(-20px); 
`;

const LogoCircle = styled(motion.div)`
  width: 220px;
  height: 220px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.05), 
    0 1px 0 rgba(255, 255, 255, 1) inset; 
  position: relative;
  backdrop-filter: blur(5px);
  will-change: transform, opacity; /* [최적화] */
  
  /* Green Pulse Aura */
  &::before {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 50%;
    border: 2px solid rgba(16, 185, 129, 0.15); 
    animation: ${pulseGreen} 3s infinite cubic-bezier(0.4, 0, 0.6, 1);
  }

  /* Red Tech Ring */
  &::after {
    content: '';
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    border: 1.5px solid transparent;
    border-top-color: #ef4444; 
    border-bottom-color: #ef4444;
    opacity: 0.3;
    animation: ${spin} 15s linear infinite;
    will-change: transform; /* [최적화] */
  }
`;

// [최적화] Next.js Image를 감싸는 스타일드 컴포넌트
const ImageWrapper = styled(motion.div)`
  position: relative;
  width: 160px;
  height: 160px; // 높이 명시 (layout shifting 방지)
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
`;

const TitleGroup = styled(motion.div)`
  margin-top: 50px;
  margin-bottom: 45px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  will-change: transform, opacity;
`;

const MainTitle = styled.h1`
  font-size: 38px;
  font-weight: 800; 
  margin: 0;
  line-height: 1;
  color: #0f172a; 
  letter-spacing: -0.03em;
  text-shadow: 0 4px 10px rgba(0,0,0,0.05);

  &::after {
    content: '.';
    color: #ef4444;
    position: relative;
    top: -2px;
    margin-left: 2px;
  }
`;

const SubTitleBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background-color: #f1f5f9; 
  border: 1px solid #e2e8f0; 
  border-radius: 20px; 
  font-size: 13px;
  font-weight: 700;
  color: #475569; 
  letter-spacing: 0.15em;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03); 
`;

const ProgressTrack = styled.div`
  width: 380px;
  height: 8px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
`;

const ProgressBar = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #34d399, #059669); 
  border-radius: 10px;
  position: relative;
  will-change: width; /* [최적화] */

  &::after {
    content: '';
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 12px;
    background: #ef4444; 
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);
    border-radius: 0 10px 10px 0;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
    animation: ${shimmer} 1.5s infinite;
  }
`;

const StatusText = styled(motion.div)`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  span.percent {
    font-size: 26px;
    font-weight: 800;
    color: #059669; 
    font-variant-numeric: tabular-nums;
  }

  span.detail {
    font-size: 15px;
    font-weight: 600;
    color: #64748b; 
    min-height: 20px; // 높이 고정으로 텍스트 변경 시 레이아웃 흔들림 방지
  }
`;

// --- Main Component ---
const GmtLoadingScreen = ({ onComplete }: GmtLoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("시스템 초기화 중...");

  useEffect(() => {
    // [최적화] 3000 -> 2000 (2초)로 단축
    const DURATION = 2000; 
    const startTime = Date.now();
    
    const messages = [
      { p: 10, msg: "AI 생산 공정 분석 중..." },
      { p: 40, msg: "실시간 데이터 동기화..." },
      { p: 75, msg: "보안 프로토콜 점검..." },
      { p: 95, msg: "GMT 스마트 팩토리 접속 완료." },
    ];

    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const rawProgress = Math.min((elapsed / DURATION) * 100, 100);

      setProgress(rawProgress);

      const currentMsg = messages.findLast(m => rawProgress >= m.p);
      if (currentMsg) {
        setStatusMessage(currentMsg.msg);
      }

      if (elapsed < DURATION) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        if (onComplete) {
            // 완료 후 딜레이도 살짝 줄여서(400ms) 빠른 전환 유도
            setTimeout(() => onComplete(), 400);
        }
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [onComplete]);

  return (
    <Container>
      <EcoBackground 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <ContentWrapper>
        {/* 1. Logo */}
        <LogoCircle
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
            transition: {
              scale: { duration: 0.8, type: 'spring', bounce: 0.4 },
              opacity: { duration: 0.5 },
              y: { duration: 0.6, ease: "easeOut" }
            }
          }}
        >
          <ImageWrapper
            animate={{ scale: [1, 1.05, 1] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* [최적화] Next/Image 사용 + priority 적용 */}
            <Image 
              src={LOGO_URL} 
              alt="GMT Logo" 
              width={160}
              height={160}
              priority
              style={{ objectFit: 'contain' }}
            />
          </ImageWrapper>
        </LogoCircle>

        {/* 2. Title Group */}
        <TitleGroup
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <MainTitle>
            고모텍 AI 관제센터
          </MainTitle>
          <SubTitleBadge>
            Intelligent Manufacturing System
          </SubTitleBadge>
        </TitleGroup>

        {/* 3. Progress Bar */}
        <ProgressTrack>
          <ProgressBar style={{ width: `${progress}%` }} />
        </ProgressTrack>

        {/* 4. Status Text */}
        <StatusText>
          <motion.span className="percent">
            {Math.floor(progress)}%
          </motion.span>
          <AnimatePresence mode="wait">
            <motion.span 
              className="detail"
              key={statusMessage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }} // 텍스트 전환 속도도 빠르게 (0.3 -> 0.2)
            >
              {statusMessage}
            </motion.span>
          </AnimatePresence>
        </StatusText>
      </ContentWrapper>
    </Container>
  );
};

export default GmtLoadingScreen;