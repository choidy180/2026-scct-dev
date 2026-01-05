"use client";

import React, { useState, Suspense, useRef, useMemo, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Canvas, useThree, useFrame } from "@react-three/fiber"; 
import { useGLTF, Stage, OrbitControls, Html, useProgress, Center, Resize, Environment } from "@react-three/drei";
import { Box as LucideBox, Activity, Thermometer, Cpu, AlertCircle, Scan } from "lucide-react";
import * as THREE from "three";

// -----------------------------------------------------------------------------
// [설정] 불러올 파일 경로
const FIXED_MODEL_PATH = "/model.glb"; 
// -----------------------------------------------------------------------------

// --- Styled Components ---

const PageContainer = styled.div`
  display: flex; flex-direction: column; width: 100%; height: 100vh;
  background-color: #1a1a1a; color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(26, 26, 26, 0.8); backdrop-filter: blur(8px);
  position: fixed; top: 0; width: 100%; z-index: 10; box-sizing: border-box;
`;

const HeaderLeft = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
  h1 { font-size: 1.125rem; font-weight: 700; margin: 0; }
`;

const MainContent = styled.main`
  flex: 1; width: 100%; height: 100%; position: relative;
  display: flex; flex-direction: column;
`;

const ViewerContainer = styled.div<{ $visible: boolean }>`
  width: 100%; height: 100%; padding-top: 3.5rem;
  background: radial-gradient(circle at center, #262626 0%, #111111 100%);
  position: relative;
  opacity: ${props => (props.$visible ? 1 : 0)};
  transition: opacity 0.8s ease-out;
`;

const InstructionBadge = styled.div`
  position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
  padding: 0.6rem 1.2rem; background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px; font-size: 0.8rem; color: #a3a3a3;
  pointer-events: none; white-space: nowrap; z-index: 5;
`;

const FloatingLabel = styled.div`
  padding: 4px 8px; background-color: rgba(0, 0, 0, 0.8);
  border: 1px solid #84cc16; border-radius: 4px; color: #84cc16;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  box-shadow: 0 4px 6px rgba(0,0,0,0.4); pointer-events: none;
  user-select: none; opacity: 0.7;
`;

// --- UI & Animation Components ---

const popupFadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const growLine = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const pulse = keyframes`
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(132, 204, 22, 0.7); }
  70% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; box-shadow: 0 0 0 10px rgba(132, 204, 22, 0); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`;

const InfoWrapper = styled.div`
  display: flex; align-items: stretch; gap: 8px;
  opacity: 0; 
  animation: ${popupFadeIn} 0.4s ease-out 0.4s forwards; 
  pointer-events: none;
  
  &::after {
    content: ''; position: absolute; bottom: -6px; left: 50%;
    transform: translateX(-50%); width: 0; height: 0; 
    border-left: 6px solid transparent; border-right: 6px solid transparent;
    border-top: 6px solid #84cc16;
  }
`;

const PreviewBox = styled.div`
  width: 100px; background: rgba(10, 15, 20, 0.95);
  border: 1px solid #84cc16; backdrop-filter: blur(12px);
  position: relative; overflow: hidden;
  box-shadow: 0 0 20px rgba(132, 204, 22, 0.1);
  display: flex; align-items: center; justify-content: center;
`;

const PopupContainer = styled.div`
  width: 200px; background: rgba(15, 20, 25, 0.95);
  border: 1px solid #84cc16; backdrop-filter: blur(12px);
  padding: 0; color: white; font-family: "Consolas", "Monaco", monospace;
  box-shadow: 0 0 30px rgba(132, 204, 22, 0.2);
`;

const PopupHeader = styled.div`
  background: rgba(132, 204, 22, 0.15); padding: 8px 12px;
  border-bottom: 1px solid #84cc16; font-size: 13px; font-weight: bold;
  color: #84cc16; display: flex; align-items: center; gap: 8px;
  text-transform: uppercase; letter-spacing: 1px;
