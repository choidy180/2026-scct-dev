"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  Grid,
  Square,
  LayoutTemplate,
  Bell,
  TrendingUp,
  TrendingDown,
  Video,
  X,
  FileText,
  Maximize2
} from "lucide-react";

// --- [1. 설정 및 데이터] ---

const TARGET_TAKT = 12.0;

const VIDEO_PATHS = {
  A: "http://1.254.24.170:24828/api/DX_API000031?videoName=223.mp4", 
  B: "http://1.254.24.170:24828/api/DX_API000031?videoName=225.mp4",
  C: "http://1.254.24.170:24828/api/DX_API000031?videoName=224.mp4",
};

const MOCK_CSV_DATA = `timestamp,message,type
14:25:30,#4번 공정 텍타임 지연 (15.2초),error
14:24:12,2호기 자재 공급 요청,warning
14:20:00,라인 2 가동 시작,success
13:55:40,#1번 공정 일시 정지 (센서 오류),error
13:00:00,오후 작업조 투입 완료,success
12:55:10,오전 작업조 작업 종료,success
12:40:05,품질 검사 데이터 전송 완료,success
11:30:22,3호기 유압 모터 온도 상승 주의,warning
11:15:00,#2번 라인 자재 부족 알림,warning
10:00:00,설비 정기 점검 완료,success`;

const COLORS = {
  bgPage: "#F8FAFC",
  bgCard: "#FFFFFF",
  primary: "#3B82F6",
  target: "#F97316",
  alert: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",
  textMain: "#0F172A",
  textSub: "#64748B",
  grid: "#E2E8F0",
  borderBlue: "#3B82F6",
  borderGreen: "#10B981",
  borderYellow: "#F59E0B",
  hoverBg: "#F1F5F9",
  tabActive: "#2563EB",
  videoBg: "#1E293B",
};

interface CycleData {
  id: string;
  name: string;
  cycleTime: number;
  target: number;
  isOver: boolean;
  production: number;
}

interface LogData {
  time: string;
  msg: string;
  type: 'error' | 'success' | 'warning';
}

const generateLineData = (lineId: string) => {
  return Array.from({ length: 16 }, (_, i) => {
    const base = 11.5;
    const noise = Math.random() * 2 - 0.5;
    let cycleTime = Number((base + noise).toFixed(1));
    if (Math.random() > 0.85) cycleTime += 3.5;
    const isOver = cycleTime > TARGET_TAKT;
    return {
      id: `${lineId}-${i}`,
      name: `#${101 + i}`,
      cycleTime,
      target: TARGET_TAKT,
      isOver,
      production: 100 + i * 5,
    };
  });
};

// --- [2. 스타일 컴포넌트] ---

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&family=Rajdhani:wght@600;700;800&display=swap');
  body { 
    background-color: ${COLORS.bgPage}; 
    margin: 0; 
    font-family: 'Pretendard', sans-serif;
    overflow: hidden; 
    color: ${COLORS.textMain};
  }
  * { box-sizing: border-box; }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
`;

const LayoutContainer = styled.div`
  display: flex;
  width: 100vw;
  height: calc(100vh - 64px);
  background-color: ${COLORS.bgPage};
`;

const Sidebar = styled.div`
  width: 80px;
  background: ${COLORS.bgCard};
  border-right: 1px solid ${COLORS.grid};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 24px;
  gap: 16px;
  z-index: 20;
  box-shadow: 2px 0 12px rgba(0,0,0,0.02);
`;

const NavItem = styled.button<{ $active: boolean }>`
  width: 60px; height: 60px;
  border-radius: 16px;
  border: 1px solid ${(props) => (props.$active ? COLORS.primary : "transparent")};
  background: ${(props) => (props.$active ? "#EFF6FF" : "transparent")};
  color: ${(props) => (props.$active ? COLORS.primary : COLORS.textSub)};
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover { 
    background: ${(props) => (props.$active ? "#EFF6FF" : COLORS.hoverBg)}; 
    color: ${(props) => (props.$active ? COLORS.primary : COLORS.textMain)}; 
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }
  span { font-size: 11px; font-weight: 700; letter-spacing: -0.5px; }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  height: 64px;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${COLORS.bgCard};
  border-bottom: 1px solid ${COLORS.grid};
  flex-shrink: 0;
  
  .title-area {
    display: flex; align-items: center; gap: 12px;
    h1 { 
      font-size: 1.4rem; font-weight: 800; color: ${COLORS.textMain}; margin: 0; 
      display: flex; align-items: center; gap: 10px; letter-spacing: -0.5px;
    }
  }
  .sub-text { font-size: 0.9rem; color: ${COLORS.textSub}; font-weight: 500; }
