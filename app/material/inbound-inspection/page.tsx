'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// --- Firebase Imports ---
import { initializeApp, FirebaseApp } from "firebase/app";
import { getDatabase, ref, onValue, Database } from "firebase/database";

import {
  LuMaximize,
  LuMinimize,
  LuPlay,
  LuX,
  LuScanLine,
} from "react-icons/lu";

import {
  Barcode,
  Loader2,
  Cpu,
  Save,
  CheckCircle2,
  Activity,
  Box,
  Truck,
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
  MapPin,
  MoreHorizontal
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// ─── [STYLES - 최상단 정의] ─────────────────────────────

const GlobalStyle = createGlobalStyle`
  body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Pretendard', sans-serif; overflow: hidden; color: #1e293b; }
  * { box-sizing: border-box; }
`;

const hideScrollbar = css`
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const fadeIn = keyframes` from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;
const spin = keyframes` to { transform: rotate(360deg); } `;
const rotateLens = keyframes` 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } `;
const pulseRing = keyframes` 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } `;
const blinkCursor = keyframes` 0%, 100% { opacity: 1; } 50% { opacity: 0; } `;
const glareMove = keyframes` 0% { left: -50%; } 100% { left: 150%; } `;

// 1. D동 현황판 (Warehouse Board) Styles
const Backdrop = styled(motion.div)`
    position: fixed; inset: 0; 
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    z-index: 9990; 
`;

const SlidePanel = styled(motion.div)`
    position: fixed; top: 0; right: 0; 
    width: 95vw; max-width: 1800px;
    height: 100vh; 
    z-index: 9991; 
    box-shadow: -20px 0 50px rgba(0,0,0,0.5);
    background: #f8fafc;
`;

const BoardContainer = styled.div`
    width: 100%; height: 100%; background: #f8fafc; display: flex; flex-direction: column;
    
    .board-header {
        height: 60px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; padding: 0 24px;
        .title { display: flex; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: 800; color: #1e293b; }
        .close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; &:hover{ color: #ef4444; } }
    }
    
    .board-body {
        flex: 1; padding: 20px; display: flex; gap: 20px; overflow: hidden;
        
        .left-col {
            width: 340px; display: flex; flex-direction: column; gap: 16px;
            .summary-card {
                background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;
                h3 { margin: 0 0 16px 0; font-size: 0.95rem; display: flex; align-items: center; gap: 8px; }
                .chart-area {
                    display: flex; align-items: center; gap: 16px;
                    .pie-mock { width: 80px; height: 80px; border-radius: 50%; border: 8px solid #f1f5f9; border-top-color: #3b82f6; display: flex; justify-content: center; align-items: center; font-weight: 800; color: #3b82f6; }
                    .legend { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; .dot{ width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 6px;} .blue{background:#3b82f6} .green{background:#10b981} }
                }
            }
            .inv-list-wrapper {
                flex: 1; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; min-height: 0;
                .search-row { 
                    padding: 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; 
                    h3 { font-size: 0.95rem; margin: 0; display: flex; gap: 6px; align-items: center;}
                    .s-box { display: flex; align-items: center; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; width: 140px; input { border: none; background: transparent; width: 100%; outline: none; font-size: 0.8rem; } }
                }
                .list-scroll { 
                    flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px;
                    &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
                    .inv-item {
                        display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;
                        .icon { width: 32px; height: 32px; background: #fff; border-radius: 8px; display: flex; justify-content: center; align-items: center; color: #64748b; }
                        .info { flex: 1; .c { font-size: 0.85rem; font-weight: 600; } .l { font-size: 0.75rem; color: #94a3b8; } }
                        .q { font-weight: 700; color: #3b82f6; font-family: monospace; }
                    }
                }
            }
        }
        
        .map-col {
            flex: 1; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden;
            .map-legend { padding: 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 8px; 
                .badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
                .empty { background: #f1f5f9; color: #94a3b8; } .active { background: #eff6ff; color: #3b82f6; } .full { background: #fef2f2; color: #ef4444; }
            }
            .zone-wrapper {
                flex: 1; padding: 20px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; overflow: hidden;
                .zone-col {
                    display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 0;
                    .z-head {
                        background: #f8fafc; padding: 10px; border-radius: 10px; border: 1px solid #e2e8f0; flex-shrink: 0;
                        .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
                        .id { font-weight: 800; font-size: 1.1rem; color: #1e293b; }
                        .st { font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; &.g{background:#dcfce7; color:#166534} &.o{background:#ffedd5; color:#9a3412} &.r{background:#fee2e2; color:#991b1b} }
                        .bar { height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; margin-top: 8px; .fill { height: 100%; background: #3b82f6; } }
                    }
                    .slot-grid-container {
                        flex: 1; min-height: 0; display: flex; flex-direction: column;
                        .slot-grid {
                            flex: 1; display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            grid-template-rows: repeat(10, 1fr);
                            gap: 6px;
                            .slot {
                                background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
                                display: flex; align-items: center; justify-content: center; position: relative;
                                font-size: 0.8rem; font-weight: 700; color: #cbd5e1;
                                &.on { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
                                .dot { position: absolute; bottom: 10%; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; }
                            }
                        }
                    }
                }
            }
        }
    }
`;

// 2. AI Dashboard (Barcode) Styles
const OverlayContainer = styled(motion.div)`
    position: absolute;
    inset: 10px;
    background: rgba(15, 23, 42, 0.98); /* 배경 불투명도 높임 */
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    z-index: 200;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: flex;
    overflow: hidden;
`;

const CloseButton = styled(motion.button)`
    position: absolute;
    top: 15px; right: 15px;
    width: 28px; height: 28px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 50%;
    color: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 999;
    transition: all 0.2s;
    &:hover { background: #ef4444; border-color: #ef4444; }
`;

const DashboardGrid = styled.div`
    width: 100%; height: 100%;
    display: grid;
    grid-template-columns: 1.6fr 0.8fr;
    min-height: 0; 
`;

const LeftPanel = styled.div`
    padding: 20px;
    display: flex; flex-direction: column; color: white;
    min-height: 0; 
    overflow: hidden;

    .top-list-scroller {
        display: flex; gap: 8px;
        overflow-x: auto;
        padding-bottom: 5px;
        margin-bottom: 10px;
        ${hideScrollbar}

        .list-chip {
            background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            color: #94a3b8; padding: 6px 12px; border-radius: 99px; font-size: 0.75rem;
            cursor: pointer; white-space: nowrap; transition: all 0.2s;
            &.active { background: #3b82f6; color: white; border-color: #3b82f6; font-weight: 600; box-shadow: 0 0 10px rgba(59,130,246,0.3); }
            &:hover:not(.active) { background: rgba(255,255,255,0.1); }
        }
    }
`;

const DetailCardWrapper = styled.div`
    flex: 1;
    position: relative;
    background: rgba(0,0,0,0.2);
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    overflow: hidden;
    min-height: 0;
`;

const ScanningView = styled(motion.div)`
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.4);
    .laser-container {
        position: relative; margin-bottom: 20px;
        .red-laser {
            position: absolute; left: -10%; width: 120%; height: 2px; 
            background: #ef4444; box-shadow: 0 0 20px #ef4444;
        }
    }
    .scan-text {
        font-family: monospace; font-size: 1.2rem; color: #ef4444; 
        font-weight: 700; letter-spacing: 1px;
    }
`;

const DetailContent = styled(motion.div)`
    padding: 20px;
    height: 100%;
    display: flex; flex-direction: column; gap: 15px;
    ${hideScrollbar}

    .header-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 5px;
        .label-group {
            display: flex; flex-direction: column;
            .sub { font-size: 0.75rem; color: #94a3b8; font-weight: 600; letter-spacing: 1px; margin-bottom: 2px;}
            .main { font-size: 1.4rem; font-weight: 800; color: white; letter-spacing: 0.5px; line-height: 1.2; }
        }
        .badge {
            background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid #3b82f6;
            padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700;
        }
    }

    .info-grid {
        display: grid; 
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        .field {
            display: flex; flex-direction: column; gap: 4px;
            background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;
            .label { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
            .val { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .code-font { font-family: monospace; color: #a5b4fc; letter-spacing: -0.5px; font-size: 0.85rem;}
            .highlight { color: #34d399; font-size: 1rem; }
            .unit { font-size: 0.7rem; color: #64748b; font-weight: 500; }
            .status.ok { color: #34d399; } .status.no { color: #f43f5e; }
        }
    }

    .footer-row {
        margin-top: auto;
        .dwell-time {
            display: flex; align-items: center; gap: 10px; 
            background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;
            .lbl { font-size: 0.75rem; color: #94a3b8; white-space: nowrap; font-weight: 600; }
            .bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
            .bar-fill { height: 100%; background: #f59e0b; }
            .time { font-size: 0.9rem; font-weight: 700; color: #fbbf24; }
        }
    }
`;

const PanelHeader = styled.div`
    display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px; flex-shrink: 0;
    .title-row { display: flex; align-items: center; gap: 10px; h2 { margin: 0; font-size: 1.1rem; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.5px; } }
`;

const RightContainer = styled.div`
    display: flex; flex-direction: column; height: 100%; min-height: 0;
    border-left: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.2); 
`;

// [🔥 수정 완료] 가독성 개선, 닫기 버튼 겹침 해결
const StepPanel = styled.div`
    flex: 1.4;
    padding: 20px; 
    border-bottom: 1px solid rgba(255,255,255,0.1); 
    background: rgba(15, 23, 42, 0.95); /* 배경색 더 진하게 */
    backdrop-filter: blur(12px);
    ${hideScrollbar}
    
    min-height: 0;
    display: flex; flex-direction: column;

    .step-header { 
        display: flex; justify-content: space-between; align-items: flex-end;
        margin-bottom: 15px; 
        padding-right: 40px; /* 🔥 닫기 버튼과 겹치지 않도록 여백 확보 */
        
        .left { display: flex; align-items: center; gap: 8px; }
        h3 { margin: 0; font-weight: 800; font-size: 0.9rem; color: #fff; letter-spacing: 0.5px; }
        .percent { font-size: 1.1rem; font-weight: 800; color: #38bdf8; line-height: 1; }
    }
    
    .progress-track { 
        height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; 
        margin-bottom: 20px; 
        overflow: hidden; 
        .bar { height: 100%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8; } 
    }
    
    .steps-list { 
        display: flex; flex-direction: column; gap: 8px; 
        flex: 1; 
        
        .step-row { 
            display: flex; align-items: center; gap: 12px; 
            padding: 10px 12px; 
            border-radius: 8px; 
            color: #cbd5e1; /* 🔥 기본 텍스트 색상 밝게 */
            font-size: 0.85rem; transition: all 0.2s; 
            border: 1px solid transparent;
            
            &.active { 
                background: rgba(56, 189, 248, 0.2); 
                color: #ffffff; /* 🔥 활성화 시 흰색 */
                font-weight: 700;
                border-color: rgba(56, 189, 248, 0.4);
                .indicator { .glow-dot { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; } }
            } 
            &.done { color: #94a3b8; .indicator { background: #10b981; } } 

            .indicator { 
                width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2); 
                display: flex; align-items: center; justify-content: center;
                .glow-dot { width: 100%; height: 100%; border-radius: 50%; }
            }
            .content { flex: 1; display: flex; align-items: center; gap: 8px; }
            .text { flex: 1; }
            .status-icon { width: 16px; display: flex; justify-content: center; .ing { font-size: 9px; font-weight: 800; color: #38bdf8; } }
        } 
    }
`;

const ImagePanel = styled.div`
    height: 160px; /* Fixed smaller height */
    flex-shrink: 0;
    padding: 12px; 
    display: flex; align-items: center; justify-content: center; 
    min-height: 0;

    .img-box { 
        width: 100%; height: 100%; 
        border-radius: 8px; overflow: hidden; position: relative; 
        border: 1px solid rgba(255,255,255,0.1); 
        display: flex;
        justify-content: center;
        align-items: center;
        
        /* 🔥 바코드 이미지로 교체 */
        img { width: 100%; height: 100%; object-fit: contain; opacity: 0.8; } 
        .scan-line { position: absolute; left: 0; width: 100%; height: 2px; background: #10b981; box-shadow: 0 0 15px #10b981; z-index: 10; } 
        .overlay-text { 
            position: absolute; bottom: 6px; right: 6px; font-size: 9px; font-weight: 700; 
            color: rgba(255,255,255,0.9); background: rgba(0,0,0,0.6); 
            border-radius: 4px; padding: 2px 5px; display:flex; align-items:center; gap:3px; 
        } 
    }
`;

// 3. Main Dashboard Styles
const DashboardContainer = styled.div<{ $show: boolean }>` 
  width: 100%; height: calc(100vh - 64px); 
  background-color: #f1f5f9; color: #0f172a; 
  padding: 20px; box-sizing: border-box; 
  display: grid; grid-template-columns: 350px 1fr; gap: 20px; 
  font-family: 'Pretendard', sans-serif; overflow: hidden; 
  animation: ${props => (props.$show ? css`${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none')}; 
  opacity: 0; 
`;

const Column = styled.div` display: flex; flex-direction: column; gap: 20px; height: 100%; min-height: 0; `;
const Card = styled.div` background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; position: relative; `;
const FullHeightCard = styled(Card)` height: 100%; `;
const ExpandableCard = styled(motion.div)<{ $isFullScreen: boolean }>` background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); display: flex; flex-direction: column; position: relative; overflow: hidden; flex: 1; padding: 0; will-change: transform, width, height; ${({ $isFullScreen }) => $isFullScreen && css` position: fixed; top: 0px; left: 0; width: 100vw; height: calc(100vh - 64px); z-index: 999; border-radius: 0; border: none; margin: 0; `} `;

const CardHeader = styled.div` display: flex; align-items: center; margin-bottom: 15px; flex-shrink: 0; justify-content: space-between; .left-group { display: flex; align-items: center; } .badge { background-color: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-right: 10px; } h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; } `;
const ImageArea = styled.div` width: 100%; height: 200px; background-color: #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 20px; position: relative; border: 1px solid #cbd5e1; img { width: 100%; height: 100%; object-fit: cover; } .label { position: absolute; top: 10px; left: 10px; background: rgba(255, 255, 255, 0.9); color: #0f172a; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 10; } `;
const InfoRow = styled.div` display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; span.label { color: #64748b; font-size: 0.9rem; font-weight: 500; } span.value { color: #0f172a; font-weight: 600; font-size: 1rem; } `;
const StreamContainer = styled.div` flex: 1; width: 100%; height: 100%; background: #000; position: relative; overflow: hidden; display: flex; justify-content: center; align-items: center; `;
const StyledIframe = styled.iframe` width: 100%; height: 100%; border: none; display: block; object-fit: cover; position: absolute; inset: 0; z-index: 1; `;
const IpInputWrapper = styled.div` display: flex; align-items: center; gap: 8px; background: #f1f5f9; padding: 4px 12px; border-radius: 20px; border: 1px solid #e2e8f0; input { border: none; background: transparent; font-size: 0.85rem; width: 100px; color: #334155; outline: none; text-align: right; &::placeholder { color: #94a3b8; } } span.label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; } `;
const FullScreenBtn = styled.button` position: absolute; bottom: 20px; right: 20px; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.25); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); z-index: 1000; pointer-events: auto; transition: all 0.2s; &:hover { background: rgba(255, 255, 255, 0.4); transform: scale(1.1); } `;
const TriggerButton = styled.button` background: #3b82f6; color: white; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; transition: all 0.2s ease; &:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); } `;
const StatsContainer = styled.div` display: flex; gap: 15px; height: 100%; min-height: 0; .chart-area { flex: 1.1; display: flex; flex-direction: column; gap: 8px; } .history-area { flex: 0.9; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; h4 { margin: 0 0 8px 0; font-size: 0.8rem; color: #64748b; } .history-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0; } } `;
const ScoreBoard = styled.div` display: flex; gap: 8px; div { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; text-align: center; border: 1px solid #e2e8f0; flex: 1; .title { font-size: 0.7rem; color: #64748b; display: block; } .score { font-size: 0.9rem; font-weight: bold; } .score.pass { color: #059669; } .score.fail { color: #e11d48; } } `;
const HistoryItem = styled.div<HistoryStatusProps>` display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.75rem; color: #334155; &:last-child { border-bottom: none; } .comp { font-weight: 600; } .time { color: #94a3b8; font-size: 0.7rem; } .status { width: 6px; height: 6px; border-radius: 50%; background: ${props => props.status === 'ok' ? '#10b981' : '#f43f5e'}; } `;

