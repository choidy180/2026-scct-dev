"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import styled, { keyframes, css, createGlobalStyle } from "styled-components";
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
  LabelList,
} from "recharts";
import {
  Camera,
  Activity,
  Settings,
  Cpu,
  Loader2,
  AlertTriangle,
  Bot,
  X,
  ChevronRight,
  Database,
  Server,
  Zap,
} from "lucide-react";

// --- [1. Type Definitions & Constants] ---

export interface ProcessData {
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

// 🔥 Missing Interface Added Here
interface ReferenceLabelProps {
  viewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  value?: string | number | number[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  showDetail?: boolean;
  type: "MES" | "AI";
}

interface ToggleProps {
  $isOn: boolean;
}

interface ColorProp {
  $themeColor?: "orange" | "sky";
}

const TARGET_TAKT_TIME = 100;
const AI_THRESHOLD = 80;
const X_AXIS_HEIGHT = 30;
const MARGIN = { top: 20, right: 20, left: 10, bottom: 0 };

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

// --- [2. Styled Components] ---

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Rajdhani:wght@600;700&display=swap');
  body { background-color: ${colors.bgPage}; margin: 0; padding: 0; font-family: 'Inter', sans-serif; color: ${colors.textMain}; overflow: hidden; }
`;

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const spinReverse = keyframes`from { transform: rotate(360deg); } to { transform: rotate(0deg); }`;
const pulse = keyframes`0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }`;
const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const blink = keyframes`0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.2); }`;
const popIn = keyframes`0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; }`;

// Loading Styles
const BootContainer = styled.div`position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: ${colors.bgPage}; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999;`;
const ScannerWrapper = styled.div`position: relative; width: 140px; height: 140px; display: flex; justify-content: center; align-items: center; margin-bottom: 40px;`;
const ScannerRing = styled.div<{ $size: number; $color: string; $reverse?: boolean }>`position: absolute; width: ${(props) => props.$size}px; height: ${(props) => props.$size}px; border: 2px solid transparent; border-top-color: ${(props) => props.$color}; border-left-color: ${(props) => props.$color}; border-radius: 50%; animation: ${(props) => (props.$reverse ? spinReverse : spin)} 1.5s linear infinite;`;
const DynamicIconWrapper = styled.div`color: ${colors.primaryDark}; z-index: 2; display: flex; justify-content: center; align-items: center; animation: ${popIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; filter: drop-shadow(0 0 15px ${colors.primaryLight});`;
const LoadingTextGroup = styled.div`display: flex; flex-direction: column; align-items: center; gap: 12px;`;
const MainLoadingText = styled.div`font-size: 1.5rem; font-weight: 800; color: ${colors.textMain}; letter-spacing: 1px;`;
const SubLoadingText = styled.div`font-size: 0.95rem; color: ${colors.textSub}; font-weight: 600; height: 20px;`;
const StyledProgressTrack = styled.div`width: 320px; height: 6px; background: #E5E7EB; border-radius: 99px; margin-top: 24px; overflow: hidden; position: relative;`;
const StyledProgressFill = styled.div<{ $width: number }>`height: 100%; background: ${colors.primaryDark}; width: ${(props) => props.$width}%; transition: width 0.3s ease-out; border-radius: 99px;`;

// Layout Styles
const PageLayout = styled.div<{ $visible: boolean }>`display: flex; width: 100vw; height: calc(100vh - 64px); overflow: hidden; background-color: ${colors.bgPage}; opacity: 0; ${(props) => props.$visible && css`animation: ${fadeIn} 0.8s ease-out forwards;`}`;
const SidebarContainer = styled.div`width: 90px; height: 100%; background-color: ${colors.bgPage}; border-right: 1px solid ${colors.gridLine}; display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 16px; z-index: 10; flex-shrink: 0;`;
const SidebarButton = styled.button<{ $active: boolean }>`width: 60px; height: 60px; border-radius: 12px; font-family: "Rajdhani", sans-serif; font-size: 1rem; font-weight: 700; cursor: pointer; background: ${colors.bgCard}; color: ${(props) => (props.$active ? colors.primaryDark : colors.textSub)}; border: 1px solid ${(props) => (props.$active ? colors.primaryDark : colors.gridLine)}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; &:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); color: ${colors.primaryDark}; border-color: ${colors.primaryDark}; } position: relative; overflow: hidden; &::after { content: ""; position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: ${(props) => props.$active ? colors.primaryDark : "transparent"}; }`;
const MainContent = styled.div`flex: 1; height: 100%; display: flex; flex-direction: column; padding: 20px; gap: 20px; overflow: hidden;`;
const TopChartWrapper = styled.div`flex: 1; min-height: 0; position: relative;`;
const BottomChartWrapper = styled.div`flex: 1; min-height: 0;`;
const TechCard = styled.div`background: ${colors.bgCard}; width: 100%; height: 100%; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex; flex-direction: row; align-items: stretch; position: relative; overflow: hidden; border: 1px solid ${colors.gridLine}; z-index: 1;`;
const InfoPanel = styled.div`width: 260px; border-right: 1px solid ${colors.gridLine}; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; flex-shrink: 0;`;
const MainChartPanel = styled.div`flex: 1; display: flex; flex-direction: column; padding: 24px; min-width: 0; position: relative;`;
const RightAlertPanel = styled.div`width: 260px; border-left: 1px solid ${colors.gridLine}; background-color: #FEF2F2; display: flex; flex-direction: column; flex-shrink: 0; animation: ${slideUp} 0.4s ease-out; .alert-header { padding: 16px; border-bottom: 1px solid ${colors.alertLight}; font-weight: 700; color: ${colors.alertDark}; font-size: 0.95rem; display: flex; align-items: center; justify-content: space-between; background: #fff; } .alert-body { flex: 1; overflow-y: auto; padding: 12px; &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; } }`;
const PulseDot = styled.div`width: 8px; height: 8px; background: ${colors.alertDark}; border-radius: 50%; animation: ${pulse} 1.5s infinite;`;
const HeaderGroup = styled.div<{ $themeColor?: "orange" | "sky" }>` .tag { display: inline-flex; align-items: center; gap: 10px; padding: 6px 12px; background: ${(props) => props.$themeColor === "sky" ? "#F0F9FF" : "#FFF7ED"}; color: ${(props) => props.$themeColor === "sky" ? colors.secondaryDark : colors.primaryDark}; font-weight: 700; font-size: 0.75rem; border-radius: 8px; margin-bottom: 16px; .dot { width: 8px; height: 8px; background: currentColor; border-radius: 50%; animation: ${blink} 3s infinite; } } h2 { font-family: "Inter", sans-serif; font-size: 2rem; font-weight: 800; color: ${colors.textMain}; margin: 0; line-height: 1.2; .sub-eng { display: block; font-size: 0.9rem; font-weight: 600; margin-top: 4px; color: ${(props) => props.$themeColor === "sky" ? colors.secondaryDark : colors.primaryDark}; } } .desc { font-size: 0.9rem; color: ${colors.textSub}; margin-top: 10px; font-weight: 500; }`;
const IconWrapper = styled.div<{ $themeColor?: "orange" | "sky" }>`width: 54px; height: 54px; background: linear-gradient(135deg, ${(props) => (props.$themeColor === "sky" ? "#F0F9FF" : "#FFF7ED")}, ${(props) => (props.$themeColor === "sky" ? "#E0F2FE" : "#FFEDD5")}); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: ${(props) => props.$themeColor === "sky" ? colors.secondaryDark : colors.primaryDark}; margin-bottom: 16px; box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.8); border: 1px solid ${(props) => (props.$themeColor === "sky" ? "#E0F2FE" : "#FFEDD5")};`;
const StatDisplay = styled.div`padding: 16px; border-radius: 12px; background: linear-gradient(to bottom right, #f9fafb, #f3f4f6); border: 1px solid ${colors.gridLine}; .label { font-size: 0.85rem; color: ${colors.textSub}; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; } .value { font-family: "Rajdhani", sans-serif; font-size: 2.4rem; font-weight: 700; color: ${colors.textMain}; line-height: 1; letter-spacing: -1px; span { font-size: 1rem; color: ${colors.textSub}; font-weight: 600; margin-left: 6px; } }`;
const ToggleWrapper = styled.div`display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid ${colors.gridLine}; span { font-size: 0.85rem; font-weight: 600; color: ${colors.textMain}; }`;
const ToggleSwitch = styled.button<{ $isOn: boolean }>`width: 44px; height: 24px; border-radius: 99px; background: ${(props) => (props.$isOn ? colors.primaryDark : "#E5E7EB")}; border: none; position: relative; cursor: pointer; transition: all 0.3s ease; &::after { content: ""; position: absolute; top: 3px; left: ${(props) => (props.$isOn ? "23px" : "3px")}; width: 18px; height: 18px; border-radius: 50%; background: white; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.3s; }`;
const LegendBox = styled.div`display: flex; gap: 20px; margin-bottom: 6px; justify-content: flex-end; padding-right: 20px; flex-shrink: 0; .item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; color: ${colors.textSub}; } .color-box { width: 10px; height: 10px; border-radius: 3px; }`;
const ChartArea = styled.div`flex: 1; min-height: 0; position: relative;`;
const TransitionOverlay = styled.div<{ $active: boolean }>`position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 16px; background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(8px); z-index: 50; opacity: ${(props) => (props.$active ? 1 : 0)}; pointer-events: ${(props) => (props.$active ? "all" : "none")}; transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; .spinner { color: ${colors.primaryDark}; animation: ${spin} 1s linear infinite; } .text { font-size: 0.95rem; font-weight: 600; color: ${colors.textMain}; letter-spacing: 0.5px; }`;
const AlertItem = styled.button`background: white; border: 1px solid ${colors.gridLine}; border-left: 4px solid ${colors.alertDark}; padding: 12px 14px; border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 8px; &:hover { background: #FFF1F2; transform: translateX(2px); box-shadow: 0 2px 8px rgba(0,0,0,0.05); } .name { font-weight: 700; font-size: 0.8rem; color: ${colors.textMain}; } .val { font-family: "Rajdhani"; font-weight: 800; color: ${colors.alertDark}; font-size: 0.9rem; }`;
const FixedAiInsightPanel = styled.div`position: fixed; bottom: 24px; right: 24px; width: 380px; background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); overflow: hidden; border: 1px solid ${colors.gridLine}; z-index: 1000; animation: ${slideUp} 0.4s cubic-bezier(0.16, 1, 0.3, 1); .header { background: ${colors.bgBlack}; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; color: white; .title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1rem; letter-spacing: 0.5px; } .close-btn { background: rgba(255, 255, 255, 0.15); border: none; width: 28px; height: 28px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; &:hover { background: rgba(255, 255, 255, 0.3); } } } .body { padding: 20px; display: flex; flex-direction: column; gap: 16px; } .ai-msg { display: flex; gap: 12px; .bot-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #F0F9FF, #E0F2FE); color: ${colors.secondaryDark}; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: inset 0 2px 4px rgba(255,255,255,0.8); } .bubble { background: #F9FAFB; padding: 14px; border-radius: 0 16px 16px 16px; font-size: 0.9rem; line-height: 1.5; color: ${colors.textMain}; border: 1px solid ${colors.gridLine}; strong { color: ${colors.alertDark}; font-weight: 700; background: #FEF2F2; padding: 0 4px; border-radius: 4px; } } } .stats { display: flex; gap: 10px; margin-top: 4px; .stat-box { flex: 1; background: #F8FAFC; border: 1px solid ${colors.gridLine}; border-radius: 10px; padding: 10px; text-align: center; .lbl { font-size: 0.75rem; color: ${colors.textSub}; margin-bottom: 4px; font-weight: 600; } .v { font-family: "Rajdhani"; font-weight: 700; font-size: 1.2rem; } } }`;
const StylishTooltip = styled.div`background: rgba(255, 255, 255, 0.98); border: 1px solid ${colors.gridLine}; padding: 16px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); min-width: 200px; .header { font-size: 0.9rem; font-weight: 700; color: ${colors.textSub}; margin-bottom: 12px; } .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem; font-weight: 500; } .key { display: flex; align-items: center; gap: 8px; color: ${colors.textSub}; } .val { font-family: "Rajdhani"; font-weight: 700; color: ${colors.textMain}; font-size: 1.1rem; } .divider { height: 1px; background: ${colors.gridLine}; margin: 10px 0; }`;

// --- [3. Helpers & Components] ---

const CustomTooltip = memo(({ active, payload, label, showDetail, type }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProcessData;
    return (
      <StylishTooltip>
        <div className="header">{label}</div>
        {type === "MES" && (
          <>
            <div className="row"><div className="key"><Activity size={14} color={colors.lineSolid} />생산량</div><div className="val" style={{ color: colors.lineSolid }}>{data.production}</div></div>
            <div className="divider" />
            <div className="row"><div className="key">총 택트 타임</div><div className="val" style={{ color: data.isOver ? colors.alertDark : colors.textMain }}>{data.taktTotal}초</div></div>
            {showDetail && (
              <div style={{ marginTop: 8, padding: 8, background: "#F8FAFC", borderRadius: 8 }}>
                <div className="row"><div className="key">조립</div><div className="val">{data.procAssembly}초</div></div>
                <div className="row"><div className="key">용접</div><div className="val">{data.procWelding}초</div></div>
                <div className="row"><div className="key">검사</div><div className="val">{data.procInspection}초</div></div>
              </div>
            )}
          </>
        )}
        {type === "AI" && (
          <div className="row"><div className="key">AI 점수</div><div className="val" style={{ color: colors.successDark }}>{data.aiVal}</div></div>
        )}
      </StylishTooltip>
    );
  }
  return null;
});
CustomTooltip.displayName = "CustomTooltip";