`;

const DashboardBody = styled.div`
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  height: 100%;
  overflow: hidden;
`;

const ChartSection = styled.div`
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
`;

const InfoSection = styled.div`
  flex: 1;
  min-width: 340px;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
`;

const ViewContainer = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
`;

const SingleChartCard = styled.div`
  flex: 0.5; 
  background: ${COLORS.bgCard};
  border-radius: 16px;
  padding: 20px;
  border: 1px solid ${COLORS.grid};
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
`;

const BigScreenCard = styled.div`
  flex: 0.5; 
  background: ${COLORS.videoBg};
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid ${COLORS.grid};

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .live-indicator {
    position: absolute; top: 20px; left: 20px;
    background: rgba(239, 68, 68, 0.9);
    color: white; padding: 4px 10px; border-radius: 6px;
    font-size: 0.9rem; font-weight: 800;
    display: flex; align-items: center; gap: 6px;
    z-index: 10;
    .dot { width: 8px; height: 8px; background: white; border-radius: 50%; animation: blink 1.5s infinite; }
  }

  @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
`;

const MultiChartCard = styled.div`
  flex: 1;
  background: ${COLORS.bgCard};
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 0;
  border: 1px solid ${COLORS.grid};
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
`;

const VideoBox = styled.div<{ $isLarge?: boolean }>`
  width: ${(props) => props.$isLarge ? "40%" : "260px"}; 
  height: 100%;
  background: ${COLORS.videoBg};
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.4s ease; 
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .label {
    position: absolute; bottom: 0; width: 100%;
    background: rgba(0,0,0,0.6); color: white;
    font-size: 0.85rem; padding: 6px 12px; font-weight: 600;
    z-index: 10;
  }
  .live-badge {
    position: absolute; top: 10px; left: 10px;
    background: rgba(239, 68, 68, 0.9);
    color: white; font-size: 0.7rem; font-weight: 700;
    padding: 2px 6px; border-radius: 4px;
    z-index: 10;
  }
`;

const ChartWrapper = styled.div`
  flex: 1;
  height: 100%;
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const ProcessLabel = styled.div`
  position: absolute;
  top: 0; right: 0;
  background: #EFF6FF;
  color: ${COLORS.primary};
  border: 1px solid #BFDBFE;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  z-index: 10;
`;

const KpiRow = styled.div`
  display: flex;
  gap: 16px;
  height: 140px;
  flex-shrink: 0;
`;

const KpiCard = styled.div<{ $borderColor: string }>`
  flex: 1;
  background: ${COLORS.bgCard};
  border: 1px solid ${COLORS.grid};
  border-radius: 16px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  position: relative;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  
  .label { font-size: 0.85rem; color: ${COLORS.textSub}; margin-bottom: 6px; font-weight: 600; }
  .value { font-family: 'Rajdhani'; font-size: 2.2rem; font-weight: 800; color: ${COLORS.textMain}; }
  .sub { 
    font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 4px; 
    color: ${(props) => props.$borderColor === COLORS.borderYellow ? COLORS.textMain : props.$borderColor};
    background: ${(props) => props.$borderColor}15;
    padding: 4px 10px; border-radius: 6px;
  }
`;

// [NEW] 가변 높이 카드 (세로로 쌓기 위해)
const WideKpiCard = styled.div<{ $height?: number }>`
  height: ${(props) => props.$height || 140}px;
  width: 100%;
  background: ${COLORS.bgCard};
  border: 1px solid ${COLORS.grid};
  border-radius: 16px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: height 0.3s ease;
  overflow: hidden;
