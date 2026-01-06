"use client";

import React, { useState, Suspense, useRef, useMemo, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Canvas, useThree } from "@react-three/fiber"; 
import { 
  useGLTF, Stage, OrbitControls, Html, useProgress, Center, Environment, Bounds 
} from "@react-three/drei";
import { 
  Scan, BarChart3, TrendingUp, Layers, AlertTriangle, 
  LayoutDashboard, Lock, Settings, XCircle, Info 
} from "lucide-react";
import * as THREE from "three";
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

import { GR2_DATA } from "@/data/gr2";

// -----------------------------------------------------------------------------
// [설정] 파일 경로
const JIG_MODEL_PATH = "/models/final.glb";    
const FLOOR_MODEL_PATH = "/models/floor.glb";

// [배경 이미지]
const FACTORY_BG_IMAGE = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop";
// -----------------------------------------------------------------------------

// --- [에러 핸들링] ---
class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("3D Model Loading Failed:", error); }
  render() { if (this.state.hasError) return this.props.fallback; return this.props.children; }
}

function ErrorFallbackModel({ label }: { label: string }) {
  return (
    <group>
      <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="red" wireframe /></mesh>
      <Html position={[0, 1.2, 0]} center>
        <div style={{ color: 'red', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', border: '1px solid red', fontSize: '10px', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={10} /> 로드 실패</div>
          <div style={{ opacity: 0.7 }}>{label}</div>
        </div>
      </Html>
    </group>
  );
}

// --- Animations ---
const slideInRight = keyframes` from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } `;
const slideInLeft = keyframes` from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } `;
const float = keyframes` 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } `;
const growLine = keyframes` from { transform: scaleX(0); } to { transform: scaleX(1); } `;
const popupFadeIn = keyframes` from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } `;
const modalPop = keyframes` from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } `;
const pulse = keyframes`
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
  70% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; box-shadow: 0 0 0 10px rgba(56, 189, 248, 0); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`;

// --- Styled Components ---
const PageContainer = styled.div`
  display: flex; flex-direction: column; width: 100%; height: calc(100vh - 64px);
  background-image: url('${FACTORY_BG_IMAGE}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #0f172a; 
  color: #f8fafc; font-family: 'Pretendard', sans-serif; overflow: hidden;
  position: relative;
  &::before {
    content: '';
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(10, 15, 30, 0.85);
    z-index: 0;
    pointer-events: none;
  }
`;

const MainContent = styled.main` 
  flex: 1; width: 100%; height: 100%; position: relative; 
  z-index: 10; 
`;

const ViewerContainer = styled.div<{ $visible: boolean }>`
  width: 100%; height: 100%; padding-top: 4rem; position: relative;
  opacity: ${props => (props.$visible ? 1 : 0)}; transition: opacity 1.2s ease-in-out;
  /* z-index 문맥 생성 방지 */
  isolation: isolate; 
`;

// --- Navigation Styles ---
const NavContainer = styled.div`
  position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; 
  z-index: 20; /* 패널보다 높게, 하지만 모달보단 낮게 */
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px);
  padding: 6px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
`;

const NavButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(56, 189, 248, 0.2)' : 'transparent'};
  color: ${props => props.$active ? '#38bdf8' : '#94a3b8'};
  border: 1px solid ${props => props.$active ? 'rgba(56, 189, 248, 0.5)' : 'transparent'};
  padding: 8px 16px; border-radius: 8px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    color: #f1f5f9;
    background: ${props => props.$active ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  }
`;

// --- Modal Styles ---
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 99999;
`;
const ModalBox = styled.div`
  width: 320px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px; padding: 24px; text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  animation: ${modalPop} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
`;
const CloseButton = styled.button`
  position: absolute; top: 12px; right: 12px; background: none; border: none; color: #64748b;
  cursor: pointer; transition: color 0.2s; &:hover { color: #fff; }
`;

// --- Glass Panels (Z-Index 조정됨) ---
const GlassPanel = styled.div`
  position: fixed; width: 440px; height: 260px;
  background: rgba(30, 41, 59, 0.75); 
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 20px;
  display: flex; flex-direction: column; 
  z-index: 10; /* 3D 팝업보다 낮게 설정 */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  pointer-events: auto;
  &:hover { transform: translateY(-4px) scale(1.01); box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3); border-color: rgba(255, 255, 255, 0.3); background: rgba(30, 41, 59, 0.85); }
  &::before { content: ''; position: absolute; inset: 0; border-radius: 16px; padding: 1px; background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
`;
const TopRightPanel = styled(GlassPanel)` top: 6rem; right: 2rem; animation: ${slideInRight} 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; `;
const BottomLeftPanel = styled(GlassPanel)` bottom: 2rem; left: 2rem; height: 240px; animation: ${slideInLeft} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards; opacity: 0; animation-fill-mode: forwards; `;
const PanelHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px;
  .title-group { display: flex; align-items: center; gap: 10px; color: #f8fafc; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
  .tag { font-size: 10px; font-weight: 600; padding: 4px 8px; border-radius: 20px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
`;
const ChartWrapper = styled.div` flex: 1; width: 100%; min-height: 0; position: relative; `;

// --- Interactive UI ---
const InstructionBadge = styled.div`
  position: fixed; bottom: 3rem; left: 50%; transform: translateX(-50%);
  padding: 0.8rem 1.6rem; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); 
  border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; 
  font-size: 0.85rem; font-weight: 500; color: #cbd5e1;
  display: flex; align-items: center; gap: 8px; pointer-events: none; z-index: 90;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3); animation: ${float} 4s ease-in-out infinite;
  span.highlight { color: #38bdf8; font-weight: 700; }
`;
const LineContainer = styled.div` position: absolute; top: 0; left: 0; height: 2px; transform-origin: 0 0; pointer-events: none; z-index: 1000; `;
const AnimatedLine = styled.div` width: 100%; height: 100%; background-color: #38bdf8; box-shadow: 0 0 10px #38bdf8; transform-origin: 0 50%; animation: ${growLine} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; `;
const RingEffect = styled.div`
  position: absolute; width: 12px; height: 12px; background: #38bdf8; border-radius: 50%;
  transform: translate(-50%, -50%); z-index: 1002; box-shadow: 0 0 10px #38bdf8; opacity: 0; animation: ${keyframes`to{opacity:1}`} 0.1s linear 0.4s forwards;
  &::after { content: ''; position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; border-radius: 50%; background: transparent; border: 2px solid #38bdf8; transform: translate(-50%, -50%); animation: ${pulse} 2s infinite 0.4s; }
`;
const InfoWrapper = styled.div` display: flex; align-items: stretch; gap: 8px; opacity: 0; animation: ${popupFadeIn} 0.4s ease-out 0.4s forwards; pointer-events: none; `;
const FloatingLabel = styled.div`
  padding: 4px 8px; background-color: rgba(15, 23, 42, 0.9); border: 1px solid #38bdf8; border-radius: 4px; color: #38bdf8;
  font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.6); pointer-events: none; user-select: none; opacity: 0.8; transition: opacity 0.3s;
`;

// --- Loaders ---
const LoaderOverlay = styled.div` position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; z-index: 9999; `;
const LoadingBarContainer = styled.div` width: 300px; text-align: center; `;
const LoadingText = styled.div` font-size: 14px; color: #94a3b8; margin-bottom: 12px; display: flex; justify-content: space-between; strong { color: #38bdf8; } `;
const Track = styled.div` width: 100%; height: 4px; background: #334155; border-radius: 2px; overflow: hidden; `;
const Fill = styled.div<{ $p: number }>` height: 100%; width: ${props => props.$p}%; background: linear-gradient(90deg, #38bdf8, #818cf8); transition: width 0.1s linear; `;

// 1. 초기 3D 에셋 로딩용 로더
function InitialLoader({ onFinished }: { onFinished: () => void }) {
  const { active, progress } = useProgress();
  const [val, setVal] = useState(0);
  const [done, setDone] = useState(false);
  
  useEffect(() => {
    let frame: number;
    const loop = () => {
      setVal(v => { 
        const target = active ? progress : 100; 
        const next = v + (target - v) * 0.1; 
        if(Math.abs(target - next) < 0.1) return target; 
        return next; 
      });
      frame = requestAnimationFrame(loop);
    };
    loop(); return () => cancelAnimationFrame(frame);
  }, [active, progress]);

  useEffect(() => { 
    if(val > 99.5) { 
      setTimeout(() => { setDone(true); onFinished(); }, 600); 
    } 
  }, [val, onFinished]);

  if(done) return null;
  return (<LoaderOverlay><LoadingBarContainer><LoadingText><span>시스템 불러오는 중</span><strong>{val.toFixed(0)}%</strong></LoadingText><Track><Fill $p={val} /></Track></LoadingBarContainer></LoaderOverlay>);
}

// 2. 탭 전환용 2초 강제 로더
function TransitionLoader({ onFinished }: { onFinished: () => void }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const duration = 2000;
    let frame: number;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min((progress / duration) * 100, 100);
      setVal(percentage);
      if (progress < duration) {
        frame = requestAnimationFrame(animate);
      } else {
        setTimeout(onFinished, 200);
      }
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

// --- Popup (Z-Index Fix) ---
const PopupCard = styled.div` width: 220px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(56, 189, 248, 0.5); border-radius: 8px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); pointer-events: auto; `;
const PopupTitle = styled.div` background: rgba(56, 189, 248, 0.15); padding: 10px 12px; font-size: 13px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); `;
const PopupRow = styled.div` padding: 8px 12px; display: flex; justify-content: space-between; font-size: 12px; color: #cbd5e1; border-bottom: 1px solid rgba(255,255,255,0.05); &:last-child { border-bottom: none; } span.val { font-family: 'Menlo', monospace; font-weight: 600; color: #fff; } span.good { color: #4ade80; } `;

function StatusPopup({ data, position }: { data: any, position: [number, number, number] }) {
  const { camera } = useThree();
  const vec = new THREE.Vector3(...position); vec.project(camera);
  const isRightSide = vec.x > 0;
  const dx = isRightSide ? -180 : 180; const dy = -180; 
  const lineLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI); 
  const totalWidth = 220; const popupLeft = dx - (totalWidth / 2); const popupTop = dy;
  
  // ✅ 추가: 마운트 상태 확인 (SSR 안전성 확보)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
      setMounted(true);
  }, []);

  // 마운트 전에는 렌더링 하지 않음
  if (!mounted) return null;

  return (
    // ✅ 수정: portal 속성을 사용하여 document.body로 렌더링 위치 이동
    // 이렇게 하면 3D 캔버스의 쌓임 맥락을 벗어나 전역 z-index 경쟁에 참여하게 됩니다.
    <Html 
      position={position} 
      center 
      portal={{ current: document.body }} 
      zIndexRange={[99990, 99999]} 
      style={{ pointerEvents: 'none', width: 0, height: 0, overflow: 'visible', zIndex: 99999 }}
    >
      <div style={{ position: 'relative', zIndex: 99999 }}>
        <div style={{ position: 'absolute', left: -4, top: -4, width: 8, height: 8, background: '#38bdf8', borderRadius: '50%', boxShadow: '0 0 10px #38bdf8', zIndex: 1001 }} />
        <LineContainer style={{ width: `${lineLength}px`, transform: `rotate(${angle}deg)` }}><AnimatedLine /></LineContainer>
        <RingEffect style={{ left: dx, top: dy }} />
        <div style={{ position: 'absolute', left: popupLeft + 'px', top: popupTop + 'px', width: totalWidth + 'px', transform: 'translateY(-100%)', paddingBottom: '16px' }}>
          <InfoWrapper>
            <PopupCard>
              <PopupTitle><Scan size={14}/> {data.name}</PopupTitle>
              <PopupRow><span>상태</span><span className="val good">정상</span></PopupRow>
              <PopupRow><span>온도</span><span className="val">{data.temp}°C</span></PopupRow>
              <PopupRow><span>부하</span><span className="val">{data.load}%</span></PopupRow>
            </PopupCard>
          </InfoWrapper>
        </div>
      </div>
    </Html>
  );
}

// -----------------------------------------------------------------------------
// [모델 정의]
function StaticFloorModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#555555"), metalness: 0.2, roughness: 0.8, side: THREE.DoubleSide
        });
        mesh.receiveShadow = true;
      }
    });
  }, [scene]);
  return <primitive object={scene} />;
}

