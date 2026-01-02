"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";
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
import { ScanBarcode, Camera, Activity, Settings } from "lucide-react";

// --- [1. Type Definitions] 타입 정의 ---

interface ProcessData {
  name: string;
  taktTotal: number;
  taktBase: number;
  taktOver: number;
  procAssembly: number;
  procWelding: number;
  procInspection: number;
  production: number;
  isOver: boolean;
  aiVal: number;
  aiBase: number;
  aiOver: number;
}

interface ColorProp {
  $themeColor?: "orange" | "sky";
}

interface ToggleProps {
  $isOn: boolean;
}

// [Fix] Tooltip Props 타입 재정의 (Recharts 타입 충돌 방지)
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[]; // Recharts payload는 복잡하므로 any[]로 받아 내부에서 캐스팅
  label?: string;
  showDetail?: boolean;
  type: "MES" | "AI";
}

// --- [2. Settings] 설정값 ---
const TARGET_TAKT_TIME = 100;
const AI_THRESHOLD = 80;
const X_AXIS_HEIGHT = 30;
const MARGIN = { top: 20, right: 20, left: 20, bottom: X_AXIS_HEIGHT };

const colors = {
  bgPage: "#F8F9FA",
  bgCard: "#FFFFFF",
  primaryDark: "#F97316",
  primaryLight: "#FFEDD5",
  secondaryDark: "#0EA5E9",
  secondaryLight: "#E0F2FE",
  lineSolid: "#C2410C",
  alertDark: "#EF4444",
  alertLight: "#FCA5A5",
  successDark: "#10B981",
  successLight: "#6EE7B7",
  processA: "#3B82F6",
  processB: "#10B981",
  processC: "#8B5CF6",
  textMain: "#1F2937",
  textSub: "#6B7280",
  gridLine: "#E5E7EB",
  bgBlack: "#111827",
  textWhite: "#FFFFFF",
};

// --- [3. Styled Components] ---

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@600;700&display=swap');
  
  body {
    background-color: ${colors.bgPage};
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    color: ${colors.textMain};
    -webkit-font-smoothing: antialiased;
  }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
`;

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 48px;
  display: flex;
  flex-direction: column;
  gap: 48px;
  align-items: center;
`;

const TechCard = styled.div`
  background: ${colors.bgCard};
  width: 100%;
  max-width: 1280px;
  height: 540px;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  border: 1px solid ${colors.gridLine};
`;

const InfoPanel = styled.div`
  width: 280px;
  border-right: 1px solid ${colors.gridLine};
  padding-right: 40px;
  margin-right: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const HeaderGroup = styled.div<ColorProp>`
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    background: ${(props) =>
      props.$themeColor === "sky" ? "#F0F9FF" : "#FFF7ED"};
    color: ${(props) =>
      props.$themeColor === "sky" ? colors.secondaryDark : colors.primaryDark};
    font-weight: 700;
    font-size: 0.75rem;
    border-radius: 8px;
    margin-bottom: 24px;

    .dot {
      width: 8px;
      height: 8px;
      background: ${(props) =>
        props.$themeColor === "sky"
          ? colors.secondaryDark
          : colors.primaryDark};
      border-radius: 50%;
      animation: ${blink} 3s infinite;
    }
  }

  h2 {
    font-family: "Inter", sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    color: ${colors.textMain};
    margin: 0;
    line-height: 1.2;
  }

  .desc {
    font-size: 1rem;
    color: ${colors.textSub};
    margin-top: 16px;
    font-weight: 500;
  }
`;

const IconWrapper = styled.div<ColorProp>`
  width: 64px;
  height: 64px;
  background: linear-gradient(
    135deg,
    ${(props) => (props.$themeColor === "sky" ? "#F0F9FF" : "#FFF7ED")},
    ${(props) => (props.$themeColor === "sky" ? "#E0F2FE" : "#FFEDD5")}
  );
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.$themeColor === "sky" ? colors.secondaryDark : colors.primaryDark};
  margin-bottom: 24px;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.8);
  border: 1px solid
    ${(props) => (props.$themeColor === "sky" ? "#E0F2FE" : "#FFEDD5")};
