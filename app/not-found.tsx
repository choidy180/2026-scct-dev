"use client";

import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';

// -------------------------------------------------------------------------
// Styled Components
// -------------------------------------------------------------------------

// 배경에 은은한 그리드 패턴을 넣어 'AI/물류' 시스템 느낌을 줌
const Container = styled.div`
  width: 100vw;
  height: calc(100vh - 64px); /* 네비게이션 높이 제외 (필요 시 조정) */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
  background-size: 24px 24px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
`;

// 둥둥 떠있는 애니메이션
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

// 기존 테마와 통일된 Glassmorphism 카드
const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.02);
  border-radius: 24px;
  padding: 60px 80px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  max-width: 500px;
  animation: ${float} 6s ease-in-out infinite;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  background: #FFF0F3; /* 테마의 연한 붉은색 배경 */
  color: #D31145;      /* 테마의 메인 붉은색 */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  box-shadow: 0 10px 20px rgba(211, 17, 69, 0.15);
  margin-bottom: 8px;
`;

const ErrorCode = styled.h1`
  font-size: 64px;
  font-weight: 800;
  color: #333;
  margin: 0;
  line-height: 1;
  letter-spacing: -2px;
  
  span {
    color: #D31145; /* 404 중 0을 붉은색으로 포인트 */
  }
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const Description = styled.p`
  font-size: 15px;
  color: #666;
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const HomeButton = styled(Link)`
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #333;
  color: #fff;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #D31145; /* 마우스 올리면 브랜드 컬러로 변경 */
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(211, 17, 69, 0.3);
  }

  svg {
    transition: transform 0.2s;
  }

  &:hover svg {
    transform: translateX(-4px);
  }
`;

// -------------------------------------------------------------------------
// Page Component
// -------------------------------------------------------------------------

export default function NotFound() {
  return (
    <Container>
      <GlassCard>
        <IconWrapper>
          <FiAlertTriangle />
        </IconWrapper>
        
        <ErrorCode>
          4<span>0</span>4
        </ErrorCode>
        
        <Title>페이지를 찾을 수 없습니다.</Title>
        
        <Description>
          요청하신 페이지가 삭제되었거나,<br />
          잘못된 경로로 접근하셨습니다.
        </Description>

        <HomeButton href="/">
          <FiArrowLeft />
          메인 대시보드로 이동
        </HomeButton>
      </GlassCard>
    </Container>
  );
}