type EmissiveData = { color: THREE.Color; intensity: number; };
type LabelInfo = { id: string; text: string; position: [number, number, number]; };

function InteractiveJigModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const [labels, setLabels] = useState<LabelInfo[]>([]);
  const [hoveredData, setHoveredData] = useState<any | null>(null);
  const originalEmissives = useRef<Map<string, EmissiveData>>(new Map());
  const highlightColor = useMemo(() => new THREE.Color("#38bdf8"), []); 

  useEffect(() => {
    const generatedLabels: LabelInfo[] = [];
    let grCount = 1;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true; mesh.receiveShadow = true;
        const metalMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#c0c0c0"), metalness: 0.8, roughness: 0.25, envMapIntensity: 1.5 
        });
        mesh.material = metalMaterial;
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        if (!box.isEmpty()) {
          const center = new THREE.Vector3(); box.getCenter(center);
          const labelText = `GR${grCount.toString().padStart(2, '0')}`;
          mesh.userData = { name: labelText, temp: Math.floor(Math.random() * 30) + 40, load: Math.floor(Math.random() * 40) + 20 };
          generatedLabels.push({ id: mesh.uuid, text: labelText, position: [center.x, box.max.y + 0.1, center.z] });
          grCount++;
        }
      }
    });
    setLabels(generatedLabels);
  }, [scene]);

  const handlePointerOver = (e: any) => {
    e.stopPropagation(); document.body.style.cursor = "pointer";
    const mesh = e.object as THREE.Mesh;
    if (mesh.isMesh) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!originalEmissives.current.has(mesh.uuid)) {
        originalEmissives.current.set(mesh.uuid, { 
          color: mat.emissive ? mat.emissive.clone() : new THREE.Color(0,0,0), 
          intensity: mat.emissiveIntensity ?? 1 
        });
      }
      mat.emissive.copy(highlightColor);
      mat.emissiveIntensity = 2.0; 
      mesh.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(mesh);
      const center = new THREE.Vector3(); box.getCenter(center);
      setHoveredData({
        id: mesh.uuid, name: mesh.userData.name || "알 수 없음",
        temp: mesh.userData.temp || 45, load: mesh.userData.load || 30,
        position: [center.x, center.y, center.z]
      });
    }
  };

  const handlePointerOut = (e: any) => {
    const mesh = e.object as THREE.Mesh;
    document.body.style.cursor = "auto";
    if (mesh.isMesh && originalEmissives.current.has(mesh.uuid)) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const originalData = originalEmissives.current.get(mesh.uuid)!;
        mat.emissive.copy(originalData.color);
        mat.emissiveIntensity = originalData.intensity;
    }
    setHoveredData(null);
  };

  return (
    <group position={[0, 0.0, 0]}> 
      <primitive object={scene} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} />
      {labels.map((label) => (
        <Html key={label.id} position={label.position} center zIndexRange={[100, 0]} distanceFactor={12} style={{pointerEvents: 'none'}}>
          <FloatingLabel>{label.text}</FloatingLabel>
        </Html>
      ))}
      {/* 팝업 컴포넌트 렌더링 */}
      {hoveredData && <StatusPopup data={hoveredData} position={hoveredData.position} />}
    </group>
  );
}

