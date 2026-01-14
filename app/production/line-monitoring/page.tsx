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
  ScanLine
} from "lucide-react";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
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
// [데이터 목업]
const GR2_DATA = [
  { name: '09:00', inspection: 400, error: 24, rate: 0.5 },
  { name: '10:00', inspection: 300, error: 13, rate: 0.8 },
  { name: '11:00', inspection: 200, error: 58, rate: 1.2 },
  { name: '12:00', inspection: 278, error: 39, rate: 1.0 },
  { name: '13:00', inspection: 189, error: 48, rate: 1.5 },
  { name: '14:00', inspection: 239, error: 38, rate: 1.1 },
  { name: '15:00', inspection: 349, error: 43, rate: 0.9 },
];

// -----------------------------------------------------------------------------
// [설정]
const JIG_MODEL_PATH = "/models/final_final.glb";
const FLOOR_MODEL_PATH = "/models/floor.glb";
const FACTORY_BG_IMAGE = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop";

// [수정] 공장 대차(AGV/카트) 관련 이미지 URL
const CART_IMAGE_URL = "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=1000&auto=format&fit=crop";


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

// -----------------------------------------------------------------------------
// [Types]
interface UnitData {
  name: string;
  temp: number;
  load: number;
  status: 'normal' | 'error';
  uuid?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// -----------------------------------------------------------------------------
// [Animations]
const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px) translateX(-50%); }
  50% { transform: translateY(-5px) translateX(-50%); }
  100% { transform: translateY(0px) translateX(-50%); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const modalPop = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const blink = keyframes`
  50% { opacity: 0; }
`;

const soundWave = keyframes`
  0% { height: 10%; }
  50% { height: 100%; }
  100% { height: 10%; }
`;

// -----------------------------------------------------------------------------
// [Styled Components]

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 64px);
  background-image: url('${FACTORY_BG_IMAGE}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: 'Pretendard', sans-serif;
  overflow: hidden;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(10, 15, 30, 0.85);
    z-index: 0; pointer-events: none;
  }
`;

const MainContent = styled.main`
  flex: 1; width: 100%; height: 100%;
  position: relative; z-index: 10;
`;

const ViewerContainer = styled.div<{ $visible: boolean }>`
  width: 100%; height: 100%;
  padding-top: 4rem;
  position: relative;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 1.2s ease-in-out;
  isolation: isolate;
  will-change: opacity;
`;

const GlassPanel = styled.div`
  position: fixed;
  background: ${THEME.whiteCard};
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  padding: 24px;
  display: flex; flex-direction: column;
  z-index: 20;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: auto;
  color: ${THEME.textMain};
  font-family: 'Pretendard', sans-serif;
  will-change: transform;
`;

const TopRightPanel = styled(GlassPanel)`
  top: 6rem; right: 2rem;
  width: 420px; height: 300px;
  animation: ${slideInRight} 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
`;

const DefectStatusPanel = styled(GlassPanel)`
  top: calc(6rem + 300px + 20px); right: 2rem;
  width: 420px; min-height: 180px;
  animation: ${slideInRight} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
  border-left: 4px solid ${THEME.danger};
`;

const BottomLeftPanel = styled(GlassPanel)`
  bottom: 2rem; left: 2rem;
  width: 320px; 
  height: 280px;
  animation: ${slideInLeft} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
  opacity: 0; animation-fill-mode: forwards;
`;

// [수정] VisionAnalysisPanel 너비 축소 (320px -> 240px, 약 25% 축소)
const VisionAnalysisPanel = styled(GlassPanel)`
  bottom: 2rem;
  left: calc(2rem + 320px + 20px);
  width: 240px; /* 너비 축소 */
  animation: ${slideInLeft} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
  opacity: 0; animation-fill-mode: forwards;
  padding: 0;
  overflow: hidden;
`;

const HoverInfoPanel = styled(GlassPanel)`
  top: 6rem; left: 2rem; width: 280px;
  animation: ${slideDown} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border-left: 4px solid transparent;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  will-change: transform, border-color;
`;

const AIAdvisorPanel = styled.div`
  position: fixed;
  bottom: calc(2rem + 280px + 20px);
  left: 2rem;
  width: 320px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px);
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(99, 102, 241, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
  padding: 0;
  overflow: hidden;
  z-index: 25;
  animation: ${slideUp} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex; flex-direction: column;
  font-family: 'Pretendard', sans-serif;
  will-change: transform;
`;

const AIHeader = styled.div`
  background: linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%);
  padding: 16px 20px;
  display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
