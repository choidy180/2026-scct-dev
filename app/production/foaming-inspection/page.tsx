"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { 
  FiCheck, 
  FiAlertTriangle, 
  FiActivity, 
  FiThermometer, 
  FiClock, 
  FiBox,
  FiRefreshCw,
  FiX,
  FiAlertOctagon,
  FiLayers,    
  FiGrid       
} from 'react-icons/fi';

// --------------------------------------------------------------------------
// 1. Types & Constants
// --------------------------------------------------------------------------

const COMMON_FONT = "'Pretendard', sans-serif";

interface GaugeData {
  id: string;
  label: string;
  unit: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  value: number;
}

interface AlertItemData {
  id: string;
  type: 'error' | 'warning';
  title: string;
  desc: string;
  time: string;
  value?: string;
}

// API Response Types
interface ApiDataItem {
  "time_diff": number;
  "Serial No.": string;
  "Model No.": string;
  "지그번호": string;
  "대차번호": string;
  "R액 압력(kg/㎥)": string;
  "R액 탱크온도(℃)": string;
  "P액 헤드온도(℃)": string;
  "발포시간(초)": string;
  "가조립무게(g)": string;
  [key: string]: any; 
}

interface ApiLimitItem {
  name: string;
  min: string;
  max: string;
}

interface ApiResponse {
  success?: boolean;
  data: ApiDataItem[];
  DX_LIMIT_LIST: ApiLimitItem[];
}

const METRIC_CONFIG = [
  { key: 'R액 압력(kg/㎥)', label: 'R액 압력', unit: 'kg/m³', icon: <FiActivity /> },
  { key: 'R액 탱크온도(℃)', label: 'R액 탱크온도', unit: '°C', icon: <FiThermometer /> },
  { key: 'P액 헤드온도(℃)', label: 'P액 헤드온도', unit: '°C', icon: <FiThermometer /> },
  { key: '발포시간(초)', label: '발포시간', unit: '초', icon: <FiClock /> },
  { key: '가조립무게(g)', label: '가조립무게', unit: 'g', icon: <FiBox /> },
];

// --------------------------------------------------------------------------
// 2. Dummy Data (Fallback)
// --------------------------------------------------------------------------
const MOCK_API_RESPONSE: ApiResponse = {
  success: true,
  data: [
    { "time_diff": -31759, "Serial No.": "WO2601140002200000", "Model No.": "ADC30021006", "지그번호": "DJ24R2G90005", "대차번호": "1", "R액 압력(kg/㎥)": "127.2", "R액 탱크온도(℃)": "19.5", "P액 헤드온도(℃)": "27.3", "발포시간(초)": "0.76", "가조립무게(g)": "7095" },
    { "time_diff": -31779, "Serial No.": "WO2601140001800000", "Model No.": "ADC30008834", "지그번호": "DJ20MRH90013", "대차번호": "2", "R액 압력(kg/㎥)": "125.6", "R액 탱크온도(℃)": "19.4", "P액 헤드온도(℃)": "27.3", "발포시간(초)": "1.62", "가조립무게(g)": "2535" },
    { "time_diff": -31800, "Serial No.": "WO2601140001800000", "Model No.": "ADC30008834", "지그번호": "DJ20MRH90008", "대차번호": "3", "R액 압력(kg/㎥)": "127.0", "R액 탱크온도(℃)": "19.3", "P액 헤드온도(℃)": "27.4", "발포시간(초)": "1.63", "가조립무게(g)": "1125" },
    { "time_diff": -31820, "Serial No.": "WO2601140001800000", "Model No.": "ADC30008834", "지그번호": "DJ20MRH90006", "대차번호": "4", "R액 압력(kg/㎥)": "126.4", "R액 탱크온도(℃)": "19.2", "P액 헤드온도(℃)": "27.3", "발포시간(초)": "1.63", "가조립무게(g)": "12165" },
    { "time_diff": -31839, "Serial No.": "WO2601140001800000", "Model No.": "ADC30008834", "지그번호": "DJ24R2G90004", "대차번호": "5", "R액 압력(kg/㎥)": "127.6", "R액 탱크온도(℃)": "19.2", "P액 헤드온도(℃)": "27.5", "발포시간(초)": "0.77", "가조립무게(g)": "3765" },
    { "time_diff": -31859, "Serial No.": "WO2601140001800000", "Model No.": "ADC30008834", "지그번호": "DJ20MRH90005", "대차번호": "6", "R액 압력(kg/㎥)": "128.0", "R액 탱크온도(℃)": "19.1", "P액 헤드온도(℃)": "27.5", "발포시간(초)": "1.63", "가조립무게(g)": "4945" },
    { "time_diff": -31878, "Serial No.": "WO2601140002100000", "Model No.": "ADC30008832", "지그번호": "DJ20M3H90004", "대차번호": "7", "R액 압력(kg/㎥)": "128.0", "R액 탱크온도(℃)": "19.1", "P액 헤드온도(℃)": "27.4", "발포시간(초)": "0.76", "가조립무게(g)": "4945" },
  ],
  "DX_LIMIT_LIST": [
    { "name": "R액 압력(kg/㎥)", "min": "150", "max": "110" },
    { "name": "R액 탱크온도(℃)", "min": "23", "max": "13" },
    { "name": "P액 헤드온도(℃)", "min": "28", "max": "24" },
    { "name": "발포시간(초)", "min": "0.76", "max": "1.63" },
    { "name": "가조립무게(g)", "min": "1125", "max": "7095" }
  ]
};

