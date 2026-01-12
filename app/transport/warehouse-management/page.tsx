"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styled, { css, createGlobalStyle, keyframes } from "styled-components";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, Box as BoxIcon, Info, Layers, LayoutGrid, CheckCircle2, Truck } from "lucide-react";

// --- Global Styles ---
const GlobalStyle = createGlobalStyle`
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Pretendard', sans-serif;
    color: #334155;
    overflow: hidden; /* 전체 스크롤 방지 */
    height: 100vh; 
    width: 100vw;
    background-color: #f8fafc;
  }
`;

// --- Types ---
type ProductStatus = "NEW" | "OLD" | "EMPTY";

interface RackItem {
  id: number;
  label: number;
  status: ProductStatus;
  entryDate?: Date;
  vehicleId?: string; 
  workState?: string; 
  labelId?: string;   
}

interface SectionConfig {
  id: string;
  rows: number;
  cols: number;
  items: RackItem[];
}

interface TooltipData {
  item: RackItem;
  rect: DOMRect;
}

// --- Grid Calculation Logic (수정됨) ---
// 요청사항: 내부 박스 크기 통일
// 데이터 양과 관계없이 항상 4x4 (16칸) 그리드를 기본으로 사용하여 셀 크기를 고정합니다.
const calculateGrid = (total: number) => {
  const cols = 4; // 가로 4칸 고정
  // 최소 4줄 보장 (데이터가 많으면 늘어남)
  const rows = Math.max(4, Math.ceil(total / cols)); 
  return { rows, cols };
};

// --- Main Component ---
export default function WarehouseDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeBuilding, setActiveBuilding] = useState("D");
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<SectionConfig[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [hoveredData, setHoveredData] = useState<TooltipData | null>(null);

  const stats = useMemo(() => {
    let newCount = 0, oldCount = 0, emptyCount = 0;
    data.forEach(sec => {
      sec.items.forEach(item => {
        if (item.status === 'NEW') newCount++;
        else if (item.status === 'OLD') oldCount++;
        else emptyCount++;
      });
    });
    return { newCount, oldCount, emptyCount };
  }, [data]);

  const mapApiToSections = useCallback((apiResponse: any): SectionConfig[] => {
    if (!apiResponse || typeof apiResponse !== 'object') return [];

    return Object.entries(apiResponse).map(([key, sectionData]: [string, any]) => {
      const total = sectionData.total || 0;
      const slotsDetail = sectionData.slots_detail || [];
      const { rows, cols } = calculateGrid(total);

      const items: RackItem[] = slotsDetail.map((slot: any) => {
        let status: ProductStatus = "EMPTY";
        const isOccupied = slot.occupied; 
        
        if (isOccupied) {
          if (slot.entry_time) {
            const entryTime = new Date(slot.entry_time);
            const now = new Date();
            const hoursDiff = differenceInHours(now, entryTime);
            status = hoursDiff < 24 ? "NEW" : "OLD";
          } else {
            status = "NEW"; 
          }
        }

        return {
          id: slot.slot_id,
          label: slot.slot_id,
          status: status,
          vehicleId: slot.vehicle_id || "-",
          entryDate: slot.entry_time ? new Date(slot.entry_time) : undefined,
          workState: slot.nmwrkstate || "-",
          labelId: slot.label001
        };
      });

      // 빈 슬롯 채우기 (Grid 모양 및 셀 크기 유지를 위해 필수)
      while (items.length < rows * cols) {
        items.push({ id: items.length + 1, label: items.length + 1, status: "EMPTY" });
      }

      return { id: key, rows, cols, items };
    });
  }, []);

  const fetchData = async () => {
    try {
      const API_URL = "http://1.254.24.170:24828/api/DX_API000014"; 
      const response = await fetch(API_URL);
      if (response.ok) {
        const result = await response.json();
        const parsedData = mapApiToSections(result);
        parsedData.sort((a, b) => Number(a.id) - Number(b.id));
        setData(parsedData);
      } else {
        console.warn("API Fail");
      }
    } catch (e) {
      console.error("API Error", e);
    }
  };

  useEffect(() => {
    setCurrentTime(new Date());
    const init = async () => {
      const interval = setInterval(() => setProgress(p => p < 90 ? p + 5 : p), 50);
      await fetchData();
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setIsLoading(false), 500);
    };
    init();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [mapApiToSections]);

  const handleCellEnter = (e: React.MouseEvent, item: RackItem) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredData({ item, rect });
  };

  if (isLoading) return <LoadingScreen progress={progress} />;

  return (
    <>
      <GlobalStyle />
      <Container>
        <Sidebar>
          <BrandLogo>
            <div className="icon"><LayoutGrid size={20} color="white" /></div>
            <span>WMS 비전</span>
          </BrandLogo>
          
          <NavGroup>
            {/* 한글화: BUILDINGS -> 물류 센터 */}
            <span className="label">물류 센터</span>
            {["A", "B", "C", "D", "E", "F", "G", "H"].map((b) => (
              <NavButton key={b} $active={activeBuilding === b} onClick={() => b !== "D" && setShowModal(true)}>
                {activeBuilding === b && <div className="dot" />}
                {b}동 창고
              </NavButton>
            ))}
          </NavGroup>

          <TimeWidget>
             <Clock size={16} className="icon"/>
             <span>{currentTime ? currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--"}</span>
          </TimeWidget>
        </Sidebar>

        <MainArea>
          <Header>
            <PageTitle>
              <h1>D동 실시간 적재 현황</h1>
              {/* 한글화: Subtitle */}
              <span className="subtitle">실시간 재고 통합 관제 시스템</span>
            </PageTitle>
            
            <StatsGroup>
              <StatCard $color="#84cc16">
                <div className="label">신규 입고 (24h)</div>
                <div className="value">{stats.newCount}</div>
                <div className="icon-bg"><CheckCircle2 /></div>
              </StatCard>
              <StatCard $color="#10b981">
                <div className="label">장기 보관</div>
                <div className="value">{stats.oldCount}</div>
                <div className="icon-bg"><BoxIcon /></div>
              </StatCard>
              <StatCard $color="#cbd5e1">
                <div className="label">빈 슬롯</div>
                <div className="value">{stats.emptyCount}</div>
                <div className="icon-bg"><Layers /></div>
              </StatCard>
            </StatsGroup>
          </Header>

          <FullGridContainer>
            <GridSystem>
              {data.length > 0 ? data.map((sec) => (
                <SectionWrapper key={sec.id}>
                  <Section 
                    config={sec} 
                    onCellEnter={handleCellEnter} 
                    onCellLeave={() => setHoveredData(null)} 
                  />
                </SectionWrapper>
              )) : (
                <div style={{ gridColumn: "1/-1", display:"flex", justifyContent:"center", alignItems:"center", color:"#94a3b8" }}>
                  데이터 수신 대기 중...
                </div>
              )}
            </GridSystem>
          </FullGridContainer>
        </MainArea>

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

        {hoveredData && <GlobalTooltip data={hoveredData} />}

      </Container>
    </>
  );
}

