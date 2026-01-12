"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styled, { css, createGlobalStyle, keyframes } from "styled-components";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, Box as BoxIcon, Info, Layers, BarChart3, Truck } from "lucide-react";

// --- Global Styles ---
const GlobalStyle = createGlobalStyle`
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Pretendard', sans-serif;
    color: #1e293b;
    overflow: hidden; /* 스크롤 방지 */
    height: 100vh; width: 100vw;
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
  rect: DOMRect; // 박스의 화면상 위치 정보
}

// --- Grid Calculation Logic ---
const calculateGrid = (total: number) => {
  if (total <= 6) return { rows: 2, cols: 3 }; 
  if (total <= 8) return { rows: 2, cols: 4 }; 
  if (total <= 10) return { rows: 2, cols: 5 }; 
  if (total <= 12) return { rows: 2, cols: 6 }; 
  if (total <= 16) return { rows: 4, cols: 4 }; 
  
  const cols = 4;
  const rows = Math.ceil(total / cols);
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
  
  // [NEW] 글로벌 툴팁 상태 관리 (박스 내부가 아닌, 전체 화면 레벨에서 관리)
  const [hoveredData, setHoveredData] = useState<TooltipData | null>(null);

  const blurAmount = "14px"; 

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

      while (items.length < total) {
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

  const handleBuildingClick = (b: string) => {
    if (b === "D") setActiveBuilding(b);
    else setShowModal(true);
  };

  // [NEW] 마우스 핸들러: 박스의 좌표값을 캡쳐함
  const handleCellEnter = (e: React.MouseEvent, item: RackItem) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredData({ item, rect });
  };

  const handleCellLeave = () => {
    setHoveredData(null);
  };

  if (isLoading) return <LoadingScreen progress={progress} />;

  return (
    <>
      <GlobalStyle />
      <BackgroundLayer><div className="img" /><div className="backdrop" style={{ backdropFilter: `blur(${blurAmount})` }} /></BackgroundLayer>
      
      <Container>
        <Header>
          <StatsCard>
            <div className="title-area"><BarChart3 size={18} /><span>D동 현황</span></div>
            <div className="stats-content">
              <StatItem color="#10b981" label="신규" value={stats.newCount} />
              <StatItem color="#f59e0b" label="장기" value={stats.oldCount} />
              <StatItem color="#cbd5e1" label="빈슬롯" value={stats.emptyCount} isEmpty />
            </div>
          </StatsCard>
          <NavGroup>
            {["A", "B", "C", "D", "E", "F", "G", "H"].map((b) => (
              <NavButton key={b} $active={activeBuilding === b} onClick={() => handleBuildingClick(b)}>{b}동</NavButton>
            ))}
          </NavGroup>
          <TimeCard>
            <Clock size={18} className="icon"/>
            <span className="time">{currentTime ? currentTime.toLocaleTimeString() : "Loading..."}</span>
          </TimeCard>
        </Header>

        <MainContent>
          <GridSystem>
            {data.length > 0 ? data.map((sec) => (
              <SectionWrapper key={sec.id}>
                <Section 
                  config={sec} 
                  onCellEnter={handleCellEnter} 
                  onCellLeave={handleCellLeave} 
                />
              </SectionWrapper>
            )) : (
              <div style={{ gridColumn: "1/-1", display:"flex", justifyContent:"center", alignItems:"center", color:"#64748b", fontWeight:600 }}>
                데이터 수신 대기 중...
              </div>
            )}
          </GridSystem>
        </MainContent>

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

        {/* [NEW] 글로벌 툴팁 컴포넌트 (모든 레이어 최상단에 위치) */}
        {hoveredData && <GlobalTooltip data={hoveredData} />}

      </Container>
    </>
  );
}

// --- Global Tooltip Component ---
const GlobalTooltip = ({ data }: { data: TooltipData }) => {
  const { item, rect } = data;
  
  // 화면 중앙 기준으로 위/아래 결정
  const isTopHalf = rect.top < window.innerHeight / 2;
  
  // 위치 계산 (CSS in JS로 전달)
  const style = {
    left: rect.left + rect.width / 2, // 박스 중앙
    top: isTopHalf ? rect.bottom + 10 : rect.top - 10, // 상단이면 아래로, 하단이면 위로
    transform: isTopHalf ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)', // 툴팁 중심점 조정
  };

  return (
    <FixedTooltipContainer style={style}>
      <div className="top">
        <span className="id">Slot {item.label}</span>
        <span className={`badge ${item.status}`}>
          {item.status === 'NEW' ? '신규' : item.status === 'OLD' ? '장기' : '빈슬롯'}
        </span>
      </div>
      {item.status !== "EMPTY" ? (
        <div className="info">
          <p><Truck size={11} strokeWidth={2.5}/> {item.vehicleId}</p>
          <p><BoxIcon size={11} strokeWidth={2.5}/> {item.labelId || '-'}</p>
          <p><Clock size={11} strokeWidth={2.5}/> {item.entryDate && formatDistanceToNow(item.entryDate, { locale: ko })} 전</p>
          {item.workState && <p className="state">상태: {item.workState}</p>}
        </div>
      ) : <div className="info empty"><p>사용 가능</p></div>}
    </FixedTooltipContainer>
  );
};

// --- Sub Components ---

const Section = ({ config, onCellEnter, onCellLeave }: { config: SectionConfig, onCellEnter: any, onCellLeave: any }) => (
  <GlassCard>
    <SectionTitle>{config.id} 구역</SectionTitle>
    <RackGrid $rows={config.rows} $cols={config.cols}>
      {config.items.map((item) => (
        <Cell 
          key={item.id} 
          $status={item.status}
          onMouseEnter={(e) => onCellEnter(e, item)}
          onMouseLeave={onCellLeave}
        >
          <span className="num">{item.label}</span>
        </Cell>
      ))}
    </RackGrid>
  </GlassCard>
);

const LoadingScreen = ({ progress }: { progress: number }) => (
  <LoadingContainer>
    <GlobalStyle />
    <LoadingContent>
      <LogoArea><Layers size={64} color="#6366f1" className="bounce" /></LogoArea>
      <LoadingText><h2>스마트 물류 관제</h2><p>실시간 데이터 동기화 중...</p></LoadingText>
      <ProgressArea><div className="bar-bg"><div className="bar-fill" style={{ width: `${progress}%` }} /></div><span className="percent">{Math.floor(progress)}%</span></ProgressArea>
    </LoadingContent>
  </LoadingContainer>
);

const StatItem = ({ color, label, value, isEmpty }: any) => (
  <div className="stat-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isEmpty ? '#fff' : color, border: isEmpty ? `2px solid ${color}` : 'none' }} />
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>{label}</span>
    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{value}</span>
  </div>
);

// --- Styled Components ---

const bounce = keyframes` 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } `;
const slideUp = keyframes` from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } `;
const glassStyle = css` background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); `;

const LoadingContainer = styled.div` position: fixed; inset: 0; background: #fff; z-index: 9999; display: flex; justify-content: center; align-items: center; `;
const LoadingContent = styled.div` display: flex; flex-direction: column; align-items: center; width: 340px; `;
const LogoArea = styled.div` margin-bottom: 24px; .bounce { animation: ${bounce} 2s infinite ease-in-out; } `;
const LoadingText = styled.div` text-align: center; margin-bottom: 32px; h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; } p { font-size: 0.9rem; color: #64748b; } `;
const ProgressArea = styled.div` width: 100%; display: flex; flex-direction: column; gap: 8px; .bar-bg { width: 100%; height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; } .bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); transition: width 0.2s; } .percent { font-size: 0.8rem; font-weight: 700; color: #6366f1; align-self: flex-end; } `;