// --- Tooltip Style ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
        padding: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: '140px'
      }}>
        <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '8px', fontWeight: '600' }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
            <span style={{ color: p.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{width:6, height:6, borderRadius:2, background:p.color}}/> 
              {p.name === 'Inspection' ? '검사 수' : p.name === 'Error' ? '불량 수' : p.name === 'Rate' ? '불량률' : p.name}
            </span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{p.value}{p.unit || ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Modal Component ---
function PreparingModal({ target, onClose }: { target: string | null, onClose: () => void }) {
  if (!target) return null;
  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}><XCircle size={24} /></CloseButton>
        <div style={{ width: 60, height: 60, margin: '0 auto 16px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={30} color="#94a3b8" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>시스템 준비 중</h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' }}>
          선택하신 <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{target} 공정</span> 대시보드는<br/>현재 시스템 연동 작업이 진행 중입니다.
        </p>
        <button 
          onClick={onClose}
          style={{ marginTop: '20px', padding: '10px 24px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          확인
        </button>
      </ModalBox>
    </ModalOverlay>
  );
}

// --- Main Page ---

export default function GlbViewerPage() {
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("GR2"); 
  const [targetTab, setTargetTab] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // 모달 상태
  const [modalTarget, setModalTarget] = useState<string | null>(null);

  const tabs = ["GR1", "GR2", "GR3", "GR4", "GR5"];

  const handleTabClick = (tab: string) => {
    if (tab === activeTab || isNavigating) return;

    if (tab === "GR2") {
      // GR2는 정상 진입 (로딩바 표시)
      setTargetTab(tab);
      setIsNavigating(true);
    } else {
      // 다른 탭은 모달 띄우기 (화면 전환 X)
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
        {!initialLoaded && <InitialLoader onFinished={() => setInitialLoaded(true)} />}
        {isNavigating && <TransitionLoader onFinished={handleTransitionComplete} />}
        
        {/* 준비중 모달 (가장 최상위 z-index) */}
        <PreparingModal target={modalTarget} onClose={() => setModalTarget(null)} />

        <NavContainer>
          {tabs.map(tab => (
            <NavButton 
              key={tab} 
              $active={activeTab === tab} 
              onClick={() => handleTabClick(tab)}
            >
              <LayoutDashboard size={14} style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'text-bottom' }} />
              {tab} 공정
            </NavButton>
          ))}
        </NavContainer>

        <ViewerContainer $visible={initialLoaded}>
          
          <TopRightPanel>
            <PanelHeader>
              <div className="title-group"><BarChart3 size={18} color="#38bdf8"/> 실시간 검사 현황</div>
              <div className="tag">실시간</div>
            </PanelHeader>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={GR2_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize:10, fill:'#64748b'}} tickLine={false} axisLine={false} interval={4} />
                  <YAxis yAxisId="L" tick={{fontSize:10, fill:'#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="R" orientation="right" tick={{fontSize:10, fill:'#f43f5e'}} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                  <Bar yAxisId="L" dataKey="inspection" name="Inspection" fill="url(#barGradient)" barSize={8} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Line yAxisId="R" type="monotone" dataKey="error" name="Error" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{r:5, stroke:'#fff'}} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </TopRightPanel>

          <BottomLeftPanel>
            <PanelHeader>
              <div className="title-group"><TrendingUp size={18} color="#4ade80"/> 주간 불량률 추이</div>
              <div className="tag" style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)', borderColor: 'rgba(74, 222, 128, 0.3)' }}>주간</div>
            </PanelHeader>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={GR2_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.4}/>
                      <stop offset="100%" stopColor="#4ade80" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize:10, fill:'#64748b'}} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{fontSize:10, fill:'#64748b'}} unit="%" tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{stroke: 'rgba(255,255,255,0.2)'}} />
                  <Area type="monotone" dataKey="rate" name="Rate" stroke="#4ade80" strokeWidth={2} fill="url(#areaGradient)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </BottomLeftPanel>

          <Canvas 
            dpr={[1, 2]} 
            camera={{ position: [15, 12, 12], fov: 1 }} 
            shadows
            gl={{ logarithmicDepthBuffer: true, antialias: true }} 
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[100, 100, 100]} intensity={1} castShadow />

            <Suspense fallback={null}>
              <Bounds fit clip observe margin={0.62}>
                <Stage environment="city" intensity={2.0} adjustCamera={false} shadows={false}>
                  <Center>
                    <group>
                      <ModelErrorBoundary fallback={<ErrorFallbackModel label="Floor Model" />}>
                        <StaticFloorModel url={FLOOR_MODEL_PATH} />
                      </ModelErrorBoundary>
                      
                      <ModelErrorBoundary fallback={<ErrorFallbackModel label="Jig Model" />}>
                        <InteractiveJigModel url={JIG_MODEL_PATH} />
                      </ModelErrorBoundary>
                    </group>
                  </Center>
                </Stage>
              </Bounds>
              <Environment preset="city" blur={1} background={false} />
            </Suspense>
            <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
          </Canvas>

          <InstructionBadge>
            <Layers size={14} color="#38bdf8"/>
            <span className="highlight">좌클릭</span>: 회전 / <span className="highlight">스크롤</span>: 확대/축소
          </InstructionBadge>

        </ViewerContainer>
      </MainContent>
    </PageContainer>
  );
}