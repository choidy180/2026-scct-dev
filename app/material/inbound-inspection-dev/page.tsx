'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// --- Firebase Imports ---
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, Database } from "firebase/database";

// --- Icons (react-icons) ---
import {
  LuMaximize,
  LuMinimize,
  LuX,
  LuBox,
  LuLayers,
  LuClipboardCheck,
  LuFileText,
} from "react-icons/lu";

// --- Icons (lucide-react) ---
import {
  Barcode,
  Loader2,
  Cpu,
  Save,
  CheckCircle2,
  Activity,
  FileBadge,
  ScanBarcode,
  ListTodo,
  ScanEye,
  LayoutGrid,
  Package as PackageIcon,
  X as XIcon,
  Search,
  MoreHorizontal,
  Truck,
  PieChart as PieIcon,
  History,
  RefreshCw,
  Signal,
  WifiOff,
  Calendar,
  Box,
  Layers,
  MapPin,
  ImageOff,
  ArrowRight
} from "lucide-react";

// --- Charts ---
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// ─── [1. INTERFACES] ─────────────────────────────

interface ItemData {
  id: number;
  project: string;
  code: string;
  name: string;
  type: string;
  date: string;
  vendor: string;
  qty: number;
  quality: string;
  dwellTime: string;
}

interface SlotData {
  no: number;
  active: boolean;
}

interface ZoneData {
  id: string;
  total: number;
  used: number;
  free: number;
  status: string;
  slots: SlotData[];
}

interface InventoryItem {
  code: string;
  qty: number;
  loc: string;
}

// Styled Props Interfaces
interface StyledShowProps {
  $show: boolean;
}

interface StyledFullScreenProps {
  $isFullScreen: boolean;
}

interface StyledFadeProps {
  $isFadingOut: boolean;
}

interface ItemCardProps {
  $active: boolean;
}

interface StepItemProps {
  $active: boolean;
  $done: boolean;
}

// ─── [2. CONSTANTS] ─────────────────────────────────────

const PORT = 8080;

const PROCESS_STEPS = [
  { id: 1, label: "바코드 디코딩", icon: <Barcode size={14} /> },
  { id: 2, label: "ERP 조회", icon: <Cpu size={14} /> },
  { id: 3, label: "입고 검사 매칭", icon: <Activity size={14} /> },
  { id: 4, label: "품질 이력 분석", icon: <FileBadge size={14} /> },
  { id: 5, label: "데이터 저장", icon: <Save size={14} /> },
];

const BOOT_LOGS = [
  "BIOS Integrity Check... OK",
  "Initializing Optical Sensors...",
  "Calibrating Lens Aperture...",
  "Loading AI Vision Models (v2.4)...",
  "System Ready."
];

// ─── [3. HELPER FUNCTIONS] ──────────────────────────────

const generateDummyItems = (): ItemData[] => {
  const items: ItemData[] = [];
  
  items.push({
    id: 0,
    project: "A-Next F(FU,FL) Door 내재화",
    code: "MGJ63884811",
    name: "Plate,Freezer (Outdoor)",
    type: "자체무검사",
    date: "2026-01-13",
    vendor: "세진공업(주)",
    qty: 180,
    quality: "Y",
    dwellTime: "11분"
  });

  items.push({
    id: 1,
    project: "PILLAR",
    code: "MGJ63884911",
    name: "Plate,Freezer (Outdoor)",
    type: "정밀검사",
    date: "2026-01-13",
    vendor: "LG전자",
    qty: 150,
    quality: "Y",
    dwellTime: "15분"
  });

  for(let i=2; i<5; i++) {
    items.push({
      id: i,
      project: "PILLAR_V2",
      code: `MEE${Math.floor(60000000 + Math.random() * 90000000)}`,
      name: "COOLING FAN_V2",
      type: "육안검사",
      date: "2026-01-13",
      vendor: "협력사 A",
      qty: Math.floor(Math.random() * 1000) + 100,
      quality: "Y",
      dwellTime: "20분"
    });
  }
  return items;
};

const generateHistoryData = () => {
  const companies = ['에이치물산', '동양철강', '태성산업', '한화물류', '경동택배', '미래해운', '세진공업', '대원강업', '삼보모터스', '대한통운'];
  return Array.from({ length: 20 }).map((_, i) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - (i * 15 + 5)); 
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');

    return {
      id: i,
      company: companies[i % companies.length],
      time: `${h}:${m}`,
      status: Math.random() > 0.15 ? '정상' : '검수필요'
    };
  });
};

// ─── [4. FIREBASE CONFIG] ───────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAOBRFxZhVTJmP8_jdPNCFHSLN1FG9QAho",
  authDomain: "scct2026.firebaseapp.com",
  databaseURL: "https://scct2026-default-rtdb.firebaseio.com",
  projectId: "scct2026",
  storageBucket: "scct2026.firebasestorage.app",
  messagingSenderId: "496699213652",
  appId: "1:496699213652:web:b0f2c451096bd47b456ac1",
  measurementId: "G-D74LJZSR7H"
};

let app: FirebaseApp | undefined;
let db: Database | undefined;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10) { 
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
} catch (e) {
  console.warn("Firebase Init Failed:", e);
}

// ─── [5. STYLES] ──────────────────

const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
  body {
    margin: 0;
    padding: 0;
    background: #f8fafc;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
    overflow: hidden;
    color: #1e293b;
  }
  * {
    box-sizing: border-box;
    font-family: 'Pretendard', sans-serif;
  }
`;

const hideScrollbar = css`
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const rotateLens = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulseRing = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
`;

const blinkCursor = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const glareMove = keyframes`
  0% { left: -50%; }
  100% { left: 150%; }