const ReferenceLabel = memo((props: ReferenceLabelProps) => {
  const { viewBox, value } = props;
  const { x, y, width } = viewBox || {};
  if (typeof x !== "number" || typeof y !== "number" || typeof width !== "number") return null;
  const text = value?.toString() || "";
  const rectWidth = text.length * 7 + 24; const rectHeight = 24; const margin = 6;
  const rectX = x + width - rectWidth; const rectY = y - rectHeight - margin;
  const textX = rectX + rectWidth / 2; const textY = rectY + rectHeight / 2 + 1;
  const filterId = `labelShadow-${value?.toString().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <g>
      <defs><filter id={filterId} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" /></filter></defs>
      <rect x={rectX} y={rectY} width={rectWidth} height={rectHeight} fill="rgba(0, 0, 0, 0.6)" rx={12} filter={`url(#${filterId})`} />
      <text x={textX} y={textY} fill={colors.textWhite} fontSize={11} fontWeight={700} textAnchor="middle" dominantBaseline="middle">{text}</text>
    </g>
  );
});
ReferenceLabel.displayName = "ReferenceLabel";

const CustomizedDot = (props: any) => {
  const { cx, cy } = props; const stroke = colors.lineSolid;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} stroke={stroke} strokeWidth={2} fill="#fff" style={{ filter: `drop-shadow(0 0 4px ${stroke}44)` }} />
      <circle cx={cx} cy={cy} r={2} fill={stroke} />
    </g>
  );
};

