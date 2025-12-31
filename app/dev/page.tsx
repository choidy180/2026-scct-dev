"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanEye, FileText, History, BatteryCharging, Wifi, MoreHorizontal,
  AlertCircle, Thermometer, ShieldAlert
} from "lucide-react";

// --- Theme Definition ---
const THEME = {
  bg: "#0f172a", 
  primary: "#3B82F6",
  alert: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",
  textMain: "#1E293B",
  textSub: "#64748B",
  cardBg: "rgba(255, 255, 255, 0.85)", 
  line: "#94A3B8",
};

const BG_IMAGE_URL = "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?q=80&w=2632&auto=format&fit=crop";

const DATA_NODES = [
  { id: 1, title: "Detected Object", value: "Unattended Bag", subValue: "Conf: 98%", color: THEME.warning, icon: <ScanEye size={20} />, tags: ["Zone B-2", "Black Nylon"] },
  { id: 2, title: "Thermal Scan", value: "85°C (High)", subValue: "Abnormal Heat", color: THEME.alert, icon: <Thermometer size={20} />, tags: ["Risk: Fire", "Sensor: IR"] },
  { id: 3, title: "Protocol", value: "Code Red", subValue: "Evacuate Area", color: THEME.primary, icon: <FileText size={20} />, tags: ["View PDF", "Share"] },
  { id: 4, title: "History", value: "1st Detection", subValue: "2 mins ago", color: THEME.textSub, icon: <History size={20} />, tags: ["No Owner", "Cam #4"] },
  { id: 5, title: "Battery", value: "82%", subValue: "4h Left", color: THEME.success, icon: <BatteryCharging size={20} />, tags: ["Temp: OK"] },
  { id: 6, title: "Network", value: "5G Stable", subValue: "12ms Latency", color: THEME.success, icon: <Wifi size={20} />, tags: ["Secure", "HD Stream"] },
];

