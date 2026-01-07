"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled, { css, createGlobalStyle, keyframes } from "styled-components";
import { formatDistanceToNow, subHours, subDays, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, Box as BoxIcon, Info, Layers, BarChart3, LayoutGrid } from "lucide-react";

// --- Global Styles ---
const GlobalStyle = createGlobalStyle`
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Pretendard', sans-serif;
    color: #1e293b;
    overflow: hidden; /* 스크롤 방지 */
    height: 100vh;
    width: 100vw;
    background-color: #f1f5f9;
  }
`;

// --- Types ---
type ProductStatus = "NEW" | "OLD" | "EMPTY";

interface RackItem {
  id: number;
  label: number;
  status: ProductStatus;
  entryDate?: Date;
  productId?: string;
}

interface SectionConfig {
  id: string;
  rows: number;
  cols: number;
  items: RackItem[];
}

// --- Mock Data ---
const generateMockData = (): SectionConfig[] => {
  const sections = [
    { id: "101", rows: 2, cols: 3 },
    { id: "102", rows: 2, cols: 4 },
    { id: "103", rows: 2, cols: 3 },
    { id: "105", rows: 4, cols: 3 },
    { id: "106", rows: 4, cols: 3 },
    { id: "107", rows: 4, cols: 4 },
    { id: "108", rows: 2, cols: 6 },
    { id: "109", rows: 2, cols: 6 },
    { id: "110", rows: 2, cols: 5 },
    { id: "111", rows: 2, cols: 6 },
    { id: "113", rows: 2, cols: 4 },
  ];

  return sections.map((sec) => {
    const totalItems = sec.rows * sec.cols;
    const items: RackItem[] = Array.from({ length: totalItems }, (_, i) => {
      const rand = Math.random();
      let status: ProductStatus = "EMPTY";
      let entryDate: Date | undefined = undefined;
      let productId: string | undefined = undefined;

      if (rand > 0.3) {
        const isOld = Math.random() > 0.5;
        status = isOld ? "OLD" : "NEW";
        entryDate = isOld
          ? subDays(new Date(), Math.floor(Math.random() * 5) + 1)
          : subHours(new Date(), Math.floor(Math.random() * 23));
        productId = `P-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      }
      return { id: i, label: i + 1, status, entryDate, productId };
    });
    return { ...sec, items };
  });
};

// --- Main Component ---
export default function WarehouseDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeBuilding, setActiveBuilding] = useState("D");
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<SectionConfig[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const blurAmount = "14px"; 

  // 현황판 데이터 계산
  const stats = useMemo(() => {
    let newCount = 0;
    let oldCount = 0;
    let emptyCount = 0;
    data.forEach(sec => {
      sec.items.forEach(item => {
        if (item.status === 'NEW') newCount++;
        else if (item.status === 'OLD') oldCount++;
        else emptyCount++;
      });
    });
    return { newCount, oldCount, emptyCount };
  }, [data]);

  useEffect(() => {
    const init = async () => {
      setData(generateMockData());
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5; 
        });
      }, 50);

      await new Promise((r) => setTimeout(r, 1500));
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setIsLoading(false), 500);
    };
    init();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBuildingClick = (b: string) => {
    if (b === "D") setActiveBuilding(b);
    else setShowModal(true);
  };

  // --- Loading Screen ---
  if (isLoading) {
    return (
      <LoadingContainer>
        <GlobalStyle />
        <LoadingContent>
          <LogoArea>
            <Layers size={64} color="#6366f1" className="bounce" />
          </LogoArea>
          <LoadingText>
            <h2>스마트 물류 시스템</h2>
            <p>시스템 초기화 및 데이터 동기화 중...</p>
          </LoadingText>
          <ProgressArea>
            <div className="bar-bg">
              <div className="bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="percent">{Math.floor(progress)}%</span>
          </ProgressArea>
        </LoadingContent>
      </LoadingContainer>
    );
  }

  // --- Dashboard UI ---
  return (
    <>
      <GlobalStyle />
      
      {/* Background */}
      <BackgroundLayer>
        {/* public/background.jpg 파일 필수 */}
        <div className="img" />
        <div className="backdrop" style={{ backdropFilter: `blur(${blurAmount})` }} />
      </BackgroundLayer>

      <Container>
        {/* 1. Header Area */}
        <Header>
          {/* Stats Board */}
          <StatsCard>
            <div className="title-area">
              <BarChart3 size={18} color="#475569" />
              <span>D동 현황</span>
            </div>
            <div className="stats-content">
              <div className="stat-group">
                <span className="dot new" />
                <span className="label">신규</span>
                <span className="val">{stats.newCount}</span>
              </div>
              <div className="stat-group">
                <span className="dot old" />
                <span className="label">장기</span>
                <span className="val">{stats.oldCount}</span>
              </div>
              <div className="stat-group">
                {/* [수정] 빈 슬롯 흰색으로 변경 */}
                <span className="dot empty" />
                <span className="label">빈슬롯</span>
                <span className="val">{stats.emptyCount}</span>
              </div>
            </div>
          </StatsCard>

          {/* Navigation */}
          <NavGroup>
            {["A", "B", "C", "D", "E", "F", "G", "H"].map((b) => (
              <NavButton
                key={b}
                $active={activeBuilding === b}
                onClick={() => handleBuildingClick(b)}
              >
                {b}동
              </NavButton>
            ))}
          </NavGroup>

          {/* Time */}
          <TimeCard>
            <Clock size={18} className="icon"/>
            <span className="time">{currentTime.toLocaleTimeString()}</span>
          </TimeCard>
        </Header>

        {/* 2. Main Content */}
        <MainContent>
          <GridSystem>
            {data.slice(0, 9).map((sec) => (
               <SectionWrapper key={sec.id}>
                 <Section config={sec} />
               </SectionWrapper>
            ))}

            {/* Last Row */}
            <SectionWrapper>
              {data[9] && <Section config={data[9]} />}
            </SectionWrapper>
            
            <div /> {/* Spacer */}

            <SectionWrapper>
              {data[10] && <Section config={data[10]} />}
            </SectionWrapper>
          </GridSystem>
        </MainContent>

        {/* Modal */}
        {showModal && (
          <ModalBackdrop onClick={() => setShowModal(false)}>
            <ModalCard onClick={(e) => e.stopPropagation()}>
              <div className="icon"><Info size={32} color="white" /></div>
              <h3>시스템 점검 중</h3>
              <p>해당 구역은 현재 데이터 연동 작업 중입니다.</p>
              <button onClick={() => setShowModal(false)}>확인</button>
            </ModalCard>
          </ModalBackdrop>
        )}
      </Container>
    </>
  );
}

// --- Section Component ---
const Section = ({ config }: { config: SectionConfig }) => {
  return (
    <GlassCard>
      <SectionTitle>{config.id} 구역</SectionTitle>
      <RackGrid $rows={config.rows} $cols={config.cols}>
        {config.items.map((item) => (
          <Cell key={item.id} $status={item.status}>
            <span className="num">{item.label}</span>
            <DetailPopup>
              <div className="top">
                <span className="id">Slot {item.label}</span>
                <span className={`badge ${item.status}`}>
                  {item.status === "NEW" ? "신규" : item.status === "OLD" ? "장기" : "빈 슬롯"}
                </span>
              </div>
              {item.status !== "EMPTY" ? (
                <div className="info">
                  <p><BoxIcon size={12}/> {item.productId}</p>
                  <p><Clock size={12}/> {item.entryDate && formatDistanceToNow(item.entryDate, { locale: ko })} 전</p>
                </div>
              ) : (
                <div className="info empty">
                  <p><LayoutGrid size={12}/> 사용 가능</p>
                  <p className="sub">입고 대기 중</p>
                </div>
              )}
            </DetailPopup>
          </Cell>
        ))}
      </RackGrid>
    </GlassCard>
  );
};

// --- Styles ---
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const glassStyle = css`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.08);
`;

/* Loading */
const LoadingContainer = styled.div`
  position: fixed; inset: 0; background: #fff; z-index: 9999;
  display: flex; justify-content: center; align-items: center;
`;
const LoadingContent = styled.div`
  display: flex; flex-direction: column; align-items: center; width: 340px;
`;
const LogoArea = styled.div`
  margin-bottom: 24px;
  .bounce { animation: ${bounce} 2s infinite ease-in-out; }
`;
const LoadingText = styled.div`
  text-align: center; margin-bottom: 32px;
  h2 { font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
  p { font-size: 0.95rem; color: #64748b; font-weight: 500; }
`;
const ProgressArea = styled.div`
  width: 100%; display: flex; flex-direction: column; gap: 8px;
  .bar-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 0.2s; }
  .percent { font-size: 0.85rem; font-weight: 700; color: #6366f1; align-self: flex-end; }
`;

/* Background */
const BackgroundLayer = styled.div`
  position: fixed; inset: 0; z-index: -1;
  .img {
    position: absolute; inset: 0;
    background-image: url('/background.jpg'); 
    background-size: cover; background-position: center;
  }
  .backdrop {
    position: absolute; inset: 0;
    background: rgba(255, 255, 255, 0.4);
  }
`;

/* Layout */
const Container = styled.div`
  position: relative; width: 100vw; height: 100vh;
  display: flex; flex-direction: column;
  padding: 16px 32px;
  gap: 16px;
`;

const Header = styled.header`
  position: relative;
  display: flex; justify-content: space-between; align-items: center;
  height: 56px; flex-shrink: 0;
`;

/* Stats Card */
const StatsCard = styled.div`
  ${glassStyle}
  padding: 0 20px; height: 100%;
  border-radius: 16px;
  display: flex; align-items: center; gap: 24px;
  min-width: 320px;

  .title-area {
    display: flex; align-items: center; gap: 8px;
    font-size: 1rem; font-weight: 800; color: #1e293b;
    padding-right: 20px;
    border-right: 1px solid rgba(0,0,0,0.1);
  }
  
  .stats-content { display: flex; align-items: center; gap: 20px; }
  .stat-group { display: flex; align-items: center; gap: 8px; }

  /* [수정] 빈슬롯: 흰색 점 + 회색 테두리 */
  .dot { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
  .dot.new { background: #10b981; }
  .dot.old { background: #f59e0b; }
  .dot.empty { background: #ffffff; border: 2px solid #cbd5e1; box-shadow: none; }
  
  .label { font-size: 0.9rem; font-weight: 600; color: #64748b; }
  .val { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
`;

/* Nav */
const NavGroup = styled.div`
  position: absolute; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  padding: 6px; border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.4);
`;

const NavButton = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(props) => (props.$active ? "#ffffff" : "transparent")};
  color: ${(props) => (props.$active ? "#4f46e5" : "#475569")};
  font-weight: ${(props) => (props.$active ? "800" : "600")};
  padding: 8px 18px; border-radius: 12px; font-size: 0.95rem;
  cursor: pointer; transition: all 0.2s;
  box-shadow: ${(props) => (props.$active ? "0 4px 10px rgba(0,0,0,0.08)" : "none")};

  &:hover { background: rgba(255,255,255,0.8); }
`;

/* Time */
const TimeCard = styled.div`
  ${glassStyle}
  height: 100%; padding: 0 24px; border-radius: 16px;
  display: flex; align-items: center; gap: 10px;
  font-weight: 700; color: #334155; font-size: 1.1rem;
  .icon { color: #6366f1; }
`;

/* Main Content */
const MainContent = styled.main`
  flex: 1; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  min-height: 0;
`;

const GridSystem = styled.div`
  display: grid;
  /* 3열 고정 (외부 박스 너비 통일) */
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  place-content: center;
  
  gap: 1.5vh 1.5vw;
  width: 100%; height: 100%;
  max-width: 1400px;
  max-height: calc(100vh - 100px); 
  
  animation: ${slideUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;

const SectionWrapper = styled.div`
  display: flex; justify-content: center; align-items: center;
  width: 100%; height: 100%;
`;

const GlassCard = styled.div`
  ${glassStyle}
  border-radius: 20px;
  padding: 16px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: transform 0.2s;
  
  /* [수정] 카드를 그리드 셀에 가득 채우기 (외부 박스 크기 통일) */
  width: 100%; height: 100%;
  
  &:hover { transform: translateY(-4px); }
`;

const SectionTitle = styled.div`
  font-size: 0.9rem; font-weight: 800; color: #1e293b;
  margin-bottom: 10px;
  background: rgba(255,255,255,0.8);
  padding: 4px 14px; border-radius: 20px;
  flex-shrink: 0;
`;

const RackGrid = styled.div<{ $rows: number; $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$cols}, auto);
  gap: 8px; /* 박스 사이 간격 */
  
  width: 100%;
  height: 100%;
  
  /* 그리드 전체를 카드 정중앙에 배치 */
  place-content: center;
  align-items: center;
`;

/* Cell */
const Cell = styled.div<{ $status: ProductStatus }>`
  /* [핵심] 크기 통일 및 정사각형 고정 */
  width: 4.5vh;   /* 화면 크기에 비례한 고정 크기 (약 40~50px) */
  height: 4.5vh;  /* width와 동일하게 설정하여 정사각형 유지 */
  
  border-radius: 6px; /* 둥근 모서리 약간 줄임 */
  display: flex; justify-content: center; align-items: center;
  position: relative; cursor: pointer; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  .num { 
    font-size: 0.9rem; /* 박스 크기에 맞춰 폰트 사이즈 조정 */
    font-weight: 700; z-index: 1; 
    text-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }

  /* 상태별 컬러 스타일 (기존 유지) */
  ${(props) => {
    switch (props.$status) {
      case "NEW":
        return css`
          background: linear-gradient(135deg, #34d399 0%, #059669 100%);
          border: 1px solid rgba(255,255,255,0.3); color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
          &:hover { transform: translateY(-2px) scale(1.1); z-index: 10; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
        `;
      case "OLD":
        return css`
          background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
          border: 1px solid rgba(255,255,255,0.3); color: white;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
          &:hover { transform: translateY(-2px) scale(1.1); z-index: 10; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); }
        `;
      case "EMPTY":
        return css`
          background: rgba(255,255,255,0.5);
          border: 1px solid #cbd5e1; color: #94a3b8;
          
          &:hover { 
            background: #fff; border-color: #64748b; transform: scale(1.1); z-index: 10;
            .num { opacity: 1; }
          }
        `;
    }
  }}
`;

const DetailPopup = styled.div`
  position: absolute; bottom: 125%; left: 50%; transform: translateX(-50%);
  width: 170px; background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(8px); padding: 12px; border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid white;
  opacity: 0; visibility: hidden; transition: all 0.2s; z-index: 100;
  pointer-events: none;

  ${Cell}:hover & { opacity: 1; visibility: visible; bottom: 135%; }

  .top { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .id { font-size: 0.85rem; font-weight: 800; color: #334155; }
  .badge { font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; 
    &.NEW { background: #ecfdf5; color: #059669; }
    &.OLD { background: #fffbeb; color: #d97706; }
    &.EMPTY { background: #f1f5f9; color: #64748b; }
  }
  .info p { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px; }
  .info.empty .sub { color: #94a3b8; font-weight: 500; margin-left: 18px; }
`;

/* Modal */
const ModalBackdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.2);
  backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 999;
`;
const ModalCard = styled.div`
  background: white; padding: 32px; border-radius: 24px; text-align: center; width: 300px;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2); font-family: 'Pretendard', sans-serif;
  .icon { width: 60px; height: 60px; background: #6366f1; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 16px; }
  h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; font-family: 'Pretendard', sans-serif; }
  p { font-size: 0.95rem; color: #64748b; margin-bottom: 24px; font-family: 'Pretendard', sans-serif;}
  button { width: 100%; padding: 12px; background: #1e293b; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; font-family: 'Pretendard', sans-serif;}
`;