// --- Global Tooltip (한글화) ---
const GlobalTooltip = ({ data }: { data: TooltipData }) => {
  const { item, rect } = data;
  const isTopHalf = rect.top < window.innerHeight / 2;
  
  const style = {
    left: rect.left + rect.width / 2,
    top: isTopHalf ? rect.bottom + 12 : rect.top - 12,
    transform: isTopHalf ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
  };

  return (
    <FixedTooltipContainer style={style}>
      <div className="top">
        {/* 한글화: Slot -> 위치 */}
        <span className="id">위치 {item.label}</span>
        <span className={`badge ${item.status}`}>
          {/* 한글화: 상태값 */}
          {item.status === 'NEW' ? '신규' : item.status === 'OLD' ? '장기' : '공석'}
        </span>
      </div>
      {item.status !== "EMPTY" ? (
        <div className="info">
          <p><Truck size={12} /> {item.vehicleId}</p>
          <p><BoxIcon size={12} /> {item.labelId || '-'}</p>
          <p><Clock size={12} /> {item.entryDate && formatDistanceToNow(item.entryDate, { locale: ko })} 전 입고</p>
        </div>
      ) : <div className="info empty"><p>입고 가능</p></div>}
    </FixedTooltipContainer>
  );
};

// --- Sub Components ---
const Section = ({ config, onCellEnter, onCellLeave }: { config: SectionConfig, onCellEnter: any, onCellLeave: any }) => (
  <CleanCard>
    <div className="header">
      {/* 한글화: ZONE -> 구역 */}
      <span className="title">{config.id} 구역</span>
      <span className="count">{config.items.filter(i => i.status !== 'EMPTY').length} / {config.items.length}</span>
    </div>
    <RackGridWrapper>
      <RackGrid $rows={config.rows} $cols={config.cols}>
        {config.items.map((item) => (
          <Cell 
            key={item.id} 
            $status={item.status}
            onMouseEnter={(e) => onCellEnter(e, item)}
            onMouseLeave={onCellLeave}
          >
            {item.status !== 'EMPTY' && <div className="indicator" />}
            <span className="num">{item.label}</span>
          </Cell>
        ))}
      </RackGrid>
    </RackGridWrapper>
  </CleanCard>
);