// --------------------------------------------------------------------------
// 3. Styled Components & Keyframes
// --------------------------------------------------------------------------

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideInRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const dangerPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

const PageContainer = styled.div`
  background-color: #f5f7fa;
  width: 100vw;
  height: calc(100vh - 64px); 
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #111;
  padding-top: 12px; 
  position: relative;
  font-family: ${COMMON_FONT};
  box-sizing: border-box;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: calc(100% - 48px);
  height: calc(100% - 24px);
  margin: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-family: ${COMMON_FONT};
`;

// [수정됨] 헤더 영역을 컬럼(세로) 배치로 변경하여 버튼 영역 확보
const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 16px;
  gap: 12px; 
`;

const HeaderTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 48px;
`;

const HeaderTitleArea = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderClockArea = styled.div`
  display: flex;
  align-items: center;
`;

const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px; /* 스크롤바 공간 살짝 확보 */
  
  /* 스크롤바 숨김 (깔끔한 UI) */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

// [수정됨] 직관적이고 산뜻한 버튼 디자인 + 에러 상태 스타일 추가
const TabButton = styled.button<{ $isActive: boolean; $hasError: boolean }>`
  border: ${props => props.$hasError ? '2px solid #ef4444' : '1px solid #e2e8f0'};
  outline: none;
  background: ${props => 
    props.$isActive 
      ? (props.$hasError ? '#ef4444' : '#1e293b') 
      : (props.$hasError ? '#fef2f2' : '#fff')
  };
  color: ${props => 
    props.$isActive 
      ? '#fff' 
      : (props.$hasError ? '#ef4444' : '#64748b')
  };
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0; /* 버튼이 줄어들지 않도록 설정 */
  min-width: 60px; /* 최소 너비 확보 */
  justify-content: center;
  
  /* 그림자 효과로 깊이감 표현 (isActive일 때 다르게) */
  box-shadow: ${props => props.$isActive 
    ? 'inset 0 2px 4px rgba(0,0,0,0.1)' 
    : '0 2px 4px rgba(0,0,0,0.03)'};
  
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${COMMON_FONT};

  /* [수정됨] Y축 이동 이벤트 제거하고 색상/그림자로만 인터렉션 */
  &:hover {
    background: ${props => 
      props.$isActive 
        ? (props.$hasError ? '#dc2626' : '#0f172a') 
        : (props.$hasError ? '#fee2e2' : '#f1f5f9')
    };
  }
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: ${COMMON_FONT};

  .proc-badge {
    font-size: 14px;
    background: #eff6ff;
    color: #3b82f6;
    padding: 4px 10px;
    border-radius: 8px;
    vertical-align: middle;
  }
`;

