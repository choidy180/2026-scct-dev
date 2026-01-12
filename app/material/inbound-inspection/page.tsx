'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// --- Firebase Imports (설정 유지) ---
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, Database } from "firebase/database";

// --- Icons ---
import {
  LuMaximize,
  LuMinimize,
  LuPlay,
  LuX,
} from "react-icons/lu";

import {
  Barcode,
  Loader2,
  Cpu,
  Save,
  CheckCircle2,
  Activity,
  Box,
  Calendar,
  Layers,
  FileBadge,
  PackageCheck,
  ScanBarcode,
  ListTodo,
  ScanEye,
  Map as MapIcon, 
  PieChart,
  LayoutGrid,
  Package as PackageIcon,
  X as XIcon,
  Search,
  MoreHorizontal
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

interface StyledStatusProps {
  $status: 'ok' | 'fail';
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

interface RackGridProps {
  $rows: number;
  $cols: number;
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
  const count = Math.floor(Math.random() * 8) + 3;
  const items: ItemData[] = [];
  for(let i=0; i<count; i++) {
    items.push({
      id: i,
      project: "PILLAR",
      code: `MEE${Math.floor(60000000 + Math.random() * 90000000)}`,
      name: i % 2 === 0 ? "HEATER, PLATE" : "COOLING FAN_V2",
      type: i === 0 ? "무검사" : (Math.random() > 0.5 ? "정밀검사" : "육안검사"),
      date: "2026-01-07",
      vendor: "엘지전자(주)",
      qty: Math.floor(Math.random() * 5000) + 1000,
      quality: "Y",
      dwellTime: `${Math.floor(Math.random() * 40 + 10)}분`
    });
  }
  return items;
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

// ─── [5. STYLES - FULLY EXPANDED & OPTIMIZED] ──────────────────

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: #f8fafc;
    font-family: 'Pretendard', sans-serif;
    overflow: hidden;
    color: #1e293b;
  }
  * {
    box-sizing: border-box;
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

// --- Layout & Modal Components ---

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

// --- Board Components ---

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
          .blue { background: #3b82f6; }
          .green { background: #10b981; }
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
            .info { flex: 1; }
            .c { font-size: 0.85rem; font-weight: 600; }
            .l { font-size: 0.75rem; color: #94a3b8; }
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
        justify-content: flex-end;
        gap: 8px;

        .badge {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .empty { background: #f1f5f9; color: #94a3b8; }
        .active { background: #eff6ff; color: #3b82f6; }
        .full { background: #fef2f2; color: #ef4444; }
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
          gap: 10px;
          height: 100%;
          min-height: 0;

          .z-head {
            background: #f8fafc;
            padding: 10px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            flex-shrink: 0;

            .top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
            }
            .id {
              font-weight: 800;
              font-size: 1.1rem;
              color: #1e293b;
            }
            .st {
              font-size: 0.7rem;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
            }
            .g { background: #dcfce7; color: #166534; }
            .o { background: #ffedd5; color: #9a3412; }
            .r { background: #fee2e2; color: #991b1b; }

            .bar {
              height: 4px;
              background: #e2e8f0;
              border-radius: 2px;
              overflow: hidden;
              margin-top: 8px;
            }
            .fill {
              height: 100%;
              background: #3b82f6;
            }
          }

          .slot-grid-container {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;

            .slot-grid {
              flex: 1;
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: repeat(10, 1fr);
              gap: 6px;

              .slot {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                font-size: 1rem;
                font-weight: 700;
                color: #cbd5e1;
              }
              .on {
                background: #eff6ff;
                border-color: #93c5fd;
                color: #2563eb;
              }
              .dot {
                position: absolute;
                bottom: 10%;
                width: 6px;
                height: 6px;
                background: #3b82f6;
                border-radius: 50%;
              }
            }
          }
        }
      }
    }
  }
`;

// --- Overlay Components ---

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

const MainGrid = styled.div`
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
  }

  .right-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: rgba(0,0,0,0.3);
    min-width: 280px;
    min-height: 0;
  }
`;

const ProductListArea = styled.div`
  height: auto;
  border-bottom: 1px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255,255,255,0.02);

  .label {
    font-size: 1rem;
    font-weight: 800;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 0.5px;
  }

  .list-scroller {
    flex: 1;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    ${hideScrollbar}
  }
`;

const ItemCard = styled.div<ItemCardProps>`
  min-width: 120px;
  height: 100%;
  background: ${(props) => props.$active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)'};
  border: 1px solid ${(props) => props.$active ? '#60a5fa' : 'rgba(255,255,255,0.1)'};
  border-radius: 8px;
  padding: 8px 10px;
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

  .code {
    font-size: 0.8rem;
    font-weight: 800;
    font-family: monospace;
    letter-spacing: -0.5px;
    color: ${(props) => props.$active ? '#60a5fa' : '#e2e8f0'};
  }
  .name {
    font-size: 0.7rem;
    color: #cbd5e1;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .qty {
    font-size: 0.75rem;
    font-weight: 700;
    color: ${(props) => props.$active ? '#60a5fa' : '#94a3b8'};
  }
`;

const DetailArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  ${hideScrollbar}
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;

  .big-header {
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.1);

    .sub {
      font-size: 0.85rem;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: 1px;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #fff;
      line-height: 1.2;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
  }

  .info-group {
    background: rgba(0,0,0,0.2);
    border-radius: 10px;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    margin-top: 8px;

    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .row:last-child {
      margin-bottom: 0;
    }
    .k {
      color: #cbd5e1;
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .v {
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      letter-spacing: 0.5px;
    }
    .highlight {
      color: #34d399;
      font-size: 1.1rem;
      font-weight: 800;
      text-shadow: 0 0 10px rgba(52, 211, 153, 0.3);
    }
  }

  .status-box {
    padding: 12px;
    border-radius: 10px;
    text-align: center;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .st-text {
      font-size: 1.1rem;
      font-weight: 900;
      letter-spacing: 1px;
      color: white;
    }
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

    .line {
      position: absolute;
      width: 100%;
      height: 3px;
      background: #ef4444;
      box-shadow: 0 0 25px #ef4444;
      z-index: 5;
    }
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
`;

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

const DashboardContainer = styled.div<StyledShowProps>`
  width: 100%;
  height: calc(100vh - 64px);
  background-color: #f1f5f9;
  color: #0f172a;
  padding: 20px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  font-family: 'Pretendard', sans-serif;
  overflow: hidden;
  animation: ${(props) => (props.$show ? css`${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none')};
  opacity: 0;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  min-height: 0;
`;

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
`;

const FullHeightCard = styled(Card)`
  height: 100%;
`;

const ExpandableCard = styled(motion.div)<StyledFullScreenProps>`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  flex: 1;
  padding: 0;
  will-change: transform, width, height;

  ${({ $isFullScreen }) => $isFullScreen && css`
    position: fixed;
    top: 0px;
    left: 0;
    width: 100vw;
    height: calc(100vh - 64px);
    z-index: 999;
    border-radius: 0;
    border: none;
    margin: 0;
  `}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0;
  justify-content: space-between;

  .left-group {
    display: flex;
    align-items: center;
  }
  .badge {
    background-color: #3b82f6;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 700;
    margin-right: 10px;
  }
  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
  }
`;

const ImageArea = styled.div`
  width: 100%;
  height: 200px;
  background-color: #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  position: relative;
  border: 1px solid #cbd5e1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .label {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    color: #0f172a;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 10;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  align-items: center;

  span.label {
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
  }
  span.value {
    color: #0f172a;
    font-weight: 600;
    font-size: 1rem;
  }
`;

const StreamContainer = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  background: #000;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  object-fit: cover;
  position: absolute;
  inset: 0;
  z-index: 1;
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
    font-size: 0.85rem;
    width: 100px;
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

const FullScreenBtn = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  z-index: 1000;
  pointer-events: auto;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }
`;

const TriggerButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 15px;
  height: 100%;
  min-height: 0;

  .chart-area {
    flex: 1.1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .history-area {
    flex: 0.9;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;

    h4 {
      margin: 0 0 8px 0;
      font-size: 0.8rem;
      color: #64748b;
    }
    .history-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
  }
`;

const ScoreBoard = styled.div`
  display: flex;
  gap: 8px;

  div {
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 6px;
    text-align: center;
    border: 1px solid #e2e8f0;
    flex: 1;

    .title {
      font-size: 0.7rem;
      color: #64748b;
      display: block;
    }
    .score {
      font-size: 0.9rem;
      font-weight: bold;
    }
    .score.pass {
      color: #059669;
    }
    .score.fail {
      color: #e11d48;
    }
  }
`;

const HistoryItem = styled.div<StyledStatusProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.75rem;
  color: #334155;

  &:last-child {
    border-bottom: none;
  }
  .comp {
    font-weight: 600;
  }
  .time {
    color: #94a3b8;
    font-size: 0.7rem;
  }
  .status {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(props) => props.$status === 'ok' ? '#10b981' : '#f43f5e'};
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

// ─── [6. OPTIMIZED SUB-COMPONENTS] ──────────────────────────────

// Optimization: Memoized Inventory List Item to prevent unnecessary re-renders
const MemoizedInventoryItem = React.memo(({ item }: { item: InventoryItem }) => (
  <div className="inv-item">
    <div className="icon"><Layers size={14}/></div>
    <div className="info"><div className="c">{item.code}</div><div className="l">{item.loc}</div></div>
    <div className="q">{item.qty}</div>
  </div>
));
MemoizedInventoryItem.displayName = 'MemoizedInventoryItem';

// Optimization: Memoized Slot to prevent huge grid re-renders
const MemoizedSlot = React.memo(({ s }: { s: SlotData }) => (
  <div className={`slot ${s.active?'on':''}`}>
    {s.no} {s.active && <div className="dot"/>}
  </div>
));
MemoizedSlot.displayName = 'MemoizedSlot';

// Optimization: Zone Column wrapper
const ZoneColumn = React.memo(({ zone }: { zone: ZoneData }) => (
  <div className="zone-col">
    <div className="z-head">
      <div className="top"><span className="id">{zone.id}</span> <span className={`st ${zone.status==='만차'?'r':zone.status==='혼잡'?'o':'g'}`}>{zone.status}</span></div>
      <div className="bar"><div className="fill" style={{width: `${(zone.used/zone.total)*100}%`}}/></div>
    </div>
    <div className="slot-grid-container">
      <div className="slot-grid">
        {zone.slots.map((s) => <MemoizedSlot key={s.no} s={s} />)}
      </div>
    </div>
  </div>
));
ZoneColumn.displayName = 'ZoneColumn';

// Optimization: WarehouseBoard (Split to isolate map re-renders)
const WarehouseBoard = ({ onClose }: { onClose: () => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Memoize static data
  const mapData: ZoneData[] = useMemo(() => [
    { id: 'D101', total: 20, used: 4, free: 16, status: '여유', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 4 })) },
    { id: 'D102', total: 20, used: 16, free: 4, status: '혼잡', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 16 })) },
    { id: 'D103', total: 20, used: 20, free: 0, status: '만차', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: true })) },
    { id: 'D104', total: 20, used: 8, free: 12, status: '보통', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 8 })) },
    { id: 'D105', total: 20, used: 0, free: 20, status: '비어있음', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: false })) },
  ], []);

  const inventoryData: InventoryItem[] = useMemo(() => [
    { code: 'ADC30009358', qty: 708, loc: 'D101' }, { code: 'ADC30014326', qty: 294, loc: 'D102' },
    { code: 'ADC30003801', qty: 204, loc: 'D102' }, { code: 'AGF04075606', qty: 182, loc: 'D103' },
    { code: 'ADC30009359', qty: 150, loc: 'D104' }, { code: 'AGM76970201', qty: 120, loc: 'D101' },
    { code: 'AGM76970202', qty: 100, loc: 'D105' }, { code: 'AGM76970203', qty: 50, loc: 'D101' },
    { code: 'AGM76970204', qty: 30, loc: 'D102' }, { code: 'AGM76970205', qty: 10, loc: 'D103' },
    { code: 'AGM76970206', qty: 120, loc: 'D104' }, { code: 'AGM76970207', qty: 100, loc: 'D105' },
  ], []);

  const filteredInventory = useMemo(() => inventoryData.filter(item => 
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.loc.toLowerCase().includes(searchTerm.toLowerCase())
  ), [inventoryData, searchTerm]);

  return (
    <BoardContainer>
      <div className="board-header">
        <div className="title"><LayoutGrid size={24} color="#3b82f6"/> D동 실시간 적재 현황판</div>
        <button className="close-btn" onClick={onClose}><XIcon size={28}/></button>
      </div>
      <div className="board-body">
        <div className="left-col">
          <div className="summary-card">
            <h3><PieChart size={16}/> 종합 적재 현황</h3>
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
              {filteredInventory.map((item, i) => (
                <MemoizedInventoryItem key={i} item={item} />
              ))}
            </div>
          </div>
        </div>
        <div className="map-col">
          <div className="map-legend">
            <span className="badge empty">여유</span><span className="badge active">사용</span><span className="badge full">만차</span>
          </div>
          <div className="zone-wrapper">
            {mapData.map(zone => <ZoneColumn key={zone.id} zone={zone} />)}
          </div>
        </div>
      </div>
    </BoardContainer>
  )
};