`;

// --- Layout Components ---

const DashboardContainer = styled.div<StyledShowProps>`
  width: 100%;
  height: calc(100vh - 64px);
  background-color: #f8fafc;
  padding: 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  overflow: hidden;
  animation: ${(props) => (props.$show ? css`${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none')};
  opacity: 0;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
`;

const TopCard = styled(Card)`
  flex-shrink: 0;
`;

const FullHeightCard = styled(Card)`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CardTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  margin-bottom: 20px;
  flex-shrink: 0;
`;

// --- Left Panel Specifics (UPDATED) ---

const VehicleImageContainer = styled.div`
  width: 100%;
  height: 160px;
  background: #0f172a;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-bottom: none;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 600;
  }
`;

const PlateContainer = styled.div`
  background: #1e293b;
  border-radius: 0 0 8px 8px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  overflow: hidden;
  margin-bottom: 20px;

  .label {
    color: #ffffff;
    font-size: 1rem;
    font-weight: 500;
  }

  .plate-badge {
    height: 100%;
    background: #3b82f6;
    display: flex;
    align-items: center;
    padding: 0 24px;
    font-size: 1.4rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.5px;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  align-items: center;
  font-size: 1rem;

  .label {
    color: #64748b;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &::before {
      content: '';
      display: block;
      width: 4px;
      height: 4px;
      background: #94a3b8;
      border-radius: 50%;
    }
  }
  .value {
    color: #0f172a;
    font-weight: 800;
  }
  .highlight-box {
      background: #3b82f6;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 600;
  }
`;

const DwellTimeBadge = styled.span`
  font-weight: 800;
  color: #fff;
  background: rgba(239, 68, 68, 0.9);
  padding: 4px 10px;
  border-radius: 4px;
`;

const CompactScoreRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const CompactScoreBox = styled.div<{ $type: 'pass' | 'fail' }>`
  background: ${props => props.$type === 'pass' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.$type === 'pass' ? '#10b981' : '#ef4444'};
  border-radius: 8px;
  padding: 6px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: 1rem;
    font-weight: 700;
    color: ${props => props.$type === 'pass' ? '#15803d' : '#b91c1c'};
  }
  .value {
    font-size: 1.4rem;
    font-weight: 900;
    color: ${props => props.$type === 'pass' ? '#15803d' : '#b91c1c'};
  }
`;

const ChartContainer = styled.div`
  flex-shrink: 0;
  width: 100%;
  height: 120px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
`;

const HistoryListContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid #f1f5f9;
  padding-top: 8px;
  
  .h-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #64748b;
    padding: 0 4px 8px 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .h-scroll-area {
    flex: 1;
    overflow-y: auto;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    padding: 8px;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
  }
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  margin-bottom: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);

  .comp {
    font-weight: 700;
    font-size: 0.85rem;
    color: #334155;
  }
  .info {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .status {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        &.ok { background: #dcfce7; color: #166534; }
        &.bad { background: #fee2e2; color: #991b1b; }
    }
    .time {
        font-size: 0.75rem;
        color: #94a3b8;
        font-family: monospace;
    }
  }
`;

// --- Right Panel Specifics ---

const VideoCard = styled(motion.div)<StyledFullScreenProps>`
  /* background: #1e293b; */
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  border: 1px solid #e2e8f0;
  
  ${({ $isFullScreen }) => $isFullScreen && css`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: calc(100vh - 64px);
    z-index: 999;
    border-radius: 0;
    margin: 0;
  `}
`;

const VideoHeader = styled.div`
  background: #fff;
  height: 60px;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;

  .title-group {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
  }

  .btn-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const IpInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;

  input {
    border: none;
    background: transparent;
    font-size: 1rem;
    width: 140px;
    color: #334155;
    outline: none;
    text-align: right;
  }
  input::placeholder {
    color: #94a3b8;
  }
  span.label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
  }
`;

const PinkButton = styled.button`
  background: #e11d48;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 700;
  font-size: .9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(225, 29, 72, 0.2);
  transition: all 0.2s;

  &:hover {
    background: #be123c;
  }
`;

// [UPDATED] Error State to Fill Height
const StyledErrorState = styled.div`
  position: absolute; /* Changed to absolute to force fill */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #475569;
  overflow: hidden;
  z-index: 10;

  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .content-box {
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 40px;
    border: 1px solid rgba(239, 68, 68, 0.2);
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 0 40px rgba(0,0,0,0.5);
    max-width: 400px;
    text-align: center;
  }

  .icon-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 2px solid rgba(239, 68, 68, 0.3);
      border-top-color: transparent;
      animation: ${rotateLens} 2s linear infinite;
    }
  }

  h2 {
    color: #ef4444;
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: 1px;
  }
  
  p {
    color: #94a3b8;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.5;
  }

  .barcode-layer {
    position: absolute;
    /* bottom: 40px; */
    opacity: 0.3;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,0.5);
    font-family: monospace;
    font-size: 0.8rem;
  }
`;

// --- Modal & Overlay Styles ---

const OverlayContainer = styled(motion.div)`
  position: absolute;
  inset: 10px;
  background: rgba(15, 23, 42, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  z-index: 20;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Pretendard', sans-serif;
  min-height: 0;
`;

const HeaderBar = styled.div`
  height: 48px;
  border-bottom: 1px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(255,255,255,0.02);

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #fff;
    font-weight: 900;
    letter-spacing: 0.5px;
    font-size: 0.95rem;
  }
  .close-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .close-btn:hover {
    background: #ef4444;
    border-color: #ef4444;
  }
`;

const MainGridInternal = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  position: relative;

  .left-pane {
    flex: 1.6;
    position: relative;
    border-right: 1px solid rgba(255,255,255,0.15);
    display: flex;
    flex-direction: column;
    padding: 16px;
    background: radial-gradient(circle at 10% 10%, rgba(30, 41, 59, 0.8), transparent);
    overflow: hidden;
    cursor: pointer; /* Clickable */
  }
  .right-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: rgba(0,0,0,0.3);
    min-width: 320px;
    min-height: 0;
    overflow: hidden;
  }
`;

// RPA View & Camera
const RPAProcessView = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 16px;

  .rpa-header {
    margin-bottom: 16px;
    padding-left: 5px;

    h2 {
      font-size: 1.4rem;
      font-weight: 900;
      color: #fff;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }
    p {
      color: #cbd5e1;
      margin: 4px 0 0 0;
      font-size: 0.85rem;
      font-weight: 500;
    }
  }
  .step-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 5px;
    overflow-y: auto;
    ${hideScrollbar}
  }
  .pip-container {
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 200px;
    height: 130px;
    z-index: 50;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid rgba(255,255,255,0.2);
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    background: #000;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
  }