// 4. Loading Styles
const NewLoadingScreen = styled.div<{ $isFadingOut: boolean }>` position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999; transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1); opacity: ${props => (props.$isFadingOut ? 0 : 1)}; transform: ${props => (props.$isFadingOut ? 'scale(1.05)' : 'scale(1)')}; pointer-events: ${props => (props.$isFadingOut ? 'none' : 'all')}; .background-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px); background-size: 50px 50px; z-index: 0; } .loader-content { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 30px; } .brand-text { text-align: center; .small { display: block; font-size: 0.85rem; font-weight: 700; letter-spacing: 3px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; } .large { margin: 0; font-size: 2.5rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; .version { font-size: 1rem; color: #3b82f6; vertical-align: super; font-weight: 600; } } } `;
const LensCore = styled.div` width: 120px; height: 120px; position: relative; display: flex; align-items: center; justify-content: center; .outer-ring { position: absolute; inset: 0; border: 2px dashed #cbd5e1; border-radius: 50%; animation: ${rotateLens} 10s linear infinite; } .inner-ring { position: absolute; width: 80%; height: 80%; border: 2px solid #3b82f6; border-top-color: transparent; border-radius: 50%; animation: ${rotateLens} 2s linear infinite reverse; box-shadow: 0 0 15px rgba(59, 130, 246, 0.3); } .core-lens { width: 60%; height: 60%; background: radial-gradient(circle at 30% 30%, #60a5fa, #2563eb); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(37, 99, 235, 0.6); animation: ${pulseRing} 2s infinite; } `;
const TechProgressWrapper = styled.div` width: 320px; display: flex; flex-direction: column; gap: 8px; .bar-bg { width: 100%; height: 6px; background: #e2e8f0; border-radius: 2px; position: relative; overflow: hidden; } .bar-fill { height: 100%; background: #3b82f6; position: relative; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); } .bar-glare { position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); animation: ${glareMove} 1.5s ease-in-out infinite; } .progress-info { display: flex; justify-content: space-between; font-family: monospace; font-size: 0.8rem; color: #475569; font-weight: 600; .log-text { color: #64748b; .cursor { color: #3b82f6; animation: ${blinkCursor} 0.8s infinite; margin-right: 4px; } } .percentage { color: #3b82f6; font-weight: 700; } } `;