const CurrentTime = styled.div`
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 8px 16px;
  border-radius: 99px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  font-family: 'Pretendard';

  &::before {
    content: '';
    display: block;
    width: 6px;
    height: 6px;
    background-color: #10b981;
    border-radius: 50%;
    animation: ${blink} 1.5s infinite ease-in-out;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 20% 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0; 
  padding-bottom: 0px;

  @media (max-width: 1400px) {
    grid-template-columns: 280px 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
`;

const RightColumn = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 20px 28px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid #f1f5f9;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  font-family: 'Pretendard';
`;

const DateLabel = styled.span`
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  padding: 6px 12px;
  border-radius: 6px;
  font-family: ${COMMON_FONT};
  svg { font-size: 14px; color: #94a3b8; }
`;

const MetricsList = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  flex: 1;
  width: 100%;
  gap: 8px;
  padding-top: 12px;
  overflow: hidden;
`;

const CardBase = styled.div<{ $status: 'good' | 'error', $clickable?: boolean }>`
  background: ${props => props.$status === 'good' ? 'rgb(59 255 190 / 5%)' : 'rgb(255 101 101 / 5%)'};
  border-radius: 20px;
  padding: 20px;
  flex: 1; 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 2px solid ${props => props.$status === 'good' ? '#10b981' : '#ef4444'};
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  
  &:hover {
    transform: ${props => props.$clickable ? 'translateY(-4px)' : 'none'};
    box-shadow: ${props => props.$clickable ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'};
  }
`;

const CardHeader = styled.div`
  width: 100%;
  text-align: left;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  color: #334155;
  z-index: 1;
  font-family: ${COMMON_FONT};
`;

const StatusCircle = styled.div<{ $status: 'good' | 'error' }>`
  width: 10vmin;
  height: 10vmin;
  min-width: 80px; min-height: 80px;
  max-width: 120px; max-height: 120px;
  border-radius: 50%;
  background: ${props => props.$status === 'good' ? '#10b981' : '#ef4444'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 20px ${props => props.$status === 'good' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  z-index: 1;
`;

const StatusText = styled.div`
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  z-index: 1;
  font-family: ${COMMON_FONT};
`;

const StatusBadge = styled.div<{ $status: 'good' | 'error' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  z-index: 1;
  font-family: ${COMMON_FONT};
  ${props => props.$status === 'good' ? css`background-color: #D2F6EA; color: #01A871;` : css`background-color: #FFDDDD; color: #dc2626;`}
`;

const LegendContainer = styled.div`
  width: 100%;
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  justify-content: center;
  gap: 12px;
  z-index: 1;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  font-family: ${COMMON_FONT};
  &::before {
    content: '';
    display: block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background-color: ${props => props.color};
  }
`;

const RowContainer = styled.div<{ $isError?: boolean }>`
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-radius: 16px;
  position: relative;
  flex: 1;
  min-height: 54px;
  ${props => props.$isError ? css`background: #FEF2F2; border: 2px solid #FCA5A5;` : css`background: #f1f5f9; border: 2px solid transparent; &:hover { background-color: #f8fafc; border-color: #e2e8f0; }`}
`;

const MetricInfo = styled.div`
  width: 240px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
`;

const IconBox = styled.div`
  width: 40px; height: 40px;
  background-color: #fff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 18px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const MetricLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricName = styled.span`
  font-weight: 700;
  font-size: 18px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: ${COMMON_FONT};
`;

const MetricUnit = styled.span`
  font-size: 13px;
  color: #757d88;
  font-weight: 400;
  font-family: ${COMMON_FONT};
`;

const GaugeColumn = styled.div`
  flex: 1;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const TrackArea = styled.div`
  position: relative;
  width: 100%; height: 10px;
  margin-top: 10px;
`;

const GaugeTrack = styled.div<{ $isError?: boolean }>`
  width: 100%; height: 100%;
  border-radius: 99px;
  background: ${props => props.$isError ? '#e2e8f0' : 'linear-gradient(90deg, #3498db 0%, #2ecc71 40%, #fff200 70%, #fd79a8 100%)'};
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%);
    background-size: 200% 100%;
    animation: ${shimmer} 3s infinite linear;
    display: ${props => props.$isError ? 'none' : 'block'};
  }
`;

const GaugeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 14px;
  color: #717983;
  font-weight: 500;
  width: 100%;
  font-family: ${COMMON_FONT};
`;

const GaugeMarker = styled.div<{ $percent: number, $isError?: boolean }>`
  position: absolute;
  top: 50%;
  left: ${props => props.$percent}%;
  width: 0; height: 0; z-index: 10;
  transition: left 1s cubic-bezier(0.4, 0, 0.2, 1); 

  .value-text {
    position: absolute;
    bottom: 8px; left: 50%;
    transform: translateX(-50%);
    font-size: 18px; font-weight: 700;
    color: ${props => props.$isError ? '#ef4444' : '#0f172a'};
    white-space: nowrap;
    text-align: center;
    font-family: ${COMMON_FONT};
  }
  .handle {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 18px; height: 10px;
    background: ${props => props.$isError ? '#ef4444' : '#fff'};
    border: 2px solid ${props => props.$isError ? '#b91c1c' : '#334155'};
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    box-sizing: border-box;
  }
`;

const DangerPopup = styled.div`
  position: absolute;
  left: 260px; top: -15px; z-index: 50;
  background: #ef4444; color: white;
  padding: 10px 16px; border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.6);
  display: flex; align-items: center; gap: 16px;
  animation: ${dangerPulse} 2s infinite;

  &::after {
    content: ''; position: absolute;
    bottom: -6px; left: 20px;
    width: 12px; height: 12px;
    background: #ef4444; transform: rotate(45deg);
  }
  .icon-area { font-size: 24px; display: flex; align-items: center; }
  .text-area { display: flex; flex-direction: column; gap: 2px; }
  .warning-title { font-size: 13px; font-weight: 800; color: #fee2e2; text-transform: uppercase; font-family: ${COMMON_FONT}; }
  .warning-msg { font-size: 14px; font-weight: 700; white-space: nowrap; font-family: ${COMMON_FONT}; }
  .action-btn { background: white; color: #ef4444; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-family: ${COMMON_FONT}; &:hover { background: #fff1f2; } }
`;

const ValueBox = styled.div<{ $isError?: boolean }>`
  width: 100px; height: 44px;
  background-color: ${props => props.$isError ? '#ef4444' : '#10b981'};
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 16px; font-weight: 700;
  box-shadow: 0 4px 6px -1px ${props => props.$isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'};
  flex-shrink: 0;
  font-family: ${COMMON_FONT};
`;

const NotificationContainer = styled.div`
  position: absolute;
  top: 20px; right: 20px;
  width: 400px; z-index: 9999;
  display: flex; flex-direction: column; gap: 12px;
  pointer-events: none; 
  font-family: ${COMMON_FONT};
`;

const SummaryBanner = styled.div`
  pointer-events: auto;
  background-color: rgba(239, 68, 68, 0.95);
  backdrop-filter: blur(4px);
  color: white; padding: 16px 20px; border-radius: 12px;
  display: flex; flex-direction: column;
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
  animation: ${slideInRight} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  
  .header { display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 4px; }
  .header-left { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; }
  .close-all-btn { cursor: pointer; color: white; opacity: 0.9; transition: all 0.2s; &:hover { opacity: 1; transform: scale(1.2); } }
  .sub-text { font-size: 13px; opacity: 0.9; padding-left: 28px; }
`;

const AlertCardStyle = styled.div<{ $type: 'error' | 'warning' }>`
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef4444' : '#f59e0b'};
  display: flex; flex-direction: column;
  animation: ${slideInRight} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  transition: transform 0.2s;
  &:hover { transform: translateX(-4px); }

  .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .title-group { display: flex; align-items: center; gap: 8px; }
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; color: white; background-color: ${props => props.$type === 'error' ? '#ef4444' : '#f59e0b'}; }
  .title { font-size: 14px; font-weight: 700; color: #1e293b; font-family: ${COMMON_FONT}; }
  .right-side { display: flex; align-items: center; gap: 12px; }
  .time { font-size: 14px; color: #94a3b8; font-family: ${COMMON_FONT}; }
  .close-item-btn { cursor: pointer; color: #cbd5e1; transition: all 0.2s; &:hover { color: #64748b; transform: scale(1.1); } }
  .desc { font-size: 13px; color: #475569; line-height: 1.5; white-space: pre-wrap; font-family: ${COMMON_FONT}; }
  .value-highlight { display: block; margin-top: 4px; font-weight: 700; color: #0f172a; font-family: ${COMMON_FONT}; }
`;

// --------------------------------------------------------------------------
// 4. Sub-Components
// --------------------------------------------------------------------------

const LiveClock = memo(() => {
  const [time, setTime] = useState<string>('');
  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  if (!time) return <CurrentTime>Loading...</CurrentTime>;
  return <CurrentTime>{time}</CurrentTime>;
});
LiveClock.displayName = 'LiveClock';

const StatusCard = memo(({ 
  type, title, mainText, subText, onClick
}: { 
  type: 'good' | 'error', title: string, mainText: string, subText: string, onClick?: () => void
}) => (
  <CardBase $status={type} onClick={onClick} $clickable={!!onClick}>
    <CardHeader>{title}</CardHeader>
    <StatusCircle $status={type}>
      {type === 'good' ? <FiCheck /> : <FiAlertTriangle />}
    </StatusCircle>
    <StatusText>{mainText}</StatusText>
    <StatusBadge $status={type}>
      {type === 'good' ? <FiCheck size={14} /> : <FiAlertTriangle size={14} />}
      {subText}
    </StatusBadge>
    <LegendContainer>
      <LegendItem color="#10b981">{type === 'good' ? '양호' : '없음'}</LegendItem>
      <LegendItem color="#f59e0b">{type === 'good' ? '주의' : '1건 이상'}</LegendItem>
      <LegendItem color="#ef4444">{type === 'good' ? '불량' : '1건 이상'}</LegendItem>
    </LegendContainer>
  </CardBase>
));
StatusCard.displayName = 'StatusCard';

const MetricRow = memo(({ data }: { data: GaugeData }) => {
  let min = data.min;
  let max = data.max;
  
  if (min > max) { [min, max] = [max, min]; }
  
  const range = max - min;
  let percent = 0;
  
  if (range > 0) {
    percent = ((data.value - min) / range) * 100;
  } else {
    percent = 50;
  }

  const isSpecOut = data.value < min || data.value > max;

  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;

  return (
    <RowContainer $isError={isSpecOut}>
      {isSpecOut && (
        <DangerPopup>
          <div className="icon-area"><FiAlertOctagon /></div>
          <div className="text-area">
            <span className="warning-title">CRITICAL WARNING</span>
            <span className="warning-msg">현재값 {data.value} (정상 {min}~{max})</span>
          </div>
          <div className="action-btn">조치완료</div>
        </DangerPopup>
      )}

      <MetricInfo>
        <IconBox>{data.icon}</IconBox>
        <MetricLabelGroup>
          <MetricName>{data.label} <MetricUnit>({data.unit})</MetricUnit></MetricName>
        </MetricLabelGroup>
      </MetricInfo>

      <GaugeColumn>
        <TrackArea>
          <GaugeMarker $percent={percent} $isError={isSpecOut}>
            <span className="value-text">{data.value}</span>
            <div className="handle" />
          </GaugeMarker>
          <GaugeTrack $isError={isSpecOut} />
        </TrackArea>
        <GaugeLabels>
          <span>{min}</span>
          <span>{max}</span>
        </GaugeLabels>
      </GaugeColumn>

      <ValueBox $isError={isSpecOut}>{data.value}</ValueBox>
    </RowContainer>
  );
});
MetricRow.displayName = 'MetricRow';

interface NotificationSystemProps {
  isOpen: boolean;
  onCloseAll: () => void;
  onCloseItem: (id: string) => void;
  alerts: AlertItemData[];
  hiddenAlertIds: string[];
}

const NotificationSystem = memo(({ isOpen, onCloseAll, onCloseItem, alerts, hiddenAlertIds }: NotificationSystemProps) => {
  const visibleAlerts = useMemo(() => 
    alerts.filter(a => !hiddenAlertIds.includes(a.id)), 
    [alerts, hiddenAlertIds]
  );

  if (!isOpen || visibleAlerts.length === 0) return null;

  return (
    <NotificationContainer>
      <SummaryBanner>
        <div className="header">
          <div className="header-left">
            <FiAlertTriangle size={20} /> WARNING - 특이사항 발생
          </div>
          <FiX className="close-all-btn" size={24} onClick={onCloseAll} />
        </div>
        <div className="sub-text">총 {visibleAlerts.length}건의 알림이 있습니다</div>
      </SummaryBanner>
      {visibleAlerts.map(alert => (
        <AlertCardStyle key={alert.id} $type={alert.type}>
          <div className="top-row">
            <div className="title-group">
              <div className="badge">{alert.type === 'error' ? '긴급' : '주의'}</div>
              <div className="title">{alert.title}</div>
            </div>
            <div className="right-side">
              <span className="time">{alert.time}</span>
              <FiX className="close-item-btn" size={18} onClick={() => onCloseItem(alert.id)} />
            </div>
          </div>
          <div className="desc">
            {alert.desc}
            {alert.value && <span className="value-highlight">{alert.value}</span>}
          </div>
        </AlertCardStyle>
      ))}
    </NotificationContainer>
  );
});
NotificationSystem.displayName = 'NotificationSystem';

// --------------------------------------------------------------------------
// 5. Main Page
// --------------------------------------------------------------------------

export default function ProcessMonitorPage() {
  const [cartList, setCartList] = useState<ApiDataItem[]>([]);
  const [selectedCartNo, setSelectedCartNo] = useState<string>('');
  const [metricsData, setMetricsData] = useState<GaugeData[]>([]);
  const [alerts, setAlerts] = useState<AlertItemData[]>([]);
  const [hiddenAlertIds, setHiddenAlertIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [apiLimits, setApiLimits] = useState<Record<string, {min: number, max: number}>>({});

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://1.254.24.170:24828/api/DX_API000022');
        if (!res.ok) throw new Error('API Failed');
        const json: ApiResponse = await res.json();
        processApiResponse(json);
      } catch (err) {
        console.warn('API Fetch failed, using Dummy Data', err);
        processApiResponse(MOCK_API_RESPONSE);
      }
    };
    fetchData();
  }, []);

  // 2. Process API Response
  const processApiResponse = (json: ApiResponse) => {
    const limitMap: Record<string, {min: number, max: number}> = {};
    if (json.DX_LIMIT_LIST) {
      json.DX_LIMIT_LIST.forEach(item => {
        let min = parseFloat(item.min);
        let max = parseFloat(item.max);
        if (isNaN(min)) min = 0;
        if (isNaN(max)) max = 100;
        limitMap[item.name] = { min, max };
      });
    }
    setApiLimits(limitMap);

    if (json.data && json.data.length > 0) {
      setCartList(json.data);
      if (!selectedCartNo) {
        setSelectedCartNo(json.data[0]['대차번호']);
        updateMetricsForCart(json.data[0], limitMap);
      }
    }
  };

  // 3. Update Metrics
  const updateMetricsForCart = useCallback((cartData: ApiDataItem, limits: Record<string, {min: number, max: number}>) => {
    const newMetrics: GaugeData[] = [];
    const newAlerts: AlertItemData[] = [];
    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });

    METRIC_CONFIG.forEach((config, index) => {
      const valStr = cartData[config.key];
      const val = parseFloat(valStr);
      
      let min = 0, max = 100;
      if (limits[config.key]) {
        min = limits[config.key].min;
        max = limits[config.key].max;
      }
      if (min > max) { [min, max] = [max, min]; }

      if (!isNaN(val)) {
        newMetrics.push({
          id: `m-${index}`,
          label: config.label,
          unit: config.unit,
          icon: config.icon,
          min,
          max,
          value: val
        });

        if (val < min || val > max) {
          newAlerts.push({
            id: `alert-${index}`,
            type: 'error',
            title: 'Spec Out 발생',
            desc: `${config.label}이(가) 관리 범위(${min}~${max}${config.unit})를 벗어났습니다.`,
            value: `현재값: ${val} ${config.unit}`,
            time: nowStr
          });
        }
      }
    });

    setMetricsData(newMetrics);
    setAlerts(newAlerts);
  }, []);

  const handleCartChange = (cartNo: string) => {
    setSelectedCartNo(cartNo);
    const cartData = cartList.find(c => c['대차번호'] === cartNo);
    if (cartData) {
      updateMetricsForCart(cartData, apiLimits);
      setHiddenAlertIds([]); 
    }
  };

  // [New Helper] Helper to check if a specific cart has ANY error
  const checkCartError = useCallback((item: ApiDataItem) => {
    return METRIC_CONFIG.some(config => {
      const val = parseFloat(item[config.key]);
      if (isNaN(val)) return false;
      
      let limit = apiLimits[config.key];
      if (!limit) return false;
      
      let { min, max } = limit;
      if (min > max) { [min, max] = [max, min]; }
      
      return val < min || val > max;
    });
  }, [apiLimits]);

  const handleCloseItem = useCallback((id: string) => {
    setHiddenAlertIds(prev => [...prev, id]);
  }, []);

  const handleCloseAll = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    setHiddenAlertIds([]);
    setShowModal(true);
  }, []);

  const hasCriticalError = useMemo(() => alerts.some(a => a.type === 'error'), [alerts]);
  
  return (
    <>
      <PageContainer>
        <NotificationSystem 
          isOpen={showModal || alerts.length > 0} 
          onCloseAll={handleCloseAll}
          onCloseItem={handleCloseItem}
          alerts={alerts}
          hiddenAlertIds={hiddenAlertIds}
        />

        <ContentWrapper>
          <HeaderContainer>
            {/* 상단: 타이틀 + 시계 */}
            <HeaderTopRow>
              <HeaderTitleArea>
                <PageTitle>
                  설비이상 징후 탐지 AI
                  <span style={{ marginLeft: '12px', fontSize: '18px', color: '#94a3b8' }}>|</span>
                  <span className="proc-badge">GR2 발포 공정</span>
                </PageTitle>
              </HeaderTitleArea>
              <HeaderClockArea>
                <LiveClock />
              </HeaderClockArea>
            </HeaderTopRow>

            {/* 하단: 버튼 리스트 (Full Width, Horizontal Scroll) */}
            <ButtonRow>
              {cartList.map((item) => {
                const cNo = item['대차번호'];
                // 대차에 에러가 있는지 미리 검사
                const hasError = checkCartError(item);
                
                return (
                  <TabButton 
                    key={cNo} 
                    $isActive={selectedCartNo === cNo}
                    $hasError={hasError}
                    onClick={() => handleCartChange(cNo)}
                  >
                    {selectedCartNo === cNo ? <FiLayers /> : <FiGrid />}
                    {hasError ? <FiAlertTriangle size={12}/> : null}
                    대차 {cNo}
                  </TabButton>
                );
              })}
            </ButtonRow>
          </HeaderContainer>

          <DashboardGrid>
            <LeftColumn>
              <StatusCard 
                type={hasCriticalError ? "error" : "good"}
                title="설비 상태"
                mainText={hasCriticalError ? "점검필요" : "양호"}
                subText={hasCriticalError ? "Spec Out 발견됨" : "안정적으로 운영중"}
              />
              <StatusCard 
                type={alerts.length > 0 ? "error" : "good"}
                title="발생 건수"
                mainText={`${alerts.length}건`}
                subText={alerts.length > 0 ? `특이사항 ${alerts.length}건 발생` : "특이사항 없음"}
                onClick={alerts.length > 0 ? handleOpenModal : undefined}
              />
            </LeftColumn>

            <RightColumn>
              <SectionHeader>
                <SectionTitle>대차 #{selectedCartNo} 공정 데이터</SectionTitle>
                <DateLabel><FiRefreshCw /> 실시간 수신중</DateLabel>
              </SectionHeader>
              
              <MetricsList>
                {metricsData.map((item) => (
                  <MetricRow key={item.id} data={item} />
                ))}
              </MetricsList>
            </RightColumn>
          </DashboardGrid>
        </ContentWrapper>
      </PageContainer>
    </>
  );
}