`;

const AIBody = styled.div`
  padding: 20px; position: relative;
`;

const AIMessage = styled.div`
  font-size: 14px; line-height: 1.6; color: ${THEME.textMain}; font-weight: 500;
`;

const WaveBar = styled.div<{ $delay: number }>`
  width: 4px; height: 100%; background: ${THEME.accent}; border-radius: 2px;
  animation: ${soundWave} 1s ease-in-out infinite; animation-delay: ${(p) => p.$delay}s;
`;

const BlinkingCursor = styled.span`
  display: inline-block; width: 2px; height: 14px; background-color: ${THEME.accent};
  margin-left: 4px; vertical-align: middle; animation: ${blink} 1s step-end infinite;
`;

const InfoRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  &:last-child { border-bottom: none; }
  .label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${THEME.textSub}; font-weight: 500; }
  .value { font-family: 'Pretendard', sans-serif; font-variant-numeric: tabular-nums; font-size: 14px; font-weight: 700; color: ${THEME.textMain}; }
  .status { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
`;

const ChartHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;
`;

const ChartTitle = styled.div`
  font-size: 16px; font-weight: 800; color: ${THEME.textMain};
  display: flex; align-items: center; gap: 8px; transition: color 0.3s;
`;

const ChartSubtitle = styled.div`
  font-size: 12px; color: ${THEME.textSub}; font-weight: 500; margin-top: 4px;
`;

const BigNumber = styled.div`
  font-size: 32px; font-weight: 800; color: ${THEME.textMain};
  letter-spacing: -1px; font-family: 'Pretendard', sans-serif; font-variant-numeric: tabular-nums;
`;

const TrendBadge = styled.div<{ $isUp: boolean }>`
  font-size: 12px; font-weight: 700; color: ${(p) => (p.$isUp ? THEME.primary : THEME.danger)};
  display: flex; align-items: center; gap: 4px;
`;

const ChartWrapper = styled.div`
  flex: 1; width: 100%; min-height: 0; position: relative;
`;

const DefectItem = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px; margin-bottom: 8px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  &:last-child { margin-bottom: 0; }
`;

const DefectName = styled.div`
  font-weight: 700; color: ${THEME.textMain};
  display: flex; align-items: center; gap: 6px; font-size: 14px;
`;

const DefectTag = styled.div`
  font-size: 11px; font-weight: 700; color: #fff; background: ${THEME.danger};
  padding: 2px 8px; border-radius: 99px;
  display: flex; align-items: center; gap: 4px; animation: ${blink} 2s infinite;
`;

const NavContainer = styled.div`
  position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; z-index: 20;
  background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px);
  padding: 6px; border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const NavButton = styled.button<{ $active: boolean }>`
  background: ${(props) => (props.$active ? 'rgba(255, 255, 255, 0.9)' : 'transparent')};
  color: ${(props) => (props.$active ? '#0f172a' : '#cbd5e1')};
  border: 1px solid ${(props) => (props.$active ? '#fff' : 'transparent')};
  padding: 8px 16px; border-radius: 8px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: all 0.2s ease; font-family: 'Pretendard', sans-serif;
  &:hover {
    color: ${(props) => (props.$active ? '#0f172a' : '#fff')};
    background: ${(props) => (props.$active ? '#fff' : 'rgba(255, 255, 255, 0.1)')};
  }
