"use client";

import React, { useState, Suspense, useRef, useMemo, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import {
  useGLTF,
  Stage,
  OrbitControls,
  Html,
  Center,
  Environment
} from "@react-three/drei";
import {
  TrendingUp,
  Layers,
  AlertTriangle,
  LayoutDashboard,
  Settings,
  XCircle,
  Activity,
  Zap,
  Cpu,
  Thermometer,
  Gauge,
  Bot,
  CheckCircle,
  Database,
  BarChart3,
  ScanLine,
  Droplets,
  Siren, 
  Octagon,
  Wrench,
  AlertOctagon
} from "lucide-react";
import * as THREE from "three";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

// -----------------------------------------------------------------------------
// [설정 및 목업 데이터]

// 연간 데이터
const ANNUAL_DATA = [
  { name: 'Jan', inspection: 14000, error: 120, rate: 0.8 },
  { name: 'Feb', inspection: 13500, error: 98, rate: 0.7 },
  { name: 'Mar', inspection: 15000, error: 150, rate: 1.0 },
  { name: 'Apr', inspection: 14200, error: 110, rate: 0.77 },
  { name: 'May', inspection: 16000, error: 180, rate: 1.1 },
  { name: 'Jun', inspection: 15500, error: 140, rate: 0.9 },
  { name: 'Jul', inspection: 16200, error: 130, rate: 0.8 },
  { name: 'Aug', inspection: 15800, error: 125, rate: 0.79 },
  { name: 'Sep', inspection: 17000, error: 160, rate: 0.94 },
  { name: 'Oct', inspection: 18000, error: 110, rate: 0.6 },
  { name: 'Nov', inspection: 17500, error: 145, rate: 0.82 },
  { name: 'Dec', inspection: 19000, error: 130, rate: 0.68 },
];

const MOTOR_DATA = [
  { time: '1s', load: 45 },
  { time: '2s', load: 52 },
  { time: '3s', load: 48 },
  { time: '4s', load: 70 },
  { time: '5s', load: 65 },
  { time: '6s', load: 58 },
  { time: '7s', load: 42 },
  { time: '8s', load: 45 },
];

const JIG_MODEL_PATH = "/models/final_final_final.glb";
const FLOOR_MODEL_PATH = "/models/final_final_final_final.glb";
const FACTORY_BG_IMAGE = "/images/gmt_back.png"; 
const API_URL = "http://1.254.24.170:24828/api/DX_API000024";

const THEME = {
  primary: "#10b981",
  secondary: "#3b82f6",
  danger: "#ef4444",
  warning: "#f59e0b",
  textMain: "#1e293b",
  textSub: "#64748b",
  whiteCard: "rgba(255, 255, 255, 0.85)",
  accent: "#6366f1",
  bg: '#F3F4F6',
  border: '#E5E7EB',
  success: '#10B981',
  successBg: '#D1FAE5',
  dangerBg: '#FEE2E2',
};

const ERROR_REASONS = [
    { problem: "냉각수 압력 저하", solution: "밸브 #3 개방 및 유량 체크" },
    { problem: "서보 모터 과부하", solution: "베어링 오일 보충" },
    { problem: "광학 센서 오작동", solution: "렌즈 이물질 제거" },
    { problem: "입력 전압 불안정", solution: "PSU 모듈 교체" },
    { problem: "PLC 응답 지연", solution: "통신 케이블 점검" },
    { problem: "유압 실린더 누유", solution: "실린더 패킹 교체" },
    { problem: "코어 온도 과열", solution: "냉각 팬 RPM 증가" },
    { problem: "위치 제어 편차", solution: "서보 모터 영점 조정" }
];

// -----------------------------------------------------------------------------
// [Types]

interface ApiDataItem {
  대차번호: string;
  INTCART: number;
  시리얼번호: string;
  모델번호: string;
  TIMEVALUE: string;
  "R액 압력(kg/㎥)": string; 
  "P액 압력(kg/㎥)": string;
  "R액 유량(g)": string;
  "P액 유량(g)": string;
  "유량 비율(P/R)": string;
  "R액 탱크온도(℃)": string;
  "P액 탱크온도(℃)": string;
  "R액 헤드온도(℃)": string;
  "P액 헤드온도(℃)": string;
  "온조#1리턴온도(℃)": string;
  "온조#2리턴온도(℃)": string;
  "온조#1공급수압력(kg/㎥)": string;
  "온조#2공급수압력(kg/㎥)": string;
  "발포시간(초)": string;
  "가조립무게(g)": string;
  "가조립온도(℃)": string;
  "삽입주변온도(℃)": string;
  "지그상판온도(℃)": string;
  "지그하판온도(℃)": string;
  "취출경화시간(초)": string;
  "취출무게(g)": string;
  "취출주변온도(℃)": string;
  FILENAME1: string;
  AI_TIME_STR: string;
  AI_LABEL: string;
  FILEPATH1: string;
  [key: string]: any; 
}

interface UnitData {
  name: string;
  temp: number;
  load: number;
  status: 'normal' | 'error';
  uuid?: string;
  problem?: string;
  solution?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// -----------------------------------------------------------------------------
// [Animations & Styles]
const slideInRight = keyframes` from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } `;
const slideInLeft = keyframes` from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } `;
const slideUp = keyframes` from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } `;
const slideDown = keyframes` from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } `;
const float = keyframes` 0% { transform: translateY(0px) translateX(-50%); } 50% { transform: translateY(-5px) translateX(-50%); } 100% { transform: translateY(0px) translateX(-50%); } `;
const blink = keyframes` 50% { opacity: 0; } `;
const emergencyBlink = keyframes` 
  0%, 100% { box-shadow: inset 0 0 50px rgba(239, 68, 68, 0.2); background-color: rgba(50, 0, 0, 0.3); } 
  50% { box-shadow: inset 0 0 150px rgba(239, 68, 68, 0.6); background-color: rgba(50, 0, 0, 0.6); } 
`;
const textGlow = keyframes` 0%, 100% { text-shadow: 0 0 10px rgba(255, 0, 0, 0.5); } 50% { text-shadow: 0 0 20px rgba(255, 0, 0, 1), 0 0 40px rgba(255, 0, 0, 0.8); } `;
const soundWave = keyframes` 0% { height: 10%; } 50% { height: 100%; } 100% { height: 10%; } `;
const modalPop = keyframes` from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } `;

const PageContainer = styled.div` display: flex; flex-direction: column; width: 100%; height: calc(100vh - 64px); background-image: url('${FACTORY_BG_IMAGE}'); background-size: cover; background-position: center; background-repeat: no-repeat; background-color: #0f172a; color: #f8fafc; font-family: 'Pretendard', sans-serif; overflow: hidden; position: relative; &::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 15, 30, 0.85); z-index: 0; pointer-events: none; } `;
const MainContent = styled.main` flex: 1; width: 100%; height: 100%; position: relative; z-index: 10; `;
const ViewerContainer = styled.div` width: 100%; height: 100%; padding-top: 4rem; position: relative; isolation: isolate; `;
const GlassPanel = styled.div` position: fixed; background: ${THEME.whiteCard}; backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.6); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; z-index: 20; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); pointer-events: auto; color: ${THEME.textMain}; font-family: 'Pretendard', sans-serif; will-change: transform; `;
const TopRightPanel = styled(GlassPanel)` top: 5rem; right: 1.5rem; width: 320px; height: 280px; animation: ${slideInRight} 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; `;
const DefectStatusPanel = styled(GlassPanel)` top: calc(5rem + 280px + 15px); right: 1.5rem; width: 320px; min-height: 160px; animation: ${slideInRight} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards; border-left: 4px solid ${THEME.danger}; `;
const BottomLeftPanel = styled(GlassPanel)` bottom: 1.5rem; left: 1.5rem; width: 320px; height: 260px; animation: ${slideInLeft} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards; opacity: 0; animation-fill-mode: forwards; `;
const VisionAnalysisPanel = styled(GlassPanel)` bottom: 1.5rem; left: calc(1.5rem + 320px + 15px); width: 240px; animation: ${slideInLeft} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards; opacity: 0; animation-fill-mode: forwards; padding: 0; overflow: hidden; `;
const HoverInfoPanel = styled(GlassPanel)` top: 5rem; left: 1.5rem; width: 260px; padding: 14px; animation: ${slideDown} 0.3s cubic-bezier(0.16, 1, 0.3, 1); border-left: 4px solid transparent; transition: border-color 0.3s ease, box-shadow 0.3s ease; will-change: transform, border-color; `;
const AIAdvisorPanel = styled.div` position: fixed; bottom: calc(1.5rem + 260px + 15px); left: 1.5rem; width: 320px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(24px); border-radius: 20px; box-shadow: 0 20px 50px rgba(99, 102, 241, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid rgba(255, 255, 255, 0.8); padding: 0; overflow: hidden; z-index: 25; animation: ${slideUp} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); display: flex; flex-direction: column; font-family: 'Pretendard', sans-serif; will-change: transform; `;
const AIHeader = styled.div` background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%); padding: 12px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(0, 0, 0, 0.03); `;
const AIBody = styled.div` padding: 16px; position: relative; `;
const AIMessage = styled.div` font-size: 14px; line-height: 1.6; color: ${THEME.textMain}; font-weight: 500; `;
const WaveBar = styled.div<{ $delay: number }>` width: 4px; height: 100%; background: ${THEME.accent}; border-radius: 2px; animation: ${soundWave} 1s ease-in-out infinite; animation-delay: ${(p) => p.$delay}s; `;
const BlinkingCursor = styled.span` display: inline-block; width: 2px; height: 14px; background-color: ${THEME.accent}; margin-left: 4px; vertical-align: middle; animation: ${blink} 1s step-end infinite; `;
const InfoRow = styled.div` display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(0, 0, 0, 0.05); &:last-child { border-bottom: none; } .label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${THEME.textSub}; font-weight: 500; } .value { font-family: 'Pretendard', sans-serif; font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 700; color: ${THEME.textMain}; } .status { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; } `;
const ChartHeader = styled.div` display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; `;
const ChartTitle = styled.div` font-size: 15px; font-weight: 800; color: ${THEME.textMain}; display: flex; align-items: center; gap: 6px; transition: color 0.3s; `;
const ChartSubtitle = styled.div` font-size: 11px; color: ${THEME.textSub}; font-weight: 500; margin-top: 2px; `;
const BigNumber = styled.div` font-size: 32px; font-weight: 800; color: ${THEME.textMain}; letter-spacing: -1px; font-family: 'Pretendard', sans-serif; font-variant-numeric: tabular-nums; `;
const TrendBadge = styled.div<{ $isUp: boolean }>` font-size: 12px; font-weight: 700; color: ${(p) => (p.$isUp ? THEME.primary : THEME.danger)}; display: flex; align-items: center; gap: 4px; `;
const ChartWrapper = styled.div` flex: 1; width: 100%; min-height: 0; position: relative; `;
const DefectItem = styled.div` display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 6px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; &:last-child { margin-bottom: 0; } `;
const DefectName = styled.div` font-weight: 700; color: ${THEME.textMain}; display: flex; align-items: center; gap: 6px; font-size: 14px; `;
const DefectTag = styled.div` font-size: 11px; font-weight: 700; color: #fff; background: ${THEME.danger}; padding: 2px 8px; border-radius: 99px; display: flex; align-items: center; gap: 4px; animation: ${blink} 2s infinite; `;
const NavContainer = styled.div` position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); padding: 6px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); `;
const NavButton = styled.button<{ $active: boolean }>` background: ${(props) => (props.$active ? 'rgba(255, 255, 255, 0.9)' : 'transparent')}; color: ${(props) => (props.$active ? '#0f172a' : '#cbd5e1')}; border: 1px solid ${(props) => (props.$active ? '#fff' : 'transparent')}; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; font-family: 'Pretendard', sans-serif; &:hover { color: ${(props) => (props.$active ? '#0f172a' : '#fff')}; background: ${(props) => (props.$active ? '#fff' : 'rgba(255, 255, 255, 0.1)')}; } `;
const InstructionBadge = styled.div` position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); padding: 0.8rem 1.6rem; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; font-size: 0.85rem; font-weight: 500; color: #cbd5e1; display: flex; align-items: center; gap: 8px; pointer-events: none; z-index: 90; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); animation: ${float} 4s ease-in-out infinite; span.highlight { color: #38bdf8; font-weight: 700; } `;

const CriticalAlertOverlay = styled.div` 
  position: fixed; inset: 0; z-index: 9999; 
  display: flex; flex-direction: column; align-items: center; justify-content: center; 
  animation: ${emergencyBlink} 1.5s infinite ease-in-out; 
  pointer-events: all; 
  backdrop-filter: blur(4px);
`;
const AlertBox = styled.div` background: #000; border: 2px solid #ff0000; padding: 40px 80px; text-align: center; border-radius: 20px; box-shadow: 0 0 100px rgba(255, 0, 0, 0.6); transform: scale(1.2); `;
const AlertTitle = styled.h1` font-size: 80px; color: #ff0000; margin: 0; line-height: 1; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; animation: ${textGlow} 1s infinite alternate; display: flex; align-items: center; gap: 20px; `;
const AlertSub = styled.p` color: #fff; font-size: 24px; margin-top: 20px; font-weight: bold; `;
const LoaderOverlay = styled.div` position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #000000; z-index: 9999; flex-direction: column; `;
const LoadingBarContainer = styled.div` width: 300px; text-align: center; `;
const LoadingText = styled.div` font-size: 15px; color: #cbd5e1; margin-bottom: 12px; display: flex; justify-content: space-between; font-family: 'Pretendard', sans-serif; strong { color: #38bdf8; } `;
const Track = styled.div` width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; `;
const Fill = styled.div<{ $p: number }>` height: 100%; width: ${(props) => props.$p}%; background: linear-gradient(90deg, #38bdf8, #818cf8); transition: width 0.1s linear; box-shadow: 0 0 10px #38bdf8; `;

const ErrorBubble = styled.div` 
  width: 140px; 
  background: rgba(0, 0, 0, 0.85); 
  backdrop-filter: blur(8px); 
  border: 1px solid ${THEME.danger}; 
  border-radius: 8px; 
  padding: 8px; 
  color: white; 
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4); 
  animation: ${modalPop} 0.3s ease-out; 
  position: relative; 
  
  &::after { 
    content: ''; position: absolute; left: -6px; top: 12px;
    width: 0; height: 0; 
    border-top: 6px solid transparent; 
    border-bottom: 6px solid transparent; 
    border-right: 6px solid ${THEME.danger}; 
  } 
`;
const BubbleTitle = styled.div` font-size: 11px; font-weight: 800; color: ${THEME.danger}; display: flex; align-items: center; gap: 4px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; `;
const BubbleText = styled.div` font-size: 10px; color: #e2e8f0; margin-bottom: 3px; line-height: 1.3; span.label { color: #94a3b8; font-weight: 600; display: block; font-size: 9px; margin-bottom: 1px; } `;

// -----------------------------------------------------------------------------
// [Helpers]

function TransitionLoader({ onFinished }: { onFinished: () => void }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const duration = 1500;
    let frame: number;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min((progress / duration) * 100, 100);
      setVal(percentage);
      if (progress < duration) frame = requestAnimationFrame(animate);
      else setTimeout(onFinished, 200);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [onFinished]);

  return (
    <LoaderOverlay>
      <LoadingBarContainer>
        <LoadingText><span>요청 처리 중...</span><strong>{val.toFixed(0)}%</strong></LoadingText>
        <Track><Fill $p={val} /></Track>
      </LoadingBarContainer>
    </LoaderOverlay>
  );
}

const CustomTooltip = React.memo(({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', minWidth: '140px', fontFamily: 'Pretendard, sans-serif' }}>
        <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
            <span style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: p.color }} />{p.name}
            </span>
            <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{p.value}{p.unit || ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
});
CustomTooltip.displayName = "CustomTooltip";

function PreparingModal({ target, onClose }: { target: string | null, onClose: () => void }) {
  const ModalOverlay = styled.div`
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 99999;
  `;
  const ModalBox = styled.div`
    width: 320px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    animation: ${modalPop} 0.3s cubic-bezier(0.16, 1, 0.3, 1); position: relative; font-family: 'Pretendard', sans-serif;
  `;
  const CloseButton = styled.button`
    position: absolute; top: 12px; right: 12px; background: none; border: none; color: #64748b;
    cursor: pointer; transition: color 0.2s; &:hover { color: #fff; }
  `;
  if (!target) return null;
  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}><XCircle size={24} /></CloseButton>
        <div style={{ width: 60, height: 60, margin: '0 auto 16px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={30} color="#94a3b8" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>시스템 준비 중</h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>선택하신 <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{target} 공정</span> 대시보드는<br />현재 시스템 연동 작업이 진행 중입니다.</p>
        <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 24px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'Pretendard, sans-serif' }}>확인</button>
      </ModalBox>
    </ModalOverlay>
  );
}