`;

// [NEW] 세로형 그리드 (1개일 때와 다르게 동작)
const TaktGrid = styled.div<{ $rows: number }>`
  display: grid;
  grid-template-rows: repeat(${(props) => props.$rows}, 1fr);
  grid-template-columns: 1fr; /* 무조건 한 줄(세로) */
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 12px;
`;

const TaktBox = styled.div<{ $isSingle?: boolean }>`
  display: flex;
  /* 싱글일 때는 세로 정렬, 멀티일 때는 가로 정렬 */
  flex-direction: ${(props) => props.$isSingle ? 'column' : 'row'};
  justify-content: ${(props) => props.$isSingle ? 'center' : 'space-between'};
  align-items: center;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  padding: 0 20px;
  
  .line-name {
    font-size: ${(props) => props.$isSingle ? '0.9rem' : '0.85rem'};
    font-weight: 700;
    color: ${COLORS.textSub};
    margin-bottom: ${(props) => props.$isSingle ? '6px' : '0'};
  }
  .val-group {
    display: flex;
    flex-direction: ${(props) => props.$isSingle ? 'column' : 'row'};
    align-items: center;
    gap: ${(props) => props.$isSingle ? '2px' : '12px'};
  }
  .takt-val {
    font-family: 'Rajdhani';
    font-size: ${(props) => props.$isSingle ? '2.4rem' : '1.6rem'};
    font-weight: 800;
    color: ${COLORS.textMain};
    line-height: 1;
  }
  .diff {
    font-size: ${(props) => props.$isSingle ? '0.85rem' : '0.8rem'};
    color: ${COLORS.success};
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 4px;
    background: #F0FDF4;
    padding: 2px 8px;
    border-radius: 6px;
  }
`;

const AlertSection = styled.div`
  flex: 1;
  background: ${COLORS.bgCard};
  border-radius: 16px;
  border: 1px solid ${COLORS.grid};
  padding: 20px;
  display: flex; flex-direction: column;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  overflow: hidden;
  
  .header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid ${COLORS.grid};
    font-weight: 700; color: ${COLORS.textMain}; font-size: 0.95rem;
    .view-all { 
      font-size: 0.8rem; color: ${COLORS.primary}; cursor: pointer; font-weight: 600;
      display: flex; align-items: center; gap: 4px;
      &:hover { text-decoration: underline; }
    }
  }
  .list-wrapper {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
    &::-webkit-scrollbar { width: 4px; }
  }