const generateRandomData = (groupName: string) => {
  const count = 16; const baseRandom = groupName.charCodeAt(2) % 10;
  return Array.from({ length: count }, (_, i) => {
    let taktTotal;
    if ((i + baseRandom) % 4 === 3) taktTotal = Math.floor(Math.random() * 30) + 120;
    else if ((i + baseRandom) % 5 === 0) taktTotal = Math.floor(Math.random() * 20) + 60;
    else taktTotal = Math.floor(Math.random() * 30) + 80;
    const production = Math.floor(Math.random() * 40) + 90 + baseRandom * 2;
    const p1 = Math.floor(taktTotal * 0.4); const p2 = Math.floor(taktTotal * 0.35); const p3 = taktTotal - p1 - p2;
    const aiRaw = Math.min(100, Math.floor(Math.random() * 40) + 60 + baseRandom);
    return {
      name: `Lot-${i + 1}`, taktTotal: taktTotal, taktBase: Math.min(taktTotal, TARGET_TAKT_TIME), taktOver: Math.max(0, taktTotal - TARGET_TAKT_TIME),
      procAssembly: p1, procWelding: p2, procInspection: p3, production: production, isOver: taktTotal > TARGET_TAKT_TIME,
      aiVal: aiRaw, aiBase: Math.min(aiRaw, AI_THRESHOLD), aiOver: Math.max(0, aiRaw - AI_THRESHOLD),
    };
  });
};