const LoadingScreen = ({ progress }: { progress: number }) => (
  <LoadingContainer>
    <GlobalStyle />
    <LoadingContent>
      <LogoArea><Layers size={64} color="#84cc16" className="bounce" /></LogoArea>
      {/* 한글화: 로딩 텍스트 */}
      <LoadingText><h2>WMS 비전</h2><p>시스템 데이터를 불러오는 중...</p></LoadingText>
      <ProgressArea><div className="bar-bg"><div className="bar-fill" style={{ width: `${progress}%` }} /></div></ProgressArea>
    </LoadingContent>
  </LoadingContainer>
);

// --- Styled Components (기존 유지) ---

const bounce = keyframes` 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } `;
const fadeIn = keyframes` from { opacity: 0; } to { opacity: 1; } `;

const Container = styled.div` 
  display: flex; width: 100vw; height: calc(100vh - 64px); background: #f8fafc;
  overflow: hidden; 
`;

const Sidebar = styled.aside`
  width: 260px; height: 100%; background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex; flex-direction: column; padding: 24px;
  flex-shrink: 0; z-index: 10;
`;

const BrandLogo = styled.div`
  display: flex; align-items: center; gap: 12px; margin-bottom: 40px;
  .icon { width: 32px; height: 32px; background: #0f172a; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  span { font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
`;

const NavGroup = styled.nav`
  display: flex; flex-direction: column; gap: 8px; flex: 1;
  .label { font-size: 18px; font-weight: 700; color: #4a4d50; margin-bottom: 8px; letter-spacing: 1px; }
`;

const NavButton = styled.button<{ $active: boolean }>`
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 12px 16px; border-radius: 12px; border: none;
  background: ${props => props.$active ? '#0f172a' : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#64748b'};
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer; transition: all 0.2s;
  &:hover { background: ${props => props.$active ? '#0f172a' : '#f1f5f9'}; }
  .dot { width: 6px; height: 6px; background: #84cc16; border-radius: 50%; }
`;

const TimeWidget = styled.div`
  background: #f1f5f9; padding: 16px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  color: #334155; font-weight: 700; font-size: 14px;
  .icon { color: #64748b; }
`;

const MainArea = styled.main`
  flex: 1; display: flex; flex-direction: column; padding: 24px; gap: 20px; 
  height: calc(100vh - 64px); overflow: hidden; 
`;

const Header = styled.header`
  display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0;
  height: 80px; 
`;

const PageTitle = styled.div`
  h1 { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -1px; }
  .subtitle { font-size: 13px; color: #64748b; font-weight: 500; }
`;

const StatsGroup = styled.div`
  display: flex; gap: 16px;
`;

const StatCard = styled.div<{ $color: string }>`
  background: white; width: 160px; padding: 16px; border-radius: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  position: relative; overflow: hidden;
  
  .label { font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
  .value { font-size: 22px; font-weight: 800; color: #0f172a; }
  .icon-bg { 
    position: absolute; right: -8px; bottom: -8px; 
    color: ${props => props.$color}; opacity: 0.15; 
    transform: scale(2.2); 
  }
  &::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    background: ${props => props.$color};
  }
`;

const FullGridContainer = styled.div`
  flex: 1; /* 남은 높이(약 80vh)를 모두 차지 */
  min-height: 0; 
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 스크롤 절대 금지 */
  padding-bottom: 20px; /* 하단 여백 살짝 */
`;

const GridSystem = styled.div` 
  flex: 1;
  display: grid; 
  /* 가로 5칸 고정 */
  grid-template-columns: repeat(5, 1fr);
  /* 세로 3칸 고정 (화면 높이를 3등분하여 100% 사용) */
  grid-template-rows: repeat(3, minmax(0, 1fr)); 
  gap: 12px; 
  height: 100%; /* 부모 높이 꽉 채움 */
  animation: ${fadeIn} 0.5s ease-out; 
`;

