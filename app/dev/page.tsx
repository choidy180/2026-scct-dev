"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanEye,
  FileText,
  History,
  BatteryCharging,
  Wifi,
  MoreHorizontal,
  AlertCircle,
  Thermometer,
  ShieldAlert,
  LayoutTemplate,
  CircleDashed
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
  cardBg: "rgba(255, 255, 255, 0.75)",
  line: "#94A3B8",
};

const BG_IMAGE_URL = "https://images.unsplash.com/photo-1564069114553-7215e1ff1890?q=80&w=2632&auto=format&fit=crop";

const DATA_NODES = [
  { id: 1, title: "Detected Object", value: "Unattended Bag", subValue: "Conf: 98%", color: THEME.warning, icon: <ScanEye size={18} />, tags: ["Zone B-2", "Black Nylon"] },
  { id: 2, title: "Thermal Scan", value: "85°C (High)", subValue: "Abnormal Heat", color: THEME.alert, icon: <Thermometer size={18} />, tags: ["Risk: Fire", "Sensor: IR"] },
  { id: 3, title: "Protocol", value: "Code Red", subValue: "Evacuate Area", color: THEME.primary, icon: <FileText size={18} />, tags: ["View PDF", "Share"] },
  { id: 4, title: "History", value: "1st Detection", subValue: "2 mins ago", color: THEME.textSub, icon: <History size={18} />, tags: ["No Owner", "Cam #4"] },
  { id: 5, title: "Battery", value: "82%", subValue: "4h Left", color: THEME.success, icon: <BatteryCharging size={18} />, tags: ["Temp: OK"] },
  { id: 6, title: "Network", value: "5G Stable", subValue: "12ms Latency", color: THEME.success, icon: <Wifi size={18} />, tags: ["Secure", "HD Stream"] },
];

// 🔥 [수정됨] AR 모드를 확실한 '가로 타원형'으로 만들기 위해 X값을 대폭 늘림
const LAYOUT_CONFIG = {
  FHD: {
    // AR 모드 (확실한 타원형)
    arRadiusX: 560, // 가로를 훨씬 넓게 설정 (기존 420 -> 560)
    arRadiusY: 320, // 세로는 유지 (상하 잘림 방지)
    
    // HUD 모드
    hudOffsetX: 650, 
    hudGapY_Left: 160, 
    hudGapY_Right: 160, 
    hudStartY_Left: -240, 
    hudStartY_Right: -240, 
  },
  QHD: {
    // AR 모드 (QHD에서도 넓게 퍼지도록)
    arRadiusX: 680, // (기존 650 -> 850)
    arRadiusY: 450,
    
    // HUD 모드
    hudOffsetX: 800, 
    hudGapY_Left: 200,
    hudGapY_Right: 200,
    hudStartY_Left: -280,
    hudStartY_Right: -280,
  }
};