// ─── [CONFIG] Firebase Configuration ─────────────────────
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
  if (firebaseConfig.apiKey.length > 10) { 
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
} catch (e) {
  console.warn("Firebase Init Failed:", e);
}

// ─── [CONFIG] System & Constants ────────────────────────
const PORT = 8080;
const ANALYSIS_DURATION = 12000; 

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

// 더미 데이터 생성기
const generateDummyItems = () => {
    const count = Math.floor(Math.random() * 8) + 3;
    const items = [];
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

interface HistoryStatusProps {
  status: 'ok' | 'fail';
}

// ─── [NEW COMPONENT] D동 현황판 ─────────────────────────
const WarehouseBoard = ({ onClose }: { onClose: () => void }) => {
    const [searchTerm, setSearchTerm] = useState("");
    
    // D동 맵 데이터
    const mapData = [
      { id: 'D101', total: 20, used: 4, free: 16, status: '여유', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 4 })) },
      { id: 'D102', total: 20, used: 16, free: 4, status: '혼잡', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 16 })) },
      { id: 'D103', total: 20, used: 20, free: 0, status: '만차', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: true })) },
      { id: 'D104', total: 20, used: 8, free: 12, status: '보통', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 8 })) },
      { id: 'D105', total: 20, used: 0, free: 20, status: '비어있음', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: false })) },
    ];
    // 재고 데이터
    const inventoryData = [
      { code: 'ADC30009358', qty: 708, loc: 'D101' }, { code: 'ADC30014326', qty: 294, loc: 'D102' },
      { code: 'ADC30003801', qty: 204, loc: 'D102' }, { code: 'AGF04075606', qty: 182, loc: 'D103' },
      { code: 'ADC30009359', qty: 150, loc: 'D104' }, { code: 'AGM76970201', qty: 120, loc: 'D101' },
      { code: 'AGM76970202', qty: 100, loc: 'D105' }, { code: 'AGM76970203', qty: 50, loc: 'D101' },
      { code: 'AGM76970204', qty: 30, loc: 'D102' }, { code: 'AGM76970205', qty: 10, loc: 'D103' },
      { code: 'AGM76970206', qty: 120, loc: 'D104' }, { code: 'AGM76970207', qty: 100, loc: 'D105' },
    ];
    const filteredInventory = inventoryData.filter(item => 
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.loc.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                <div key={i} className="inv-item">
                                    <div className="icon"><Layers size={14}/></div>
                                    <div className="info"><div className="c">{item.code}</div><div className="l">{item.loc}</div></div>
                                    <div className="q">{item.qty}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="map-col">
                    <div className="map-legend">
                        <span className="badge empty">여유</span><span className="badge active">사용</span><span className="badge full">만차</span>
                    </div>
                    <div className="zone-wrapper">
                        {mapData.map(zone => (
                            <div key={zone.id} className="zone-col">
                                <div className="z-head">
                                    <div className="top"><span className="id">{zone.id}</span> <span className={`st ${zone.status==='만차'?'r':zone.status==='혼잡'?'o':'g'}`}>{zone.status}</span></div>
                                    <div className="bar"><div className="fill" style={{width: `${(zone.used/zone.total)*100}%`}}/></div>
                                </div>
                                <div className="slot-grid-container">
                                    <div className="slot-grid">
                                        {zone.slots.map((s:any) => (
                                            <div key={s.no} className={`slot ${s.active?'on':''}`}>
                                                {s.no} {s.active && <div className="dot"/>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </BoardContainer>
    )
}

// ─── [Component] AI Dashboard Overlay ────────────────────
function AIDashboardModal({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState(1);
    const [progress, setProgress] = useState(0);
    const [items, setItems] = useState<ItemData[]>([]);
    const [selectedId, setSelectedId] = useState<number>(0);
    const [isScanning, setIsScanning] = useState(true); 

    useEffect(() => {
        const generated = generateDummyItems();
        setItems(generated);
        const stepInterval = ANALYSIS_DURATION / PROCESS_STEPS.length;
        const timer = setInterval(() => {
            setProgress(old => (old >= 100 ? 100 : old + (100 / (ANALYSIS_DURATION / 100))));
        }, 100);
        const stepTimer = setInterval(() => {
            setStep(prev => (prev < PROCESS_STEPS.length ? prev + 1 : prev));
        }, stepInterval);
        const scanTimeout = setTimeout(() => { setIsScanning(false); }, 1500);
        return () => { clearInterval(timer); clearInterval(stepTimer); clearTimeout(scanTimeout); };
    }, []);

    const handleChipClick = (id: number) => {
        setSelectedId(id);
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 600);
    };
    const activeItem = items.find(i => i.id === selectedId) || items[0];

    return (
        <OverlayContainer
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <CloseButton onClick={onClose}><LuX size={18} /></CloseButton>
            <DashboardGrid>
                <LeftPanel>
                    <PanelHeader>
                        <div className="title-row"><Barcode size={22} color="#3b82f6" /><h2>Smart Scanner Data</h2></div>
                        <div className="top-list-scroller">
                            {items.map((item) => (
                                <button key={item.id} className={`list-chip ${selectedId === item.id ? 'active' : ''}`} onClick={() => handleChipClick(item.id)}>
                                    <span className="code">{item.code}</span>
                                </button>
                            ))}
                        </div>
                    </PanelHeader>
                    <DetailCardWrapper>
                        <AnimatePresence mode="wait">
                            {isScanning ? (
                                <ScanningView key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <div className="laser-container"><ScanBarcode size={80} color="rgba(255,255,255,0.2)" /><motion.div className="red-laser" animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}/></div>
                                    <div className="scan-text">Reading Data...</div>
                                </ScanningView>
                            ) : (
                                <DetailContent key="content" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                    <div className="header-row">
                                        <div className="label-group"><span className="sub">PROJECT NAME</span><span className="main">{activeItem?.project}</span></div>
                                        <div className="badge">{activeItem?.type}</div>
                                    </div>
                                    <div className="info-grid">
                                        <div className="field"><span className="label"><Box size={12}/> 품목 코드</span><span className="val code-font">{activeItem?.code}</span></div>
                                        <div className="field"><span className="label"><Layers size={12}/> 품목명</span><span className="val">{activeItem?.name}</span></div>
                                        <div className="field"><span className="label"><Truck size={12}/> 거래처명</span><span className="val">{activeItem?.vendor}</span></div>
                                        <div className="field"><span className="label"><Calendar size={12}/> 입고 일자</span><span className="val">{activeItem?.date}</span></div>
                                        <div className="field"><span className="label"><PackageCheck size={12}/> 총 입고수량</span><span className="val highlight">{activeItem?.qty.toLocaleString()} <span className="unit">EA</span></span></div>
                                        <div className="field"><span className="label"><CheckCircle2 size={12}/> 품질 확정</span><span className={`val status ${activeItem?.quality === 'Y' ? 'ok' : 'no'}`}>{activeItem?.quality === 'Y' ? 'Approved' : 'Pending'}</span></div>
                                    </div>
                                    <div className="footer-row">
                                        <div className="dwell-time"><span className="lbl">차량 체류시간</span><div className="bar-bg"><div className="bar-fill" style={{width: '60%'}}></div></div><span className="time">{activeItem?.dwellTime}</span></div>
                                    </div>
                                </DetailContent>
                            )}
                        </AnimatePresence>
                    </DetailCardWrapper>
                </LeftPanel>
                <RightContainer>
                    <StepPanel>
                        {/* 🔥 [수정됨] 우측 여백 추가, 텍스트 가독성 개선 */}
                        <div className="step-header"><div className="left"><ListTodo size={16} color="#60a5fa" /><h3>PROCESSING STATUS</h3></div><span className="percent">{Math.round(progress)}%</span></div>
                        <div className="progress-track"><motion.div className="bar" style={{ width: `${progress}%` }} /></div>
                        <div className="steps-list">
                            {PROCESS_STEPS.map((s) => (
                                <div key={s.id} className={`step-row ${step >= s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
                                    <div className="indicator">{
                                        step === s.id && <motion.div className="glow-dot" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
                                    }</div>
                                    <div className="content"><span className="text">{s.label}</span>{step === s.id && <Loader2 className="spin" size={12} />}</div>
                                    <div className="status-icon">{step > s.id ? <CheckCircle2 size={14} color="#34d399" /> : (step === s.id ? <span className="ing">RUN</span> : null)}</div>
                                </div>
                            ))}
                        </div>
                    </StepPanel>
                    <ImagePanel>
                        <div className="img-box">
                            <img src="/images/barcode.png" alt="Captured" />
                            <motion.div className="scan-line" animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}/>
                            <div className="overlay-text"><LuScanLine size={12}/> CAPTURED</div>
                        </div>
                    </ImagePanel>
                </RightContainer>
            </DashboardGrid>
        </OverlayContainer>
    );
}

// ─── [Main] Dashboard Component ──────────────────────────

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

  const manualTrigger = () => { setShowDashboard(true); };

  return (
    <LayoutGroup>
      {(loading || isFadingOut) && (
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
      )}

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
                  <TriggerButton onClick={() => setShowMapBoard(true)}>
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
                            <AIDashboardModal onClose={() => setShowDashboard(false)} />
                        )}
                    </AnimatePresence>

                    <FullScreenBtn onClick={() => setIsFullScreen(!isFullScreen)}>
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
                      <BarChart data={[{ name: 'A사', 합격: 85, 불량: 15 }, { name: 'B사', 합격: 90, 불량: 10 }, { name: 'C사', 합격: 98, 불량: 2 }]}>
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
                    <HistoryItem status="ok"><div><div className="comp">퓨처로지스</div><div className="time">10:30</div></div><div className="status"></div></HistoryItem>
                    <HistoryItem status="ok"><div><div className="comp">글로벌테크</div><div className="time">10:45</div></div><div className="status"></div></HistoryItem>
                    <HistoryItem status="fail"><div><div className="comp">에이치물산</div><div className="time">11:00</div></div><div className="status"></div></HistoryItem>
                    <HistoryItem status="ok"><div><div className="comp">대성산업</div><div className="time">11:15</div></div><div className="status"></div></HistoryItem>
                  </div>
                </div>
              </StatsContainer>
            </Card>
          </Column>
        </DashboardContainer>
      )}

      {/* 🔥 [추가] D동 현황판 (Slide Modal) */}
      <AnimatePresence>
        {showMapBoard && (
            <>
                <Backdrop
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMapBoard(false)}
                />
                <SlidePanel
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <WarehouseBoard onClose={() => setShowMapBoard(false)} />
                </SlidePanel>
            </>
        )}
      </AnimatePresence>

    </LayoutGroup>
  );
}