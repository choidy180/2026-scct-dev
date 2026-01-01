"use client";

import React, { useState, Suspense, useRef, useMemo, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage, OrbitControls, Html } from "@react-three/drei";
import { Upload, X, Loader2, Box as LucideBox } from "lucide-react"; // 이름 확인
import * as THREE from "three";

// --- Styled Components (기존과 동일) ---
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #171717;
  color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #262626;
  background-color: rgba(23, 23, 23, 0.5);
  backdrop-filter: blur(4px);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 10;
  box-sizing: border-box;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  h1 {
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin: 0;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  span {
    font-size: 0.875rem;
    color: #a3a3a3;
    @media (max-width: 640px) {
      display: none;
    }
  }
`;

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(239, 68, 68, 0.2);
  }
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const UploadWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1.5rem;
  box-sizing: border-box;
`;

const UploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 42rem;
  height: 16rem;
  border: 2px dashed #404040;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: transparent;

  &:hover {
    border-color: #3b82f6;
    background-color: rgba(38, 38, 38, 0.5);

    .icon-wrapper {
      background-color: rgba(59, 130, 246, 0.2);
    }
    .icon {
      color: #3b82f6;
    }
  }

  input {
    display: none;
  }
`;

const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 1.25rem;
  padding-bottom: 1.5rem;
`;

const IconWrapper = styled.div`
  padding: 1rem;
  margin-bottom: 0.75rem;
  background-color: #262626;
  border-radius: 9999px;
  transition: background-color 0.2s;
`;

const TextTitle = styled.p`
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #d4d4d4;
`;

const TextSub = styled.p`
  font-size: 0.875rem;
  color: #737373;
`;

const ViewerContainer = styled.div`
  width: 100%;
  height: 100%;
  padding-top: 3.5rem;
  background: linear-gradient(to bottom, #171717, #262626);
  position: relative;
`;

const InstructionBadge = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #a3a3a3;
  pointer-events: none;
  white-space: nowrap;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: white;

  svg {
    animation: ${spin} 1s linear infinite;
    color: #3b82f6;
  }

  span {
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const FloatingLabel = styled.div`
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid #84cc16;
  border-radius: 4px;
  color: #84cc16;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  pointer-events: none;
  user-select: none;
`;

// --- 3D Helper Components ---

type EmissiveData = {
  color: THREE.Color;
  intensity: number;
};

type LabelInfo = {
  id: string;
  text: string;
  position: [number, number, number];
};

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const originalEmissives = useRef<Map<string, EmissiveData>>(new Map());
  const highlightColor = useMemo(() => new THREE.Color("#84cc16"), []);
  const [labels, setLabels] = useState<LabelInfo[]>([]);

  useEffect(() => {
    const generatedLabels: LabelInfo[] = [];
    let grCount = 1;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map((m) => m.clone())
            : mesh.material.clone();
        }

        mesh.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        box.getSize(size);

        if (!box.isEmpty() && size.length() > 0.01) {
          const center = new THREE.Vector3();
          box.getCenter(center);

          const labelText = `GR${grCount.toString().padStart(2, '0')}`;

          generatedLabels.push({
            id: mesh.uuid,
            text: labelText,
            position: [center.x, box.max.y + 0.05, center.z], 
          });
          
          grCount++;
        }
      }
    });
    setLabels(generatedLabels);
  }, [scene]);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    if (mesh.isMesh && mesh.material) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        document.body.style.cursor = "pointer";
        if (!originalEmissives.current.has(mesh.uuid)) {
          originalEmissives.current.set(mesh.uuid, {
            color: mat.emissive.clone(),
            intensity: mat.emissiveIntensity ?? 1,
          });
        }
        mat.emissive.copy(highlightColor);
        mat.emissiveIntensity = 1.0;
      }
    }
  };

  const handlePointerOut = (e: any) => {
    const mesh = e.object as THREE.Mesh;
    if (mesh.isMesh && originalEmissives.current.has(mesh.uuid)) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const originalData = originalEmissives.current.get(mesh.uuid)!;
      document.body.style.cursor = "auto";
      mat.emissive.copy(originalData.color);
      mat.emissiveIntensity = originalData.intensity;
    }
  };

  return (
    <group>
      <primitive
        object={scene}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {labels.map((label) => (
        <Html
          key={label.id}
          position={label.position}
          center
          zIndexRange={[100, 0]}
          distanceFactor={10}
        >
          <FloatingLabel>
            {label.text}
          </FloatingLabel>
        </Html>
      ))}
    </group>
  );
}

function Loader() {
  return (
    <Html center>
      <LoaderWrapper>
        <Loader2 size={32} />
        <span>모델 불러오는 중...</span>
      </LoaderWrapper>
    </Html>
  );
}

// --- Main Page Component ---

export default function GlbViewerPage() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileName(file.name);
    }
  };

  const handleReset = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setFileName("");
  };

  return (
    <PageContainer>
      <Header>
        <HeaderLeft>
          {/* 수정된 부분: BoxLucideBox -> LucideBox */}
          <LucideBox size={24} color="#3b82f6" />
          <h1>GLB Viewer</h1>
        </HeaderLeft>

        {fileUrl && (
          <HeaderRight>
            <span>{fileName}</span>
            <ResetButton onClick={handleReset}>
              <X size={12} />
              닫기
            </ResetButton>
          </HeaderRight>
        )}
      </Header>

      <MainContent>
        {!fileUrl ? (
          <UploadWrapper>
            <UploadLabel>
              <UploadContent>
                <IconWrapper className="icon-wrapper">
                  <Upload className="icon" size={32} color="#a3a3a3" />
                </IconWrapper>
                <TextTitle>모델 파일 업로드</TextTitle>
                <TextSub>.glb 또는 .gltf 파일을 이곳에 드래그하거나 클릭하세요</TextSub>
              </UploadContent>
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={handleFileUpload}
              />
            </UploadLabel>
          </UploadWrapper>
        ) : (
          <ViewerContainer>
            <Canvas dpr={[1, 2]} camera={{ fov: 45 }} shadows>
              <Suspense fallback={<Loader />}>
                <Stage environment="city" intensity={0.5} adjustCamera={1.2}>
                  <Model url={fileUrl} />
                </Stage>
              </Suspense>
              <OrbitControls makeDefault autoRotateSpeed={0.5} />
            </Canvas>

            <InstructionBadge>
              마우스 오버: 부품 하이라이트 / 우클릭: 이동 / 휠: 확대·축소
            </InstructionBadge>
          </ViewerContainer>
        )}
      </MainContent>
    </PageContainer>
  );
}