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
  History,
  RefreshCw,
  Signal,
  Calendar,
  Box,
  Layers,
  ServerCrash,
  PieChart as PieIcon
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

interface ApiEntry {
  PrjGubun: string;
  PrjCode: string;
  PrjName: string;
  BigOper: string;
  CdGItem: string;
  NmGItem: string;
  SzStand: string;
  Ingrdnt: string;
  SzSUnit: string;
  ProcGB: string;
  NmProcGB: string;
  InspGB: string;
  NmInspGB: string;
  PurOrdNo: string;
  PurInNo: string;
  InvoiceNo: string;
  DtPurOrd: string;
  InPlnDate: string;
  DtPurIn: string;
  PurInDate: string; 
  CdCustm: string;
  NmCustm: string;
  OrdQty: number;
  CancelQty: number;
  ConfQty: number;
  TInQty: number;
  RemQty: number;
  InQty: number;
  PackCnt: string;
  InspConf: string; 
  InspDate: string;
  QmConf: string;
  QmDate: string | null;
  LastConf: string;
  LastDate: string | null;
  GMTCloseConf: string;
  GMTCloseDate: string | null;
  Remarks: string;
}

interface HistoryItemData {
  id: string; 
  company: string; 
  purInNo: string; 
  status: '정상' | '검수필요';
  time: string; 
  fullDate: string; 
}

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

// Styled Props
interface StyledShowProps {
  $show: boolean;
}
interface StyledFullScreenProps {
  $isFullScreen: boolean;
}
interface ItemCardProps {
  $active: boolean;
}
interface StepItemProps {
  $active: boolean;
  $done: boolean;
}
interface StyledFadeProps {
  $isFadingOut: boolean;
}

// ─── [2. CONSTANTS] ─────────────────────────────────────