// --- [4. Sub-components (Memoized)] ---

const Sidebar = memo(({ activeGroup, onGroupChange, groups }: { activeGroup: string, onGroupChange: (g: string) => void, groups: string[] }) => (
  <SidebarContainer>
    {groups.map((group) => (
      <SidebarButton key={group} $active={activeGroup === group} onClick={() => onGroupChange(group)}>
        {group === "GR1" && <Database size={20} />}
        {group === "GR2" && <Server size={20} />}
        {group === "GR3" && <Activity size={20} />}
        {group === "GR4" && <Zap size={20} />}
        {group === "GR5" && <Settings size={20} />}
        {group}
      </SidebarButton>
    ))}
  </SidebarContainer>
));
Sidebar.displayName = "Sidebar";

const TopChart = memo(({ data, isTransitioning, showDetail, onDetailToggle, alertedLots, onLotClick, mesMax }: any) => (
  <TechCard>
    <TransitionOverlay $active={isTransitioning}>
      <Loader2 className="spinner" size={48} />
      <div className="text">UPDATING DATA...</div>
    </TransitionOverlay>

    <InfoPanel>
      <HeaderGroup $themeColor="orange">
        <div className="tag"><div className="dot" /> 시스템 가동 중</div>
        <IconWrapper $themeColor="orange"><Settings size={30} /></IconWrapper>
        <h2>공정 흐름도<br /><span className="sub-eng">(Process Flow)</span></h2>
        <div className="desc">택트 타임 및 생산량 분석</div>
      </HeaderGroup>
      <ToggleWrapper>
        <ToggleSwitch $isOn={showDetail} onClick={onDetailToggle} disabled={isTransitioning} style={{ cursor: isTransitioning ? "not-allowed" : "pointer" }} />
        <span>상세 공정 보기</span>
      </ToggleWrapper>
    </InfoPanel>

    <MainChartPanel>
      <LegendBox>
        <div className="item"><div className="color-box" style={{ background: colors.lineSolid }} />생산량</div>
        {!showDetail ? (
          <>
            <div className="item"><div className="color-box" style={{ background: colors.primaryDark }} />정상 택트</div>
            <div className="item"><div className="color-box" style={{ background: colors.alertDark }} />초과 택트</div>
          </>
        ) : (
          <>
            <div className="item"><div className="color-box" style={{ background: colors.processA }} />조립</div>
            <div className="item"><div className="color-box" style={{ background: colors.processB }} />용접</div>
            <div className="item"><div className="color-box" style={{ background: colors.processC }} />검사</div>
          </>
        )}
      </LegendBox>
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={MARGIN}>
            <defs>
              <linearGradient id="normalTakt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.primaryLight} stopOpacity={0.9} />
                <stop offset="100%" stopColor={colors.primaryDark} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="overTakt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FCA5A5" stopOpacity={0.9} />
                <stop offset="100%" stopColor={colors.alertDark} stopOpacity={1} />
              </linearGradient>
              <filter id="lineShadow" height="130%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
                <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gridLine} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} dy={12} tick={{ fill: colors.textSub, fontSize: 11, fontWeight: 600 }} height={X_AXIS_HEIGHT} />
            <YAxis domain={[0, mesMax] as [number, number]} hide padding={{ top: 0, bottom: 0 }} />
            <Tooltip content={<CustomTooltip showDetail={showDetail} type="MES" />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
            {!showDetail ? (
              <>
                <Bar dataKey="taktBase" stackId="takt" barSize={34}>
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill="url(#normalTakt)" radius={(entry.taktOver > 0 ? [0, 0, 6, 6] : [6, 6, 6, 6]) as any} />
                  ))}
                </Bar>
                <Bar dataKey="taktOver" stackId="takt" fill="url(#overTakt)" barSize={34} radius={[6, 6, 0, 0] as any} />
              </>
            ) : (
              <>
                <Bar dataKey="procAssembly" stackId="proc" fill={colors.processA} barSize={34} radius={[0, 0, 4, 4] as any}><LabelList dataKey="procAssembly" position="center" fill="#FFFFFF" fontSize={11} fontWeight="bold" /></Bar>
                <Bar dataKey="procWelding" stackId="proc" fill={colors.processB} barSize={34}><LabelList dataKey="procWelding" position="center" fill="#FFFFFF" fontSize={11} fontWeight="bold" /></Bar>
                <Bar dataKey="procInspection" stackId="proc" fill={colors.processC} barSize={34} radius={[4, 4, 0, 0] as any}><LabelList dataKey="procInspection" position="center" fill="#FFFFFF" fontSize={11} fontWeight="bold" /></Bar>
              </>
            )}
            <Line type="monotone" dataKey="production" stroke={colors.lineSolid} strokeWidth={3} filter="url(#lineShadow)" dot={CustomizedDot} activeDot={{ r: 7, strokeWidth: 0, fill: colors.textMain }} isAnimationActive={false} />
            <ReferenceLine y={TARGET_TAKT_TIME} stroke={colors.alertDark} strokeDasharray="4 2" strokeWidth={2} label={<ReferenceLabel value={`목표 택트 (${TARGET_TAKT_TIME}초)`} />} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartArea>
    </MainChartPanel>

    {!isTransitioning && alertedLots.length > 0 && (
      <RightAlertPanel>
        <div className="alert-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color={colors.alertDark} />
            지연 발생 ({alertedLots.length}건)
          </div>
          <PulseDot />
        </div>
        <div className="alert-body">
          {alertedLots.map((lot: any) => (
            <AlertItem key={lot.name} onClick={() => onLotClick(lot)}>
              <span className="name">{lot.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="val">{lot.taktTotal}s</span>
                <ChevronRight size={14} color={colors.textSub} />
              </div>
            </AlertItem>
          ))}
        </div>
      </RightAlertPanel>
    )}
  </TechCard>
));
TopChart.displayName = "TopChart";

