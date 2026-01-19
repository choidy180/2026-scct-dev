"use client";

import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
} from "recharts";
import {
  Activity,
  Bell,
  TrendingUp,
  TrendingDown,
  Maximize2,
  FileText,
  X,
  Refrigerator,
  Wine,
  GlassWater,
  Loader2,
  Cpu,
  Wifi
} from "lucide-react";

// --- [1. 설정 및 데이터 상수] ---

const TARGET_TAKT = 45.0; 
const CHART_Y_MAX_LIMIT = 100;
const REFRESH_RATE = 5000;

const VIDEO_PATHS = {
  A: "http://1.254.24.170:24828/api/DX_API000031?videoName=223.mp4", 
  B: "http://1.254.24.170:24828/api/DX_API000031?videoName=224.mp4",
  C: "http://1.254.24.170:24828/api/DX_API000031?videoName=225.mp4",
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
  videoBg: "#1E293B",
  hoverBg: "#F1F5F9",
};

// --- [타입 정의] ---
interface ApiRecentItem { CAM_NO: string; UPDATETIME: string; CLASS_NAME: string; COUNT_NUM: string; TACTTIME: string; TACTTIME_AVG: string; EXP_TT: number | string; }
interface ApiHistoryItem { CAM_NO: string; CLASS_NAME: string; ENTRY_TIME: string; COUNT_NUM: string; TACTTIME: string; TACTTIME_AVG: string; RowNum: string; }
interface ApiResponse { success: boolean; recent_data: ApiRecentItem[]; history_data: { [key: string]: ApiHistoryItem[]; }; }
interface CycleData { id: string; name: string; cycleTime: number; visualCycleTime: number; target: number; isOver: boolean; production: number; timeLabel: string; }
interface LogData { time: string; msg: string; type: 'error' | 'success' | 'warning'; }

// --- [스타일] ---
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&family=Rajdhani:wght@600;700;800&display=swap');
  body { background-color: ${COLORS.bgPage}; margin: 0; font-family: 'Pretendard', sans-serif; overflow: hidden; color: ${COLORS.textMain}; }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
`;

const LayoutContainer = styled.div`display: flex; width: 100vw; height: calc(100vh - 64px); background-color: ${COLORS.bgPage};`;
const Sidebar = styled.div`width: 100px; background: ${COLORS.bgCard}; border-right: 1px solid ${COLORS.grid}; display: flex; flex-direction: column; align-items: center; padding-top: 24px; gap: 16px; z-index: 20;`;
const NavItem = styled.button<{ $active: boolean }>`
  width: 80px; height: 80px; border-radius: 16px; border: 1px solid ${(props) => (props.$active ? COLORS.primary : "transparent")};
  background: ${(props) => (props.$active ? "#EFF6FF" : "transparent")}; color: ${(props) => (props.$active ? COLORS.primary : COLORS.textSub)};
  cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease;
  &:hover { background: ${(props) => (props.$active ? "#EFF6FF" : COLORS.hoverBg)}; transform: translateY(-2px); }
  span { font-size: 11px; font-weight: 700; letter-spacing: -0.5px; text-align: center; line-height: 1.2; }