`;

const StepItem = styled.div<StepItemProps>`
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0,0,0,0.4);
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  transition: all 0.3s;

  ${(props) => props.$active && css`
    background: rgba(59, 130, 246, 0.2);
    border-color: #60a5fa;
    transform: translateX(5px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `}

  ${(props) => props.$done && css`
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
  `}

  .icon-box {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    flex-shrink: 0;
    transition: all 0.3s;

    ${(props) => props.$active && css`
      background: #3b82f6;
      color: white;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
    `}

    ${(props) => props.$done && css`
      background: #10b981;
      color: white;
    `}
  }
  .txt {
    font-size: 0.9rem;
    font-weight: 700;
    color: #94a3b8;
    flex: 1;
    transition: color 0.3s;

    ${(props) => props.$active && css`
      color: #fff;
      text-shadow: 0 0 10px rgba(59,130,246,0.5);
    `}

    ${(props) => props.$done && css`
      color: #94a3b8;
      text-decoration: line-through;
    `}
  }
  .status {
    font-size: 0.8rem;
    font-weight: 600;
  }
`;

const CameraFrame = styled(motion.div)`
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  background: #000;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 20px 50px rgba(0,0,0,0.7);

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .scan-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const CompletionPopup = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  padding: 40px 60px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 30px 80px rgba(0,0,0,0.9);
  border: 2px solid #3b82f6;
  z-index: 9999;
  pointer-events: none;

  .icon-check {
    width: 80px;
    height: 80px;
    background: #3b82f6;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    box-shadow: 0 0 40px #3b82f6;
  }
  .text {
    font-size: 1.8rem;
    font-weight: 900;
    color: #fff;
    letter-spacing: 1px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
    white-space: nowrap;
  }
`;

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  z-index: 9990;
`;

const SlidePanel = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  width: 95vw;
  max-width: 1800px;
  height: 100vh;
  z-index: 9991;
  box-shadow: -20px 0 50px rgba(0,0,0,0.5);
  background: #f8fafc;
`;

// --- New Right Panel Styled Components ---
const RightContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  gap: 16px;
  overflow: hidden;
`;

const TopInfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
`;

const InfoInputBox = styled.div`
  display: flex;
  background: #0f172a;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  overflow: hidden;
  height: 42px;
  align-items: center;

  .label-area {
    width: 90px;
    background: #1e293b;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 700;
    border-right: 1px solid rgba(255,255,255,0.1);
    gap: 6px;
  }
  .value-area {
    flex: 1;
    padding: 0 12px;
    color: #fff;
    font-weight: 600;
    font-size: 1rem;
    letter-spacing: 0.5px;
  }
`;

const SplitRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ListSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;

  .header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #cbd5e1;
    font-size: 0.9rem;
    font-weight: 800;
  }
  .list-scroll-view {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    ${hideScrollbar}
  }
`;

const DetailSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  margin-top: 10px;
  
  .grid-table {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid rgba(255,255,255,0.1);
  }

  .grid-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.1);

    .lbl {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #94a3b8;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .val {
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      text-align: right;
    }
    .val.qty {
      color: #10b981;
      font-size: 1.2rem;
      font-weight: 800;
    }
  }
`;

const LogSection = styled.div`
  flex-shrink: 0;
  margin-top: 10px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  padding: 12px;
  
  .log-head {
    font-size: 0.75rem;
    font-weight: 800;
    color: #60a5fa;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
  }
  .log-body {
    font-family: 'Pretendard', monospace;
    font-size: 0.75rem;
    color: #cbd5e1;
    line-height: 1.5;
    opacity: 0.9;
    white-space: pre-wrap;
  }