export default function WearableARInterface() {
  const [isActive, setIsActive] = useState(false);
  const [isCircularLayout, setIsCircularLayout] = useState(true);
  const [isQHD, setIsQHD] = useState(false);

  useEffect(() => {
    const checkRes = () => {
      setIsQHD(window.innerWidth > 2200);
    };
    checkRes();
    window.addEventListener('resize', checkRes);
    return () => window.removeEventListener('resize', checkRes);
  }, []);

  const CONFIG = isQHD ? LAYOUT_CONFIG.QHD : LAYOUT_CONFIG.FHD;

  const getCardPosition = (index: number) => {
    if (isCircularLayout) {
      // --- AR 모드 (타원형 배치) ---
      const angleDeg = (index * (360 / DATA_NODES.length)) - 90;
      const radian = (angleDeg * Math.PI) / 180;
      
      // CONFIG에서 분리된 X, Y 반지름을 각각 적용하여 타원형 생성
      return {
        x: Math.cos(radian) * CONFIG.arRadiusX,
        y: Math.sin(radian) * CONFIG.arRadiusY
      };
    } else {
      // --- HUD 모드 ---
      if (index < 2) {
        return {
          x: -CONFIG.hudOffsetX,
          y: CONFIG.hudStartY_Left + (index * CONFIG.hudGapY_Left)
        };
      } else {
        const rightIndex = index - 2;
        return {
          x: CONFIG.hudOffsetX,
          y: CONFIG.hudStartY_Right + (rightIndex * CONFIG.hudGapY_Right)
        };
      }
    }
  };

  return (
    <Container>
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

      <LayoutControl>
        <span className="label">VIEW MODE</span>
        <ToggleContainer onClick={() => setIsCircularLayout(!isCircularLayout)}>
          <div className={`bg ${isCircularLayout ? 'left' : 'right'}`} />
          <div className={`option ${isCircularLayout ? 'active' : ''}`}>
            <CircleDashed size={14} /> AR
          </div>
          <div className={`option ${!isCircularLayout ? 'active' : ''}`}>
            <LayoutTemplate size={14} /> HUD
          </div>
        </ToggleContainer>
      </LayoutControl>

      <AnimatePresence>
        {isActive && (
          <EmergencyAlert
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
            transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
          >
            <AlertHeader>
              <ShieldAlert size={20} color={THEME.alert} />
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
              <div className="guide-step"><AlertCircle size={14} /><span>Maintain 5m safety distance.</span></div>
              <div className="guide-step"><AlertCircle size={14} /><span>Do not touch. Contact EOD.</span></div>
            </ActionGuideBox>
          </EmergencyAlert>
        )}
      </AnimatePresence>

      <CenterOrigin>
        <SVGOverlay>
          <AnimatePresence>
            {isActive && isCircularLayout && DATA_NODES.map((node, i) => {
              const pos = getCardPosition(i);
              return (
                <motion.line
                  key={`line-${node.id}`}
                  x1={0} y1={0}
                  x2={pos.x} y2={pos.y}
                  stroke={THEME.line}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  exit={{ pathLength: 0, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              );
            })}
          </AnimatePresence>
        </SVGOverlay>

        <InvisibleTrigger
          onMouseEnter={() => setIsActive(true)}
          onMouseLeave={() => setIsActive(false)}
        >
          <Crosshair
            animate={{
              opacity: isActive ? 1 : 0.4,
              scale: isActive ? 1 : 0.8,
              rotate: isActive ? 90 : 0
            }}
          >
            <div className="h-line" />
            <div className="v-line" />
          </Crosshair>

          <CornerBrackets
            animate={{
              scale: isActive ? 1 : 1.4,
              opacity: isActive ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="corner top-left" />
            <div className="corner top-right" />
            <div className="corner bottom-left" />
            <div className="corner bottom-right" />
          </CornerBrackets>

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

        <AnimatePresence>
          {isActive && DATA_NODES.map((node, index) => {
            const pos = getCardPosition(index);
            return (
              <NodeItem 
                key={node.id} 
                data={node} 
                x={pos.x} 
                y={pos.y} 
                index={index} 
              />
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
      layout
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
      animate={{
        x, y, opacity: 1, scale: 1,
        transition: { type: "spring", stiffness: 80, damping: 15, delay: index * 0.05 }
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
            <MoreHorizontal size={16} color="#94A3B8" />
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
  width: 100vw;
  height: 100vh;
  max-height: calc(100vh - 64px); 
  background-color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const SharpBackgroundLayer = styled.div`
  position: absolute;
  inset: 0;
  background-image: url(${BG_IMAGE_URL});
  background-size: cover;
  background-position: center;
  z-index: 1;
`;

const PeripheralBlurLayer = styled.div<{ $isActive: boolean }>`
  position: absolute;
  inset: -20px;
  background-image: url(${BG_IMAGE_URL});
  background-size: cover;
  background-position: center;
  z-index: 2;
  filter: blur(20px) brightness(0.9);
  mask-image: radial-gradient(circle at center, transparent 30%, black 80%);
  -webkit-mask-image: radial-gradient(circle at center, transparent 30%, black 80%);
  opacity: ${({ $isActive }) => $isActive ? 1 : 0};
  transition: opacity 0.8s ease;
  pointer-events: none;
`;

const GlobalTintLayer = styled.div<{ $isActive: boolean }>`
  position: absolute;
  inset: 0;
  background-color: ${({ $isActive }) => $isActive ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.1)'};
  z-index: 3;
  transition: background-color 0.8s ease;
  pointer-events: none;
`;

const BackgroundGrid = styled.div<{ $isActive: boolean }>`
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: ${({ $isActive }) => $isActive ? 0.4 : 0};
  z-index: 4;
  pointer-events: none;
  transition: opacity 0.8s ease;
`;

const HeaderStatus = styled.div`
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 50;

  @media (min-width: 2200px) {
    top: 50px;
    left: 50px;
    transform: scale(1.3);
    transform-origin: top left;
  }

  .label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.8);
    letter-spacing: 1.5px;
    margin-bottom: 6px;
    display: block;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .value {
    font-size: 15px;
    font-weight: 800;
    color: white;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    letter-spacing: 0.5px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94A3B8;
    transition: 0.3s;
  }

  .dot.active {
    background: ${THEME.alert};
    box-shadow: 0 0 12px ${THEME.alert};
  }
`;

const LayoutControl = styled.div`
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;

  @media (min-width: 2200px) {
    top: 50px;
    right: 50px;
    transform: scale(1.3);
    transform-origin: top right;
  }

  .label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(255,255,255,0.6);
    letter-spacing: 1px;
  }
`;

const ToggleContainer = styled.div`
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 99px;
  display: flex;
  padding: 4px;
  position: relative;
  cursor: pointer;
  backdrop-filter: blur(4px);

  .bg {
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: calc(50% - 4px);
    background: ${THEME.primary};
    border-radius: 99px;
    transition: left 0.3s ease;
    &.left { left: 4px; }
    &.right { left: 50%; }
  }

  .option {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    transition: color 0.3s;

    &.active {
      color: white;
    }
  }
`;

const CenterOrigin = styled.div`
  position: relative;
  width: 0;
  height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
`;

const SVGOverlay = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  overflow: visible;
  z-index: 10;
  pointer-events: none;
`;

const EmergencyAlert = styled(motion.div)`
  position: absolute;
  bottom: 30px;
  left: 30px;
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  border-left: 5px solid ${THEME.alert};
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  backdrop-filter: blur(12px);

  @media (min-width: 2200px) {
    bottom: 50px;
    left: 50px;
    width: 420px;
    padding: 24px;
    gap: 14px;
    
    .alert-title { font-size: 16px; }
    .issue-value { font-size: 16px; }
    .description { font-size: 14px; }
  }
`;

const AlertHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  .alert-title {
    font-size: 13px;
    font-weight: 800;
    color: ${THEME.alert};
    letter-spacing: 0.5px;
  }

  .alert-time {
    font-size: 11px;
    color: ${THEME.textSub};
    margin-left: auto;
    font-weight: 500;
  }
`;

const AlertBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;

  .issue-row {
    display: flex;
    gap: 6px;
    font-size: 13px;
  }

  .issue-label {
    font-weight: 600;
    color: ${THEME.textSub};
  }

  .issue-value {
    font-weight: 800;
    color: ${THEME.textMain};
  }

  .description {
    font-size: 12px;
    color: ${THEME.textSub};
    line-height: 1.4;
    margin-top: 2px;
  }
`;

const ActionGuideBox = styled.div`
  background: rgba(254, 242, 242, 0.8);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px dashed rgba(220, 38, 38, 0.2);

  .guide-label {
    font-size: 10px;
    font-weight: 700;
    color: ${THEME.alert};
    margin-bottom: 2px;
  }

  .guide-step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #991B1B;

    svg {
      min-width: 14px;
    }
  }
`;

const InvisibleTrigger = styled.div`
  position: absolute;
  width: 220px;
  height: 220px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  cursor: crosshair;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Crosshair = styled(motion.div)`
  position: absolute;
  width: 16px;
  height: 16px;

  .h-line {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 1.5px;
    background: rgba(255,255,255,0.9);
    transform: translateY(-50%);
  }

  .v-line {
    position: absolute;
    left: 50%;
    top: 0;
    height: 100%;
    width: 1.5px;
    background: rgba(255,255,255,0.9);
    transform: translateX(-50%);
  }
`;

const CornerBrackets = styled(motion.div)`
  position: absolute;
  width: 70px;
  height: 70px;

  .corner {
    position: absolute;
    width: 12px;
    height: 12px;
    border-color: ${THEME.alert};
    border-style: solid;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
  }

  .top-left {
    top: 0;
    left: 0;
    border-width: 2px 0 0 2px;
  }

  .top-right {
    top: 0;
    right: 0;
    border-width: 2px 2px 0 0;
  }

  .bottom-left {
    bottom: 0;
    left: 0;
    border-width: 0 0 2px 2px;
  }

  .bottom-right {
    bottom: 0;
    right: 0;
    border-width: 0 2px 2px 0;
  }
`;

const ScanningRing = styled(motion.div)`
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-top-color: ${THEME.alert};
`;

const CardPositioner = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 20;
`;

const CardCentering = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 250px;
  transform: translate(-50%, -50%);

  /* QHD 전용: 카드 크기 자체 확대 */
  @media (min-width: 2200px) {
    width: 320px; 
  }
`;

const Card = styled.div<{ $accentColor: string }>`
  background: ${THEME.cardBg};
  backdrop-filter: blur(16px);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  border: 1px solid rgba(255, 255, 255, 0.5); 
  border-left: 4px solid ${({ $accentColor }) => $accentColor};

  /* QHD 전용: 패딩 키움 */
  @media (min-width: 2200px) {
    padding: 20px;
    border-radius: 18px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;

  .icon-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title {
    font-size: 12px;
    font-weight: 700;
    color: ${THEME.textSub};
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (min-width: 2200px) {
      font-size: 14px;
    }
  }
`;

const IconBox = styled.div<{ $color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 2200px) {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }
`;

const CardBody = styled.div`
  .value {
    font-size: 18px;
    font-weight: 800;
    color: ${THEME.textMain};
    line-height: 1.2;
    letter-spacing: -0.3px;

    @media (min-width: 2200px) {
      font-size: 24px;
    }
  }

  .sub-row {
    margin-top: 3px;
  }

  .sub-text {
    font-size: 12px;
    font-weight: 600;

    @media (min-width: 2200px) {
      font-size: 14px;
    }
  }
`;

const CardFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid ${THEME.line}30;
`;

const Tag = styled.span`
  background: rgba(241, 245, 249, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: ${THEME.textSub};

  @media (min-width: 2200px) {
    font-size: 12px;
    padding: 4px 8px;
  }
`;