`;

const AlertItem = styled.div<{ $type: string }>`
  display: flex; gap: 12px; margin-bottom: 12px;
  padding: 12px;
  border-radius: 10px;
  background: ${(props) => props.$type === 'error' ? '#FEF2F2' : props.$type === 'warning' ? '#FFFBEB' : '#F0FDF4'};
  border: 1px solid transparent;
  
  &:hover { border-color: ${COLORS.grid}; }

  .dot { 
    width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; 
    background: ${(props) => props.$type === 'error' ? COLORS.alert : props.$type === 'warning' ? COLORS.warning : COLORS.success};
  }
  .content {
    .msg { font-size: 0.85rem; font-weight: 700; display: block; margin-bottom: 2px; color: ${COLORS.textMain}; }
    .time { font-size: 0.75rem; color: ${COLORS.textSub}; font-weight: 500; }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
  z-index: 1000; display: flex; align-items: center; justify-content: center;
`;

const ModalContent = styled(motion.div)`
  width: 90%; height: 90%; background: white; border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3); display: flex; flex-direction: column; overflow: hidden;
  .modal-header {
    padding: 24px; border-bottom: 1px solid ${COLORS.grid};
    display: flex; justify-content: space-between; align-items: center; background: ${COLORS.bgPage};
    h2 { margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 12px; color: ${COLORS.textMain}; }
    .close-btn { 
      background: white; border: 1px solid ${COLORS.grid}; border-radius: 50%; width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${COLORS.textSub};
      &:hover { background: #fee2e2; color: ${COLORS.alert}; border-color: ${COLORS.alert}; }
    }
  }
  .modal-body { flex: 1; overflow-y: auto; padding: 24px; background: white; }
`;

const LogTable = styled.table`
  width: 100%; border-collapse: collapse;
  thead {
    position: sticky; top: 0; background: white; z-index: 10;
    th { text-align: left; padding: 16px; border-bottom: 2px solid ${COLORS.grid}; color: ${COLORS.textSub}; font-weight: 700; font-size: 0.95rem; }
  }
  tbody {
    tr { border-bottom: 1px solid ${COLORS.grid}; &:hover { background: ${COLORS.hoverBg}; } }
    td { padding: 16px; font-size: 0.95rem; color: ${COLORS.textMain}; }
  }
  .type-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
    &.error { background: #FEF2F2; color: ${COLORS.alert}; }
    &.warning { background: #FFFBEB; color: ${COLORS.warning}; }
    &.success { background: #F0FDF4; color: ${COLORS.success}; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  }
`;

const CustomTooltipBox = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid ${COLORS.grid};
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  font-size: 0.85rem;
  .label { font-weight: 700; color: ${COLORS.textMain}; margin-bottom: 4px; }
  .val { font-family: 'Rajdhani'; font-weight: 700; color: ${COLORS.primary}; font-size: 1rem; }
  .alert { color: ${COLORS.alert}; }
`;

const MonitorChart = memo(({ data }: { data: CycleData[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: COLORS.textSub, fontSize: 10, fontWeight: 600 }} 
          dy={10} 
        />
        <YAxis hide domain={[8, 16]} />
        <Tooltip
          cursor={{ fill: COLORS.hoverBg }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload;
              return (
                <CustomTooltipBox>
                  <div className="label">{d.name}</div>
                  <div className={d.isOver ? "val alert" : "val"}>{d.cycleTime}s</div>
                </CustomTooltipBox>
              );
            }
            return null;
          }}
        />
        <ReferenceLine y={TARGET_TAKT} stroke={COLORS.target} strokeDasharray="3 3" strokeWidth={2} />
        <Bar dataKey="cycleTime" maxBarSize={40} radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.isOver ? COLORS.alert : COLORS.primary} fillOpacity={0.9} />
          ))}
        </Bar>
        <Line type="monotone" dataKey="cycleTime" stroke={COLORS.target} strokeWidth={2} dot={{r:3, fill:'white', stroke:COLORS.target}} activeDot={{r:5}} />
      </ComposedChart>
    </ResponsiveContainer>
  );
});
MonitorChart.displayName = "MonitorChart";

// --- [Main Component] ---