const BackgroundLayer = styled.div` position: fixed; inset: 0; z-index: -1; .img { position: absolute; inset: 0; background-image: url('/background.jpg'); background-size: cover; background-position: center; } .backdrop { position: absolute; inset: 0; background: rgba(255, 255, 255, 0.4); } `;

const Container = styled.div` 
  position: relative; width: 100vw; height: calc(100vh - 64px); 
  display: flex; flex-direction: column; 
  padding: 1.5vh 2vw; gap: 1.5vh; 
  overflow: hidden; 
`;

const Header = styled.header` 
  position: relative; display: flex; justify-content: space-between; align-items: center; 
  height: 6vh; min-height: 50px; flex-shrink: 0; 
`;

const StatsCard = styled.div` ${glassStyle} padding: 0 1.5vw; height: 100%; border-radius: 14px; display: flex; align-items: center; gap: 1.5vw; min-width: 300px; .title-area { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 800; color: #1e293b; padding-right: 1.5vw; border-right: 1px solid rgba(0,0,0,0.1); } .stats-content { display: flex; align-items: center; gap: 1.2vw; } `;
const NavGroup = styled.div` position: absolute; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); padding: 4px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); `;
const NavButton = styled.button<{ $active: boolean }>` border: none; background: ${(props) => (props.$active ? "#ffffff" : "transparent")}; color: ${(props) => (props.$active ? "#4f46e5" : "#475569")}; font-weight: ${(props) => (props.$active ? "800" : "600")}; padding: 0.8vh 1.2vw; border-radius: 10px; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; box-shadow: ${(props) => (props.$active ? "0 2px 8px rgba(0,0,0,0.08)" : "none")}; &:hover { background: rgba(255,255,255,0.8); } `;
const TimeCard = styled.div` ${glassStyle} height: 100%; padding: 0 1.5vw; border-radius: 14px; display: flex; align-items: center; gap: 8px; font-weight: 700; color: #334155; font-size: 1rem; .icon { color: #6366f1; } `;