`;

const ItemCard = styled.div<ItemCardProps>`
  min-width: 110px;
  height: 90px;
  background: ${(props) => props.$active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)'};
  border: 1px solid ${(props) => props.$active ? '#60a5fa' : 'rgba(255,255,255,0.1)'};
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${(props) => props.$active ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none'};

  &:hover {
    background: rgba(255,255,255,0.15);
    border-color: rgba(255,255,255,0.3);
  }

  .c {
    font-size: 0.75rem;
    font-weight: 800;
    color: ${(props) => props.$active ? '#60a5fa' : '#cbd5e1'};
  }
  .n {
    font-size: 0.7rem;
    color: #94a3b8;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
  }
  .q {
    font-size: 0.85rem;
    font-weight: 700;
    color: #fff;
    margin-top: auto;
  }
`;


// --- Loading Screen Styles ---

const NewLoadingScreen = styled.div<StyledFadeProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: ${(props) => (props.$isFadingOut ? 0 : 1)};
  transform: ${(props) => (props.$isFadingOut ? 'scale(1.05)' : 'scale(1)')};
  pointer-events: ${(props) => (props.$isFadingOut ? 'none' : 'all')};

  .background-grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index: 0;
  }
  .loader-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
  }
  .brand-text {
    text-align: center;
    
    .small {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 3px;
      color: #94a3b8;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .large {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -1px;
      
      .version {
        font-size: 1rem;
        color: #3b82f6;
        vertical-align: super;
        font-weight: 600;
      }
    }
  }
`;

const LensCore = styled.div`
  width: 120px;
  height: 120px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .outer-ring {
    position: absolute;
    inset: 0;
    border: 2px dashed #cbd5e1;
    border-radius: 50%;
    animation: ${rotateLens} 10s linear infinite;
  }
  .inner-ring {
    position: absolute;
    width: 80%;
    height: 80%;
    border: 2px solid #3b82f6;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ${rotateLens} 2s linear infinite reverse;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  }
  .core-lens {
    width: 60%;
    height: 60%;
    background: radial-gradient(circle at 30% 30%, #60a5fa, #2563eb);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 30px rgba(37, 99, 235, 0.6);
    animation: ${pulseRing} 2s infinite;
  }
`;

const TechProgressWrapper = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .bar-bg {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: #3b82f6;
    position: relative;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }
  .bar-glare {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
    animation: ${glareMove} 1.5s ease-in-out infinite;
  }
  .progress-info {
    display: flex;
    justify-content: space-between;
    font-family: monospace;
    font-size: 0.8rem;
    color: #475569;
    font-weight: 600;

    .log-text {
      color: #64748b;

      .cursor {
        color: #3b82f6;
        animation: ${blinkCursor} 0.8s infinite;
        margin-right: 4px;
      }
    }
    .percentage {
      color: #3b82f6;
      font-weight: 700;
    }
  }
`;

// --- BoardContainer ---
const BoardContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #f8fafc;
  display: flex;
  flex-direction: column;

  .board-header {
    height: 60px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;

    .title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.2rem;
      font-weight: 800;
      color: #1e293b;
    }
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
    }
    .close-btn:hover {
      color: #ef4444;
    }
  }
  .board-body {
    flex: 1;
    padding: 20px;
    display: flex;
    gap: 20px;
    overflow: hidden;

    .left-col {
      width: 340px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .summary-card {
        background: #fff;
        padding: 20px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;

        h3 {
          margin: 0 0 16px 0;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chart-area {
          display: flex;
          align-items: center;
          gap: 16px;

          .pie-mock {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 8px solid #f1f5f9;
            border-top-color: #3b82f6;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: 800;
            color: #3b82f6;
          }
          .legend {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 0.8rem;
          }
          .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
          }
          .blue {
            background: #3b82f6;
          }
          .green {
            background: #10b981;
          }
        }
      }
      .inv-list-wrapper {
        flex: 1;
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        min-height: 0;

        .search-row {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;

          h3 {
            font-size: 0.95rem;
            margin: 0;
            display: flex;
            gap: 6px;
            align-items: center;
          }
          .s-box {
            display: flex;
            align-items: center;
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 6px;
            width: 140px;
          }
          input {
            border: none;
            background: transparent;
            width: 100%;
            outline: none;
            font-size: 0.8rem;
          }
        }
        .list-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          &::-webkit-scrollbar {
            width: 4px;
          }
          &::-webkit-scrollbar-thumb {
            background: #e2e8f0;
            border-radius: 4px;
          }

          .inv-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #f1f5f9;

            .icon {
              width: 32px;
              height: 32px;
              background: #fff;
              border-radius: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              color: #64748b;
            }
            .info {
              flex: 1;
            }
            .c {
              font-size: 0.85rem;
              font-weight: 600;
            }
            .l {
              font-size: 0.75rem;
              color: #94a3b8;
            }
            .q {
              font-weight: 700;
              color: #3b82f6;
              font-family: monospace;
            }
          }
        }
      }
    }
    .map-col {
      flex: 1;
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .map-legend {
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        justify-content: center;
        gap: 20px;

        .badge {
          font-size: 0.85rem;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .empty {
          background: #f1f5f9;
          color: #94a3b8;
          border: 1px solid #e2e8f0;
        }
        .active {
          background: #eff6ff;
          color: #3b82f6;
          border: 1px solid #bfdbfe;
        }
        .full {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
        }
        .dot {
            width: 8px; 
            height: 8px; 
            border-radius: 50%;
        }
      }
      .zone-wrapper {
        flex: 1;
        padding: 20px;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        overflow: hidden;

        .zone-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
          min-height: 0;
          
          .z-head {
            background: #fff;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);

            .top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            .id {
              font-weight: 900;
              font-size: 1.2rem;
              color: #1e293b;
            }
            .st {
              font-size: 0.75rem;
              font-weight: 800;
              padding: 4px 8px;
              border-radius: 6px;
            }
            .g { background: #dcfce7; color: #166534; }
            .o { background: #ffedd5; color: #9a3412; }
            .r { background: #fee2e2; color: #991b1b; }
            
            .usage-text {
                font-size: 0.8rem;
                color: #64748b;
                margin-bottom: 6px;
                display: flex;
                justify-content: space-between;
                font-weight: 600;
                
                b { color: #0f172a; }
            }

            .bar {
              height: 8px;
              background: #f1f5f9;
              border-radius: 4px;
              overflow: hidden;
            }
            .fill {
              height: 100%;
              background: linear-gradient(90deg, #3b82f6, #2563eb);
              border-radius: 4px;
              transition: width 0.5s ease-out;
            }
          }
          .slot-grid-container {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            padding: 8px;

            .slot-grid {
              flex: 1;
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: repeat(10, 1fr); /* [수정] 높이 꽉 차도록 변경 */
              gap: 8px;
              /* overflow-y 제거 (꽉 채우기 위함) */
              
              .slot {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                font-size: 0.9rem;
                font-weight: 700;
                color: #cbd5e1;
                transition: all 0.3s;
                /* min-height 제거 (grid row에 맞춤) */
                box-shadow: 0 1px 2px rgba(0,0,0,0.03);
              }
              .on {
                background: #eff6ff;
                border-color: #60a5fa;
                color: #2563eb;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
              }
              .new-item {
                animation: ${pulseRing} 1.5s infinite;
                border-color: #3b82f6;
                background: #dbeafe;
              }
              .icon-box {
                  margin-bottom: 2px;
              }
            }
          }
        }
      }
    }
  }
`;

// ─── [6. SUB-COMPONENTS] ──────────────────────────────

const MemoizedInventoryItem = React.memo(({ item }: { item: InventoryItem }) => ( <div className="inv-item"> <div className="icon"><Layers size={14}/></div> <div className="info"><div className="c">{item.code}</div><div className="l">{item.loc}</div></div> <div className="q">{item.qty}</div> </div> )); MemoizedInventoryItem.displayName = 'MemoizedInventoryItem';

// [수정] Slot 컴포넌트 개선 - isTarget prop 추가
const MemoizedSlot = React.memo(({ s, isTarget }: { s: SlotData, isTarget: boolean }) => ( 
    <div className={`slot ${s.active?'on':''} ${isTarget ? 'new-item' : ''}`}> 
        {/* [수정] D101의 5번만 진한색 아이콘, 나머지는 연한색 */}
        {s.active && <div className="icon-box"><Box size={14} fill={isTarget ? "#3b82f6" : "#93c5fd"} color={isTarget ? "#1d4ed8" : "#60a5fa"}/></div>}
        {s.no} 
    </div> 
)); 
MemoizedSlot.displayName = 'MemoizedSlot';

const ZoneColumn = React.memo(({ zone }: { zone: ZoneData }) => ( 
    <div className="zone-col"> 
        <div className="z-head"> 
            <div className="top">
                <span className="id">{zone.id}</span> 
                <span className={`st ${zone.status==='만차'?'r':zone.status==='혼잡'?'o':'g'}`}>{zone.status}</span>
            </div> 
            <div className="usage-text">
                <span>점유율</span>
                <b>{Math.round((zone.used/zone.total)*100)}%</b>
            </div>
            <div className="bar"><div className="fill" style={{width: `${(zone.used/zone.total)*100}%`}}/></div> 
        </div> 
        <div className="slot-grid-container"> 
            <div className="slot-grid"> 
                {/* [수정] D101 구역의 5번 슬롯만 타겟팅 */}
                {zone.slots.map((s) => <MemoizedSlot key={s.no} s={s} isTarget={zone.id === 'D101' && s.no === 5 && s.active} />)} 
            </div> 
        </div> 
    </div> 
)); 
ZoneColumn.displayName = 'ZoneColumn';

// WarehouseBoard [수정: D동 현황 로직 변경]
const WarehouseBoard = ({ onClose }: { onClose: () => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // [수정 1, 2, 3] 초기 데이터 설정 (D101:10칸, D102:19칸, D105:19칸)
  const initialMapData: ZoneData[] = [
    { id: 'D101', total: 10, used: 2, free: 8, status: '여유', slots: Array.from({length: 10}, (_, i) => ({ no: i+1, active: i < 2 })) },
    { id: 'D102', total: 19, used: 15, free: 4, status: '혼잡', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: i < 15 })) },
    { id: 'D103', total: 20, used: 20, free: 0, status: '만차', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: true })) },
    { id: 'D104', total: 20, used: 8, free: 12, status: '보통', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 8 })) },
    { id: 'D105', total: 19, used: 0, free: 19, status: '비어있음', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: false })) },
  ];

  const [mapData, setMapData] = useState<ZoneData[]>(initialMapData);

  // [수정 4] 3초 뒤 D101구역 5번 슬롯 적재 시뮬레이션
  useEffect(() => {
      const timer = setTimeout(() => {
          setMapData(prev => prev.map(zone => {
              // [수정] 오직 D101만 업데이트
              if (zone.id === 'D101') {
                  const newSlots = zone.slots.map(slot => 
                      slot.no === 5 ? { ...slot, active: true } : slot
                  );
                  return {
                      ...zone,
                      used: zone.used + 1,
                      free: zone.free - 1,
                      slots: newSlots
                  };
              }
              return zone;
          }));
      }, 3000);
      return () => clearTimeout(timer);
  }, []);

  const inventoryData: InventoryItem[] = useMemo(() => [
    { code: 'ADC30009358', qty: 708, loc: 'D101' }, { code: 'ADC30014326', qty: 294, loc: 'D102' },
    { code: 'ADC30003801', qty: 204, loc: 'D102' }, { code: 'AGF04075606', qty: 182, loc: 'D103' },
    { code: 'ADC30009359', qty: 150, loc: 'D104' }, { code: 'AGM76970201', qty: 120, loc: 'D101' },
    { code: 'AGM76970202', qty: 100, loc: 'D105' }, { code: 'AGM76970203', qty: 50, loc: 'D101' },
    { code: 'AGM76970204', qty: 30, loc: 'D102' }, { code: 'AGM76970205', qty: 10, loc: 'D103' },
    { code: 'AGM76970206', qty: 120, loc: 'D104' }, { code: 'AGM76970207', qty: 100, loc: 'D105' },
  ], []);
  const filteredInventory = useMemo(() => inventoryData.filter(item => item.code.toLowerCase().includes(searchTerm.toLowerCase()) || item.loc.toLowerCase().includes(searchTerm.toLowerCase()) ), [inventoryData, searchTerm]);
  
  return ( 
    <BoardContainer> 
        <div className="board-header"> 
            <div className="title"><LayoutGrid size={24} color="#3b82f6"/> D동 실시간 적재 현황판</div> 
            <button className="close-btn" onClick={onClose}><XIcon size={28}/></button> 
        </div> 
        <div className="board-body"> 
            <div className="left-col"> 
                <div className="summary-card"> 
                    <h3><PieIcon size={16}/> 종합 적재 현황</h3> 
                    <div className="chart-area"> 
                        <div className="pie-mock"><span className="val">48%</span></div> 
                        <div className="legend"> 
                            <div><span className="dot blue"></span>사용: <b>48</b></div> 
                            <div><span className="dot green"></span>여유: <b>52</b></div> 
                        </div> 
                    </div> 
                </div> 
                <div className="inv-list-wrapper"> 
                    <div className="search-row"> 
                        <h3><PackageIcon size={16}/> 재고 리스트</h3> 
                        <div className="s-box"><Search size={14}/><input placeholder="검색..." onChange={e=>setSearchTerm(e.target.value)}/></div> 
                    </div> 
                    <div className="list-scroll"> 
                        {filteredInventory.map((item, i) => ( <MemoizedInventoryItem key={i} item={item} /> ))} 
                    </div> 
                </div> 
            </div> 
            <div className="map-col"> 
                <div className="map-legend"> 
                    <span className="badge empty"><div className="dot" style={{background:'#cbd5e1'}}/> 여유</span>
                    <span className="badge active"><div className="dot" style={{background:'#3b82f6'}}/> 사용</span>
                    <span className="badge full"><div className="dot" style={{background:'#ef4444'}}/> 만차</span> 
                </div> 
                <div className="zone-wrapper"> 
                    {mapData.map(zone => <ZoneColumn key={zone.id} zone={zone} />)} 
                </div> 
            </div> 
        </div> 
    </BoardContainer> 
  )
};

