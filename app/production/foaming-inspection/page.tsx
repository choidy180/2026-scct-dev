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
  FiCpu,       
  FiLayers,    
  FiGrid       
} from 'react-icons/fi';

// --------------------------------------------------------------------------
// 1. Types & Constants
// --------------------------------------------------------------------------

type ProcessType = 'GR1' | 'GR2' | 'GR3' | 'GR4' | 'GR5';
const PROCESS_LIST: ProcessType[] = ['GR1', 'GR2', 'GR3', 'GR4', 'GR5'];
const COMMON_FONT = "'Pretendard', sans-serif";

interface GaugeData {
  id: number;
  label: string;
  unit: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  value: number;
}

interface AlertItemData {
  id: number;
  type: 'error' | 'warning';
  title: string;
  desc: string;
  time: string;
  value?: string;
}

// --------------------------------------------------------------------------
// 2. Data Helpers (Pure Functions)
// --------------------------------------------------------------------------

const getRandomVal = (min: number, max: number, decimals: number = 0) => {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
};

const generateProcessData = (proc: ProcessType) => {
  const isBadLuck = proc === 'GR3' || proc === 'GR5'; 
  
  const baseMetrics: Omit<GaugeData, 'value'>[] = [
    { id: 1, label: 'R액 압력', unit: 'kg/m²', icon: <FiActivity />, min: 110, max: 150 },
    { id: 2, label: 'R액 탱크온도', unit: '°C', icon: <FiThermometer />, min: 13, max: 23 },
    { id: 3, label: 'P액 헤드온도', unit: '°C', icon: <FiThermometer />, min: 24, max: 28 },
    { id: 4, label: '발포시간', unit: '초', icon: <FiClock />, min: 0.76, max: 1.66 },
    { id: 5, label: '가조립무게', unit: 'g', icon: <FiBox />, min: 2375, max: 12530 },
    { id: 6, label: '믹싱모터', unit: 'rpm', icon: <FiActivity />, min: 1800, max: 2200 },
  ];

  const metrics: GaugeData[] = baseMetrics.map(m => {
    const range = m.max - m.min;
    const errorMargin = isBadLuck ? range * 0.4 : range * 0.05; 
    let val = getRandomVal(m.min, m.max, m.unit === 'g' || m.unit === 'rpm' ? 0 : 2);
    
    if (Math.random() > 0.8) {
      val = getRandomVal(m.min - errorMargin, m.max + errorMargin, m.unit === 'g' ? 0 : 2);
    }
    return { ...m, value: val };
  });

  const newAlerts: AlertItemData[] = [];
  const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });

  metrics.forEach(m => {
    if (m.value < m.min || m.value > m.max) {
      newAlerts.push({
        id: m.id,
        type: 'error',
        title: 'Spec Out 발생',
        desc: `${m.label}이(가) 관리 범위(${m.min}~${m.max}${m.unit})를 벗어났습니다.`,
        value: `현재값: ${m.value} ${m.unit}`,
        time: nowStr
      });
    }
  });

  if (isBadLuck && Math.random() > 0.5) {
    newAlerts.push({
      id: 99,
      type: 'warning',
      title: '통신 지연 감지',
      desc: '센서 데이터 수신이 0.5초 지연되었습니다.',
      time: nowStr
    });
  }

  return { metrics, alerts: newAlerts };
};

// --------------------------------------------------------------------------
// 3. Styled Components & Keyframes
// --------------------------------------------------------------------------

const pulseGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 200, 150, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(0, 200, 150, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 200, 150, 0); }
`;

const pulseRed = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(238, 70, 72, 0.7); transform: scale(1); }
  50% { transform: scale(1.02); }
  70% { box-shadow: 0 0 0 20px rgba(238, 70, 72, 0); }
  100% { box-shadow: 0 0 0 0 rgba(238, 70, 72, 0); transform: scale(1); }
`;

const dangerPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

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

const fillProgress = keyframes`
  0% { width: 0%; }
  100% { width: 100%; }
`;

const textGlow = keyframes`
  0%, 100% { text-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
  50% { text-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(16, 185, 129, 0.6); }
`;