const BottomChart = memo(({ data, aiMax }: any) => (
  <TechCard>
    <InfoPanel>
      <HeaderGroup $themeColor="sky">
        <div className="tag"><div className="dot" /> AI 분석 중</div>
        <IconWrapper $themeColor="sky"><Camera size={30} /></IconWrapper>
        <h2>AI 비전<br /><span className="sub-eng">(AI Vision)</span></h2>
        <div className="desc">실시간 품질 검사</div>
      </HeaderGroup>
      <StatDisplay>
        <div className="label">감지 정확도</div>
        <div className="value" style={{ color: colors.secondaryDark }}>99.8 <span>%</span></div>
      </StatDisplay>
    </InfoPanel>

    <MainChartPanel>
      <LegendBox>
        <div className="item"><div className="color-box" style={{ background: colors.successDark }} />정상 품질</div>
        <div className="item"><div className="color-box" style={{ background: colors.alertDark }} />결함 의심</div>
      </LegendBox>
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={MARGIN}>
            <defs>
              <linearGradient id="mintBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.successLight} stopOpacity={0.9} />
                <stop offset="100%" stopColor={colors.successDark} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gridLine} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} dy={12} tick={{ fill: colors.textSub, fontSize: 11, fontWeight: 600 }} height={X_AXIS_HEIGHT} />
            <YAxis domain={[0, aiMax] as [number, number]} hide padding={{ top: 0, bottom: 0 }} />
            <Tooltip content={<CustomTooltip type="AI" />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
            <Bar dataKey="aiBase" stackId="ai" barSize={34}>
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-ai-${index}`} fill="url(#mintBarGrad)" radius={(entry.aiOver > 0 ? [0, 0, 6, 6] : [6, 6, 6, 6]) as any} />
              ))}
            </Bar>
            <Bar dataKey="aiOver" stackId="ai" fill="url(#overTakt)" barSize={34} radius={[6, 6, 0, 0] as any} />
            <ReferenceLine y={AI_THRESHOLD} stroke={colors.alertDark} strokeDasharray="4 2" strokeWidth={2} label={<ReferenceLabel value={`결함 임계값 (${AI_THRESHOLD})`} />} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartArea>
    </MainChartPanel>
  </TechCard>
));
BottomChart.displayName = "BottomChart";

// --- [5. Main Component] ---

export default function ProcessDashboard() {
  const [data, setData] = useState<ProcessData[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0); 
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("GR1");
  const groups = useMemo(() => ["GR1", "GR2", "GR3", "GR4", "GR5"], []);
  const [selectedLot, setSelectedLot] = useState<ProcessData | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Handlers memoized
  const getAiAnalysis = useCallback((lot: ProcessData, allData: ProcessData[]) => {
    const avgAssy = allData.reduce((acc, cur) => acc + cur.procAssembly, 0) / allData.length;
    const avgWeld = allData.reduce((acc, cur) => acc + cur.procWelding, 0) / allData.length;
    const avgInsp = allData.reduce((acc, cur) => acc + cur.procInspection, 0) / allData.length;
    const diffAssy = ((lot.procAssembly - avgAssy) / avgAssy) * 100;
    const diffWeld = ((lot.procWelding - avgWeld) / avgWeld) * 100;
    const diffInsp = ((lot.procInspection - avgInsp) / avgInsp) * 100;
    let maxDiffVal = diffAssy; let maxDiffName = "조립";
    if (diffWeld > maxDiffVal) { maxDiffVal = diffWeld; maxDiffName = "용접"; }
    if (diffInsp > maxDiffVal) { maxDiffVal = diffInsp; maxDiffName = "검사"; }
    return (
      <>
        현재 해당 LOT는 전체 평균 대비 <strong>{maxDiffName} 공정</strong>이 <strong>{maxDiffVal.toFixed(1)}%</strong> 높게 측정되고 있습니다. 해당 공정 설비의 부하율을 점검해보시는 것을 추천드립니다.
      </>
    );
  }, []);

  const handleGroupChange = useCallback((group: string) => {
    if (isTransitioning || selectedGroup === group) return;
    setIsTransitioning(true); setShowAiModal(false);
    setTimeout(() => {
      setSelectedGroup(group); setData(generateRandomData(group));
      setTimeout(() => { setIsTransitioning(false); }, 400);
    }, 300);
  }, [isTransitioning, selectedGroup]);

  const handleDetailToggle = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setShowDetail((prev) => !prev);
      setTimeout(() => { setIsTransitioning(false); }, 400);
    }, 300);
  }, [isTransitioning]);

  const handleLotClick = useCallback((lot: ProcessData) => {
    setSelectedLot(lot); setShowAiModal(true);
  }, []);

  useEffect(() => {
    setLoadingStep(0);
    const timer1 = setTimeout(() => setLoadingStep(1), 1200);
    const timer2 = setTimeout(() => setLoadingStep(2), 2200);
    const timer3 = setTimeout(() => { setData(generateRandomData("GR1")); setIsLoading(false); }, 3500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, []);

  const mesMax = useMemo(() => {
    if (!data.length) return 150;
    const maxVal = Math.max(...data.map((d) => Math.max(d.taktTotal, d.production)));
    return Math.ceil(Math.max(maxVal, TARGET_TAKT_TIME * 1.8) / 10) * 10;
  }, [data]);

  const aiMax = useMemo(() => {
    if (!data.length) return 120;
    return Math.ceil(Math.max(...data.map((d) => d.aiVal), AI_THRESHOLD * 1.5) / 10) * 10;
  }, [data]);

  const alertedLots = useMemo(() => data.filter((d) => d.isOver), [data]);

  return (
    <>
      <GlobalStyle />
      {isLoading && (
        <BootContainer>
          <ScannerWrapper>
            <ScannerRing $size={120} $color={colors.primaryLight} />
            <ScannerRing $size={100} $color={colors.primaryDark} $reverse />
            <DynamicIconWrapper key={loadingStep}>
              {loadingStep === 0 && <Cpu size={48} />}
              {loadingStep === 1 && <Database size={48} />}
              {loadingStep === 2 && <Zap size={48} />}
            </DynamicIconWrapper>
          </ScannerWrapper>
          <LoadingTextGroup>
            <MainLoadingText>
              {loadingStep === 0 && "시스템 초기화 중..."}
              {loadingStep === 1 && "데이터 동기화 중..."}
              {loadingStep === 2 && "AI 모듈 보정 중..."}
            </MainLoadingText>
            <SubLoadingText>
              {loadingStep === 0 && "보안 연결 확인 중..."}
              {loadingStep === 1 && "실시간 공정 로그 수집 중..."}
              {loadingStep === 2 && "시각화 컴포넌트 구성 중..."}
            </SubLoadingText>
          </LoadingTextGroup>
          <StyledProgressTrack><StyledProgressFill $width={(loadingStep + 1) * 33.3} /></StyledProgressTrack>
        </BootContainer>
      )}

      {showAiModal && selectedLot && (
        <FixedAiInsightPanel onClick={(e) => e.stopPropagation()}>
          <div className="header">
            <div className="title"><Bot size={20} /> AI Analysis</div>
            <button className="close-btn" onClick={() => setShowAiModal(false)}><X size={18} /></button>
          </div>
          <div className="body">
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: colors.textMain }}>{selectedLot.name} 상세 분석</div>
            <div className="ai-msg">
              <div className="bot-icon"><Bot size={24} /></div>
              <div className="bubble">{getAiAnalysis(selectedLot, data)}</div>
            </div>
            <div className="stats">
              <div className="stat-box"><div className="lbl">총 소요</div><div className="v" style={{ color: colors.alertDark }}>{selectedLot.taktTotal}s</div></div>
              <div className="stat-box"><div className="lbl">목표 대비</div><div className="v">+{selectedLot.taktTotal - TARGET_TAKT_TIME}s</div></div>
            </div>
          </div>
        </FixedAiInsightPanel>
      )}

      {!isLoading && (
        <PageLayout $visible={!isLoading}>
          <Sidebar activeGroup={selectedGroup} onGroupChange={handleGroupChange} groups={groups} />
          <MainContent>
            <TopChartWrapper>
              <TopChart 
                data={data} 
                isTransitioning={isTransitioning} 
                showDetail={showDetail} 
                onDetailToggle={handleDetailToggle} 
                alertedLots={alertedLots} 
                onLotClick={handleLotClick} 
                mesMax={mesMax} 
              />
            </TopChartWrapper>
            <BottomChartWrapper>
              <BottomChart data={data} aiMax={aiMax} />
            </BottomChartWrapper>
          </MainContent>
        </PageLayout>
      )}
    </>
  );
}