export default function ProcessDashboard() {
  const [viewMode, setViewMode] = useState<1 | 2 | 3>(1); 
  const [data, setData] = useState<{A: CycleData[], B: CycleData[], C: CycleData[]}>({ A: [], B: [], C: [] });
  const [alertLogs, setAlertLogs] = useState<LogData[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    const update = () => {
      setData({
        A: generateLineData("A"),
        B: generateLineData("B"),
        C: generateLineData("C")
      });
    };
    update();
    // const interval = setInterval(update, 2000);

    const lines = MOCK_CSV_DATA.trim().split('\n').slice(1);
    const logs = lines.map(line => {
      const [time, msg, type] = line.split(',');
      return { time, msg, type: type.trim() as any };
    });
    setAlertLogs(logs);

    // return () => clearInterval(interval);
  }, []);

  const avgTakts = useMemo(() => {
    const calcAvg = (arr: CycleData[]) => (arr.reduce((acc, cur) => acc + cur.cycleTime, 0) / (arr.length || 1)).toFixed(1);
    return {
      A: calcAvg(data.A),
      B: calcAvg(data.B),
      C: calcAvg(data.C)
    };
  }, [data]);

  const containerVariants: Variants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.2 } }
  };

  const modalVariants: Variants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <>
      <GlobalStyle />
      <LayoutContainer>
        <Sidebar>
          <NavItem $active={viewMode === 1} onClick={() => setViewMode(1)}>
            <Square size={22} strokeWidth={2.5} /><span>1개 라인</span>
          </NavItem>
          <NavItem $active={viewMode === 2} onClick={() => setViewMode(2)}>
            <Grid size={22} strokeWidth={2.5} /><span>2개 라인</span>
          </NavItem>
          <NavItem $active={viewMode === 3} onClick={() => setViewMode(3)}>
            <LayoutTemplate size={22} strokeWidth={2.5} /><span>3개 라인</span>
          </NavItem>
        </Sidebar>

        <MainContent>
          <Header>
            <div className="title-area">
              <Activity color={COLORS.primary} size={26} />
              <h1>GR3 실시간 텍타임(Takt Time) 및 생산 분석</h1>
            </div>
            <div className="sub-text">Real-time Cycle Time & Production Monitoring</div>
          </Header>

          <DashboardBody>
            <ChartSection>
              <AnimatePresence mode="wait">
                {viewMode === 1 && (
                  <ViewContainer
                    key="view-1"
                    // @ts-ignore
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <SingleChartCard>
                      <div style={{position:'absolute', top: 12, left: 24, fontSize:'0.8rem', color: COLORS.textSub, display:'flex', gap:16, fontWeight: 600}}>
                         <span style={{display:'flex', alignItems:'center', gap:4}}>
                           <div style={{width:10, height:2, background:COLORS.target}}/> 목표 (12s)
                         </span>
                         <span style={{display:'flex', alignItems:'center', gap:4}}>
                           <div style={{width:10, height:10, borderRadius:2, background:COLORS.primary}}/> 실적
                         </span>
                      </div>
                      <div style={{flex:1, marginTop: 10}}>
                        <MonitorChart data={data['A']} />
                      </div>
                    </SingleChartCard>

                    <BigScreenCard>
                       <video src={VIDEO_PATHS.A} autoPlay muted loop playsInline />
                       <div className="live-indicator"><div className="dot"/>LIVE</div>
                    </BigScreenCard>
                  </ViewContainer>
                )}

                {viewMode === 2 && (
                  <ViewContainer
                    key="view-2"
                    // @ts-ignore
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                     <MultiChartCard>
                        <VideoBox $isLarge={true}>
                          <video src={VIDEO_PATHS.A} autoPlay muted loop playsInline />
                          <div className="live-badge">LIVE</div>
                          <span className="label">발포 CAM-01</span>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>발포</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}>
                              <MonitorChart data={data['A']} />
                           </div>
                        </ChartWrapper>
                     </MultiChartCard>
                     
                     <MultiChartCard>
                        <VideoBox $isLarge={true}>
                          <video src={VIDEO_PATHS.B} autoPlay muted loop playsInline />
                          <div className="live-badge">LIVE</div>
                          <span className="label">총조립1 CAM-01</span>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>총조립1</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}>
                              <MonitorChart data={data['B']} />
                           </div>
                        </ChartWrapper>
                     </MultiChartCard>
                  </ViewContainer>
                )}

                {viewMode === 3 && (
                  <ViewContainer
                    key="view-3"
                    // @ts-ignore
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                     <MultiChartCard>
                        <VideoBox $isLarge={false}>
                          <video src={VIDEO_PATHS.A} autoPlay muted loop playsInline />
                          <div className="live-badge">LIVE</div>
                          <span className="label">발포 CAM-01</span>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>발포</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}>
                              <MonitorChart data={data['A']} />
                           </div>
                        </ChartWrapper>
                     </MultiChartCard>
                     
                     <MultiChartCard>
                        <VideoBox $isLarge={false}>
                          <video src={VIDEO_PATHS.B} autoPlay muted loop playsInline />
                          <div className="live-badge">LIVE</div>
                          <span className="label">총조립1 CAM-01</span>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>총조립1</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}>
                              <MonitorChart data={data['B']} />
                           </div>
                        </ChartWrapper>
                     </MultiChartCard>

                     <MultiChartCard>
                        <VideoBox $isLarge={false}>
                          <video src={VIDEO_PATHS.C} autoPlay muted loop playsInline />
                          <div className="live-badge">LIVE</div>
                          <span className="label">총조립2 CAM-01</span>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>총조립2</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}>
                              <MonitorChart data={data['C']} />
                           </div>
                        </ChartWrapper>
                     </MultiChartCard>
                  </ViewContainer>
                )}
              </AnimatePresence>
            </ChartSection>

            <InfoSection>
              <KpiRow>
                <KpiCard $borderColor={COLORS.borderBlue}>
                  <div className="label">종합 가동률 (OEE)</div>
                  <div className="value">89.4%</div>
                  <div className="sub"><TrendingUp size={14} /> 목표 대비 +1.2%</div>
                </KpiCard>
                <KpiCard $borderColor={COLORS.borderGreen}>
                  <div className="label">현재 생산량</div>
                  <div className="value" style={{ color: COLORS.success }}>1,245</div>
                  <div className="sub" style={{ color: COLORS.success, background: '#F0FDF4' }}>목표: 1,400</div>
                </KpiCard>
              </KpiRow>

              {/* [수정된 부분] 뷰 모드에 따라 높이가 변하고 세로로 쌓이는 KPI 카드 */}
              <WideKpiCard $height={viewMode === 1 ? 140 : viewMode === 2 ? 190 : 240}>
                {viewMode === 1 ? (
                  <TaktGrid $rows={1}>
                    <TaktBox $isSingle={true}>
                      <span className="line-name">평균 텍타임 (발포)</span>
                      <div className="val-group">
                        <span className="takt-val">{avgTakts.A}초</span>
                        <span className="diff"><TrendingDown size={14}/> 0.2초 단축</span>
                      </div>
                    </TaktBox>
                  </TaktGrid>
                ) : (
                  <TaktGrid $rows={viewMode}>
                    <TaktBox $isSingle={false}>
                      <span className="line-name">발포 (A)</span>
                      <div className="val-group">
                        <span className="takt-val">{avgTakts.A}s</span>
                        <span className="diff"><TrendingDown size={12}/> -0.2</span>
                      </div>
                    </TaktBox>
                    <TaktBox $isSingle={false}>
                      <span className="line-name">총조립1 (B)</span>
                      <div className="val-group">
                        <span className="takt-val">{avgTakts.B}s</span>
                        <span className="diff"><TrendingDown size={12}/> -0.1</span>
                      </div>
                    </TaktBox>
                    {viewMode === 3 && (
                      <TaktBox $isSingle={false}>
                        <span className="line-name">총조립2 (C)</span>
                        <div className="val-group">
                          <span className="takt-val">{avgTakts.C}s</span>
                          <span className="diff" style={{color: COLORS.alert, background:'#FEF2F2'}}><TrendingUp size={12}/> +0.5</span>
                        </div>
                      </TaktBox>
                    )}
                  </TaktGrid>
                )}
              </WideKpiCard>

              <AlertSection>
                 <div className="header">
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <div style={{padding:6, background:'#FEF2F2', borderRadius:8}}>
                        <Bell color={COLORS.alert} size={18} />
                      </div>
                      실시간 알림 로그
                    </div>
                    <div className="view-all" onClick={() => setShowLogModal(true)}>
                      <Maximize2 size={12} /> 전체 보기
                    </div>
                 </div>
                 <div className="list-wrapper">
                    {alertLogs.slice(0, 5).map((log, idx) => (
                       <AlertItem key={idx} $type={log.type}>
                          <div className="dot" />
                          <div className="content">
                             <span className="msg">{log.msg}</span>
                             <span className="time">{log.time}</span>
                          </div>
                       </AlertItem>
                    ))}
                 </div>
              </AlertSection>
            </InfoSection>
          </DashboardBody>
        </MainContent>

        <AnimatePresence>
          {showLogModal && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogModal(false)}
            >
              <ModalContent
                // @ts-ignore
                variants={modalVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2><FileText size={28} color={COLORS.primary} /> 전체 알림 및 로그 내역</h2>
                  <button className="close-btn" onClick={() => setShowLogModal(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="modal-body">
                  <LogTable>
                    <thead>
                      <tr>
                        <th style={{width: '12%'}}>시간</th>
                        <th style={{width: '12%'}}>유형</th>
                        <th>메시지 내용</th>
                        <th style={{width: '12%'}}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertLogs.map((log, idx) => (
                        <tr key={idx}>
                          <td>{log.time}</td>
                          <td>
                            <span className={`type-badge ${log.type}`}>
                              <div className="dot"/>
                              {log.type === 'error' ? '오류' : log.type === 'warning' ? '경고' : '정보'}
                            </span>
                          </td>
                          <td style={{fontWeight: 600}}>{log.msg}</td>
                          <td>{log.type === 'success' ? '해결됨' : '확인 필요'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </LogTable>
                </div>
              </ModalContent>
            </ModalOverlay>
          )}
        </AnimatePresence>

      </LayoutContainer>
    </>
  );
}