const LoaderOverlay = styled.div<{ $isFinished: boolean }>`
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: #ffffff;
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  opacity: ${props => props.$isFinished ? 0 : 1};
  visibility: ${props => props.$isFinished ? 'hidden' : 'visible'};
  transition: opacity 0.5s ease-out, visibility 0.5s ease-out;
  font-family: ${COMMON_FONT};
`;

const LoaderContent = styled.div`
  width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const LogoArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  .icon-wrap {
    font-size: 48px;
    color: #3b82f6;
    margin-bottom: 8px;
    filter: drop-shadow(0 4px 6px rgba(59, 130, 246, 0.3));
  }
  h1 {
    font-size: 24px;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
    letter-spacing: -0.5px;
    font-family: ${COMMON_FONT};
  }
  p {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
    animation: ${textGlow} 2s infinite ease-in-out;
    font-family: ${COMMON_FONT};
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 6px;
  background-color: #f1f5f9;
  border-radius: 99px;
  overflow: hidden;
  position: relative;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #10b981 100%);
  border-radius: 99px;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  width: 0%;
  animation: ${fillProgress} 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
`;

const LoadingStatus = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  font-family: ${COMMON_FONT};
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

const PageHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 56px;
  flex-shrink: 0;
  margin-bottom: 16px;
  width: 100%;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const HeaderCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const TabNavigation = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  border: none;
  outline: none;
  background: ${props => props.$isActive ? '#1e293b' : '#fff'};
  color: ${props => props.$isActive ? '#fff' : '#64748b'};
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: ${props => props.$isActive 
    ? '0 4px 12px rgba(30, 41, 59, 0.3)' 
    : '0 2px 4px rgba(0,0,0,0.05)'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${COMMON_FONT};

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.$isActive ? '#0f172a' : '#f8fafc'};
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

  @media (min-width: 2000px) {
    font-size: 42px;
    .proc-badge { font-size: 16px; padding: 6px 12px; }
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

  @media (min-width: 2000px) {
    font-size: 18px;
    padding: 10px 24px;
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
  @media (min-width: 2000px) { font-size: 30px; }
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
  @media (min-width: 2000px) {
    font-size: 16px; padding: 8px 16px; svg { font-size: 18px; }
  }
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

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 30%;
    background: ${props => props.$status === 'good' 
      ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(255,255,255,0) 100%)' 
      : 'linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(255,255,255,0) 100%)'};
    z-index: 0;
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
  @media (min-width: 2000px) { font-size: 32px; }
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
  animation: ${props => props.$status === 'good' ? pulseGreen : pulseRed} 2s infinite;
  
  svg { width: 50%; height: 50%; }
`;

const StatusText = styled.div`
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  z-index: 1;
  font-family: ${COMMON_FONT};
  @media (min-width: 2000px) { font-size: 56px; }
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
  @media (min-width: 2000px) { font-size: 18px; padding: 8px 24px; }
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
  @media (min-width: 2000px) { padding: 12px 16px; gap: 24px; }
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
  @media (min-width: 2000px) { font-size: 16px; &::before { width: 14px; height: 14px; } }
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
  @media (min-width: 2000px) { width: 300px; gap: 20px; }
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
  @media (min-width: 2000px) { width: 60px; height: 60px; font-size: 28px; }
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
  @media (min-width: 2000px) { font-size: 28px; }
`;

const MetricUnit = styled.span`
  font-size: 13px;
  color: #757d88;
  font-weight: 400;
  font-family: ${COMMON_FONT};
  @media (min-width: 2000px) { font-size: 18px; }
`;

const GaugeColumn = styled.div`
  flex: 1;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (min-width: 2000px) { padding: 0 80px; }
`;

const TrackArea = styled.div`
  position: relative;
  width: 100%; height: 10px;
  margin-top: 10px;
  @media (min-width: 2000px) { height: 18px; }
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
  @media (min-width: 2000px) { font-size: 20px; margin-top: 12px; }
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
  @media (min-width: 2000px) {
    .value-text { font-size: 26px; bottom: 14px; }
    .handle { width: 28px; height: 18px; border-width: 3px; }
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

  @media (min-width: 2000px) { left: 320px; padding: 16px 24px; top: -30px; }
  &::after {
    content: ''; position: absolute;
    bottom: -6px; left: 20px;
    width: 12px; height: 12px;
    background: #ef4444; transform: rotate(45deg);
  }
  .icon-area { font-size: 24px; display: flex; align-items: center; @media (min-width: 2000px) { font-size: 36px; } }
  .text-area { display: flex; flex-direction: column; gap: 2px; }
  .warning-title { font-size: 13px; font-weight: 800; color: #fee2e2; text-transform: uppercase; font-family: ${COMMON_FONT}; @media (min-width: 2000px) { font-size: 16px; } }
  .warning-msg { font-size: 14px; font-weight: 700; white-space: nowrap; font-family: ${COMMON_FONT}; @media (min-width: 2000px) { font-size: 18px; } }
  .action-btn { background: white; color: #ef4444; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-family: ${COMMON_FONT}; &:hover { background: #fff1f2; } @media (min-width: 2000px) { font-size: 16px; padding: 8px 16px; } }
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
  @media (min-width: 2000px) { width: 140px; height: 60px; font-size: 24px; }
`;

const NotificationContainer = styled.div`
  position: absolute;
  top: 20px; right: 20px;
  width: 400px; z-index: 9999;
  display: flex; flex-direction: column; gap: 12px;
  pointer-events: none; 
  font-family: ${COMMON_FONT};
  @media (min-width: 2000px) { width: 500px; top: 30px; right: 30px; }
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
  @media (min-width: 2000px) { padding: 20px 24px; .header-left { font-size: 20px; } .sub-text { font-size: 15px; } }
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
  @media (min-width: 2000px) { padding: 20px; .badge { font-size: 13px; } .title { font-size: 16px; } .desc { font-size: 15px; } .time { font-size: 15px; } }
`;

// --------------------------------------------------------------------------
// 4. Sub-Components (Memoized for Performance)
// --------------------------------------------------------------------------

// 4.1. Live Clock Component (Isolates renders)
const LiveClock = memo(() => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Client-side only to avoid hydration mismatch
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

// 4.2. Status Card
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

// 4.3. Metric Row
const MetricRow = memo(({ data }: { data: GaugeData }) => {
  const range = data.max - data.min;
  let percent = ((data.value - data.min) / range) * 100;
  const isSpecOut = data.value < data.min || data.value > data.max;

  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;

  return (
    <RowContainer $isError={isSpecOut}>
      {isSpecOut && (
        <DangerPopup>
          <div className="icon-area"><FiAlertOctagon /></div>
          <div className="text-area">
            <span className="warning-title">CRITICAL WARNING</span>
            <span className="warning-msg">현재값 {data.value} (최대 {data.max}) — 즉시 점검 요망</span>
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
          <span>{data.min}</span>
          <span>{data.max}</span>
        </GaugeLabels>
      </GaugeColumn>

      <ValueBox $isError={isSpecOut}>{data.value}</ValueBox>
    </RowContainer>
  );
});

MetricRow.displayName = 'MetricRow';

// 4.4. Notification System
interface NotificationSystemProps {
  isOpen: boolean;
  onCloseAll: () => void;
  onCloseItem: (id: number) => void;
  alerts: AlertItemData[];
  hiddenAlertIds: number[];
}

const NotificationSystem = memo(({ isOpen, onCloseAll, onCloseItem, alerts, hiddenAlertIds }: NotificationSystemProps) => {
  const visibleAlerts = useMemo(() => 
    alerts.filter(a => !hiddenAlertIds.includes(a.id)), 
    [alerts, hiddenAlertIds]
  );

  if (!isOpen || alerts.length === 0) return null;

  return (
    <NotificationContainer>
      <SummaryBanner>
        <div className="header">
          <div className="header-left">
            <FiAlertTriangle size={20} /> WARNING - 특이사항 발생
          </div>
          <FiX className="close-all-btn" size={24} onClick={onCloseAll} />
        </div>
        <div className="sub-text">총 {alerts.length}건의 알림이 있습니다</div>
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
  const [activeProcess, setActiveProcess] = useState<ProcessType>('GR2');
  const [isLoading, setIsLoading] = useState(true);
  
  const [metricsData, setMetricsData] = useState<GaugeData[]>([]);
  const [alerts, setAlerts] = useState<AlertItemData[]>([]);
  const [hiddenAlertIds, setHiddenAlertIds] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);

  // 데이터 생성 로직 (useCallback으로 메모이제이션)
  const generateData = useCallback((proc: ProcessType) => {
    return generateProcessData(proc);
  }, []);

  const handleProcessChange = useCallback((proc: ProcessType, withLoading = true) => {
    setActiveProcess(proc);
    setHiddenAlertIds([]); 
    
    if (withLoading) {
      setIsLoading(true);
      setTimeout(() => {
        const { metrics, alerts } = generateData(proc);
        setMetricsData(metrics);
        setAlerts(alerts);
        setIsLoading(false);
      }, 1500);
    } else {
      const { metrics, alerts } = generateData(proc);
      setMetricsData(metrics);
      setAlerts(alerts);
    }
  }, [generateData]);

  // 초기 로드
  useEffect(() => {
    const timer = setTimeout(() => {
      handleProcessChange('GR2', false); 
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [handleProcessChange]);

  const handleOpenModal = useCallback(() => {
    setHiddenAlertIds([]);
    setShowModal(true);
  }, []);

  const handleCloseItem = useCallback((id: number) => {
    setHiddenAlertIds(prev => [...prev, id]);
  }, []);

  const handleCloseAll = useCallback(() => {
    setShowModal(false);
  }, []);

  // 파생 상태 계산 (useMemo)
  const hasCriticalError = useMemo(() => alerts.some(a => a.type === 'error'), [alerts]);
  
  return (
    <>
      <PageContainer>
        <LoaderOverlay $isFinished={!isLoading}>
          <LoaderContent>
            <LogoArea>
              <div className="icon-wrap"><FiCpu /></div>
              <h1>설비이상 징후 탐지 AI ({activeProcess})</h1>
              <p>Connection Establishing...</p>
            </LogoArea>
            <ProgressContainer><ProgressBar /></ProgressContainer>
            <LoadingStatus><span>SYSTEM CHECK</span><span>100%</span></LoadingStatus>
          </LoaderContent>
        </LoaderOverlay>

        <NotificationSystem 
          isOpen={showModal || (alerts.length > 0 && !isLoading)} 
          onCloseAll={handleCloseAll}
          onCloseItem={handleCloseItem}
          alerts={alerts}
          hiddenAlertIds={hiddenAlertIds}
        />

        <ContentWrapper>
          <PageHeaderRow>
            <HeaderLeft>
              <PageTitle>
                설비이상 징후 탐지 AI
                <span style={{ marginLeft: '12px', fontSize: '18px', color: '#94a3b8' }}>|</span>
                <span className="proc-badge">{activeProcess} 공정</span>
              </PageTitle>
            </HeaderLeft>

            <HeaderCenter>
              <TabNavigation>
                {PROCESS_LIST.map(proc => (
                  <TabButton 
                    key={proc} 
                    $isActive={activeProcess === proc}
                    onClick={() => handleProcessChange(proc)}
                  >
                    {activeProcess === proc ? <FiLayers /> : <FiGrid />}
                    {proc}
                  </TabButton>
                ))}
              </TabNavigation>
            </HeaderCenter>

            <HeaderRight>
              <LiveClock />
            </HeaderRight>
          </PageHeaderRow>

          <DashboardGrid>
            <LeftColumn>
              <StatusCard 
                type={hasCriticalError ? "error" : "good"}
                title="설비 상태"
                mainText={hasCriticalError ? "점검필요" : "양호"}
                subText={hasCriticalError ? "이상 징후가 발견되었습니다" : "안정적으로 운영중"}
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
                <SectionTitle>{activeProcess} 핵심 공정 지표</SectionTitle>
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