const RPAStatusView = React.memo(({ step, showComplete, isWearableConnected, streamUrl, capturedImg }: { step: number, showComplete: boolean, isWearableConnected?: boolean, streamUrl?: string | null, capturedImg?: string | null }) => {
  return (
    <RPAProcessView initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} >
      <div className="rpa-header"> <h2><Cpu size={24} color="#60a5fa" strokeWidth={2.5}/> AUTO PROCESSING</h2> <p>Vision AI 데이터 분석 및 ERP 자동 입고 처리를 진행합니다.</p> </div>
      <div className="step-container"> {PROCESS_STEPS.map((s) => ( <StepItem key={s.id} $active={step === s.id} $done={step > s.id} > <div className="icon-box">{s.icon}</div> <div className="txt">{s.label}</div> <div className="status"> {step > s.id ? <CheckCircle2 size={18} color="#10b981" strokeWidth={3}/> : step === s.id ? <Loader2 className="spin" size={18} color="#fff"/> : <MoreHorizontal size={18}/>} </div> </StepItem> ))} </div>
      <div className="pip-container">
        {capturedImg ? (
            <img src={capturedImg} alt="Processed Frame" />
        ) : (
            <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%' }}>
              <CameraFrame>
                <div className="simulated-barcode-view" style={{background: '#000'}}></div>
              </CameraFrame>
            </motion.div>
        )}
      </div>
    </RPAProcessView>
  );
});
RPAStatusView.displayName = 'RPAStatusView';