// -----------------------------------------------------------------------------
// [3D Logic]
const FloorModel = React.memo(() => {
  const { scene } = useGLTF(FLOOR_MODEL_PATH);
  return <primitive object={scene} raycast={() => null} />;
});
FloorModel.displayName = "FloorModel";

class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("3D Model Loading Failed:", error); }
  render() { if (this.state.hasError) return this.props.fallback; return this.props.children; }
}

interface JigModelProps {
  url: string;
  onHoverChange: (data: UnitData | null) => void;
  apiData: ApiDataItem[];
}

const MovingLabel = ({ labelIndex, locations, errorIndices, apiData }: { labelIndex: number, locations: any[], errorIndices: number[], apiData: ApiDataItem[] }) => {
    const groupRef = useRef<THREE.Group>(null);
    const CYCLE_DURATION = 15;
    const WAIT_DURATION = 10;
    const MOVE_DURATION = 5;

    useFrame((state) => {
        if (!groupRef.current || locations.length === 0) return;

        const time = state.clock.getElapsedTime();
        const cycleIndex = Math.floor(time / CYCLE_DURATION);
        const timeInCycle = time % CYCLE_DURATION;

        const currentIndex = (labelIndex + cycleIndex) % locations.length;
        const nextIndex = (currentIndex + 1) % locations.length;

        const currentPos = locations[currentIndex].position;
        const nextPos = locations[nextIndex].position;

        if (timeInCycle < WAIT_DURATION) {
            groupRef.current.position.copy(currentPos);
        } else {
            const moveTime = timeInCycle - WAIT_DURATION;
            const progress = Math.min(moveTime / MOVE_DURATION, 1);
            groupRef.current.position.lerpVectors(currentPos, nextPos, progress);
        }
    });

    const isError = errorIndices.includes(labelIndex);
    const labelText = `M-${(labelIndex + 1).toString().padStart(2, '0')}`;
    
    const errorReason = useMemo(() => {
        if (!isError) return { problem: "", solution: "" };
        const matched = apiData.find(d => parseInt(d.대차번호) === labelIndex + 1);
        if (matched && matched.AI_LABEL !== '정상') {
             return {
                 problem: matched.AI_LABEL,
                 solution: "관리자 점검 요망"
             }
        }
        return { problem: "시스템 오류 감지", solution: "현장 확인 요망" };
    }, [isError, apiData, labelIndex]);


    return (
        <group ref={groupRef}>
            <Html 
                center 
                distanceFactor={15} 
                style={{ pointerEvents: 'none' }}
                zIndexRange={isError ? [99999999, 99999990] : [100, 0]}
            >
                <div style={{ position: 'relative', width: 'fit-content' }}>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.6)', padding: '2px 6px', borderRadius: '4px',
                        border: isError ? `1px solid ${THEME.danger}` : '1px solid rgba(255, 255, 255, 0.3)', 
                        color: isError ? THEME.danger : 'white', fontSize: '10px',
                        fontWeight: 'bold', whiteSpace: 'nowrap', fontFamily: 'Pretendard', 
                        backdropFilter: 'blur(2px)',
                        boxShadow: isError ? `0 0 10px ${THEME.danger}` : 'none',
                        marginTop: '4px' 
                    }}>
                        {labelText}
                    </div>

                    {isError && (
                        <div style={{ 
                            position: 'absolute', 
                            left: '100%', top: '50%', 
                            transform: 'translate(12px, -20%)', 
                            width: 'max-content' 
                        }}>
                            <ErrorBubble>
                                <BubbleTitle>
                                    <AlertOctagon size={12} /> Error Detected
                                </BubbleTitle>
                                <BubbleText>
                                    <span className="label">PROBLEM</span>
                                    {errorReason.problem}
                                </BubbleText>
                                <BubbleText>
                                    <span className="label">SOLUTION</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Wrench size={10} color={THEME.success} />
                                        {errorReason.solution}
                                    </div>
                                </BubbleText>
                            </ErrorBubble>
                        </div>
                    )}
                </div>
            </Html>
        </group>
    );
};