`;
const MainContent = styled.div`flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; position: relative;`;
const Header = styled.div`height: 64px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; background: ${COLORS.bgCard}; border-bottom: 1px solid ${COLORS.grid}; flex-shrink: 0;
  .title-area { display: flex; align-items: center; gap: 12px; h1 { font-size: 1.4rem; font-weight: 800; } } .sub-text { font-size: 0.9rem; color: ${COLORS.textSub}; font-weight: 500; }`;
const DashboardBody = styled.div`flex: 1; display: flex; padding: 20px; gap: 20px; height: 100%; overflow: hidden;`;
const ChartSection = styled.div`flex: 3; display: flex; flex-direction: column; gap: 16px; height: 100%; overflow: hidden;`;
const InfoSection = styled.div`flex: 1; min-width: 340px; max-width: 420px; display: flex; flex-direction: column; gap: 16px; height: 100%; overflow: hidden;`;
const ViewContainer = styled(motion.div)`flex: 1; display: flex; flex-direction: column; gap: 16px; height: 100%; overflow: hidden;`;
const SingleChartCard = styled.div`flex: 0.5; background: ${COLORS.bgCard}; border-radius: 16px; padding: 20px; border: 1px solid ${COLORS.grid}; position: relative; display: flex; flex-direction: column;`;
const BigScreenCard = styled.div`flex: 0.5; background: ${COLORS.videoBg}; border-radius: 16px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; border: 1px solid ${COLORS.grid};`;
const MultiChartCard = styled.div`flex: 1; background: ${COLORS.bgCard}; border-radius: 16px; padding: 16px 20px; display: flex; align-items: center; gap: 20px; min-height: 0; border: 1px solid ${COLORS.grid};`;
const VideoBox = styled.div<{ $isLarge?: boolean }>`
  width: ${(props) => props.$isLarge ? "40%" : "260px"}; height: 100%; background: ${COLORS.videoBg}; border-radius: 12px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; flex-shrink: 0;
  .label { position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.6); color: white; font-size: 0.85rem; padding: 6px 12px; font-weight: 600; }
  .live-badge { position: absolute; top: 10px; left: 10px; background: rgba(239,68,68,0.9); color: white; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
`;
const ChartWrapper = styled.div`flex: 1; height: 100%; position: relative; min-width: 0; display: flex; flex-direction: column;`;
const ProcessLabel = styled.div`position: absolute; top: 0; right: 0; background: #EFF6FF; color: ${COLORS.primary}; border: 1px solid #BFDBFE; font-weight: 700; padding: 4px 12px; border-radius: 8px; font-size: 0.85rem; z-index: 10;`;
const KpiRow = styled.div`display: flex; gap: 16px; height: 140px; flex-shrink: 0;`;
const KpiCard = styled.div<{ $borderColor: string }>`
  flex: 1; background: ${COLORS.bgCard}; border: 1px solid ${COLORS.grid}; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;
  .label { font-size: 0.85rem; color: ${COLORS.textSub}; margin-bottom: 6px; font-weight: 600; } .value { font-family: 'Rajdhani'; font-size: 2.2rem; font-weight: 800; color: ${COLORS.textMain}; }
  .sub { font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 4px; color: ${(props) => props.$borderColor === COLORS.borderYellow ? COLORS.textMain : props.$borderColor}; background: ${(props) => props.$borderColor}15; padding: 4px 10px; border-radius: 6px; }
`;
const WideKpiCard = styled.div<{ $height?: number }>`height: ${(props) => props.$height || 140}px; width: 100%; background: ${COLORS.bgCard}; border: 1px solid ${COLORS.grid}; border-radius: 16px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; transition: height 0.3s ease; overflow: hidden;`;
const TaktGrid = styled.div<{ $rows: number }>`display: grid; grid-template-rows: repeat(${(props) => props.$rows}, 1fr); grid-template-columns: 1fr; gap: 8px; width: 100%; height: 100%; padding: 12px;`;
const TaktBox = styled.div<{ $isSingle?: boolean }>`
  display: flex; flex-direction: ${(props) => props.$isSingle ? 'column' : 'row'}; justify-content: ${(props) => props.$isSingle ? 'center' : 'space-between'}; align-items: center; background: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0; padding: 0 20px;
  .line-name { font-size: ${(props) => props.$isSingle ? '0.9rem' : '0.85rem'}; font-weight: 700; color: ${COLORS.textSub}; } .val-group { display: flex; flex-direction: ${(props) => props.$isSingle ? 'column' : 'row'}; align-items: center; gap: ${(props) => props.$isSingle ? '2px' : '12px'}; }
  .takt-val { font-family: 'Rajdhani'; font-size: ${(props) => props.$isSingle ? '2.4rem' : '1.6rem'}; font-weight: 800; color: ${COLORS.textMain}; line-height: 1; } .diff { font-size: ${(props) => props.$isSingle ? '0.85rem' : '0.8rem'}; color: ${COLORS.success}; font-weight: 700; display: flex; align-items: center; gap: 4px; background: #F0FDF4; padding: 2px 8px; border-radius: 6px; }
`;
const AlertSection = styled.div`flex: 1; background: ${COLORS.bgCard}; border-radius: 16px; border: 1px solid ${COLORS.grid}; padding: 20px; display: flex; flex-direction: column; overflow: hidden; .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid ${COLORS.grid}; font-weight: 700; } .list-wrapper { flex: 1; overflow-y: auto; }`;
const AlertItem = styled.div<{ $type: string }>`
  display: flex; gap: 12px; margin-bottom: 12px; padding: 12px; border-radius: 10px; background: ${(props) => props.$type === 'error' ? '#FEF2F2' : props.$type === 'warning' ? '#FFFBEB' : '#F0FDF4'};
  .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; background: ${(props) => props.$type === 'error' ? COLORS.alert : props.$type === 'warning' ? COLORS.warning : COLORS.success}; } .content { .msg { font-size: 0.85rem; font-weight: 700; display: block; } .time { font-size: 0.75rem; color: ${COLORS.textSub}; } }
`;
const ModalOverlay = styled(motion.div)`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center;`;
const ModalContent = styled(motion.div)`width: 90%; height: 90%; background: white; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; .modal-header { padding: 24px; border-bottom: 1px solid ${COLORS.grid}; display: flex; justify-content: space-between; align-items: center; } .modal-body { flex: 1; overflow-y: auto; padding: 24px; }`;
const LogTable = styled.table`width: 100%; border-collapse: collapse; thead { position: sticky; top: 0; background: white; z-index: 10; th { text-align: left; padding: 16px; border-bottom: 2px solid ${COLORS.grid}; color: ${COLORS.textSub}; } } tbody { tr { border-bottom: 1px solid ${COLORS.grid}; } td { padding: 16px; color: ${COLORS.textMain}; } }`;

// [NEW] Data Sync Loading UI Styles
const LoadingOverlay = styled(motion.div)`
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(8px);
  z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: center;
`;
const Spinner = styled.div`
  width: 48px; height: 48px; border: 4px solid #E2E8F0; border-top-color: ${COLORS.primary};
  border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const LoadingText = styled.div`
  font-family: 'Rajdhani'; font-weight: 700; font-size: 1.2rem; color: ${COLORS.textMain}; display: flex; align-items: center; gap: 8px;
`;
const SubText = styled.div`
  font-size: 0.85rem; color: ${COLORS.textSub}; margin-top: 4px; font-weight: 500;
`;

// [Helper Components]
const CustomBarLabel = memo((props: any) => {
  const { x, y, width, value } = props;
  const valNum = Number(value);
  const isOver = valNum > TARGET_TAKT;
  return (
    <text x={x + width / 2} y={y - 8} fill={isOver ? COLORS.alert : COLORS.textMain} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: '13px', filter: 'drop-shadow(0px 0px 3px rgba(255,255,255, 1))' }}>
      {valNum.toFixed(1)}
    </text>
  );
});

const VideoPlayer = memo(({ src }: { src: string }) => {
    return (
        <>
            <video src={src} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(239,68,68,0.9)', color: 'white', padding: '4px 10px', borderRadius: 6, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }} />LIVE
            </div>
        </>
    )
}, (prev, next) => prev.src === next.src);

const MonitorChart = memo(({ data }: { data: CycleData[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 30, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
        <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fill: COLORS.textSub, fontSize: 10, fontWeight: 600 }} dy={10} interval={0} />
        <YAxis hide domain={[0, CHART_Y_MAX_LIMIT + 20]} />
        <ReferenceLine y={TARGET_TAKT} stroke={COLORS.target} strokeDasharray="3 3" strokeWidth={2} />
        <Bar dataKey="visualCycleTime" maxBarSize={40} radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isOver ? COLORS.alert : COLORS.primary} fillOpacity={0.9} />)}
          <LabelList dataKey="cycleTime" content={<CustomBarLabel />} />
        </Bar>
        <Line type="monotone" dataKey="visualCycleTime" stroke={COLORS.target} strokeWidth={2} dot={{r:3, fill:'white', stroke:COLORS.target}} activeDot={{r:5}} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
});

// --- [Main Component] ---

export default function ProcessDashboard() {
  const [viewMode, setViewMode] = useState<1 | 2 | 3>(1); 
  // [NEW] Transition State for Fake Loading
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Initializing System...");

  const [data, setData] = useState<{A: CycleData[], B: CycleData[], C: CycleData[]}>({ A: [], B: [], C: [] });
  const [alertLogs, setAlertLogs] = useState<LogData[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [totalProduction, setTotalProduction] = useState(0);

  // [Smart Transition Handler]
  const handleViewChange = useCallback((newMode: 1 | 2 | 3) => {
    if (newMode === viewMode) return;
    
    // 1. Show Loading Screen immediately
    setIsTransitioning(true);
    setLoadingMsg("Synchronizing Data Streams...");

    // 2. Delay the heavy lifting (React Render) slightly to let the loading screen paint
    setTimeout(() => {
        setViewMode(newMode);
        
        // 3. Hide loading screen after a delay (smooth UX)
        setTimeout(() => {
             setIsTransitioning(false);
        }, 800); // 0.8s total animation time
    }, 50);
  }, [viewMode]);

  const processData = (arr: ApiHistoryItem[] | undefined): CycleData[] => {
      if (!arr) return [];
      return [...arr].reverse().map((item, idx) => {
          const val = parseFloat(item.TACTTIME);
          return {
              id: `${item.CAM_NO}-${idx}`, name: item.RowNum, timeLabel: item.ENTRY_TIME.split(' ')[1],
              cycleTime: val, visualCycleTime: val > CHART_Y_MAX_LIMIT ? CHART_Y_MAX_LIMIT : val,
              target: TARGET_TAKT, isOver: val > TARGET_TAKT, production: parseInt(item.COUNT_NUM),
          };
      });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://1.254.24.170:24828/api/DX_API000016");
        const json: ApiResponse = await response.json();
        if (json.success) {
          setData({
            A: processData(json.history_data["223"]),
            B: processData(json.history_data["224"]),
            C: processData(json.history_data["225"]),
          });
          setTotalProduction(json.recent_data.reduce((acc, cur) => acc + parseInt(cur.COUNT_NUM), 0));
        }
      } catch (error) { console.error("API Error", error); }
    };
    fetchData();
    const interval = setInterval(fetchData, REFRESH_RATE);
    const logs = MOCK_CSV_DATA.trim().split('\n').slice(1).map(line => {
      const [time, msg, type] = line.split(','); return { time, msg, type: type.trim() as any };
    });
    setAlertLogs(logs);
    return () => clearInterval(interval);
  }, []);

  const getSlicedData = (lineData: CycleData[]) => {
      if (viewMode === 1) return lineData;
      const sliceCount = Math.floor(lineData.length * 0.7); 
      return lineData.slice(-sliceCount); 
  };

  const displayData = useMemo(() => ({
    A: getSlicedData(data.A),
    B: getSlicedData(data.B),
    C: getSlicedData(data.C),
  }), [data, viewMode]);

  const avgTakts = useMemo(() => {
    const calcAvg = (arr: CycleData[]) => {
       const validData = arr.filter(d => d.cycleTime < 300); 
       if(validData.length === 0) return "0.0";
       return (validData.reduce((acc, cur) => acc + cur.cycleTime, 0) / validData.length).toFixed(1);
    };
    return { A: calcAvg(data.A), B: calcAvg(data.B), C: calcAvg(data.C) };
  }, [data]);

  return (
    <>
      <GlobalStyle />
      <LayoutContainer>
        <Sidebar>
          <NavItem $active={viewMode === 1} onClick={() => handleViewChange(1)}>
            <Refrigerator size={24} strokeWidth={2} /><span>꼬모<br/>냉장고</span>
          </NavItem>
          <NavItem $active={viewMode === 2} onClick={() => handleViewChange(2)}>
            <Wine size={24} strokeWidth={2} /><span>소형<br/>와인셀러</span>
          </NavItem>
          <NavItem $active={viewMode === 3} onClick={() => handleViewChange(3)}>
            <GlassWater size={24} strokeWidth={2} /><span>얼음<br/>정수기</span>
          </NavItem>
        </Sidebar>

        <MainContent>
            {/* [NEW] Data Sync Loading Overlay */}
            <AnimatePresence>
                {isTransitioning && (
                    <LoadingOverlay
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Spinner />
                        <LoadingText><Cpu size={20} /> {loadingMsg}</LoadingText>
                        <SubText>Connecting to Smart Factory Grid...</SubText>
                    </LoadingOverlay>
                )}
            </AnimatePresence>

          <Header>
            <div className="title-area">
              <Activity color={COLORS.primary} size={26} />
              <h1>GR3 실시간 공정 모니터링</h1>
            </div>
            <div className="sub-text">Real-time Cycle Time & Production Monitoring</div>
          </Header>

          <DashboardBody>
            <ChartSection>
                {/* 뷰 전환 시 애니메이션 효과는 없애거나 최소화하여 성능 확보 */}
                {viewMode === 1 && (
                  <ViewContainer key="view-1">
                    <SingleChartCard>
                      <div style={{position:'absolute', top: 12, left: 24, fontSize:'0.8rem', color: COLORS.textSub, display:'flex', gap:16, fontWeight: 600}}>
                          <span style={{display:'flex', alignItems:'center', gap:4}}><div style={{width:10, height:2, background:COLORS.target}}/> 목표 ({TARGET_TAKT}s)</span>
                          <span style={{display:'flex', alignItems:'center', gap:4}}><div style={{width:10, height:10, borderRadius:2, background:COLORS.primary}}/> 실적 (Max 100s)</span>
                      </div>
                      <div style={{flex:1, marginTop: 10}}>
                        <MonitorChart data={displayData.A} />
                      </div>
                    </SingleChartCard>
                    <BigScreenCard>
                        <VideoPlayer src={VIDEO_PATHS.A} />
                    </BigScreenCard>
                  </ViewContainer>
                )}

                {viewMode === 2 && (
                  <ViewContainer key="view-2">
                      <MultiChartCard>
                        <VideoBox $isLarge={true}>
                          <VideoPlayer src={VIDEO_PATHS.A} />
                          <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.85rem', padding: '6px 12px', fontWeight: 600 }}>꼬모냉장고 (라인 A)</div>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>꼬모냉장고</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}><MonitorChart data={displayData.A} /></div>
                        </ChartWrapper>
                      </MultiChartCard>
                      <MultiChartCard>
                        <VideoBox $isLarge={true}>
                          <VideoPlayer src={VIDEO_PATHS.B} />
                          <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.85rem', padding: '6px 12px', fontWeight: 600 }}>소형와인셀러 (라인 B)</div>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>소형와인셀러</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}><MonitorChart data={displayData.B} /></div>
                        </ChartWrapper>
                      </MultiChartCard>
                  </ViewContainer>
                )}

                {viewMode === 3 && (
                  <ViewContainer key="view-3">
                      <MultiChartCard>
                        <VideoBox $isLarge={false}>
                          <VideoPlayer src={VIDEO_PATHS.A} />
                          <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.85rem', padding: '6px 12px', fontWeight: 600 }}>꼬모냉장고</div>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>꼬모냉장고</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}><MonitorChart data={displayData.A} /></div>
                        </ChartWrapper>
                      </MultiChartCard>
                      <MultiChartCard>
                        <VideoBox $isLarge={false}>
                          <VideoPlayer src={VIDEO_PATHS.B} />
                          <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.85rem', padding: '6px 12px', fontWeight: 600 }}>소형와인셀러</div>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>소형와인셀러</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}><MonitorChart data={displayData.B} /></div>
                        </ChartWrapper>
                      </MultiChartCard>
                      <MultiChartCard>
                        <VideoBox $isLarge={false}>
                          <VideoPlayer src={VIDEO_PATHS.C} />
                          <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.85rem', padding: '6px 12px', fontWeight: 600 }}>얼음정수기</div>
                        </VideoBox>
                        <ChartWrapper>
                           <ProcessLabel>얼음정수기</ProcessLabel>
                           <div style={{flex:1, marginTop: 8}}><MonitorChart data={displayData.C} /></div>
                        </ChartWrapper>
                      </MultiChartCard>
                  </ViewContainer>
                )}
            </ChartSection>

            <InfoSection>
              <KpiRow>
                <KpiCard $borderColor={COLORS.borderBlue}>
                  <div className="label">종합 가동률</div>
                  <div className="value">98.2%</div>
                  <div className="sub"><TrendingUp size={14} /> 목표 대비 +1.2%</div>
                </KpiCard>
                <KpiCard $borderColor={COLORS.borderGreen}>
                  <div className="label">현재 총 생산량</div>
                  <div className="value" style={{ color: COLORS.success }}>{totalProduction}</div>
                  <div className="sub" style={{ color: COLORS.success, background: '#F0FDF4' }}>실시간 집계 중</div>
                </KpiCard>
              </KpiRow>

              <WideKpiCard $height={viewMode === 1 ? 140 : viewMode === 2 ? 190 : 240}>
                {viewMode === 1 ? (
                  <TaktGrid $rows={1}>
                    <TaktBox $isSingle={true}>
                      <span className="line-name">평균 텍타임 (꼬모냉장고)</span>
                      <div className="val-group">
                        <span className="takt-val">{avgTakts.A}초</span>
                        <span className="diff"><TrendingDown size={14}/> 안정적</span>
                      </div>
                    </TaktBox>
                  </TaktGrid>
                ) : (
                  <TaktGrid $rows={viewMode}>
                    <TaktBox $isSingle={false}>
                      <span className="line-name">꼬모냉장고</span>
                      <div className="val-group">
                        <span className="takt-val">{avgTakts.A}s</span>
                      </div>
                    </TaktBox>
                    <TaktBox $isSingle={false}>
                      <span className="line-name">소형와인셀러</span>
                      <div className="val-group">
                        <span className="takt-val">{avgTakts.B}s</span>
                      </div>
                    </TaktBox>
                    {viewMode === 3 && (
                      <TaktBox $isSingle={false}>
                        <span className="line-name">얼음정수기</span>
                        <div className="val-group">
                          <span className="takt-val">{avgTakts.C}s</span>
                        </div>
                      </TaktBox>
                    )}
                  </TaktGrid>
                )}
              </WideKpiCard>

              <AlertSection>
                 <div className="header">
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <div style={{padding:6, background:'#FEF2F2', borderRadius:8}}><Bell color={COLORS.alert} size={18} /></div>
                      실시간 알림 로그
                    </div>
                    <div className="view-all" onClick={() => setShowLogModal(true)}><Maximize2 size={12} /> 전체 보기</div>
                 </div>
                 <div className="list-wrapper">
                    {alertLogs.slice(0, 5).map((log, idx) => (
                       <AlertItem key={idx} $type={log.type}>
                          <div className="dot" /><div className="content"><span className="msg">{log.msg}</span><span className="time">{log.time}</span></div>
                       </AlertItem>
                    ))}
                 </div>
              </AlertSection>
            </InfoSection>
          </DashboardBody>
        </MainContent>

        <AnimatePresence>
          {showLogModal && (
            <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogModal(false)}>
              <ModalContent 
                // @ts-ignore
                variants={modalVariants} initial="initial" animate="animate" exit="exit" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2><FileText size={28} color={COLORS.primary} /> 전체 알림 및 로그 내역</h2>
                  <button className="close-btn" onClick={() => setShowLogModal(false)}><X size={24} /></button>
                </div>
                <div className="modal-body">
                  <LogTable>
                    <thead><tr><th style={{width: '12%'}}>시간</th><th style={{width: '12%'}}>유형</th><th>메시지 내용</th><th style={{width: '12%'}}>상태</th></tr></thead>
                    <tbody>
                      {alertLogs.map((log, idx) => (
                        <tr key={idx}>
                          <td>{log.time}</td>
                          <td><span className={`type-badge ${log.type}`}><div className="dot"/>{log.type === 'error' ? '오류' : log.type === 'warning' ? '경고' : '정보'}</span></td>
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