const LoadingComponent = React.memo(({ loading, isFadingOut, progress, currentLog }: any) => { if (!loading && !isFadingOut) return null; return ( <NewLoadingScreen $isFadingOut={isFadingOut}> <div className="background-grid"></div> <div className="loader-content"> <LensCore> <div className="outer-ring"></div> <div className="inner-ring"></div> <div className="core-lens"><ScanEye size={32} color="white" /></div> </LensCore> <div className="brand-text"> <span className="small">WEARABLE AI SYSTEM</span> <h1 className="large">VISION OS <span className="version">v2.0</span></h1> </div> <TechProgressWrapper> <div className="bar-bg"><motion.div className="bar-fill" style={{ width: `${progress}%` }}><div className="bar-glare"></div></motion.div></div> <div className="progress-info"><span className="log-text"><span className="cursor">&gt;</span> {currentLog}</span><span className="percentage">{Math.floor(progress)}%</span></div> </TechProgressWrapper> </div> </NewLoadingScreen> ); }); LoadingComponent.displayName = 'LoadingComponent';

const MemoizedItemCard = React.memo(({ item, selectedId, onClick }: { item: ItemData, selectedId: number, onClick: (id: number) => void }) => ( 
  <ItemCard $active={selectedId === item.id} onClick={() => onClick(item.id)} > 
    <div className="c">{item.code}</div> 
    <div className="n">{item.name}</div> 
    <div className="q">{item.qty.toLocaleString()} EA</div> 
  </ItemCard> 
)); 
MemoizedItemCard.displayName = 'MemoizedItemCard';

// ─── [7. AIDashboardModal (MODAL COMPONENT)] ──────────────────────