const PORT = 8080;
const API_URL = "http://1.254.24.170:24828/api/DX_API000028";

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
  const count = Math.floor(Math.random() * 8) + 3;
  const items: ItemData[] = [];
  for(let i=0; i<count; i++) {
    items.push({
      id: i,
      project: "PILLAR",
      code: `MEE${Math.floor(60000000 + Math.random() * 90000000)}`,
      name: i % 2 === 0 ? "HEATER, PLATE" : "COOLING FAN_V2",
      type: i === 0 ? "무검사" : (Math.random() > 0.5 ? "정밀검사" : "육안검사"),
      date: "2026-01-13",
      vendor: "엘지전자(주)",
      qty: Math.floor(Math.random() * 5000) + 1000,
      quality: "Y",
      dwellTime: `${Math.floor(Math.random() * 40 + 10)}분`
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
      id: i.toString(),
      company: companies[i % companies.length],
      purInNo: `PO-${20260115 + i}`,
      time: `${h}:${m}`,
      status: Math.random() > 0.15 ? '정상' : '검수필요',
      fullDate: date.toISOString()
    } as HistoryItemData;
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

// ─── [5. STYLES DEFINITIONS] ──────────────────

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

// Keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const rotateLens = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// [FIXED] pulseRing Definition
const pulseRing = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
`;

const pulseRingGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
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
  opacity: 1;
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
  min-height: 380px; 
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

// --- Left Panel Specifics ---

const VehicleImagePlaceholder = styled.div`
  width: 100%;
  height: 140px;
  background: #f1f5f9;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #cbd5e1;
  font-weight: 700;
  font-size: 1.2rem;
  border: 1px solid #e2e8f0;
  border-bottom: none;
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

const DwellTimeBadge = styled.span<{ $isWarning: boolean }>`
  font-weight: 800;
  color: ${props => props.$isWarning ? '#fff' : '#0f172a'};
  background: ${props => props.$isWarning ? 'rgba(239, 68, 68, 0.9)' : 'transparent'};
  padding: ${props => props.$isWarning ? '4px 10px' : '0'};
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
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: 1.1rem;
    font-weight: 700;
    color: ${props => props.$type === 'pass' ? '#15803d' : '#b91c1c'};
    white-space: nowrap; 
  }
  .value {
    font-size: 1.2rem;
    font-weight: 900;
    color: ${props => props.$type === 'pass' ? '#15803d' : '#b91c1c'};
    white-space: nowrap; 
  }
`;

const HistoryListContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
  
  .h-title {
    font-size: 1rem;
    font-weight: 700;
    color: #64748b;
    padding: 0 4px 12px 4px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .h-scroll-area {
    flex: 1;
    overflow-y: auto;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    padding: 10px;

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
  padding: 12px 14px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: transform 0.1s;

  &:hover {
    transform: translateX(2px);
    border-color: #cbd5e1;
  }

  .left-grp {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .comp {
    font-weight: 800;
    font-size: 0.95rem;
    color: #334155;
  }
  .sub-txt {
    font-size: 0.75rem;
    color: #94a3b8;
    font-family: monospace;
  }

  .info {
    display: flex;
    align-items: center;
    gap: 10px;
    
    .status {
        font-size: 0.8rem;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 700;
        white-space: nowrap;
        &.ok { background: #dcfce7; color: #166534; }
        &.bad { background: #fee2e2; color: #991b1b; }
    }
    .time {
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 600;
        white-space: nowrap;
    }
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

const StyledErrorState = styled.div`
  position: absolute;
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

const MiniEmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin: 0 20px 20px 20px;
  min-height: 200px;
  border: 1px dashed #cbd5e1;
  
  .icon-circle {
    width: 60px;
    height: 60px;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  
  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #64748b;
    margin: 0;
  }
  
  p {
    color: #94a3b8;
    font-size: 0.85rem;
    margin: 0;
  }

  .loader-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #3b82f6;
    font-weight: 600;
    font-size: 0.8rem;
    margin-top: 4px;
  }
`;

// --- Modal & Overlay Components ---

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

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
  }
  .scan-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .guide {
      border: 2px solid rgba(255,255,255,0.5);
      width: 85%;
      height: 65%;
      border-radius: 16px;
      position: relative;
      box-shadow: 0 0 0 100vmax rgba(0,0,0,0.5);
    }
    .tag {
      position: absolute;
      bottom: 30px;
      background: #ef4444;
      color: white;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 1px;
      box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
    }
  }
  
  .simulated-barcode-view {
    width: 100%;
    height: 100%;
    background: #111;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    color: #fff;
  }
`;

const CompletionPopup = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  padding: 30px 50px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.5), 0 30px 80px rgba(0,0,0,0.9);
  border: 2px solid #10b981;
  z-index: 9999;
  pointer-events: none;

  .icon-check {
    width: 64px;
    height: 64px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    box-shadow: 0 0 30px #10b981;
  }
  .text {
    font-size: 1.5rem;
    font-weight: 900;
    color: #fff;
    letter-spacing: 2px;
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

// --- New Right Panel Styled Components (Modal) ---
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
  
  .title-area {
    margin-bottom: 20px;
    margin-top: 10px;
    h1 {
      font-size: 2rem;
      font-weight: 900;
      color: #fff;
      margin: 0;
      line-height: 1;
      letter-spacing: -1px;
    }
  }

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

// ─── [6. WAREHOUSE BOARD COMPONENTS (GREEN THEME - MINIMAL)] ────────────────

const GreenBoardContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  font-family: 'Pretendard', sans-serif;
  color: #1e293b;

  * { box-sizing: border-box; }

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
      transition: color 0.2s;
    }
    .close-btn:hover {
      color: #10b981; 
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
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

        h3 {
          margin: 0 0 16px 0;
          font-size: 0.95rem;
          color: #1e293b;
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
            border-top-color: #10b981;
            border-right-color: #10b981;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: 800;
            color: #10b981;
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
          .primary { background: #10b981; }
          .secondary { background: #cbd5e1; }
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
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

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
            color: #1e293b;
          }
          .s-box {
            display: flex;
            align-items: center;
            background: #f8fafc;
            padding: 4px 8px;
            border-radius: 6px;
            width: 140px;
            border: 1px solid #e2e8f0;
            color: #64748b;
          }
          input {
            border: none;
            background: transparent;
            width: 100%;
            outline: none;
            font-size: 0.8rem;
            color: #1e293b;
          }
          input::placeholder { color: #94a3b8; }
        }

        .list-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          &::-webkit-scrollbar { width: 4px; }
          &::-webkit-scrollbar-thumb {
            background: #cbd5e1;
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
            transition: all 0.2s;

            &:hover {
              background: #f0fdf4;
            }

            .icon {
              width: 32px;
              height: 32px;
              background: #fff;
              border-radius: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              color: #94a3b8;
            }
            .info { flex: 1; }
            .c {
              font-size: 0.85rem;
              font-weight: 600;
              color: #1e293b;
            }
            .l {
              font-size: 0.75rem;
              color: #64748b;
            }
            .q {
              font-weight: 700;
              color: #10b981;
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
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

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
          background: #ecfdf5; 
          color: #10b981; 
          border: 1px solid #a7f3d0;
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
                
                b { color: #10b981; }
            }

            .bar {
              height: 8px;
              background: #f1f5f9;
              border-radius: 4px;
              overflow: hidden;
            }
            .fill {
              height: 100%;
              background: linear-gradient(90deg, #10b981, #059669); 
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
              grid-template-rows: repeat(10, 1fr);
              gap: 8px;
              
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
                box-shadow: 0 1px 2px rgba(0,0,0,0.03);
              }
              .on {
                background: #ecfdf5; 
                border-color: #a7f3d0; 
                color: #10b981; 
                box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
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

const MemoizedGreenInventoryItem = React.memo(({ item }: { item: InventoryItem }) => (
  <div className="inv-item">
    <div className="icon"><Layers size={14}/></div>
    <div className="info">
      <div className="c">{item.code}</div>
      <div className="l">{item.loc}</div>
    </div>
    <div className="q">{item.qty}</div>
  </div>
));
MemoizedGreenInventoryItem.displayName = 'MemoizedGreenInventoryItem';

const MemoizedGreenSlot = React.memo(({ s }: { s: SlotData }) => (
    <div className={`slot ${s.active?'on':''}`}>
        {s.active && (
            <div className="icon-box">
                <Box size={14} fill="#86efac" color="#22c55e"/>
            </div>
        )}
        {s.no}
    </div>
));
MemoizedGreenSlot.displayName = 'MemoizedGreenSlot';

const GreenZoneColumn = React.memo(({ zone }: { zone: ZoneData }) => (
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
                {zone.slots.map((s) => <MemoizedGreenSlot key={s.no} s={s} />)}
            </div>
        </div>
    </div>
));
GreenZoneColumn.displayName = 'GreenZoneColumn';

const WarehouseBoard = ({ onClose }: { onClose: () => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const initialMapData: ZoneData[] = [
    { id: 'D101', total: 10, used: 2, free: 8, status: '여유', slots: Array.from({length: 10}, (_, i) => ({ no: i+1, active: i < 2 })) },
    { id: 'D102', total: 19, used: 15, free: 4, status: '혼잡', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: i < 15 })) },
    { id: 'D103', total: 20, used: 20, free: 0, status: '만차', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: true })) },
    { id: 'D104', total: 20, used: 8, free: 12, status: '보통', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 8 })) },
    { id: 'D105', total: 19, used: 0, free: 19, status: '비어있음', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: false })) },
  ];

  const mapData = initialMapData;

  const inventoryData: InventoryItem[] = useMemo(() => [
    { code: 'ADC30009358', qty: 708, loc: 'D101' }, { code: 'ADC30014326', qty: 294, loc: 'D102' },
    { code: 'ADC30003801', qty: 204, loc: 'D102' }, { code: 'AGF04075606', qty: 182, loc: 'D103' },
    { code: 'ADC30009359', qty: 150, loc: 'D104' }, { code: 'AGM76970201', qty: 120, loc: 'D101' },
    { code: 'AGM76970202', qty: 100, loc: 'D105' }, { code: 'AGM76970203', qty: 50, loc: 'D101' },
    { code: 'AGM76970204', qty: 30, loc: 'D102' }, { code: 'AGM76970205', qty: 10, loc: 'D103' },
    { code: 'AGM76970206', qty: 120, loc: 'D104' }, { code: 'AGM76970207', qty: 100, loc: 'D105' },
  ], []);

  const filteredInventory = useMemo(() => 
    inventoryData.filter(item => 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.loc.toLowerCase().includes(searchTerm.toLowerCase()) 
    ), 
  [inventoryData, searchTerm]);
  
  return ( 
    <GreenBoardContainer> 
        <div className="board-header"> 
            <div className="title"><LayoutGrid size={24} color="#10b981"/> D동 실시간 적재 현황판</div> 
            <button className="close-btn" onClick={onClose}><XIcon size={28}/></button> 
        </div> 
        <div className="board-body"> 
            <div className="left-col"> 
                <div className="summary-card"> 
                    <h3><PieIcon size={16}/> 종합 적재 현황</h3> 
                    <div className="chart-area"> 
                        <div className="pie-mock"><span className="val">48%</span></div> 
                        <div className="legend"> 
                            <div><span className="dot primary"></span>사용: <b>48</b></div> 
                            <div><span className="dot secondary"></span>여유: <b>52</b></div> 
                        </div> 
                    </div> 
                </div> 
                <div className="inv-list-wrapper"> 
                    <div className="search-row"> 
                        <h3><PackageIcon size={16}/> 재고 리스트</h3> 
                        <div className="s-box"><Search size={14}/><input placeholder="검색..." onChange={e=>setSearchTerm(e.target.value)}/></div> 
                    </div> 
                    <div className="list-scroll"> 
                        {filteredInventory.map((item, i) => ( <MemoizedGreenInventoryItem key={i} item={item} /> ))} 
                    </div> 
                </div> 
            </div> 
            <div className="map-col"> 
                <div className="map-legend"> 
                    <span className="badge empty"><div className="dot" style={{background:'#cbd5e1'}}/> 여유</span>
                    <span className="badge active"><div className="dot" style={{background:'#10b981'}}/> 사용</span>
                    <span className="badge full"><div className="dot" style={{background:'#ef4444'}}/> 만차</span> 
                </div> 
                <div className="zone-wrapper"> 
                    {mapData.map(zone => <GreenZoneColumn key={zone.id} zone={zone} />)} 
                </div> 
            </div> 
        </div> 
    </GreenBoardContainer> 
  )
};

const MemoizedItemCard = React.memo(({ item, selectedId, onClick }: { item: ItemData, selectedId: number, onClick: (id: number) => void }) => ( 
  <ItemCard $active={selectedId === item.id} onClick={() => onClick(item.id)} > 
    <div className="c">{item.code}</div> 
    <div className="n">{item.name}</div> 
    <div className="q">{item.qty.toLocaleString()} EA</div> 
  </ItemCard> 
)); 
MemoizedItemCard.displayName = 'MemoizedItemCard';

// ─── [7. AIDashboardModal] ──────────────────────

const RPAStatusView = React.memo(({ step, showComplete, isWearableConnected, streamUrl }: { step: number, showComplete: boolean, isWearableConnected?: boolean, streamUrl?: string | null }) => {
  return (
    <RPAProcessView initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} >
      <div className="rpa-header"> <h2><Cpu size={24} color="#60a5fa" strokeWidth={2.5}/> AUTO PROCESSING</h2> <p>Vision AI 데이터 분석 및 ERP 자동 입고 처리를 진행합니다.</p> </div>
      <div className="step-container"> {PROCESS_STEPS.map((s) => ( <StepItem key={s.id} $active={step === s.id} $done={step > s.id} > <div className="icon-box">{s.icon}</div> <div className="txt">{s.label}</div> <div className="status"> {step > s.id ? <CheckCircle2 size={18} color="#10b981" strokeWidth={3}/> : step === s.id ? <Loader2 className="spin" size={18} color="#fff"/> : <MoreHorizontal size={18}/>} </div> </StepItem> ))} </div>
      <div className="pip-container">
        <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%' }}>
          <CameraFrame>
            {isWearableConnected && streamUrl ? (
                <iframe src={streamUrl} style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }} />
            ) : (
                <div className="simulated-barcode-view">
                    <ScanBarcode size={64} color="white" style={{opacity:0.8, marginBottom: 8}} />
                    <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>SIMULATING SCAN...</span>
                </div>
            )}
            <div className="scan-overlay"> <div className="tag">STANDBY</div> </div>
          </CameraFrame>
        </motion.div>
      </div>
    </RPAProcessView>
  );
});
RPAStatusView.displayName = 'RPAStatusView';

function AIDashboardModal({ onClose, streamUrl, streamStatus }: { onClose: () => void, streamUrl?: string | null, streamStatus: string }) {
  const [viewMode, setViewMode] = useState<'scan' | 'rpa'>('scan');
  const [items, setItems] = useState<ItemData[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [rpaStep, setRpaStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
        setTimeout(() => { setShowComplete(false); }, 2000);
      } else { 
          setRpaStep(step); 
      }
    }, 1200);
  }, []);

  useEffect(() => {
    if (!db) return;
    const logRef = ref(db, 'logs');
    
    const unsubscribe = onValue(logRef, (snapshot) => {
        if (initialMount.current) {
            initialMount.current = false;
            return;
        }

        setViewMode('rpa');
        startRPAProcess();
    });

    return () => unsubscribe();
  }, [startRPAProcess]);

  const handleItemClick = useCallback((id: number) => { setSelectedId(id); }, []);
  
  const handleScanClick = useCallback(() => {
      if(viewMode === 'scan') {
          setViewMode('rpa');
          startRPAProcess();
      }
  }, [viewMode, startRPAProcess]);

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
              <div className="icon-check"><CheckCircle2 size={48} strokeWidth={4} /></div> 
              <div className="text">RPA PROCESSING COMPLETE</div> 
            </CompletionPopup> 
          )} 
        </AnimatePresence> 
        
        <div className="left-pane" onClick={handleScanClick}> 
          <LayoutGroup> 
            {viewMode === 'rpa' && <RPAStatusView step={rpaStep} showComplete={showComplete} isWearableConnected={isWearableConnected} streamUrl={streamUrl} />} 
            {viewMode === 'scan' && ( 
              <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%', zIndex: 20 }}> 
                <CameraFrame> 
                  {isWearableConnected ? <iframe src={streamUrl || ''} style={{ width: '100%', height: '100%', border: 'none', objectFit: 'cover' }} /> : (
                      <div className="simulated-barcode-view">
                          <img src="/images/barcode.png" alt="Scanning Target" onError={(e) => e.currentTarget.style.display='none'} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.6 }} />
                      </div>
                  )}
                  <motion.div className="scan-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} > 
                    <div className="guide"> 
                    </div> 
                    <div className="tag">SCANNING...</div> 
                  </motion.div> 
                </CameraFrame> 
              </motion.div> 
            )} 
          </LayoutGroup> 
        </div> 
        
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
                {items.map(item => (
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
                            <div className="val qty">{activeItem.qty.toLocaleString()} <span style={{fontSize: '0.8em', fontWeight: 600, color: '#64748b'}}>EA</span></div>
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
  const [streamHost, setStreamHost] = useState("192.168.0.53");
  const [streamStatus, setStreamStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const streamUrl = streamHost ? `http://${streamHost}:${PORT}/` : null;

  const [showDashboard, setShowDashboard] = useState(false);
  const [showMapBoard, setShowMapBoard] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Real-time Dwell Logic
  const [now, setNow] = useState<Date>(new Date());
  const [dwellString, setDwellString] = useState("0분");
  const [isLongDwell, setIsLongDwell] = useState(false);
  
  // API Data & Stats State
  const [apiData, setApiData] = useState<ApiEntry[]>([]);
  const [stats, setStats] = useState({ pass: 0, fail: 0, passRate: 0, failRate: 0 });
  const [historyList, setHistoryList] = useState<HistoryItemData[]>([]);
  
  // [강제 설정] 현재 API 연동 전이라 데이터를 못 찾았다는 UI를 보여주기 위해 false로 고정
  const isDataReady = false; 

  const [arrivalTime] = useState(() => {
    const now = new Date();
    const isLong = Math.random() < 0.3; 
    const minutesAgo = isLong 
        ? Math.floor(Math.random() * 120) + 65 
        : Math.floor(Math.random() * 50) + 5;  
        
    return new Date(now.getTime() - minutesAgo * 60000);
  });

  const arrivalTimeString = useMemo(() => {
    const h = String(arrivalTime.getHours()).padStart(2, '0');
    const m = String(arrivalTime.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, [arrivalTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch API Data
  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("API Error");
            const data: ApiEntry[] = await res.json();
            
            // 데이터 처리
            let passCount = 0;
            let failCount = 0;
            
            const processedHistory: HistoryItemData[] = data.map(item => {
                const isPass = item.InspConf && item.InspConf.toUpperCase() === 'Y';
                if(isPass) passCount++; else failCount++;
                
                // 시간 파싱 (YYYY-MM-DD HH:mm 에서 HH:mm 추출)
                let timeStr = "-";
                if(item.PurInDate) {
                    const parts = item.PurInDate.split(' ');
                    if(parts.length > 1) {
                        timeStr = parts[1].substring(0, 5);
                    }
                }

                return {
                    id: item.PurInNo,
                    company: item.NmCustm,
                    purInNo: item.PurInNo,
                    status: isPass ? '정상' : '검수필요',
                    time: timeStr,
                    fullDate: item.PurInDate 
                };
            });

            processedHistory.sort((a, b) => {
                if(a.fullDate < b.fullDate) return 1;
                if(a.fullDate > b.fullDate) return -1;
                return 0;
            });

            const total = passCount + failCount;
            const passRate = total > 0 ? Math.round((passCount / total) * 1000) / 10 : 0; 
            const failRate = total > 0 ? Math.round((failCount / total) * 1000) / 10 : 0;

            setStats({ pass: passCount, fail: failCount, passRate, failRate });
            setHistoryList(processedHistory.slice(0, 20)); 
            
            // [API 연동 시 주석 해제]
            // setApiData(data); 

        } catch (err) {
            console.error("API Fetch Failed or Skipped");
        }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const diffMs = now.getTime() - arrivalTime.getTime();
    if (diffMs < 0) {
      setDwellString("0분");
      setIsLongDwell(false);
    } else {
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      setIsLongDwell(diffMins >= 60);
      if (hours > 0) {
        setDwellString(`${hours}시간 ${minutes}분`);
      } else {
        setDwellString(`${minutes}분`);
      }
    }
  }, [now, arrivalTime]);

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
    if (!db) return;
    const logsRef = ref(db, 'vuzix_log');
    let initialLoad = true;
    const unsubscribe = onValue(logsRef, (snapshot) => {
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

  return (
    <LayoutGroup>
      <GlobalStyle />
      
      <DashboardContainer $show={true}>
            {/* Left Column */}
            <Column>
                {/* Vehicle Info Card */}
                <TopCard>
                    <CardTitle>입고 차량 정보</CardTitle>
                    {/* isDataReady가 false이므로 MiniEmptyState가 보임 */}
                    {isDataReady && apiData.length > 0 ? (
                      <>
                        <VehicleImagePlaceholder>
                            차량사진 CCTV
                        </VehicleImagePlaceholder>
                        
                        <PlateContainer>
                            <span className="label">차량 번호</span>
                            <div className="plate-badge">
                                89소 7383
                            </div>
                        </PlateContainer>

                        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
                            <InfoRow>
                                <span className="label">공급업체</span>
                                <span className="value highlight-box">
                                    {apiData[0].NmCustm}
                                </span>
                            </InfoRow>
                            <InfoRow>
                                <span className="label">도착시간</span>
                                <span className="value">{arrivalTimeString}</span>
                            </InfoRow>
                            <InfoRow>
                                <span className="label">체류시간</span>
                                <DwellTimeBadge $isWarning={isLongDwell}>
                                    {dwellString}
                                </DwellTimeBadge>
                            </InfoRow>
                        </div>
                      </>
                    ) : (
                      <MiniEmptyState>
                        <div className="icon-circle">
                          <ServerCrash size={28} />
                        </div>
                        <h3>데이터 조회 대기 중</h3>
                        <p>차량 입고 데이터를 기다리고 있습니다.</p>
                        <div className="loader-row">
                          <Loader2 className="spin" size={14} /> 연결 시도 중...
                        </div>
                      </MiniEmptyState>
                    )}
                </TopCard>

                {/* Stats Card & Recent History */}
                <FullHeightCard>
                    <CardTitle>통계 및 이력</CardTitle>
                    <CompactScoreRow>
                        <CompactScoreBox $type="pass">
                            <span className="label">합격률</span>
                            <span className="value">{stats.passRate}%</span>
                        </CompactScoreBox>
                        <CompactScoreBox $type="fail">
                            <span className="label">불량률</span>
                            <span className="value">{stats.failRate}%</span>
                        </CompactScoreBox>
                    </CompactScoreRow>
                    
                    <HistoryListContainer>
                        <div className="h-title"><History size={16} />최근 이력 ({historyList.length}건)</div>
                        <div className="h-scroll-area">
                            {historyList.map((h) => (
                                <HistoryItem key={h.id}>
                                    <div className="left-grp">
                                        <span className="comp">
                                          {/* 말줄임표 처리 */}
                                          {h.company.length > 10 ? h.company.substring(0, 10) + '...' : h.company}
                                        </span>
                                        <span className="sub-txt">{h.purInNo}</span>
                                    </div>
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

            {/* Right Column (Video Feed) */}
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