`;

const InstructionBadge = styled.div`
  position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
  padding: 0.8rem 1.6rem;
  background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px;
  font-size: 0.85rem; font-weight: 500; color: #cbd5e1;
  display: flex; align-items: center; gap: 8px; pointer-events: none; z-index: 90;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); animation: ${float} 4s ease-in-out infinite;
  span.highlight { color: #38bdf8; font-weight: 700; }
`;

const LoaderOverlay = styled.div`
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: #000000; z-index: 9999; flex-direction: column;
`;

const SpinnerRing = styled.div<{ $size: number, $color: string, $speed: number, $reverse?: boolean }>`
  position: absolute; width: ${(p) => p.$size}px; height: ${(p) => p.$size}px;
  border-radius: 50%; border: 3px solid transparent;
  border-top-color: ${(p) => p.$color}; border-left-color: ${(p) => p.$color + '60'};
  animation: ${spin} ${(p) => p.$speed}s linear infinite ${(p) => (p.$reverse ? 'reverse' : '')};
`;

const LoadingBarContainer = styled.div`
  width: 300px; text-align: center;
`;

const LoadingText = styled.div`
  font-size: 15px; color: #cbd5e1; margin-bottom: 12px; display: flex;
  justify-content: space-between; font-family: 'Pretendard', sans-serif;
  strong { color: #38bdf8; }
`;

const Track = styled.div`
  width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden;
`;

const Fill = styled.div<{ $p: number }>`
  height: 100%; width: ${(props) => props.$p}%;
  background: linear-gradient(90deg, #38bdf8, #818cf8);
  transition: width 0.1s linear; box-shadow: 0 0 10px #38bdf8;
`;

// -----------------------------------------------------------------------------
// [Helpers]

function CyberLoader({ onFinished }: { onFinished: () => void }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const duration = 2500;
    let frameId: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);
      if (currentProgress > 30 && step === 0) setStep(1);
      if (currentProgress > 60 && step === 1) setStep(2);
      if (currentProgress < 100) {
        frameId = requestAnimationFrame(animate);
      } else {
        setTimeout(onFinished, 500);
      }
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [onFinished, step]);

  return (
    <LoaderOverlay>
      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
        <SpinnerRing $size={130} $color="#10b981" $speed={2} />
        <SpinnerRing $size={100} $color="#3b82f6" $speed={1.5} $reverse />
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', fontFamily: 'Pretendard, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
          {progress.toFixed(0)}%
        </div>
      </div>
      <div style={{ textAlign: 'center', fontFamily: 'Pretendard', color: '#fff' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>시스템 가동 시퀀스</div>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>
          {step === 0 && "초기화 진행 중..."}
          {step === 1 && "데이터 리소스 로드 중..."}
          {step === 2 && "설정 마무리 중..."}
        </div>
      </div>
    </LoaderOverlay>
  );
}

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
  return <primitive object={scene} />;
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
  onStatusUpdate: (units: UnitData[]) => void;
}

function InteractiveJigModel({ url, onHoverChange, onStatusUpdate }: JigModelProps) {
  const { scene } = useGLTF(url);
  const activeIdRef = useRef<string | null>(null);
  const errorMeshesRef = useRef<THREE.Mesh[]>([]); 
  const highlightColor = useMemo(() => new THREE.Color("#38bdf8"), []);
  const errorColor = useMemo(() => new THREE.Color("#ff0000"), []);
  const [sortedLabels, setSortedLabels] = useState<{ id: string, name: string, position: THREE.Vector3 }[]>([]);

  useEffect(() => {
    const meshes: { mesh: THREE.Mesh, position: THREE.Vector3 }[] = [];
    errorMeshesRef.current = []; 
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true; mesh.receiveShadow = true;
        if (mesh.geometry) mesh.geometry.computeVertexNormals();
        if (mesh.material) {
          const oldMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const standardMat = oldMat as THREE.MeshStandardMaterial;
          const originalColor = standardMat.color ? standardMat.color : new THREE.Color(0xffffff);
          const newMat = new THREE.MeshPhysicalMaterial({
            color: originalColor, metalness: 0.1, roughness: 0.2, clearcoat: 1.0, clearcoatRoughness: 0.1, flatShading: false, side: THREE.DoubleSide, shadowSide: THREE.BackSide 
          });
          mesh.material = newMat;
        }
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        meshes.push({ mesh, position: worldPos });
      }
    });

    meshes.sort((a, b) => {
      const zDiff = a.position.z - b.position.z;
      if (Math.abs(zDiff) > 1.0) return zDiff;
      return a.position.x - b.position.x;
    });

    const errorCount = Math.floor(Math.random() * 4) + 2;
    const shuffledIndices = Array.from({ length: meshes.length }, (_, i) => i).sort(() => 0.5 - Math.random()).slice(0, errorCount);
    const errorIndicesSet = new Set(shuffledIndices);
    const errorUnitsData: UnitData[] = [];

    const labelsData = meshes.map((item, index) => {
      const count = index + 1;
      const labelText = `GR${count.toString().padStart(2, '0')}`;
      const isError = errorIndicesSet.has(index);
      const temp = isError ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 40;
      const load = isError ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 40) + 20;
      const unitData: UnitData = { name: labelText, temp, load, status: isError ? 'error' : 'normal', uuid: item.mesh.uuid };
      item.mesh.userData = unitData;
      if (isError) {
        errorUnitsData.push(unitData);
        errorMeshesRef.current.push(item.mesh);
      }
      return { id: item.mesh.uuid, name: labelText, position: item.position.clone().add(new THREE.Vector3(0, 1.5, 0)) };
    });

    setSortedLabels(labelsData);
    onStatusUpdate(errorUnitsData);
  }, [scene, onStatusUpdate]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const flashIntensity = 1.5 + Math.sin(time * 12) * 1.0;
    errorMeshesRef.current.forEach((mesh) => {
      if (activeIdRef.current !== mesh.uuid) {
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        mat.emissive.set(errorColor);
        mat.emissiveIntensity = flashIntensity;
      }
    });
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    const mesh = e.object as THREE.Mesh;
    if (mesh.isMesh) {
      activeIdRef.current = mesh.uuid;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.emissive.copy(highlightColor);
      mat.emissiveIntensity = 2.0;
      onHoverChange(mesh.userData as UnitData);
    }
  }, [highlightColor, onHoverChange]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    const mesh = e.object as THREE.Mesh;
    if (activeIdRef.current === mesh.uuid) {
      document.body.style.cursor = "auto";
      activeIdRef.current = null;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      if (mesh.userData.status !== 'error') {
         mat.emissiveIntensity = 0;
      }
      onHoverChange(null);
    }
  }, [onHoverChange]);

  return (
    <group>
      <primitive object={scene} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} />
      {sortedLabels.map((label) => (
        <Html key={label.id} position={label.position} center distanceFactor={15} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)', padding: '2px 6px', borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.3)', color: 'white', fontSize: '10px',
            fontWeight: 'bold', whiteSpace: 'nowrap', fontFamily: 'Pretendard, sans-serif', backdropFilter: 'blur(2px)'
          }}>
            {label.name}
          </div>
        </Html>
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
      let advice = "";
      if (target.temp >= 90) {
        advice = `${target.name} 코어 온도 ${target.temp}°C 감지. 냉각수 순환 펌프 3번 밸브 개방 및 유량 확인이 필요합니다. 즉시 조치바랍니다.`;
      } else if (target.load >= 90) {
        advice = `${target.name} 시스템 부하 ${target.load}% 도달. 입력 프로세스 속도를 20% 감속하고, 백그라운드 캐시를 정리하십시오.`;
      } else {
        advice = `${target.name} 비정상 신호 감지. 센서 교정 작업이 필요할 수 있습니다. 유지보수 팀을 호출하십시오.`;
      }
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

const Panels = React.memo(({ hoveredInfo, errorUnits }: { hoveredInfo: UnitData | null, errorUnits: UnitData[] }) => {
  // 현재 표시할 유닛 결정 (호버 > 에러 > 기본값)
  const activeUnit = hoveredInfo || (errorUnits.length > 0 ? errorUnits[0] : null) || { name: 'GR01', status: 'normal' };
  const isError = activeUnit.status === 'error';
  const statusColor = isError ? THEME.danger : THEME.success;
  const statusBg = isError ? THEME.dangerBg : THEME.successBg;

  // 더미 데이터 (실시간 반영처럼 보이게)
  const boxes = isError 
    ? [{ top: 40, left: 20, width: 10, height: 10, color: '#EF4444' }]
    : [{ top: 55, left: 65, width: 12, height: 12, color: '#10B981' }];
    
  return (
    <>
      {hoveredInfo && (
        <HoverInfoPanel style={{
          borderLeftColor: hoveredInfo.status === 'error' ? THEME.danger : THEME.primary,
          boxShadow: hoveredInfo.status === 'error' ? `0 8px 32px ${THEME.danger}30` : undefined
        }}>
          <ChartHeader>
            <div>
              <ChartTitle style={{ color: hoveredInfo.status === 'error' ? THEME.danger : THEME.textMain }}>
                <Cpu size={20} color={hoveredInfo.status === 'error' ? THEME.danger : THEME.primary} /> {hoveredInfo.name}
              </ChartTitle>
              <ChartSubtitle>Unit Status Monitor</ChartSubtitle>
            </div>
          </ChartHeader>
          <InfoRow>
            <div className="label"><Activity size={14} /> 작동 상태</div>
            {hoveredInfo.status === 'error' ? (
              <div className="status" style={{ color: '#fff', background: THEME.danger }}>CRITICAL</div>
            ) : (
              <div className="status" style={{ color: THEME.primary, background: 'rgba(16, 185, 129, 0.1)' }}>정상 가동 중</div>
            )}
          </InfoRow>
          <InfoRow>
            <div className="label"><Thermometer size={14} /> 코어 온도</div>
            <div className="value" style={{ color: hoveredInfo.status === 'error' ? THEME.danger : THEME.textMain }}>{hoveredInfo.temp}°C</div>
          </InfoRow>
          <InfoRow>
            <div className="label"><Gauge size={14} /> 시스템 부하</div>
            <div className="value">{hoveredInfo.load}%</div>
          </InfoRow>
        </HoverInfoPanel>
      )}

      <DefectStatusPanel>
        <ChartHeader>
          <div>
            <ChartTitle style={{ color: THEME.danger }}>
              <AlertTriangle size={18} fill={THEME.danger} stroke="#fff" /> 불량 오브젝트 현황
            </ChartTitle>
            <ChartSubtitle>Overheating Units Alert</ChartSubtitle>
          </div>
          <div style={{ background: THEME.danger, color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
            {errorUnits.length} 건
          </div>
        </ChartHeader>
        <div style={{ overflowY: 'auto', maxHeight: '120px', paddingRight: '4px' }}>
          {errorUnits.length > 0 ? (
            errorUnits.map((unit, idx) => (
              <DefectItem key={unit.uuid || idx}>
                <DefectName><span>{unit.name}</span></DefectName>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: THEME.danger, fontFamily: 'Pretendard', fontVariantNumeric: 'tabular-nums' }}>{unit.temp}°C</span>
                  <DefectTag>CRITICAL</DefectTag>
                </div>
              </DefectItem>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>현재 감지된 이상 없음</div>
          )}
        </div>
      </DefectStatusPanel>

      <TopRightPanel>
        <ChartHeader>
          <div><ChartTitle><Activity size={18} color={THEME.primary} /> 실시간 검사 현황</ChartTitle><ChartSubtitle>Real-time Monitor</ChartSubtitle></div>
          <div style={{ padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: THEME.primary, borderRadius: '12px', fontSize: 11, fontWeight: 700 }}>LIVE</div>
        </ChartHeader>
        <div style={{ marginBottom: 20 }}><BigNumber>14,480</BigNumber><TrendBadge $isUp={true}><TrendingUp size={14} /> 전일 대비 2.4% 증가</TrendBadge></div>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={GR2_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: THEME.textSub, fontFamily: 'Pretendard' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis yAxisId="L" tick={{ fontSize: 11, fill: THEME.textSub, fontFamily: 'Pretendard' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11, fill: THEME.danger, fontFamily: 'Pretendard' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar yAxisId="L" dataKey="inspection" barSize={12} radius={[6, 6, 6, 6]}>{GR2_DATA.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === GR2_DATA.length - 1 ? THEME.primary : "#cbd5e1"} />))}</Bar>
              <Line yAxisId="R" type="monotone" dataKey="error" stroke={THEME.danger} strokeWidth={3} dot={false} activeDot={{ r: 5, stroke: '#fff' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </TopRightPanel>

      <BottomLeftPanel>
        <ChartHeader><div><ChartTitle><Zap size={18} fill={THEME.textMain} stroke="none" /> 주간 불량률 추이</ChartTitle><ChartSubtitle>Weekly Defect Analysis</ChartSubtitle></div></ChartHeader>
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}><BigNumber>1.2%</BigNumber><TrendBadge $isUp={true} style={{ color: THEME.primary }}>안정권 유지 중</TrendBadge></div>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={GR2_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={THEME.primary} stopOpacity={0.3} /><stop offset="100%" stopColor={THEME.primary} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: THEME.textSub, fontFamily: 'Pretendard' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: THEME.textSub, fontFamily: 'Pretendard' }} unit="%" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1' }} />
              <Area type="monotone" dataKey="rate" stroke={THEME.primary} strokeWidth={3} fill="url(#areaGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </BottomLeftPanel>

      {/* [NEW] VisionAnalysisPanel - 항상 보임, 크기 축소 및 이미지 교체 완료 */}
      <VisionAnalysisPanel>
         {/* 1. 상단: ID + 상태 */}
         <div style={{ 
            padding: '16px 20px', // 패딩 축소
            borderBottom: `1px solid ${THEME.border}`, 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#F9FAFB'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: THEME.textMain, letterSpacing: '-0.5px' }}>
                    {activeUnit.name || 'GR-??'}
                </span>
                
                <div style={{ 
                    padding: '4px 10px', borderRadius: '20px', 
                    backgroundColor: statusBg, color: statusColor,
                    fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    {isError ? <AlertTriangle size={12} strokeWidth={3} /> : <CheckCircle size={12} strokeWidth={3} />}
                    {isError ? '불량' : '정상'}
                </div>
            </div>
            
            {/* 우측 상단 스캔라인 아이콘 (데코레이션) - 크기 축소 */}
            <ScanLine size={20} color={THEME.textSub} />
        </div>

        {/* 2. 중간: 이미지 영역 - 높이 축소 및 이미지 교체 */}
        <div style={{ padding: '16px 20px 0 20px' }}>
            <div style={{ 
                position: 'relative', width: '100%', height: '135px', // 높이 축소 (180 -> 135)
                borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000',
                border: `1px solid ${THEME.border}`, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
            }}>
                {/* [수정] 교체된 공장 대차 이미지 */}
                <img 
                    src={CART_IMAGE_URL}
                    alt="Factory Cart Analysis" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
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

        {/* 3. 하단: 통계 값 (세로 배치) - 패딩 및 폰트 축소 */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* 상반기 평균값 */}
            <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: '12px', backgroundColor: '#F3F4F6',
                border: `1px solid ${THEME.border}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <Database size={14} color={THEME.accent} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: THEME.textSub }}>상반기 평균값</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: THEME.textMain, fontVariantNumeric: 'tabular-nums' }}>
                   0.5421
                </span>
            </div>

            {/* 하반기 평균값 */}
            <div style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: '12px', backgroundColor: '#F3F4F6',
                border: `1px solid ${THEME.border}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <BarChart3 size={14} color={THEME.success} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: THEME.textSub }}>하반기 평균값</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: THEME.textMain, fontVariantNumeric: 'tabular-nums' }}>
                   0.5102
                </span>
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
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("GR2");
  const [targetTab, setTargetTab] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [modalTarget, setModalTarget] = useState<string | null>(null);

  const [hoveredInfo, setHoveredInfo] = useState<UnitData | null>(null);
  const [errorUnits, setErrorUnits] = useState<UnitData[]>([]);

  const tabs = ["GR1", "GR2", "GR3", "GR4", "GR5"];

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
      <MainContent>
        {!initialLoaded && <CyberLoader onFinished={() => setInitialLoaded(true)} />}
        {isNavigating && <TransitionLoader onFinished={handleTransitionComplete} />}
        <PreparingModal target={modalTarget} onClose={() => setModalTarget(null)} />

        <NavContainer>
          {tabs.map(tab => (
            <NavButton key={tab} $active={activeTab === tab} onClick={() => handleTabClick(tab)}>
              <LayoutDashboard size={14} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'text-bottom' }} /> {tab} 공정
            </NavButton>
          ))}
        </NavContainer>

        <ViewerContainer $visible={initialLoaded}>
          
          {initialLoaded && <AIAdvisor errors={errorUnits} />}

          <Panels 
            hoveredInfo={hoveredInfo} 
            errorUnits={errorUnits} 
          />

          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [22, 18, 20], fov: 14 }}
            shadows="soft"
            gl={{
              logarithmicDepthBuffer: true,
              antialias: true,
              powerPreference: "high-performance"
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[20, 30, 20]}
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
                <Center>
                  <group position={[0, 0, 0]}>
                    <ModelErrorBoundary fallback={null}>
                      <FloorModel />
                    </ModelErrorBoundary>
                    <ModelErrorBoundary fallback={null}>
                      <InteractiveJigModel
                        url={JIG_MODEL_PATH}
                        onHoverChange={setHoveredInfo}
                        onStatusUpdate={setErrorUnits}
                      />
                    </ModelErrorBoundary>
                  </group>
                </Center>
              </Stage>
              <Environment preset="city" blur={1} background={false} />
            </Suspense>
            <OrbitControls
              target={[0, 0, 0]}
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

// -----------------------------------------------------------------------------
// [Preload Assets]
useGLTF.preload(JIG_MODEL_PATH);
useGLTF.preload(FLOOR_MODEL_PATH);