function AIDashboardModal({ onClose, streamUrl, streamStatus }: { onClose: () => void, streamUrl?: string | null, streamStatus: string }) {
  const [viewMode, setViewMode] = useState<'scan' | 'rpa'>('scan');
  const [items, setItems] = useState<ItemData[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [rpaStep, setRpaStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // [NEW] Video Control State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  
  const isWearableConnected = streamStatus === 'ok' && !!streamUrl;
  const initialMount = useRef(true);

  useEffect(() => {
    const data = generateDummyItems();
    setItems(data);
    if(data.length > 0) setSelectedId(data[0].id);
    return () => {
        if(timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const startRPAProcess = useCallback(() => {
    if(timerRef.current) clearInterval(timerRef.current);

    let step = 1; 
    setRpaStep(step);
    setShowComplete(false); 

    timerRef.current = setInterval(() => {
      step++;
      if (step > 5) {
        if(timerRef.current) clearInterval(timerRef.current); 
        setShowComplete(true);
        setTimeout(() => { setShowComplete(false); }, 10000);
      } else { 
          setRpaStep(step); 
      }
    }, 1200);
  }, []);

  const handleVideoEnded = useCallback(() => {
      if(videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if(ctx) {
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              setCapturedImg(canvas.toDataURL('image/jpeg'));
          }
      }
      setViewMode('rpa');
      startRPAProcess();
  }, [startRPAProcess]);

  useEffect(() => {
    if (!db) return;
    const logRef = ref(db, 'log');
    
    const unsubscribe = onValue(logRef, (snapshot) => {
        if (initialMount.current) {
            initialMount.current = false;
            return;
        }
        
        setViewMode('scan');
        setCapturedImg(null);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    });

    return () => unsubscribe();
  }, []);

  const handleItemClick = useCallback((id: number) => { setSelectedId(id); }, []);
  
  const handleScanClick = useCallback(() => {
      if(viewMode === 'scan') {
          handleVideoEnded();
      }
  }, [viewMode, handleVideoEnded]);

  const activeItem = useMemo(() => items.find(i => i.id === selectedId) || (items.length > 0 ? items[0] : null), [items, selectedId]);

  return ( 
    <OverlayContainer initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} > 
      <HeaderBar> 
        <div className="brand"><ScanBarcode color="#60a5fa" strokeWidth={3}/> VISION AI SCANNER</div> 
        <button className="close-btn" onClick={onClose}><LuX size={20} strokeWidth={3}/></button> 
      </HeaderBar> 
      <MainGridInternal> 
        <AnimatePresence> 
          {showComplete && ( 
            <CompletionPopup initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }} transition={{ type: "spring", bounce: 0.5 }} > 
              <div className="icon-check"><MapPin size={48} strokeWidth={3} /></div> 
              <div className="text">D동 101구역 5번에 적치</div> 
            </CompletionPopup> 
          )} 
        </AnimatePresence> 
        
        {/* Left Pane (Video / RPA) */}
        <div className="left-pane" onClick={handleScanClick}> 
          <LayoutGroup> 
            {viewMode === 'rpa' && <RPAStatusView step={rpaStep} showComplete={showComplete} isWearableConnected={isWearableConnected} streamUrl={streamUrl} capturedImg={capturedImg} />} 
            {viewMode === 'scan' && ( 
              <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%', zIndex: 20 }}> 
                <CameraFrame> 
                  <video 
                    ref={videoRef}
                    src="/videos/dashboard-short.mp4" 
                    autoPlay 
                    muted 
                    playsInline
                    onEnded={handleVideoEnded}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <motion.div className="scan-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} > 
                  </motion.div> 
                </CameraFrame> 
              </motion.div> 
            )} 
          </LayoutGroup> 
        </div> 
        
        {/* Right Pane (Detail Info) */}
        <div className="right-pane"> 
          <RightContentContainer>
            <TopInfoSection>
              <InfoInputBox>
                <div className="label-area"><Calendar size={13}/> 송장번호</div>
                <div className="value-area">0135250C00004</div>
              </InfoInputBox>
              <SplitRow>
                <InfoInputBox>
                  <div className="label-area"><Calendar size={13}/> 입고일자</div>
                  <div className="value-area">2026-01-08</div>
                </InfoInputBox>
                <InfoInputBox>
                  <div className="label-area"><Truck size={13}/> 거래처명</div>
                  <div className="value-area">세진공업(주)</div>
                </InfoInputBox>
              </SplitRow>
            </TopInfoSection>

            <ListSection>
              <div className="header"><ListTodo size={14}/> 입고 예정 리스트 (Live)</div>
              <div className="list-scroll-view">
                {items.slice(0, 2).map(item => (
                  <MemoizedItemCard key={item.id} item={item} selectedId={selectedId} onClick={handleItemClick} />
                ))}
              </div>
            </ListSection>

            <DetailSection>
              <AnimatePresence mode="wait">
                {activeItem && (
                  <motion.div
                    key={activeItem.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                  >
                    <div className="title-area">
                      <h1>{activeItem.name}</h1>
                    </div>

                    <div className="grid-table">
                      <div className="grid-row">
                        <div className="lbl"><Box size={15}/> 품목코드</div>
                        <div className="val">{activeItem.code}</div>
                      </div>
                      <div className="grid-row">
                        <div className="lbl"><Layers size={15}/> 프로젝트</div>
                        <div className="val">{activeItem.project}</div>
                      </div>
                      <div className="grid-row">
                        <div className="lbl"><LuClipboardCheck size={15}/> 입고수량</div>
                        <div className="val qty">{activeItem.qty} EA</div>
                      </div>
                      <div className="grid-row">
                        <div className="lbl"><LuFileText size={15}/> 검사구분명</div>
                        <div className="val">{activeItem.type}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </DetailSection>

            <LogSection>
              <div className="log-head">SYSTEM LOG</div>
              <div className="log-body">
                [INFO] ERP 데이터 대조 완료.<br/>
                [INFO] PO 번호 매칭 성공 (PO-2026-01-088)<br/>
                [WARN] 창고 관리 시스템(WMS) 적재 위치 최적화 계산 중...
              </div>
            </LogSection>

          </RightContentContainer>
        </div> 
      </MainGridInternal> 
    </OverlayContainer> 
  );
}

// ─── [ROOT COMPONENT] ──────────────────────────────────────

export default function SmartFactoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState(BOOT_LOGS[0]);

  const [streamHost, setStreamHost] = useState("192.168.0.53");
  const [streamStatus, setStreamStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const streamUrl = streamHost ? `http://${streamHost}:${PORT}/` : null;

  const [showDashboard, setShowDashboard] = useState(false);
  const [showMapBoard, setShowMapBoard] = useState(false);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isImgError, setIsImgError] = useState(false);

  const [historyItems, setHistoryItems] = useState<{id:number, company:string, time:string, status:string}[]>([]);

  useEffect(() => {
      setHistoryItems(generateHistoryData());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      // Time update logic removed as requested (fixed time used)
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (showMapBoard) setShowMapBoard(false);
            else if (showDashboard) setShowDashboard(false);
            else if (isFullScreen) setIsFullScreen(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, showDashboard, showMapBoard]);

  useEffect(() => {
    if (!loading) return;
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += (Math.random() * 2 + 1);
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => setIsFadingOut(true), 800);
        setTimeout(() => setLoading(false), 2000);
      }
      setProgress(currentProgress);
      const logIndex = Math.floor((currentProgress / 100) * BOOT_LOGS.length);
      setCurrentLog(BOOT_LOGS[Math.min(logIndex, BOOT_LOGS.length - 1)]);
    }, 50);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!db) return;
    const logsRef = ref(db, 'vuzix_log');
    let initialLoad = true;
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const currentString = JSON.stringify(snapshot.val() || {});
      if (initialLoad) {
        initialLoad = false;
        return;
      }
      setShowDashboard(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (streamHost) {
      setStreamStatus("checking");
      const timer = setTimeout(() => {
        setStreamStatus(prev => prev === "checking" ? "error" : prev); 
      }, 5000); 
      return () => { clearTimeout(timer); };
    }
  }, [streamHost]);

  const manualTrigger = useCallback(() => { setShowDashboard(true); }, []);
  const toggleMapBoard = useCallback(() => { setShowMapBoard(true); }, []);
  const closeDashboard = useCallback(() => { setShowDashboard(false); }, []);
  const closeMapBoard = useCallback(() => { setShowMapBoard(false); }, []);
  const toggleFullScreen = useCallback(() => { setIsFullScreen(prev => !prev); }, []);
  const handleRetry = useCallback(() => { 
      setStreamStatus("checking"); 
      setTimeout(() => setStreamStatus("error"), 2000); 
  }, []);

  const chartData = useMemo(() => [
      { name: 'A사', 합격: 85, 불량: 15 }, 
      { name: 'B사', 합격: 90, 불량: 10 }, 
      { name: 'C사', 합격: 98, 불량: 2 }
  ], []);

  return (
    <LayoutGroup>
      <GlobalStyle />
      <LoadingComponent loading={loading} isFadingOut={isFadingOut} progress={progress} currentLog={currentLog} />

      {!loading && (
        <DashboardContainer $show={!loading}>
            <Column>
                <TopCard>
                    <CardTitle>입고 차량 정보</CardTitle>
                    <VehicleImageContainer>
                        {!isImgError ? (
                          <img 
                            src="/images/truck_num_barcode.png" 
                            alt="Vehicle" 
                            onError={() => setIsImgError(true)}
                          />
                        ) : (
                            <div className="no-image">
                                <ImageOff size={32} />
                                <span>이미지를 찾을 수 없음</span>
                            </div>
                        )}
                    </VehicleImageContainer>
                    <PlateContainer>
                        <span className="label">차량 번호</span>
                        <div className="plate-badge">89소 7383</div>
                    </PlateContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
                        <InfoRow>
                            <span className="label">공급업체</span>
                            <span className="value highlight-box">세진공업 (주)</span>
                        </InfoRow>
                        <InfoRow>
                            <span className="label">도착시간</span>
                            <span className="value">10:20</span>
                        </InfoRow>
                        <InfoRow>
                            <span className="label">체류시간</span>
                            <DwellTimeBadge>11분</DwellTimeBadge>
                        </InfoRow>
                    </div>
                </TopCard>

                <FullHeightCard>
                    <CardTitle>통계 및 이력</CardTitle>
                    <CompactScoreRow>
                        <CompactScoreBox $type="pass">
                            <span className="label">합격률</span>
                            <span className="value">98.5%</span>
                        </CompactScoreBox>
                        <CompactScoreBox $type="fail">
                            <span className="label">불량률</span>
                            <span className="value">1.5%</span>
                        </CompactScoreBox>
                    </CompactScoreRow>
                    <ChartContainer>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12, fontWeight: 700}} axisLine={false} tickLine={false} dy={10} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="합격" stackId="a" fill="#10b981" radius={[0,0,4,4]} />
                                <Bar dataKey="불량" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    <HistoryListContainer>
                        <div className="h-title"><History size={16} />최근 이력</div>
                        <div className="h-scroll-area">
                            {historyItems.map((h, i) => (
                                <HistoryItem key={i}>
                                    <span className="comp">{h.company}</span>
                                    <div className="info">
                                        <span className={`status ${h.status === '정상' ? 'ok' : 'bad'}`}>{h.status}</span>
                                        <span className="time">{h.time}</span>
                                    </div>
                                </HistoryItem>
                            ))}
                        </div>
                    </HistoryListContainer>
                </FullHeightCard>
            </Column>

            <Column>
                <VideoCard 
                    layout
                    data-fullscreen={isFullScreen}
                    $isFullScreen={isFullScreen}
                    transition={{ layout: { duration: 0.6, type: "spring", stiffness: 80, damping: 20 } }}
                >
                    <VideoHeader>
                        <div className="title-group">
                            <h3>자재검수 화면</h3>
                            <IpInputWrapper>
                                <span className="label">CAM IP</span>
                                <input 
                                    value={streamHost} 
                                    onChange={(e) => { 
                                        setStreamHost(e.target.value.trim()); 
                                        setStreamStatus("idle"); 
                                    }} 
                                    placeholder="192.168.xx.xx" 
                                />
                            </IpInputWrapper>
                        </div>
                        <div className="btn-group">
                            <PinkButton onClick={manualTrigger}>TEST &gt;</PinkButton>
                            <PinkButton onClick={toggleMapBoard}>D동 현황 &gt;</PinkButton>
                        </div>
                    </VideoHeader>

                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
                      <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%', zIndex: 1 }}>
                        {streamStatus === "ok" && streamUrl ? (
                          <iframe 
                            src={streamUrl} 
                            style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }} 
                            title="Stream"
                            onError={() => setStreamStatus("error")} 
                          />
                        ) : (
                          <StyledErrorState>
                            <div className="grid-bg"></div>
                            <div className="content-box">
                                <div className="icon-wrapper">
                                  {streamStatus === 'checking' ? (
                                    <RefreshCw className="spin" size={32} color="#ef4444" />
                                  ) : (
                                    <Signal size={32} color="#ef4444" />
                                  )}
                                </div>
                                {streamStatus === 'checking' ? (
                                  <>
                                      <h2>CONNECTING...</h2>
                                      <p>Establishing secure connection to {streamHost}...</p>
                                  </>
                                ) : (
                                  <>
                                    <h2>SIGNAL LOST</h2>
                                    <p>Connection to Camera ({streamHost}) is unstable or unreachable.</p>
                                    <div style={{marginTop: 10, display: 'flex', gap: 10, justifyContent: 'center'}}>
                                      <PinkButton onClick={handleRetry} style={{background: '#334155'}}>
                                        <RefreshCw size={14} style={{marginRight: 6}}/> RETRY
                                      </PinkButton>
                                    </div>
                                  </>
                                )}
                            </div>
                            <div className="barcode-layer">
                              <ScanBarcode size={120} color="white" style={{opacity: 0.8}} />
                              <span>WAITING FOR SCANNER SIGNAL...</span>
                            </div>
                          </StyledErrorState>
                        )}
                      </motion.div>

                        <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 50 }}>
                            <button 
                                onClick={toggleFullScreen}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '8px',
                                    width: '40px',
                                    height: '40px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                {isFullScreen ? <LuMinimize size={20}/> : <LuMaximize size={20}/>}
                            </button>
                        </div>

                            <AnimatePresence>
                            {showDashboard && (
                                <AIDashboardModal onClose={closeDashboard} streamUrl={streamUrl} streamStatus={streamStatus} />
                            )}
                        </AnimatePresence>
                    </div>
                </VideoCard>
            </Column>
        </DashboardContainer>
      )}

      <AnimatePresence>
        {showMapBoard && (
            <>
                <Backdrop
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeMapBoard}
                />
                <SlidePanel
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <WarehouseBoard onClose={closeMapBoard} />
                </SlidePanel>
            </>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}