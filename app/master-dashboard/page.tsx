"use client";

import React from 'react';
import styled, { keyframes } from 'styled-components';
import Link from 'next/link';
import { 
  FaDolly, FaEye, FaCogs, FaChartLine, FaHardHat, FaTruck, FaArrowRight 
} from 'react-icons/fa';

// --- Types ---
type CardData = {
  id: string;
  title: string;
  desc: string;
  icon: any;
  color: string;
  href: string;
};

const DASHBOARD_ITEMS: CardData[] = [
  { id: "01", title: "자재관리", desc: "입고 및 적재 효율화", icon: FaDolly, color: "#00C853", href: "/material/inbound-inspection" },
  { id: "02", title: "공정품질", desc: "AI 비전 기반 품질 판정", icon: FaEye, color: "#FF3B30", href: "/production/glass-gap-check" },
  { id: "03", title: "공정설비", desc: "설비 이상 징후 사전 탐지", icon: FaCogs, color: "#2979FF", href: "/production/line-monitoring" },
  { id: "04", title: "생산관리", desc: "공정 시간 및 병목 분석", icon: FaChartLine, color: "#00C853", href: "/production/takttime-dashboard" },
  { id: "05", title: "작업관리", desc: "Physical AI 환경 최적화", icon: FaHardHat, color: "#FF9100", href: "/production/pysical-ai" },
  { id: "06", title: "출하관리", desc: "실시간 물류 및 배송 추적", icon: FaTruck, color: "#6200EA", href: "/transport/warehouse-management" },
];

// --- Animations ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

const Container = styled.div`
  width: 100%;
  min-height: calc(100vh - 64px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 40px;
  font-family: -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif;
  position: relative;
  overflow: hidden;

  /* 배경 유지 */
  background-color: #111;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), 
      url('/images/gmt_back.png') no-repeat center center / cover;
    z-index: 0;
  }
`;

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  width: 100%;
  max-width: 1300px;
  position: relative;
  z-index: 1;

  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`;

const Card = styled.div<{ $color: string; $index: number }>`
  position: relative;
  height: 250px;
  
  /* [수정] 투명도 조절 (0.9 -> 0.8) 및 블러 강화 */
  background: rgba(255, 255, 255, 0.7); 
  backdrop-filter: blur(16px); /* 블러를 12px -> 16px로 높여 가독성 확보 */
  -webkit-backdrop-filter: blur(16px);
  
  border-radius: 24px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* 깔끔한 일반 테두리 */
  border: 1px solid rgba(255, 255, 255, 0.4); 
  
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  opacity: 0;
  animation: ${fadeInUp} 0.6s ease-out forwards;
  animation-delay: ${props => props.$index * 0.08}s;
  
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  /* 호버 효과 */
  &:hover {
    transform: translateY(-8px);
    
    /* 호버 시 테두리 색상이 브랜드 컬러로 변경 */
    border-color: ${props => props.$color};
    
    /* 호버 시 배경이 살짝 더 불투명해지며 또렷해짐 (0.8 -> 0.9) */
    background: rgba(255, 255, 255, 0.9);
    
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

const IconBox = styled.div<{ $color: string }>`
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: #f2f2f5; 
  color: ${props => props.$color};
  
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* Card 호버 시 아이콘 스타일 변경 */
  ${Card}:hover & {
    background: ${props => props.$color};
    color: #fff;
    transform: scale(1.1) rotate(-5deg);
    box-shadow: 0 8px 16px ${props => props.$color}40;
  }
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
`;

const Title = styled.h2`
  font-size: 21px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.01em;
`;

const Description = styled.p`
  font-size: 15px;
  color: #555;
  font-weight: 500;
  margin: 0;
  line-height: 1.5;
  word-break: keep-all;
`;

const CardFooter = styled.div`
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
`;

const ActionButton = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 700;
  
  /* 버튼 배경도 투명도에 맞춰 살짝 조정 */
  background: rgba(0, 0, 0, 0.05);
  color: #666;
  border: 1px solid transparent;
  
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;

  .arrow-icon {
    transition: transform 0.3s ease;
    opacity: 0.6;
  }

  /* Card 호버 시 버튼 스타일 변경 */
  ${Card}:hover & {
    background: ${props => props.$color};
    color: #fff;
    box-shadow: 0 4px 15px ${props => props.$color}50;
    transform: translateY(-2px);
    padding-right: 20px;
  }

  ${Card}:hover & .arrow-icon {
    transform: translateX(4px);
    opacity: 1;
  }
`;

// --- Component ---
export default function DashboardGrid() {
  return (
    <Container>
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
                  <span>View Dashboard</span>
                  <FaArrowRight size={12} className="arrow-icon" />
                </ActionButton>
              </CardFooter>
            </Card>
          </CardLink>
        ))}
      </GridWrapper>
    </Container>
  );
}