// [API 데이터 기반 인터랙티브 모델]
function InteractiveJigModel({ url, onHoverChange, apiData }: JigModelProps) {
  const { scene } = useGLTF(url);
  const activeIdRef = useRef<string | null>(null);
  const highlightColor = useMemo(() => new THREE.Color("#38bdf8"), []);
  const errorColor = useMemo(() => new THREE.Color("#ff0000"), []);
  
  const [meshLocations, setMeshLocations] = useState<{ id: string, position: THREE.Vector3, mesh: THREE.Mesh }[]>([]);
  
  const activeErrorIndices = useMemo(() => {
      return apiData
          .filter(item => item.AI_LABEL !== "정상")
          .map(item => parseInt(item.대차번호) - 1);
  }, [apiData]);

  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const lastCycleRef = useRef<number>(-1);
  const OFFSET_START_INDEX = 6; 
  const CYCLE_DURATION = 15;

  useEffect(() => {
    const meshes: { mesh: THREE.Mesh, position: THREE.Vector3 }[] = [];
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name.toLowerCase();
        if (
          name.includes('floor') || name.includes('ground') || name.includes('plane') || 
          name.includes('base') || name.includes('plate') || name.includes('bottom') || 
          name.includes('stand') || name.includes('support') || name.includes('frame') || 
          name.includes('line') || name.includes('rail')
        ) return;

        mesh.castShadow = true; mesh.receiveShadow = true;
        if (mesh.material) {
          const oldMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const standardMat = oldMat as THREE.MeshStandardMaterial;
          const originalColor = standardMat.color ? standardMat.color : new THREE.Color(0xffffff);
          const newMat = new THREE.MeshPhysicalMaterial({
            color: originalColor, metalness: 0.1, roughness: 0.2, 
            clearcoat: 1.0, clearcoatRoughness: 0.1, side: THREE.DoubleSide
          });
          mesh.material = newMat;
        }
        
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        meshes.push({ mesh, position: worldPos });
      }
    });

    let centerX = 0; let centerZ = 0;
    meshes.forEach(m => { centerX += m.position.x; centerZ += m.position.z; });
    centerX /= meshes.length; centerZ /= meshes.length;

    meshes.sort((a, b) => {
        let angleA = Math.atan2(a.position.z - centerZ, a.position.x - centerX);
        let angleB = Math.atan2(b.position.z - centerZ, b.position.x - centerX);
        if (angleA < 0) angleA += Math.PI * 2;
        if (angleB < 0) angleB += Math.PI * 2;
        return angleB - angleA; 
    });

    const sliceIndex = OFFSET_START_INDEX % meshes.length;
    const sortedMeshes = [
        ...meshes.slice(sliceIndex),
        ...meshes.slice(0, sliceIndex)
    ];

    if (sortedMeshes.length > 12) sortedMeshes.splice(12, 1);

    const locations = sortedMeshes.map(item => ({
       id: item.mesh.uuid,
       position: item.position.clone().add(new THREE.Vector3(0, 0.8, -0.5)),
       mesh: item.mesh
    }));
    setMeshLocations(locations);
  }, [scene]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const cycleIndex = Math.floor(time / CYCLE_DURATION);

    if (cycleIndex !== lastCycleRef.current) {
        lastCycleRef.current = cycleIndex;
        setCurrentCycleIndex(cycleIndex);
    }

    const flashIntensity = 1.5 + Math.sin(time * 12) * 1.0;
    
    if (meshLocations.length > 0) {
        meshLocations.forEach(loc => {
            if (loc.mesh.uuid !== activeIdRef.current) {
                (loc.mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0;
            }
        });
        
        activeErrorIndices.forEach(labelIdx => {
             const total = meshLocations.length;
             const currentPosIndex = (labelIdx + cycleIndex) % total;
             const mesh = meshLocations[currentPosIndex]?.mesh;
             
             if (mesh && mesh.uuid !== activeIdRef.current) {
                 const mat = mesh.material as THREE.MeshPhysicalMaterial;
                 mat.emissive.set(errorColor);
                 mat.emissiveIntensity = flashIntensity;
             }
        });
    }
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    const mesh = e.object as THREE.Mesh;
    
    if (mesh.isMesh) {
      activeIdRef.current = mesh.uuid;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      if(mat.emissive) {
          mat.emissive.copy(highlightColor);
          mat.emissiveIntensity = 2.0;
      }

      const meshIndex = meshLocations.findIndex(loc => loc.mesh.uuid === mesh.uuid);
      
      if (meshIndex !== -1) {
          const total = meshLocations.length;
          let foundLabelIdx = -1;
          for(let l = 0; l < total; l++) {
              if ((l + currentCycleIndex) % total === meshIndex) {
                  foundLabelIdx = l;
                  break;
              }
          }

          if (foundLabelIdx !== -1) {
              const name = `M-${(foundLabelIdx + 1).toString().padStart(2, '0')}`;
              const matchedData = apiData.find(d => parseInt(d.대차번호) === foundLabelIdx + 1);
              const isError = matchedData ? matchedData.AI_LABEL !== '정상' : false;

              onHoverChange({
                  name,
                  status: isError ? 'error' : 'normal',
                  temp: matchedData ? parseFloat(matchedData["가조립온도(℃)"]) : 0,
                  load: matchedData ? parseFloat(matchedData["R액 압력(kg/㎥)"]) : 0,
                  uuid: mesh.uuid
              });
          }
      }
    }
  }, [highlightColor, meshLocations, currentCycleIndex, apiData, onHoverChange]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    const mesh = e.object as THREE.Mesh;
    if (activeIdRef.current === mesh.uuid) {
      document.body.style.cursor = "auto";
      activeIdRef.current = null;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      if(mat) mat.emissiveIntensity = 0;
      onHoverChange(null);
    }
  }, [onHoverChange]);

  return (
    <group>
      <primitive object={scene} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} />
      {meshLocations.length > 0 && Array.from({ length: meshLocations.length }).map((_, i) => (
          <MovingLabel 
            key={i} 
            labelIndex={i} 
            locations={meshLocations} 
            errorIndices={activeErrorIndices}
            apiData={apiData}
          />
      ))}
    </group>
  );
}