// Optimization: Separate RPA Steps to prevent full modal re-render on step change
const RPAStatusView = React.memo(({ step, showComplete }: { step: number, showComplete: boolean }) => (
  <RPAProcessView
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    <div className="rpa-header">
      <h2><Cpu size={24} color="#60a5fa" strokeWidth={2.5}/> AUTO PROCESSING</h2>
      <p>Vision AI 데이터 분석 및 ERP 자동 입고 처리를 진행합니다.</p>
    </div>
    
    <div className="step-container">
      {PROCESS_STEPS.map((s) => (
        <StepItem 
            key={s.id} 
            $active={step === s.id} 
            $done={step > s.id}
        >
          <div className="icon-box">{s.icon}</div>
          <div className="txt">{s.label}</div>
          <div className="status">
            {step > s.id ? <CheckCircle2 size={18} color="#10b981" strokeWidth={3}/> : 
             step === s.id ? <Loader2 className="spin" size={18} color="#fff"/> : <MoreHorizontal size={18}/>}
          </div>
        </StepItem>
      ))}
    </div>

    <div className="pip-container">
      <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%' }}>
          <CameraFrame>
            <img src="/images/barcode.png" alt="Live Feed" />
            <div className="scan-overlay">
               <div className="tag">STANDBY</div>
            </div>
          </CameraFrame>
      </motion.div>
    </div>
  </RPAProcessView>
));
RPAStatusView.displayName = 'RPAStatusView';