const SectionWrapper = styled.div` 
  width: 100%; 
  height: 100%; /* 할당된 그리드 칸(1/15)을 꽉 채움 */
  min-height: 0;
`;

const CleanCard = styled.div`
  background: #ffffff; 
  border-radius: 12px; 
  padding: 10px; /* 공간 확보를 위해 패딩 약간 축소 */
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  height: 100%; /* 부모 높이 100% */
  display: flex;
  flex-direction: column;
  
  .header {
    flex-shrink: 0; 
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    .title { font-size: 14px; font-weight: 700; color: #334155; }
    .count { font-size: 11px; font-weight: 600; color: #94a3b8; background: #f1f5f9; padding: 2px 6px; border-radius: 99px; }
  }
`;

const RackGridWrapper = styled.div`
  flex: 1; /* 남은 높이 모두 차지 */
  width: 100%;
  min-height: 0;
  /* aspect-ratio 제거: 화면 꽉 채우기가 우선이므로 비율 고정 대신 flex로 채움 */
`;

const RackGrid = styled.div<{ $rows: number; $cols: number }>`
  width: 100%;
  height: 100%; /* 부모 영역 100% 채움 */
  display: grid;
  /* 내부 4x4 박스도 균일하게 공간 분배 */
  grid-template-columns: repeat(4, 1fr); 
  grid-template-rows: repeat(4, 1fr);
  gap: 4px; /* 간격 미세 조정 */
`;

const Cell = styled.div<{ $status: ProductStatus }>`
  width: 100%; 
  height: 100%; /* 셀 크기 꽉 채움 */
  border-radius: 4px; 
  display: flex; justify-content: center; align-items: center; 
  position: relative; cursor: pointer; transition: all 0.2s;
  
  .num { font-size: 12px; font-weight: 600; z-index: 1; opacity: 1; color: #5b5a5a }
  .indicator { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.9); position: absolute; top: 3px; right: 3px; }

  ${(props) => {
    switch (props.$status) {
      case "NEW": return css` background: #84cc16; color: white; &:hover { background: #65a30d; } `;
      case "OLD": return css` background: #10b981; color: white; &:hover { background: #059669; } `;
      case "EMPTY": return css` background: #f8fafc; border: 1px solid #e2e8f0; color: #cbd5e1; &:hover { background: #f1f5f9; border-color: #94a3b8; } `;
    }
  }}
`;

const FixedTooltipContainer = styled.div`
  position: fixed; z-index: 99999; width: 180px; background: #ffffff; padding: 12px; 
  border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; pointer-events: none;
  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; } 
  .id { font-size: 13px; font-weight: 700; color: #0f172a; } 
  .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; 
    &.NEW { background: #ecfccb; color: #4d7c0f; } 
    &.OLD { background: #d1fae5; color: #047857; } 
    &.EMPTY { background: #f1f5f9; color: #64748b; } 
  }
  .info { display: flex; flex-direction: column; gap: 4px; }
  .info p { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #64748b; font-weight: 500; } 
  .info.empty p { color: #94a3b8; } 
`;

const LoadingContainer = styled.div` position: fixed; inset: 0; background: #ffffff; z-index: 9999; display: flex; justify-content: center; align-items: center; `;
const LoadingContent = styled.div` display: flex; flex-direction: column; align-items: center; width: 300px; `;
const LogoArea = styled.div` margin-bottom: 24px; .bounce { animation: ${bounce} 2s infinite ease-in-out; } `;
const LoadingText = styled.div` text-align: center; margin-bottom: 32px; h2 { font-size: 20px; font-weight: 800; color: #0f172a; } p { font-size: 13px; color: #64748b; } `;
const ProgressArea = styled.div` width: 100%; .bar-bg { width: 100%; height: 4px; background: #f1f5f9; border-radius: 99px; overflow: hidden; } .bar-fill { height: 100%; background: #84cc16; transition: width 0.2s; } `;
const ModalBackdrop = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); display: flex; justify-content: center; align-items: center; z-index: 999; `;
const ModalCard = styled.div` background: white; padding: 32px; border-radius: 20px; text-align: center; width: 320px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); h3 { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px; } p { font-size: 14px; color: #64748b; margin-bottom: 24px; } button { width: 100%; padding: 14px; background: #0f172a; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; } .icon { width: 56px; height: 56px; background: #0f172a; border-radius: 16px; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px; }`;