// -----------------------------------------------------------------------------
// [Components] UI Panels

const AIAdvisor = React.memo(({ errors }: { errors: UnitData[] }) => {
  const [message, setMessage] = useState("");
  const [displayMessage, setDisplayMessage] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (errors.length > 0) {
      const target = errors[0];
      const advice = `${target.name} 이상 감지 (${target.problem}). ${target.solution || "담당자 확인 필요."}`;
      setMessage(advice);
      setIndex(0);
      setDisplayMessage("");
    } else {
      setMessage("모든 시스템 정상 가동 중. 특이사항 없습니다.");
      setIndex(0);
      setDisplayMessage("");
    }
  }, [errors]);

  useEffect(() => {
    if (index < message.length) {
      const timeout = setTimeout(() => {
        setDisplayMessage((prev) => prev + message[index]);
        setIndex((prev) => prev + 1);
      }, 30);
      return () => clearTimeout(timeout);
    }
  }, [index, message]);

  return (
    <AIAdvisorPanel>
      <AIHeader>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: THEME.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${THEME.accent}60` }}>
          <Bot size={22} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: THEME.textSub, fontWeight: 600 }}>SYSTEM ADVISOR</div>
          <div style={{ fontSize: 15, fontWeight: 'bold', color: THEME.textMain }}>Factory AI</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 20 }}>
          <WaveBar $delay={0} /> <WaveBar $delay={0.2} /> <WaveBar $delay={0.4} /> <WaveBar $delay={0.1} />
        </div>
      </AIHeader>
      <AIBody>
        <AIMessage>{displayMessage}<BlinkingCursor /></AIMessage>
      </AIBody>
    </AIAdvisorPanel>
  );
});
AIAdvisor.displayName = "AIAdvisor";

// ... 기존 import 생략 ...

// Panels 컴포넌트 수정
const Panels = React.memo(({ hoveredInfo, errorUnits, apiData }: { hoveredInfo: UnitData | null, errorUnits: UnitData[], apiData: ApiDataItem[] }) => {
  const activeUnit = hoveredInfo || (errorUnits.length > 0 ? errorUnits[0] : null) || { name: 'M-01', status: 'normal' };
  const isError = activeUnit.status === 'error';
  const statusColor = isError ? THEME.danger : THEME.success;
  const statusBg = isError ? THEME.dangerBg : THEME.successBg;

  const activeNumber = activeUnit && activeUnit.name ? parseInt(activeUnit.name.replace("M-", ""), 10) : 1;
  const matchedData = apiData.find(item => parseInt(item.대차번호) === activeNumber);
  
  // 호버용 데이터 매칭
  const hoverMatchedData = hoveredInfo 
    ? apiData.find(item => parseInt(item.대차번호) === parseInt(hoveredInfo.name.replace("M-", ""), 10))
    : null;

  const displayImage = matchedData?.FILEPATH1 || "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1000&auto=format&fit=crop";
  
  // [수정 포인트] Hydration Error 방지를 위한 State 사용
  // 초기값은 서버/클라이언트 동일하게 "-" 혹은 고정값으로 설정
  const [randomStats, setRandomStats] = useState({ val1: "-", val2: "-" });

  // [수정 포인트] 클라이언트 마운트 후(useEffect)에만 랜덤값 생성
  useEffect(() => {
    setRandomStats({
      val1: (Math.random() * (1.02 - 0.94) + 0.94).toFixed(7),
      val2: (Math.random() * (1.02 - 0.94) + 0.94).toFixed(7)
    });
  }, [activeNumber]); // activeNumber가 변경될 때마다 재생성

  const displayValue1 = randomStats.val1;
  const displayValue2 = randomStats.val2;

  const boxes = isError 
    ? [{ top: 40, left: 20, width: 10, height: 10, color: '#EF4444' }]
    : [{ top: 55, left: 65, width: 12, height: 12, color: '#10B981' }];
    
  return (
    <>
      {hoveredInfo && hoverMatchedData && (
        <HoverInfoPanel style={{
          borderLeftColor: hoveredInfo.status === 'error' ? THEME.danger : THEME.primary,
          boxShadow: hoveredInfo.status === 'error' ? `0 8px 32px ${THEME.danger}30` : undefined
        }}>
          {/* ... HoverInfoPanel 내부 내용은 그대로 유지 ... */}
          <ChartHeader>
            <div>
              <ChartTitle style={{ color: hoveredInfo.status === 'error' ? THEME.danger : THEME.textMain }}>
                <Cpu size={18} color={hoveredInfo.status === 'error' ? THEME.danger : THEME.primary} /> {hoveredInfo.name}
              </ChartTitle>
              <ChartSubtitle>Real-time Sensor Data</ChartSubtitle>
            </div>
          </ChartHeader>

          <InfoRow>
            <div className="label"><Activity size={13} /> 작동 상태</div>
            {hoveredInfo.status === 'error' ? (
              <div className="status" style={{ color: '#fff', background: THEME.danger }}>CHECK</div>
            ) : (
              <div className="status" style={{ color: THEME.primary, background: 'rgba(16, 185, 129, 0.1)' }}>NORMAL</div>
            )}
          </InfoRow>

          <InfoRow>
            <div className="label"><Droplets size={13} /> R액 압력</div>
            <div className="value" style={{ color: THEME.textMain }}>
              {hoverMatchedData["R액 압력(kg/㎥)"] || '-'} <span style={{fontSize: 10, color: THEME.textSub, fontWeight: 500}}>bar</span>
            </div>
          </InfoRow>

          <InfoRow>
            <div className="label"><Gauge size={13} /> P액 압력</div>
            <div className="value" style={{ color: THEME.textMain }}>
               {hoverMatchedData["P액 압력(kg/㎥)"] || '-'} <span style={{fontSize: 10, color: THEME.textSub, fontWeight: 500}}>bar</span>
            </div>
          </InfoRow>

           <InfoRow>
            <div className="label"><Thermometer size={13} /> 가조립 온도</div>
            <div className="value" style={{ color: hoveredInfo.status === 'error' ? THEME.danger : THEME.textMain }}>
               {hoverMatchedData["가조립온도(℃)"] || '-'} <span style={{fontSize: 10, color: THEME.textSub, fontWeight: 500}}>°C</span>
            </div>
          </InfoRow>
        </HoverInfoPanel>
      )}

      {/* ... DefectStatusPanel, TopRightPanel, BottomLeftPanel 내용 유지 ... */}
      <DefectStatusPanel>
        <ChartHeader>
          <div>
            <ChartTitle style={{ color: THEME.danger }}>
              <AlertTriangle size={16} fill={THEME.danger} stroke="#fff" /> 불량 오브젝트
            </ChartTitle>
            <ChartSubtitle>Active Errors</ChartSubtitle>
          </div>
          <div style={{ background: THEME.danger, color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>
            {errorUnits.length} 건
          </div>
        </ChartHeader>
        <div style={{ overflowY: 'auto', maxHeight: '120px', paddingRight: '4px' }}>
          {errorUnits.length > 0 ? (
            errorUnits.map((unit, idx) => (
              <DefectItem key={idx}>
                <DefectName><span>{unit.name}</span></DefectName>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: THEME.danger, fontFamily: 'Pretendard', fontVariantNumeric: 'tabular-nums' }}>{unit.temp}°C</span>
                      <DefectTag>CHECK</DefectTag>
                   </div>
                   <span style={{ fontSize: '10px', color: THEME.textSub, marginTop: '2px' }}>{unit.problem}</span>
                </div>
              </DefectItem>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>현재 감지된 이상 없음</div>
          )}
        </div>
      </DefectStatusPanel>
      
      <TopRightPanel>
        {/* ... TopRightPanel 내용 유지 ... */}
        <ChartHeader>
          <div><ChartTitle><Activity size={16} color={THEME.primary} /> 실시간 검사 현황</ChartTitle><ChartSubtitle>Real-time Monitor</ChartSubtitle></div>
          <div style={{ padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: THEME.primary, borderRadius: '12px', fontSize: 10, fontWeight: 700 }}>LIVE</div>
        </ChartHeader>
        <div style={{ marginBottom: 16 }}><BigNumber style={{fontSize: 28}}>14,480</BigNumber><TrendBadge $isUp={true}><TrendingUp size={12} /> 전일 대비 2.4% 증가</TrendBadge></div>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ANNUAL_DATA.slice(0, 7)} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: THEME.textSub, fontFamily: 'Pretendard' }} tickLine={false} axisLine={false} interval={0} />
              <YAxis yAxisId="L" tick={{ fontSize: 10, fill: THEME.textSub, fontFamily: 'Pretendard' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 10, fill: THEME.danger, fontFamily: 'Pretendard' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar yAxisId="L" dataKey="inspection" barSize={10} radius={[4, 4, 4, 4]}>{ANNUAL_DATA.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 6 ? THEME.primary : "#cbd5e1"} />))}</Bar>
              <Line yAxisId="R" type="monotone" dataKey="error" stroke={THEME.danger} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </TopRightPanel>

      <BottomLeftPanel>
        {/* ... BottomLeftPanel 내용 유지 ... */}
        <ChartHeader><div><ChartTitle><Zap size={16} fill={THEME.textMain} stroke="none" /> 연간 데이터 추이</ChartTitle><ChartSubtitle>Annual Data Trend</ChartSubtitle></div></ChartHeader>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}><BigNumber style={{fontSize: 28}}>0.8%</BigNumber><TrendBadge $isUp={true} style={{ color: THEME.primary }}>안정권 유지 중</TrendBadge></div>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ANNUAL_DATA} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={THEME.primary} stopOpacity={0.3} /><stop offset="100%" stopColor={THEME.primary} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: THEME.textSub, fontFamily: 'Pretendard' }} tickLine={false} axisLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: THEME.textSub, fontFamily: 'Pretendard' }} unit="%" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1' }} />
              <Area type="monotone" dataKey="rate" stroke={THEME.primary} strokeWidth={2} fill="url(#areaGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </BottomLeftPanel>

      <VisionAnalysisPanel>
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: `1px solid ${THEME.border}`, 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#F9FAFB'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: THEME.textMain, letterSpacing: '-0.5px' }}>
                    {activeUnit.name || 'M-??'}
                </span>
                
                <div style={{ 
                    padding: '2px 8px', borderRadius: '16px', 
                    backgroundColor: statusBg, color: statusColor,
                    fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    {isError ? <AlertTriangle size={10} strokeWidth={3} /> : <CheckCircle size={10} strokeWidth={3} />}
                    {matchedData?.AI_LABEL || (isError ? '불량' : '정상')}
                </div>
            </div>
            
            <ScanLine size={16} color={THEME.textSub} />
        </div>

        <div style={{ padding: '12px 16px 0 16px' }}>
            <div style={{ 
                position: 'relative', width: '100%', height: '120px',
                borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000',
                border: `1px solid ${THEME.border}`, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
            }}>
                <img 
                    src={displayImage}
                    alt="Factory Cart Analysis" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1000&auto=format&fit=crop";
                    }}
                />
                {boxes.map((box, idx) => (
                <div key={idx} style={{
                    position: 'absolute',
                    top: `${box.top}%`, left: `${box.left}%`,
                    width: `${box.width}%`, height: `${box.height}%`,
                    border: `2px solid ${box.color}`,
                    boxShadow: `0 0 10px ${box.color}`,
                    zIndex: 10
                }} />
                ))}
            </div>
        </div>

        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ 
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  padding: '8px 10px', borderRadius: '10px', backgroundColor: '#F3F4F6',
                  border: `1px solid ${THEME.border}`
              }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Database size={12} color={THEME.accent} />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: THEME.textSub }}>상반기</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: THEME.textMain }}>
                      {displayValue1}
                  </span>
              </div>

              <div style={{ 
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  padding: '8px 10px', borderRadius: '10px', backgroundColor: '#F3F4F6',
                  border: `1px solid ${THEME.border}`
              }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <BarChart3 size={12} color={THEME.success} />
                      <span style={{ fontSize: '10px', fontWeight: 600, color: THEME.textSub }}>하반기</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: THEME.textMain }}>
                      {displayValue2}
                  </span>
              </div>
            </div>

            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={10} color={THEME.warning} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: THEME.textSub }}>모터 부하율</span>
                </div>
                <span style={{ fontSize: '10px', color: THEME.warning, fontWeight: 'bold' }}>Live</span>
              </div>
              <div style={{ height: '40px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOTOR_DATA}>
                    <defs>
                      <linearGradient id="motorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={THEME.warning} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={THEME.warning} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="load" stroke={THEME.warning} strokeWidth={1.5} fill="url(#motorGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>
      </VisionAnalysisPanel>
    </>
  );
});
Panels.displayName = "Panels";

// -----------------------------------------------------------------------------
// [Main Page]
export default function GlbViewerPage() {
  const [activeTab, setActiveTab] = useState("GR2");
  const [targetTab, setTargetTab] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [modalTarget, setModalTarget] = useState<string | null>(null);

  const [hoveredInfo, setHoveredInfo] = useState<UnitData | null>(null);
  const [apiData, setApiData] = useState<ApiDataItem[]>([]);

  // API 데이터 기반 에러 유닛 계산
  const errorUnits = useMemo(() => {
      return apiData
        .filter(item => item.AI_LABEL !== '정상')
        .map(item => ({
            name: `M-${item.대차번호.padStart(2, '0')}`,
            temp: parseFloat(item["가조립온도(℃)"]),
            load: parseFloat(item["R액 압력(kg/㎥)"]), // 부하 대신 압력 임시 매핑
            status: 'error' as const,
            problem: item.AI_LABEL,
            solution: "관리자 확인 필요"
        }));
  }, [apiData]);

  // Critical Error Check (M-01 ~ M-04)
  const criticalUnit = useMemo(() => {
    const criticalTargets = ['M-01', 'M-02', 'M-03', 'M-04'];
    return errorUnits.find(u => criticalTargets.includes(u.name));
  }, [errorUnits]);

  // API Polling Logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const json = await response.json();
        if (json.success) {
            setApiData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch API:", error);
      }
    };

    fetchData(); // 초기 실행
    const interval = setInterval(fetchData, 5000); // 5초마다 갱신

    return () => clearInterval(interval);
  }, []);

  const tabs = ["GR2", "GR3", "GR5", "GR9"];

  const handleTabClick = (tab: string) => {
    if (tab === activeTab || isNavigating) return;
    if (tab === "GR2") {
      setTargetTab(tab);
      setIsNavigating(true);
    } else {
      setModalTarget(tab);
    }
  };

  const handleTransitionComplete = () => {
    if (targetTab) {
      setActiveTab(targetTab);
      setTargetTab(null);
    }
    setIsNavigating(false);
  };

  return (
    <PageContainer>
      {criticalUnit && (
        <CriticalAlertOverlay>
          <Siren size={120} color="#ff0000" style={{ animation: 'pulse 1s infinite' }} />
          <AlertBox>
             <AlertTitle>
               <Octagon size={80} strokeWidth={3} /> STOP
             </AlertTitle>
             <AlertSub>라인 긴급 정지 요망</AlertSub>
             <div style={{ color: '#ffaaaa', marginTop: '10px', fontSize: '18px', fontWeight: 'bold' }}>
               {criticalUnit.name} 초기 투입 구간 결함 감지
             </div>
          </AlertBox>
        </CriticalAlertOverlay>
      )}

      <MainContent>
        {isNavigating && <TransitionLoader onFinished={handleTransitionComplete} />}
        <PreparingModal target={modalTarget} onClose={() => setModalTarget(null)} />

        <NavContainer>
          {tabs.map(tab => (
            <NavButton key={tab} $active={activeTab === tab} onClick={() => handleTabClick(tab)}>
              <LayoutDashboard size={14} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'text-bottom' }} /> {tab} 공정
            </NavButton>
          ))}
        </NavContainer>

        <ViewerContainer>
          
          <AIAdvisor errors={errorUnits} />

          <Panels 
            hoveredInfo={hoveredInfo} 
            errorUnits={errorUnits} 
            apiData={apiData}
          />

          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [-22, 18, -20], fov: 14 }}
            shadows="soft"
            gl={{
              logarithmicDepthBuffer: true,
              antialias: true,
              powerPreference: "high-performance"
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[-20, 30, -20]}
              intensity={1.5}
              castShadow
              shadow-mapSize={[4096, 4096]}
              shadow-bias={-0.0001}
              shadow-normalBias={0.05}
            >
              <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8]} />
            </directionalLight>

            <Suspense fallback={null}>
              <Stage environment="city" intensity={2.0} adjustCamera={false} shadows={false}>
                <Center position={[5, 0, 4]}>
                  <group position={[0, 0, 0]}>
                    <ModelErrorBoundary fallback={null}>
                      <FloorModel />
                    </ModelErrorBoundary>
                    <ModelErrorBoundary fallback={null}>
                      <InteractiveJigModel
                        url={JIG_MODEL_PATH}
                        onHoverChange={setHoveredInfo}
                        apiData={apiData}
                      />
                    </ModelErrorBoundary>
                  </group>
                </Center>
              </Stage>
              <Environment preset="city" blur={1} background={false} />
            </Suspense>
            <OrbitControls
              target={[-1, 0, 0]}
              makeDefault
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 2.1}
            />
          </Canvas>

          <InstructionBadge>
            <Layers size={14} color="#38bdf8" />
            <span className="highlight">좌클릭</span>: 회전 / <span className="highlight">스크롤</span>: 확대/축소
          </InstructionBadge>
        </ViewerContainer>
      </MainContent>
    </PageContainer>
  );
}

useGLTF.preload(JIG_MODEL_PATH);
useGLTF.preload(FLOOR_MODEL_PATH);