`;

const StatDisplay = styled.div`
  padding: 24px;
  border-radius: 12px;
  background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
  border: 1px solid ${colors.gridLine};

  .label {
    font-size: 0.9rem;
    color: ${colors.textSub};
    font-weight: 600;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .value {
    font-family: "Rajdhani", sans-serif;
    font-size: 2.8rem;
    font-weight: 700;
    color: ${colors.textMain};
    line-height: 1;
    letter-spacing: -1px;

    span {
      font-size: 1.2rem;
      color: ${colors.textSub};
      font-weight: 600;
      margin-left: 6px;
    }
  }
`;

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid ${colors.gridLine};
  span {
    font-size: 0.9rem;
    font-weight: 600;
    color: ${colors.textMain};
  }
`;

const ToggleSwitch = styled.button<ToggleProps>`
  width: 48px;
  height: 26px;
  border-radius: 99px;
  background: ${(props) => (props.$isOn ? colors.primaryDark : "#E5E7EB")};
  border: none;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: ${(props) => (props.$isOn ? "25px" : "3px")};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
  }
`;

const ChartContent = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const LegendBox = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  justify-content: flex-end;
  padding-right: 20px;
  flex-shrink: 0;

  .item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: ${colors.textSub};
  }
  .color-box {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
`;

const ChartArea = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;

// --- [4. Custom Components] ---

// [Fix] 기준선 라벨: 좌표 계산 로직 완전 수정 (배경과 텍스트 정렬 일치)
const CustomReferenceLabel = (props: any) => {
  const { viewBox, value } = props;
  const { x, y, width } = viewBox; // y는 기준선의 픽셀 위치
  const text = value.toString();

  // 배지(Badge) 크기 설정
  const rectWidth = text.length * 7 + 24;
  const rectHeight = 24;
  const margin = 6; // 기준선에서 띄울 간격

  // 배지의 위치 계산 (기준선 바로 위에 위치)
  // top = 기준선y - 배지높이 - 마진
  const rectY = y - rectHeight - margin;
  const rectX = x + width - rectWidth;

  // 텍스트 위치 계산 (배지의 정중앙)
  const textX = rectX + rectWidth / 2;
  const textY = rectY + rectHeight / 2 + 1; // +1은 시각적 보정

  return (
    <g>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="1"
            floodColor="#000000"
            floodOpacity="0.15"
          />
        </filter>
      </defs>
      {/* 배경 박스 */}
      <rect
        x={rectX}
        y={rectY}
        width={rectWidth}
        height={rectHeight}
        fill={colors.alertDark}
        rx={12} // 둥근 알약 모양
        filter="url(#shadow)"
      />
      {/* 텍스트 (흰색, 중앙 정렬) */}
      <text
        x={textX}
        y={textY}
        fill={colors.textWhite}
        fontSize={11}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="middle" // 수직 중앙 정렬 핵심
      >
        {text}
      </text>
    </g>
  );
};

const StylishTooltip = styled.div`
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid ${colors.gridLine};
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  min-width: 200px;
  .header {
    font-size: 0.9rem;
    font-weight: 700;
    color: ${colors.textSub};
    margin-bottom: 12px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 0.9rem;
    font-weight: 500;
  }
  .key {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${colors.textSub};
  }
  .val {
    font-family: "Rajdhani";
    font-weight: 700;
    color: ${colors.textMain};
    font-size: 1.1rem;
  }
  .divider {
    height: 1px;
    background: ${colors.gridLine};
    margin: 10px 0;
  }
`;

const CustomTooltip = ({
  active,
  payload,
  label,
  showDetail,
  type,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProcessData;
    return (
      <StylishTooltip>
        <div className="header">{label}</div>
        {type === "MES" && (
          <>
            <div className="row">
              <div className="key">
                <Activity size={14} color={colors.lineSolid} />
                생산량
              </div>
              <div className="val" style={{ color: colors.lineSolid }}>
                {data.production}
              </div>
            </div>
            <div className="divider" />
            <div className="row">
              <div className="key">총 택트 타임</div>
              <div
                className="val"
                style={{
                  color: data.isOver ? colors.alertDark : colors.textMain,
                }}
              >
                {data.taktTotal}초
              </div>
            </div>
            {showDetail && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: "#F8FAFC",
                  borderRadius: 8,
                }}
              >
                <div className="row">
                  <div className="key">조립</div>
                  <div className="val">{data.procAssembly}초</div>
                </div>
                <div className="row">
                  <div className="key">용접</div>
                  <div className="val">{data.procWelding}초</div>
                </div>
                <div className="row">
                  <div className="key">검사</div>
                  <div className="val">{data.procInspection}초</div>
                </div>
              </div>
            )}
          </>
        )}
        {type === "AI" && (
          <div className="row">
            <div className="key">AI 점수</div>
            <div className="val" style={{ color: colors.successDark }}>
              {data.aiVal}
            </div>
          </div>
        )}
      </StylishTooltip>
    );
  }
  return null;
};

const CustomizedDot = (props: any) => {
  const { cx, cy } = props;
  const stroke = colors.lineSolid;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={5}
        stroke={stroke}
        strokeWidth={2}
        fill="#fff"
        style={{ filter: `drop-shadow(0 0 4px ${stroke}44)` }}
      />
      <circle cx={cx} cy={cy} r={2} fill={stroke} />
    </g>
  );
};

// --- [5. Main Component] ---

export default function ProcessDashboard() {
  const [data, setData] = useState<ProcessData[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    // [Fix] 데이터 생성 로직 개선 (Spike Data + Low Data 혼합)
    const count = 16;
    const newData = Array.from({ length: count }, (_, i) => {
      let taktTotal;

      // 데이터 패턴 다양화
      if (i % 4 === 3) {
        // Spike (기준 초과)
        taktTotal = Math.floor(Math.random() * 30) + 120;
      } else if (i % 5 === 0) {
        // Drop (아주 양호)
        taktTotal = Math.floor(Math.random() * 20) + 60;
      } else {
        // Normal (기준 전후)
        taktTotal = Math.floor(Math.random() * 30) + 80;
      }

      const production = Math.floor(Math.random() * 40) + 90;
      const p1 = Math.floor(taktTotal * 0.4);
      const p2 = Math.floor(taktTotal * 0.35);
      const p3 = taktTotal - p1 - p2;
      const aiRaw = Math.floor(Math.random() * 40) + 60;

      return {
        name: `Lot-${i + 1}`,
        taktTotal: taktTotal,
        taktBase: Math.min(taktTotal, TARGET_TAKT_TIME),
        taktOver: Math.max(0, taktTotal - TARGET_TAKT_TIME),
        procAssembly: p1,
        procWelding: p2,
        procInspection: p3,
        production: production,
        isOver: taktTotal > TARGET_TAKT_TIME,
        aiVal: aiRaw,
        aiBase: Math.min(aiRaw, AI_THRESHOLD),
        aiOver: Math.max(0, aiRaw - AI_THRESHOLD),
      };
    });
    setData(newData);
  }, []);

  const mesMax = useMemo(() => {
    if (!data.length) return 150;
    const maxVal = Math.max(
      ...data.map((d) => Math.max(d.taktTotal, d.production))
    );
    // [Fix] 1.8배로 설정하여 상단 여백 확보 (기준선 위치 밸런싱)
    return Math.ceil(Math.max(maxVal, TARGET_TAKT_TIME * 1.8) / 10) * 10;
  }, [data]);

  const aiMax = useMemo(() => {
    if (!data.length) return 120;
    return (
      Math.ceil(Math.max(...data.map((d) => d.aiVal), AI_THRESHOLD * 1.5) / 10) * 10
    );
  }, [data]);

  if (!data.length) return <Container>로딩 중...</Container>;

  return (
    <>
      <GlobalStyle />
      <Container>
        {/* --- 1. 생산 공정 차트 --- */}
        <TechCard>
          <InfoPanel>
            <div>
              <HeaderGroup $themeColor="orange">
                <div className="tag">
                  <div className="dot" /> 시스템 가동 중
                </div>
                <IconWrapper $themeColor="orange">
                  <Settings size={30} />
                </IconWrapper>
                <h2>
                  공정 흐름도
                  <br />
                  (Process Flow)
                </h2>
                <div className="desc">택트 타임 및 생산량 분석</div>
              </HeaderGroup>
            </div>
            <ToggleWrapper>
              <ToggleSwitch
                $isOn={showDetail}
                onClick={() => setShowDetail(!showDetail)}
              />
              <span>상세 공정 보기</span>
            </ToggleWrapper>
          </InfoPanel>

          <ChartContent>
            <LegendBox>
              <div className="item">
                <div
                  className="color-box"
                  style={{ background: colors.lineSolid }}
                />
                생산량
              </div>
              {!showDetail && (
                <div className="item">
                  <div
                    className="color-box"
                    style={{ background: colors.primaryDark }}
                  />
                  정상 택트
                </div>
              )}
              {!showDetail && (
                <div className="item">
                  <div
                    className="color-box"
                    style={{ background: colors.alertDark }}
                  />
                  초과 택트
                </div>
              )}
            </LegendBox>

            <ChartArea>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={MARGIN}>
                  <defs>
                    <linearGradient id="normalTakt" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={colors.primaryLight}
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.primaryDark}
                        stopOpacity={1}
                      />
                    </linearGradient>
                    <linearGradient id="overTakt" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#FCA5A5"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.alertDark}
                        stopOpacity={1}
                      />
                    </linearGradient>
                    <filter id="lineShadow" height="130%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                      <feOffset dx="0" dy="2" result="offsetblur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={colors.gridLine}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    dy={12}
                    tick={{
                      fill: colors.textSub,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    height={X_AXIS_HEIGHT}
                  />
                  <YAxis
                    domain={[0, mesMax]}
                    hide
                    padding={{ top: 0, bottom: 0 }}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip showDetail={showDetail} type="MES" />
                    }
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                  />

                  {/* Bar Chart */}
                  {!showDetail ? (
                    <>
                      <Bar dataKey="taktBase" stackId="takt" barSize={34}>
                        {data.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill="url(#normalTakt)"
                            // [Fix] 기준선 미달이면 전체 둥글게, 초과면 아래만 둥글게
                            radius={
                              entry.taktOver > 0 ? [0, 0, 6, 6] : [6, 6, 6, 6]
                            }
                          />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="taktOver"
                        stackId="takt"
                        fill="url(#overTakt)"
                        barSize={34}
                        radius={[6, 6, 0, 0]}
                      />
                    </>
                  ) : (
                    <>
                      <Bar
                        dataKey="procAssembly"
                        stackId="proc"
                        fill={colors.processA}
                        barSize={34}
                        radius={[0, 0, 4, 4]}
                      />
                      <Bar
                        dataKey="procWelding"
                        stackId="proc"
                        fill={colors.processB}
                        barSize={34}
                      />
                      <Bar
                        dataKey="procInspection"
                        stackId="proc"
                        fill={colors.processC}
                        barSize={34}
                        radius={[4, 4, 0, 0]}
                      />
                    </>
                  )}

                  {/* Line Chart */}
                  <Line
                    type="monotone"
                    dataKey="production"
                    stroke={colors.lineSolid}
                    strokeWidth={3}
                    filter="url(#lineShadow)"
                    dot={CustomizedDot}
                    activeDot={{ r: 7, strokeWidth: 0, fill: colors.textMain }}
                    isAnimationActive={false}
                  />

                  {/* [Fix] 기준선: JSX 마지막에 배치하여 Z-Index 상위 확보 (isFront 제거) */}
                  <ReferenceLine
                    y={TARGET_TAKT_TIME}
                    stroke={colors.alertDark}
                    strokeDasharray="4 2"
                    strokeWidth={2}
                    label={
                      <CustomReferenceLabel
                        value={`목표 택트 (${TARGET_TAKT_TIME}초)`}
                      />
                    }
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartArea>
          </ChartContent>
        </TechCard>

        {/* --- 2. AI 비전 차트 --- */}
        <TechCard style={{ height: "460px" }}>
          <InfoPanel>
            <HeaderGroup $themeColor="sky">
              <div className="tag">
                <div className="dot" /> AI 분석 중
              </div>
              <IconWrapper $themeColor="sky">
                <Camera size={30} />
              </IconWrapper>
              <h2>
                AI 비전
                <br />
                (AI Vision)
              </h2>
              <div className="desc">실시간 품질 검사</div>
            </HeaderGroup>
            <StatDisplay>
              <div className="label">감지 정확도</div>
              <div className="value" style={{ color: colors.secondaryDark }}>
                99.8 <span>%</span>
              </div>
            </StatDisplay>
          </InfoPanel>

          <ChartContent>
            <LegendBox>
              <div className="item">
                <div
                  className="color-box"
                  style={{ background: colors.successDark }}
                />
                정상 품질
              </div>
              <div className="item">
                <div
                  className="color-box"
                  style={{ background: colors.alertDark }}
                />
                결함 의심
              </div>
            </LegendBox>
            <ChartArea>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={MARGIN}>
                  <defs>
                    <linearGradient
                      id="mintBarGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={colors.successLight}
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor={colors.successDark}
                        stopOpacity={1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={colors.gridLine}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    dy={12}
                    tick={{
                      fill: colors.textSub,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    height={X_AXIS_HEIGHT}
                  />
                  <YAxis
                    domain={[0, aiMax]}
                    hide
                    padding={{ top: 0, bottom: 0 }}
                  />
                  <Tooltip
                    content={<CustomTooltip type="AI" />}
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                  />

                  {/* AI Bar Chart */}
                  <Bar dataKey="aiBase" stackId="ai" barSize={34}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-ai-${index}`}
                        fill="url(#mintBarGrad)"
                        radius={entry.aiOver > 0 ? [0, 0, 6, 6] : [6, 6, 6, 6]}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="aiOver"
                    stackId="ai"
                    fill="url(#overTakt)"
                    barSize={34}
                    radius={[6, 6, 0, 0]}
                  />

                  {/* AI Reference Line */}
                  <ReferenceLine
                    y={AI_THRESHOLD}
                    stroke={colors.alertDark}
                    strokeDasharray="4 2"
                    strokeWidth={2}
                    label={
                      <CustomReferenceLabel
                        value={`결함 임계값 (${AI_THRESHOLD})`}
                      />
                    }
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartArea>
          </ChartContent>
        </TechCard>
      </Container>
    </>
  );
}