const MainContent = styled.main` 
  flex: 1; width: 100%; height: 100%; 
  display: flex; justify-content: center; align-items: center; 
  min-height: 0; overflow: hidden;
`;

const GridSystem = styled.div` 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  grid-template-rows: repeat(4, minmax(0, 1fr)); 
  gap: 1.2vh 1.2vw; 
  width: 100%; height: 100%; 
  max-width: 1600px; 
  animation: ${slideUp} 0.5s ease-out; 
`;

const SectionWrapper = styled.div` display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; overflow: hidden;`;

const GlassCard = styled.div` 
  ${glassStyle} border-radius: 16px; padding: 0.8vh; 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  width: 100%; height: 100%; 
`;

const SectionTitle = styled.div` 
  font-size: 0.85rem; font-weight: 800; color: #1e293b; margin-bottom: 0.8vh; 
  background: rgba(255,255,255,0.8); padding: 0.4vh 1vw; border-radius: 20px; flex-shrink: 0; 
`;

const RackGrid = styled.div<{ $rows: number; $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$cols}, 3.2vh); 
  grid-template-rows: repeat(${(props) => props.$rows}, 3.2vh);
  gap: 0.5vh;
  place-content: center; align-items: center;
  width: 100%; height: 100%; flex: 1;
`;

const Cell = styled.div<{ $status: ProductStatus }>`
  width: 100%; height: 100%; 
  border-radius: 4px; display: flex; justify-content: center; align-items: center; position: relative; cursor: pointer; transition: transform 0.2s;
  
  .num { font-size: 1.4vh; font-weight: 700; z-index: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
  
  &:hover { transform: scale(1.15); z-index: 10; }

  ${(props) => {
    switch (props.$status) {
      case "NEW": return css` background: linear-gradient(135deg, #34d399 0%, #059669 100%); border: 1px solid rgba(255,255,255,0.3); color: white; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25); `;
      case "OLD": return css` background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); border: 1px solid rgba(255,255,255,0.3); color: white; box-shadow: 0 2px 6px rgba(245, 158, 11, 0.25); `;
      case "EMPTY": return css` background: rgba(255,255,255,0.5); border: 1px solid #cbd5e1; color: #94a3b8; &:hover { background: #fff; border-color: #64748b; .num { opacity: 1; } } `;
    }
  }}
`;

/* [NEW] Fixed Tooltip - 절대 좌표를 사용하여 화면 어디서든 잘리지 않음 */
const FixedTooltipContainer = styled.div`
  position: fixed; 
  z-index: 99999; /* 최상위 레이어 */
  width: 160px; 
  background: rgba(255, 255, 255, 0.98); 
  backdrop-filter: blur(8px); 
  padding: 10px; 
  border-radius: 12px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.25); 
  border: 1px solid white; 
  pointer-events: none; /* 마우스 이벤트 통과 (깜빡임 방지) */
  transition: opacity 0.1s;

  .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; } 
  .id { font-size: 0.8rem; font-weight: 800; color: #334155; } 
  
  .badge { font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; 
    &.NEW { background: #ecfdf5; color: #059669; } 
    &.OLD { background: #fffbeb; color: #d97706; } 
    &.EMPTY { background: #f1f5f9; color: #64748b; } 
  }

  .info p { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: #64748b; font-weight: 600; margin-bottom: 3px; } 
  .info .state { color: #3b82f6; margin-top: 4px; }
  .info.empty .sub { color: #94a3b8; font-weight: 500; margin-left: 18px; } 
`;

const ModalBackdrop = styled.div` position: fixed; inset: 0; background: rgba(0,0,0,0.2); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 999; `;
const ModalCard = styled.div` background: white; padding: 32px; border-radius: 24px; text-align: center; width: 300px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2); font-family: 'Pretendard', sans-serif; .icon { width: 60px; height: 60px; background: #6366f1; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 16px; } h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; } p { font-size: 0.95rem; color: #64748b; margin-bottom: 24px; } button { width: 100%; padding: 12px; background: #1e293b; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; } `;