export default function WearableARInterface() {
  const [isActive, setIsActive] = useState(false);
  const RADIUS = 400; 

  return (
    <Container>
      {/* 배경 레이어들 */}
      <SharpBackgroundLayer />
      <PeripheralBlurLayer $isActive={isActive} />
      <GlobalTintLayer $isActive={isActive} />
      <BackgroundGrid $isActive={isActive} />

      <HeaderStatus>
        <span className="label">WEARABLE CAM STREAM</span>
        <div className="status-row">
          <div className={`dot ${isActive ? 'active' : ''}`} />
          <span className="value">
            {isActive ? "TARGET LOCKED" : "SEARCHING..."}
          </span>
        </div>
      </HeaderStatus>

      <AnimatePresence>
        {isActive && (
          <EmergencyAlert
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
            transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
          >
            <AlertHeader>
              <ShieldAlert size={24} color={THEME.alert} />
              <div>
                <span className="alert-title">CRITICAL WARNING</span>
                <span className="alert-time">Just now</span>
              </div>
            </AlertHeader>
            <AlertBody>
              <div className="issue-row">
                <span className="issue-label">Issue:</span>
                <span className="issue-value">Thermal Anomaly Detected</span>
              </div>
              <p className="description">Target object temperature is rising rapidly (85°C). Potential combustion risk.</p>
            </AlertBody>
            <ActionGuideBox>
              <span className="guide-label">REQUIRED ACTION:</span>
              <div className="guide-step"><AlertCircle size={16} /><span>Maintain 5m safety distance.</span></div>
              <div className="guide-step"><AlertCircle size={16} /><span>Do not touch. Contact EOD.</span></div>
            </ActionGuideBox>
          </EmergencyAlert>
        )}
      </AnimatePresence>

      <CenterOrigin>
        <SVGOverlay>
          <AnimatePresence>
            {isActive && DATA_NODES.map((node, i) => {
              const angleDeg = (i * (360 / DATA_NODES.length)) - 90;
              const radian = (angleDeg * Math.PI) / 180;
              const x = Math.cos(radian) * RADIUS;
              const y = Math.sin(radian) * RADIUS;

              return (
                <motion.line
                  key={`line-${node.id}`}
                  x1={0} y1={0}
                  x2={x} y2={y}
                  stroke={THEME.line}
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              );
            })}
          </AnimatePresence>
        </SVGOverlay>

        {/* --- [핵심 변경] 투명 트리거 영역 & 미니멀 HUD --- */}
        <InvisibleTrigger
          onMouseEnter={() => setIsActive(true)}
          onMouseLeave={() => setIsActive(false)}
        >
          {/* 중앙 십자선 (아주 얇게, 항상 표시되거나 활성화시 표시) */}
          <Crosshair
            animate={{ 
              opacity: isActive ? 1 : 0.3,
              scale: isActive ? 1 : 0.8,
              rotate: isActive ? 90 : 0
            }}
          >
             <div className="h-line" />
             <div className="v-line" />
          </Crosshair>

          {/* 활성화 시 나타나는 코너 브라켓 (조준되는 느낌) */}
          <CornerBrackets
            animate={{ 
              scale: isActive ? 1 : 1.5, // 밖에서 안으로 조여짐
              opacity: isActive ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="corner top-left" />
            <div className="corner top-right" />
            <div className="corner bottom-left" />
            <div className="corner bottom-right" />
          </CornerBrackets>

          {/* 인식 중일 때 돌아가는 링 (선택 사항) */}
          {isActive && (
            <ScanningRing
              animate={{ rotate: 360, opacity: [0, 1, 0] }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
            />
          )}
        </InvisibleTrigger>

        {/* Data Cards */}
        <AnimatePresence>
          {isActive && DATA_NODES.map((node, index) => {
            const angleDeg = (index * (360 / DATA_NODES.length)) - 90;
            const radian = (angleDeg * Math.PI) / 180;
            const x = Math.cos(radian) * RADIUS;
            const y = Math.sin(radian) * RADIUS;

            return (
              <NodeItem key={node.id} data={node} x={x} y={y} index={index} />
            );
          })}
        </AnimatePresence>
      </CenterOrigin>
    </Container>
  );
}

// --- Sub Components ---

function NodeItem({ data, x, y, index }: { data: any, x: number, y: number, index: number }) {
  return (
    <CardPositioner
      style={{ x, y }} 
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, scale: 1,
        transition: { delay: index * 0.1, type: "spring", stiffness: 120, damping: 15 }
      }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
    >
      <CardCentering>
        <Card $accentColor={data.color}>
          <CardHeader>
            <div className="icon-group">
              <IconBox $color={data.color}>{data.icon}</IconBox>
              <span className="title">{data.title}</span>
            </div>
            <MoreHorizontal size={18} color="#94A3B8" />
          </CardHeader>
          <CardBody>
            <div className="value">{data.value}</div>
            <div className="sub-row">
              <span className="sub-text" style={{ color: data.color }}>{data.subValue}</span>
            </div>
          </CardBody>
          <CardFooter>
            {data.tags.map((tag: string, i: number) => <Tag key={i}>{tag}</Tag>)}
          </CardFooter>
        </Card>
      </CardCentering>
    </CardPositioner>
  );
}

// --- Styled Components ---

const Container = styled.div`
  width: 100vw; height: 100vh;
  background-color: black; 
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const SharpBackgroundLayer = styled.div`
  position: absolute; inset: 0;
  background-image: url(${BG_IMAGE_URL});
  background-size: cover; background-position: center; z-index: 1; 
`;

const PeripheralBlurLayer = styled.div<{ $isActive: boolean }>`
  position: absolute; inset: -20px;
  background-image: url(${BG_IMAGE_URL});
  background-size: cover; background-position: center; z-index: 2;
  filter: blur(20px) brightness(0.9);
  mask-image: radial-gradient(circle at center, transparent 30%, black 80%);
  -webkit-mask-image: radial-gradient(circle at center, transparent 30%, black 80%);
  opacity: ${({ $isActive }) => $isActive ? 1 : 0};
  transition: opacity 0.8s ease; pointer-events: none;
`;

const GlobalTintLayer = styled.div<{ $isActive: boolean }>`
  position: absolute; inset: 0;
  background-color: ${({ $isActive }) => $isActive ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'};
  z-index: 3; transition: background-color 0.8s ease; pointer-events: none;
`;

const BackgroundGrid = styled.div<{ $isActive: boolean }>`
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: ${({ $isActive }) => $isActive ? 0.5 : 0};
  z-index: 4; pointer-events: none; transition: opacity 0.8s ease;
`;

const HeaderStatus = styled.div`
  position: absolute; top: 40px; left: 40px; z-index: 50;
  .label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: 1px; margin-bottom: 4px; display: block; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
  .status-row { display: flex; align-items: center; gap: 8px; }
  .value { font-size: 16px; font-weight: 800; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #CBD5E1; transition: 0.3s; }
  .dot.active { background: ${THEME.alert}; box-shadow: 0 0 10px ${THEME.alert}; }
`;

const CenterOrigin = styled.div`
  position: relative; width: 0; height: 0;
  display: flex; align-items: center; justify-content: center; z-index: 20;
`;

const SVGOverlay = styled.svg`
  position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: visible; z-index: 10; pointer-events: none;
`;

const EmergencyAlert = styled(motion.div)`
  position: absolute; bottom: 40px; left: 40px; width: 340px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px; padding: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3); border-left: 6px solid ${THEME.alert};
  z-index: 100; display: flex; flex-direction: column; gap: 12px;
  backdrop-filter: blur(10px);
`;
const AlertHeader = styled.div`
  display: flex; align-items: center; gap: 12px;
  .alert-title { font-size: 14px; font-weight: 800; color: ${THEME.alert}; }
  .alert-time { font-size: 11px; color: ${THEME.textSub}; margin-left: auto; }
`;
const AlertBody = styled.div`
  display: flex; flex-direction: column; gap: 6px;
  .issue-row { display: flex; gap: 6px; font-size: 14px; }
  .issue-label { font-weight: 600; color: ${THEME.textSub}; }
  .issue-value { font-weight: 700; color: ${THEME.textMain}; }
  .description { font-size: 13px; color: ${THEME.textSub}; line-height: 1.4; }
`;
const ActionGuideBox = styled.div`
  background: rgba(254, 242, 242, 0.9); border-radius: 8px; padding: 12px;
  display: flex; flex-direction: column; gap: 8px; border: 1px dashed rgba(220, 38, 38, 0.3);
  .guide-label { font-size: 10px; font-weight: 700; color: ${THEME.alert}; }
  .guide-step { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #991B1B; svg { min-width: 16px; } }
`;

// --- [핵심] 투명 트리거 & HUD ---
const InvisibleTrigger = styled.div`
  position: absolute;
  /* 마우스 감지 영역 크기 설정 */
  width: 240px; height: 240px; 
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 50; /* 최상위 */
  /* 커서 변경으로 인터랙션 가능함을 암시 */
  cursor: crosshair;
  
  /* Flex로 내부 HUD 요소 정렬 */
  display: flex; align-items: center; justify-content: center;
`;

const Crosshair = styled(motion.div)`
  position: absolute; width: 20px; height: 20px;
  .h-line { position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: rgba(255,255,255,0.8); transform: translateY(-50%); }
  .v-line { position: absolute; left: 50%; top: 0; height: 100%; width: 2px; background: rgba(255,255,255,0.8); transform: translateX(-50%); }
`;

const CornerBrackets = styled(motion.div)`
  position: absolute; width: 80px; height: 80px;
  .corner { position: absolute; width: 15px; height: 15px; border-color: ${THEME.alert}; border-style: solid; }
  .top-left { top: 0; left: 0; border-width: 3px 0 0 3px; }
  .top-right { top: 0; right: 0; border-width: 3px 3px 0 0; }
  .bottom-left { bottom: 0; left: 0; border-width: 0 0 3px 3px; }
  .bottom-right { bottom: 0; right: 0; border-width: 0 3px 3px 0; }
`;

const ScanningRing = styled(motion.div)`
  position: absolute; width: 140px; height: 140px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-top-color: ${THEME.alert};
`;


// --- Card Styles ---
const CardPositioner = styled(motion.div)` position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 20; `;
const CardCentering = styled.div` position: absolute; top: 0; left: 0; width: 280px; transform: translate(-50%, -50%); `;
const Card = styled.div<{ $accentColor: string }>`
  background: ${THEME.cardBg}; backdrop-filter: blur(15px);
  border-radius: 16px; padding: 16px; box-shadow: 0 15px 40px rgba(0,0,0,0.2); 
  border: 1px solid rgba(255, 255, 255, 0.7); border-left: 4px solid ${({ $accentColor }) => $accentColor};
`;
const CardHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
  .icon-group { display: flex; align-items: center; gap: 8px; }
  .title { font-size: 13px; font-weight: 600; color: ${THEME.textSub}; }
`;
const IconBox = styled.div<{ $color: string }>`
  width: 32px; height: 32px; border-radius: 8px; background-color: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color}; display: flex; align-items: center; justify-content: center;
`;
const CardBody = styled.div`
  .value { font-size: 20px; font-weight: 800; color: ${THEME.textMain}; line-height: 1.2; }
  .sub-row { margin-top: 4px; }
  .sub-text { font-size: 12px; font-weight: 600; }
`;
const CardFooter = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid ${THEME.line}30;
`;
const Tag = styled.span`
  background: rgba(241, 245, 249, 0.9); padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; color: ${THEME.textSub};
`;