`;

const PopupBody = styled.div`
  padding: 12px; display: flex; flex-direction: column; gap: 8px;
`;

const StatRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; color: #e5e5e5;
  border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 4px;
  span.label { color: #a3a3a3; display: flex; align-items: center; gap: 4px; }
  span.value { font-weight: bold; color: #fff; font-family: "Menlo", monospace; }
  span.status-ok { color: #84cc16; }
`;

const LineContainer = styled.div`
  position: absolute; top: 0; left: 0;
  height: 2px; transform-origin: 0 0; 
  pointer-events: none; z-index: 1000;
`;

const AnimatedLine = styled.div`
  width: 100%; height: 100%; background-color: #84cc16;
  box-shadow: 0 0 8px #84cc16; transform-origin: 0 50%; 
  animation: ${growLine} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
`;

const RingEffect = styled.div`
  position: absolute; width: 12px; height: 12px;
  background: #84cc16; border-radius: 50%;
  transform: translate(-50%, -50%); z-index: 1002;
  box-shadow: 0 0 10px #84cc16;
  opacity: 0; animation: ${keyframes`to{opacity:1}`} 0.1s linear 0.4s forwards;

  &::after {
    content: ''; position: absolute; top: 50%; left: 50%;
    width: 100%; height: 100%; border-radius: 50%;
    background: transparent; border: 2px solid #84cc16;
    transform: translate(-50%, -50%); animation: ${pulse} 2s infinite 0.4s;
  }
`;

// --- Loader Components ---
const LoaderOverlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background-color: #1a1a1a; z-index: 2147483647; 
`;

const ProgressContainer = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 1.2rem;
  width: 320px; padding: 2.5rem; background-color: #262626;
  border-radius: 20px; border: 1px solid #333;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
`;

const ProgressText = styled.div`
  font-size: 1rem; font-weight: 600; color: #e5e5e5;
  display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;
  span.percent { color: #84cc16; font-variant-numeric: tabular-nums; }
`;

const ProgressBarTrack = styled.div`
  width: 100%; height: 8px; background-color: #333; border-radius: 9999px; overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $progress: number }>`
  height: 100%; width: ${props => props.$progress}%;
  background-color: #84cc16; border-radius: 9999px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 20px rgba(132, 204, 22, 0.5);