// Optimization: Separate Loading Component
const LoadingComponent = React.memo(({ loading, isFadingOut, progress, currentLog }: any) => {
  if (!loading && !isFadingOut) return null;
  return (
    <NewLoadingScreen $isFadingOut={isFadingOut}>
      <div className="background-grid"></div>
      <div className="loader-content">
        <LensCore>
          <div className="outer-ring"></div>
          <div className="inner-ring"></div>
          <div className="core-lens"><ScanEye size={32} color="white" /></div>
        </LensCore>
        <div className="brand-text">
          <span className="small">WEARABLE AI SYSTEM</span>
          <h1 className="large">VISION OS <span className="version">v2.0</span></h1>
        </div>
        <TechProgressWrapper>
          <div className="bar-bg"><motion.div className="bar-fill" style={{ width: `${progress}%` }}><div className="bar-glare"></div></motion.div></div>
          <div className="progress-info"><span className="log-text"><span className="cursor">&gt;</span> {currentLog}</span><span className="percentage">{Math.floor(progress)}%</span></div>
        </TechProgressWrapper>
      </div>
    </NewLoadingScreen>
  );
});
LoadingComponent.displayName = 'LoadingComponent';

// Optimization: ItemDetail Component
const ItemDetailView = React.memo(({ activeItem }: { activeItem: ItemData | null }) => (
    <DetailArea>
    <AnimatePresence mode="wait">
      {activeItem && (
        <motion.div 
            key={activeItem.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
        >
            <div className="big-header">
                <div className="sub">{activeItem.vendor}</div>
                <div className="title">{activeItem.name}</div>
            </div>
            
            <div style={{ marginTop: '12px' }}>
                <div className={`status-box ${activeItem.quality === 'Y' ? 'ok' : 'chk'}`}>
                    <div className="st-text" style={{
                        color: activeItem.quality === 'Y'?'#10b981':'#f59e0b'
                    }}>{activeItem.quality === 'Y' ? 'PASS (정상)' : 'CHECK REQUIRED'}</div>
                </div>
            </div>

            <div className="info-group">
                <div className="row"><div className="k"><Box size={14}/> 품목코드</div><div className="v" style={{fontFamily:'monospace'}}>{activeItem.code}</div></div>
                <div className="row"><div className="k"><Layers size={14}/> 프로젝트</div><div className="v">{activeItem.project}</div></div>
                <div className="row"><div className="k"><PackageCheck size={14}/> 입고수량</div><div className="v highlight">{activeItem.qty?.toLocaleString() ?? 0} <span style={{fontSize:'0.75rem', fontWeight:500, color:'#94a3b8'}}>EA</span></div></div>
                <div className="row"><div className="k"><Calendar size={14}/> 입고일자</div><div className="v">{activeItem.date}</div></div>
            </div>
            
            <div className="info-group">
                <div className="row">
                    <div className="k" style={{color:'#60a5fa'}}>SYSTEM LOG</div>
                </div>
                <div style={{fontSize:'0.75rem', color:'#cbd5e1', marginTop:'6px', lineHeight:'1.5', fontFamily:'monospace'}}>
                    [INFO] ERP 데이터 대조 완료.<br/>
                    [INFO] PO 번호 매칭 성공 (PO-2026-01-088)<br/>
                    [WARN] 창고 관리 시스템(WMS) 적재 위치 최적화 계산 중...
                </div>
            </div>

        </motion.div>
      )}
    </AnimatePresence>
  </DetailArea>
));
ItemDetailView.displayName = 'ItemDetailView';

// Optimization: List Item Card for Modal
const MemoizedItemCard = React.memo(({ item, selectedId, onClick }: { item: ItemData, selectedId: number, onClick: (id: number) => void }) => (
  <ItemCard 
      $active={selectedId === item.id}
      onClick={() => onClick(item.id)}
  >
    <div className="code">{item.code}</div>
    <div className="name">{item.name}</div>
    <div className="qty">{item.qty.toLocaleString()} EA</div>
  </ItemCard>
));
MemoizedItemCard.displayName = 'MemoizedItemCard';

// ─── [MAIN MODAL] ──────────────────────────────────────

function AIDashboardModal({ onClose }: { onClose: () => void }) {
  const [viewMode, setViewMode] = useState<'scan' | 'rpa'>('scan');
  const [items, setItems] = useState<ItemData[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  
  const [rpaStep, setRpaStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  // Generate data once
  useEffect(() => {
    const data = generateDummyItems();
    setItems(data);
    if(data.length > 0) setSelectedId(data[0].id);

    const timer = setTimeout(() => {
      setViewMode('rpa');
      startRPAProcess();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const startRPAProcess = useCallback(() => {
    let step = 1;
    setRpaStep(step);
    
    const interval = setInterval(() => {
      step++;
      if (step > 5) {
        clearInterval(interval);
        setShowComplete(true);
        setTimeout(() => {
            setShowComplete(false);
        }, 2000);
      } else {
        setRpaStep(step);
      }
    }, 1200);
  }, []);

  const handleItemClick = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const activeItem = useMemo(() => items.find(i => i.id === selectedId) || (items.length > 0 ? items[0] : null), [items, selectedId]);

  return (
    <OverlayContainer
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <HeaderBar>
        <div className="brand"><ScanBarcode color="#60a5fa" strokeWidth={3}/> VISION AI SCANNER</div>
        <button className="close-btn" onClick={onClose}><LuX size={20} strokeWidth={3}/></button>
      </HeaderBar>
      
      <MainGrid>
        <AnimatePresence>
            {showComplete && (
            <CompletionPopup
                initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                transition={{ type: "spring", bounce: 0.5 }}
            >
                <div className="icon-check"><CheckCircle2 size={48} strokeWidth={4} /></div>
                <div className="text">RPA PROCESSING COMPLETE</div>
            </CompletionPopup>
            )}
        </AnimatePresence>

        <div className="left-pane">
          <LayoutGroup>
            
            {viewMode === 'rpa' && <RPAStatusView step={rpaStep} showComplete={showComplete} />}

            {viewMode === 'scan' && (
              <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%', zIndex: 20 }}>
                <CameraFrame>
                  <img src="/images/barcode.png" alt="Live Feed" />
                  <motion.div 
                    className="scan-overlay"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    <div className="guide">
                      <motion.div 
                        className="line"
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <div className="tag">SCANNING...</div>
                  </motion.div>
                </CameraFrame>
              </motion.div>
            )}

          </LayoutGroup>
        </div>

        <div className="right-pane">
          <ProductListArea>
            <div className="label"><ListTodo size={14}/> 입고 예정 리스트 (Live)</div>
            <div className="list-scroller">
              {items.map(item => (
                <MemoizedItemCard key={item.id} item={item} selectedId={selectedId} onClick={handleItemClick} />
              ))}
            </div>
          </ProductListArea>

          <ItemDetailView activeItem={activeItem} />
        </div>
      </MainGrid>
    </OverlayContainer>
  );
}

// ─── [ROOT COMPONENT] ──────────────────────────────────────

export default function SmartFactoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState(BOOT_LOGS[0]);

  const [streamHost, setStreamHost] = useState("192.168.50.196");
  const [streamStatus, setStreamStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const streamUrl = streamHost ? `http://${streamHost}:${PORT}/` : null;

  const [showDashboard, setShowDashboard] = useState(false);
  const [showMapBoard, setShowMapBoard] = useState(false);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const previousDataRef = useRef<string>(""); 

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

  // Loading Logic
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

  // DB Listen
  useEffect(() => {
    if (!db) return;
    const logsRef = ref(db, 'logs');
    let initialLoad = true;
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const currentString = JSON.stringify(snapshot.val() || {});
      if (initialLoad) {
        previousDataRef.current = currentString;
        initialLoad = false;
        return;
      }
      if (currentString !== previousDataRef.current) {
        setShowDashboard(true);
        previousDataRef.current = currentString;
      }
    });
    return () => unsubscribe();
  }, []);

  const manualTrigger = useCallback(() => { setShowDashboard(true); }, []);
  const toggleMapBoard = useCallback(() => { setShowMapBoard(true); }, []);
  const closeDashboard = useCallback(() => { setShowDashboard(false); }, []);
  const closeMapBoard = useCallback(() => { setShowMapBoard(false); }, []);
  const toggleFullScreen = useCallback(() => { setIsFullScreen(prev => !prev); }, []);

  // Optimized Chart Data
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
            <FullHeightCard>
              <CardHeader>
                <div className="left-group"><span className="badge">01</span><h3>입고차량 인식</h3></div>
              </CardHeader>
              <ImageArea>
                <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', background: '#f1f5f9'}}>차량 사진 CCTV</div>
                <div className="label">📸 차량사진</div>
              </ImageArea>
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ color: '#475569', marginBottom: '15px' }}>차량 정보</h4>
                <InfoRow><span className="label">차량번호</span><span className="value" style={{fontSize: '1.5rem', color: '#2563eb'}}>12우 1545</span></InfoRow>
                <hr style={{borderColor: '#e2e8f0', margin: '20px 0'}}/>
                <InfoRow><span className="label">공급업체</span><span className="value">(주)퓨처로지스</span></InfoRow>
                <InfoRow><span className="label">도착시간</span><span className="value">12:12</span></InfoRow>
                <InfoRow><span className="label">출차예정</span><span className="value">13:12</span></InfoRow>
                <InfoRow><span className="label">운전자</span><span className="value">김철수 기사님</span></InfoRow>
              </div>
            </FullHeightCard>
          </Column>

          <Column>
            <ExpandableCard
              layout
              data-fullscreen={isFullScreen}
              $isFullScreen={isFullScreen}
              transition={{ layout: { duration: 0.6, type: "spring", stiffness: 80, damping: 20 } }}
            >
              <div style={{ padding: '10px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', zIndex: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{background: streamStatus === 'ok' ? '#10b981' : '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', marginRight:'10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                    {streamStatus === 'ok' ? 'Live' : 'Standby'}
                  </div>
                  <h3 style={{color: '#1e293b', margin: 0, fontSize: '1.1rem', fontWeight: 700}}>자재검수 화면</h3>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <TriggerButton onClick={manualTrigger}>
                    <LuPlay size={12} /> Test
                  </TriggerButton>
                  <TriggerButton onClick={toggleMapBoard}>
                    <MapIcon size={12} /> D동 현황
                  </TriggerButton>
                  <IpInputWrapper>
                    <span className="label">CAM IP</span>
                    <input value={streamHost} onChange={(e) => { setStreamHost(e.target.value.trim()); setStreamStatus("idle"); }} placeholder="192.168.xx.xx" />
                  </IpInputWrapper>
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
                <StreamContainer>
                    {streamStatus === "ok" && streamUrl ? (
                        <StyledIframe src={streamUrl} allow="fullscreen" />
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            {streamStatus === 'checking' ? 'Connecting...' : 'No Signal'}
                        </div>
                    )}

                    <AnimatePresence>
                        {showDashboard && (
                            <AIDashboardModal onClose={closeDashboard} />
                        )}
                    </AnimatePresence>

                    <FullScreenBtn onClick={toggleFullScreen}>
                        {isFullScreen ? <LuMinimize size={20} /> : <LuMaximize size={20} />}
                    </FullScreenBtn>
                </StreamContainer>
              </div>
            </ExpandableCard>
            
            <Card style={{ height: '220px', flexShrink: 0, padding: '15px' }}>
              <CardHeader style={{ marginBottom: '10px' }}>
                <div className="left-group"><span className="badge" style={{backgroundColor: '#6366f1'}}>02</span><h3>통계 및 이력</h3></div>
                <div style={{marginLeft: 'auto', fontSize:'0.75rem', color:'#64748b', display: 'flex', alignItems: 'center', gap: '5px'}}>
                    <span style={{width: 6, height: 6, background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 0 2px #fecaca'}}></span> 집계중
                </div>
              </CardHeader>
              <StatsContainer>
                <div className="chart-area">
                  <ScoreBoard>
                    <div><span className="title">합격률</span><span className="score pass">98.5%</span></div>
                    <div><span className="title">불량률</span><span className="score fail">1.5%</span></div>
                  </ScoreBoard>
                  <div style={{flex: 1, width: '100%', minHeight: 0}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{backgroundColor:'#fff', borderRadius:'8px', fontSize:'12px', padding:'4px 8px'}} />
                          <Bar dataKey="합격" fill="#10b981" barSize={16} radius={[4,4,0,0]} />
                          <Bar dataKey="불량" fill="#f43f5e" barSize={16} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="history-area">
                  <h4>최근 이력</h4>
                  <div className="history-list">
                    <HistoryItem $status="ok"><div><div className="comp">퓨처로지스</div><div className="time">10:30</div></div><div className="status"></div></HistoryItem>
                    <HistoryItem $status="ok"><div><div className="comp">글로벌테크</div><div className="time">10:45</div></div><div className="status"></div></HistoryItem>
                    <HistoryItem $status="fail"><div><div className="comp">에이치물산</div><div className="time">11:00</div></div><div className="status"></div></HistoryItem>
                    <HistoryItem $status="ok"><div><div className="comp">대성산업</div><div className="time">11:15</div></div><div className="status"></div></HistoryItem>
                  </div>
                </div>
              </StatsContainer>
            </Card>
          </Column>
        </DashboardContainer>
      )}

      {/* D동 현황판 (Slide Modal) */}
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