`;

// --- Preview Components ---

function PreviewObject({ name }: { name: string }) {
  const { scene } = useGLTF(FIXED_MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  
  const targetMesh = useMemo(() => {
    let found: THREE.Mesh | null = null;
    scene.traverse((child) => {
      if (child.uuid === name && (child as THREE.Mesh).isMesh) {
        // 원본 복제
        found = (child as THREE.Mesh).clone();
        
        // [수정] 타입 단언(Type Assertion)을 사용하여 emissive 속성 접근
        if (found.material) {
          const mat = Array.isArray(found.material) 
            ? found.material.map(m => m.clone()) 
            : found.material.clone();
            
          if (Array.isArray(mat)) {
            mat.forEach(m => { 
              // MeshStandardMaterial로 캐스팅 후 emissive 접근
              if ((m as THREE.MeshStandardMaterial).emissive) {
                (m as THREE.MeshStandardMaterial).emissive.setHex(0x000000); 
              }
            });
          } else {
            // MeshStandardMaterial로 캐스팅 후 emissive 접근
            if ((mat as THREE.MeshStandardMaterial).emissive) {
              (mat as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
            }
          }
          found.material = mat;
        }
      }
    });
    return found;
  }, [scene, name]);

  useFrame((state, delta) => {
    // 천천히 회전
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.2;
  });

  if (!targetMesh) return null;

  return (
    <group key={name} ref={groupRef}>
      <Resize scale={1.2}>
        <Center>
          <primitive object={targetMesh} />
        </Center>
      </Resize>
    </group>
  );
}

function InitialCameraRig() {
  const { camera } = useThree();
  const [adjusted, setAdjusted] = useState(false);

  useEffect(() => {
    if (!adjusted) {
      camera.position.y += 5; 
      camera.zoom = 1.3;
      camera.updateProjectionMatrix();
      setAdjusted(true);
    }
  }, [camera, adjusted]);

  return null;
}

// [StatusPopup]
function StatusPopup({ data, position }: { data: any, position: [number, number, number] }) {
  const { camera } = useThree();
  
  const vec = new THREE.Vector3(...position);
  vec.project(camera);
  const isRightSide = vec.x > 0; 

  const dx = isRightSide ? -250 : 250; 
  const dy = -250; 

  const lineLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI); 

  const totalWidth = 310;
  const popupLeft = dx - (totalWidth / 2); 
  const popupTop = dy;

  if (!data) return null;

  return (
    <Html 
      position={position} 
      center 
      zIndexRange={[999999, 0]} 
      occlude={false} 
      style={{ pointerEvents: 'none', width: 0, height: 0, overflow: 'visible' }}
    >
      <div style={{ position: 'relative' }}>
        
        {/* 시작점 마커 (정중앙) */}
        <div style={{
          position: 'absolute', left: -4, top: -4, width: 8, height: 8,
          background: '#84cc16', borderRadius: '50%', boxShadow: '0 0 10px #84cc16',
          zIndex: 1001
        }} />

        {/* 연결선 */}
        <LineContainer 
          style={{
            width: `${lineLength}px`,
            transform: `rotate(${angle}deg)`
          }}
        >
          <AnimatedLine />
        </LineContainer>

        {/* 연결 링 */}
        <RingEffect style={{ left: dx, top: dy }} />

        {/* 정보창 래퍼 */}
        <div style={{
          position: 'absolute',
          left: popupLeft + 'px',
          top: popupTop + 'px',
          width: totalWidth + 'px',
          transform: 'translateY(-100%)',
          paddingBottom: '16px' 
        }}>
          <InfoWrapper>
            
            {/* 프리뷰 창 */}
            <PreviewBox>
              <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 50 }}>
                <Suspense fallback={null}>
                  {/* 조명 추가로 검은색 현상 해결 */}
                  <Environment preset="city" /> 
                  <ambientLight intensity={1} />
                  <PreviewObject name={data.id} />
                </Suspense>
              </Canvas>
            </PreviewBox>

            <PopupContainer>
              <PopupHeader>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <Scan size={14} />
                  {data.name}
                </div>
              </PopupHeader>
              <PopupBody>
                <StatRow>
                  <span className="label"><Activity size={12} /> STATUS</span>
                  <span className="value status-ok">OPERATIONAL</span>
                </StatRow>
                <StatRow>
                  <span className="label"><Thermometer size={12} /> TEMP</span>
                  <span className="value">{data.temp}°C</span>
                </StatRow>
                <StatRow>
                  <span className="label"><Cpu size={12} /> LOAD</span>
                  <span className="value">{data.load}%</span>
                </StatRow>
              </PopupBody>
            </PopupContainer>
          </InfoWrapper>
        </div>

      </div>
    </Html>
  );
}

// Loader
function Loader({ onFinished }: { onFinished: () => void }) {
  const { active, progress } = useProgress();
  const [percent, setPercent] = useState(0);
  const [timePassed, setTimePassed] = useState(false);
  const [shouldUnmount, setShouldUnmount] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setTimePassed(true); }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (active) setPercent(progress);
    else if (progress === 100) setPercent(100);
  }, [active, progress]);

  useEffect(() => {
    if (timePassed && percent === 100) { onFinished(); setShouldUnmount(true); }
  }, [timePassed, percent, onFinished]);

  if (shouldUnmount) return null;

  return (
    <LoaderOverlay>
      <ProgressContainer>
        <ProgressText>
          <span>모델 불러오는 중...</span>
          <span className="percent">{percent.toFixed(0)}%</span>
        </ProgressText>
        <ProgressBarTrack><ProgressBarFill $progress={percent} /></ProgressBarTrack>
      </ProgressContainer>
    </LoaderOverlay>
  );
}

type EmissiveData = { color: THREE.Color; intensity: number; };
type LabelInfo = { id: string; text: string; position: [number, number, number]; };

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const originalEmissives = useRef<Map<string, EmissiveData>>(new Map());
  const highlightColor = useMemo(() => new THREE.Color("#84cc16"), []); 
  const [labels, setLabels] = useState<LabelInfo[]>([]);
  const [hoveredData, setHoveredData] = useState<any | null>(null);

  useEffect(() => {
    const generatedLabels: LabelInfo[] = [];
    let grCount = 1;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true; mesh.receiveShadow = true;
        
        if (mesh.material) {
          mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
        }
        
        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        
        if (!box.isEmpty()) {
          const center = new THREE.Vector3();
          box.getCenter(center);
          const labelText = `GR${grCount.toString().padStart(2, '0')}`;
          
          mesh.userData = { 
            name: labelText,
            temp: Math.floor(Math.random() * 30) + 40, 
            load: Math.floor(Math.random() * 40) + 20
          };

          generatedLabels.push({ id: mesh.uuid, text: labelText, position: [center.x, box.max.y + 0.1, center.z] });
          grCount++;
        }
      }
    });
    setLabels(generatedLabels);
  }, [scene]);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    document.body.style.cursor = "pointer";

    if (mesh.isMesh) {
      if (mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          if (!originalEmissives.current.has(mesh.uuid)) {
            originalEmissives.current.set(mesh.uuid, { color: mat.emissive.clone(), intensity: mat.emissiveIntensity ?? 1 });
          }
          mat.emissive.copy(highlightColor);
          mat.emissiveIntensity = 2.0;
        }
      }

      // [핵심] 마우스 올린 '바로 그 부품(mesh)'의 정중앙 좌표 계산
      mesh.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(mesh); // 절대 parent를 쓰지 않음
      const center = new THREE.Vector3();
      box.getCenter(center); 

      setHoveredData({
        id: mesh.uuid,
        name: mesh.userData.name || "Unknown Unit",
        temp: mesh.userData.temp || 45,
        load: mesh.userData.load || 30,
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
    <group>
      <primitive 
        object={scene} 
        onPointerOver={handlePointerOver} 
        onPointerOut={handlePointerOut} 
      />
      
      {labels.map((label) => (
        <Html key={label.id} position={label.position} center zIndexRange={[100, 0]} distanceFactor={12} style={{pointerEvents: 'none'}}>
          <FloatingLabel>{label.text}</FloatingLabel>
        </Html>
      ))}

      {hoveredData && (
        <StatusPopup 
          data={hoveredData} 
          position={hoveredData.position} 
        />
      )}
    </group>
  );
}

// --- Main Page Component ---

export default function GlbViewerPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          <LucideBox size={24} color="#84cc16" />
          <h1>GLB Viewer (Studio)</h1>
        </HeaderLeft>
      </Header>

      <MainContent>
        <Loader onFinished={() => setIsLoaded(true)} />

        <ViewerContainer $visible={isLoaded}>
          
          <Canvas dpr={[1, 2]} camera={{ position: [0, 10.54, 10.25], fov: 45 }} shadows>
            
            <InitialCameraRig />

            <Suspense fallback={null}>
              <Stage 
                environment="city" 
                intensity={1} 
                adjustCamera={0.7} 
                shadows="contact"
              >
                <Center>
                  <Model url={FIXED_MODEL_PATH} />
                </Center>
              </Stage>
            </Suspense>
            <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
          </Canvas>

          <InstructionBadge>
            좌클릭/휠: 시점 조작 / 마우스 오버: 상세 정보
          </InstructionBadge>
        </ViewerContainer>
      </MainContent>
    </PageContainer>
  );
}