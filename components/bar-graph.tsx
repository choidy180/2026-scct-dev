"use client";

import React, { useState, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { 
  FiBell, 
  FiSettings, 
  FiCheck, 
  FiAlertTriangle, 
  FiActivity, 
  FiThermometer, 
  FiClock, 
  FiBox,
  FiGrid,
  FiRefreshCw,
  FiX,            
  FiInfo          
} from 'react-icons/fi';

// --------------------------------------------------------------------------
// 1. Types & Data
// --------------------------------------------------------------------------

interface GaugeData {
  id: number;
  label: string;
  unit: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  value: number;
}

const METRIC_DATA: GaugeData[] = [
  { id: 1, label: 'R액 압력', unit: 'kg/m²', icon: <FiActivity />, min: 110, max: 150, value: 120.3 },
  { id: 2, label: 'R액 탱크온도', unit: '°C', icon: <FiThermometer />, min: 13, max: 23, value: 16.9 },
  { id: 3, label: 'P액 헤드온도', unit: '°C', icon: <FiThermometer />, min: 24, max: 28, value: 25.61 },
  { id: 4, label: '발포시간', unit: '초', icon: <FiClock />, min: 0.76, max: 1.66, value: 1.64 },
  { id: 5, label: '가조립무게', unit: 'g', icon: <FiBox />, min: 2375, max: 12530, value: 6952.1 },
];

// --------------------------------------------------------------------------
// 2. Keyframes (Animations)
// --------------------------------------------------------------------------

const pulseGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 200, 150, 0.7); }
  70% { box-shadow: 0 0 0 20px rgba(0, 200, 150, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 200, 150, 0); }
`;

const pulseRed = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(238, 70, 72, 0.7); transform: scale(1); }
  50% { transform: scale(1.05); }
  70% { box-shadow: 0 0 0 25px rgba(238, 70, 72, 0); }
  100% { box-shadow: 0 0 0 0 rgba(238, 70, 72, 0); transform: scale(1); }
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

// --------------------------------------------------------------------------
// 3. Styled Components (Layout & Design System)
// --------------------------------------------------------------------------

const PageContainer = styled.div`
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 40px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  color: #111;
`;

const ContentWrapper = styled.div`
  max-width: 1680px;
  margin: 0 auto;
  padding: 0 24px;
  margin-top: 30px;
  transform : scale(1.5) translateY(100px) ;
`;

const PageHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 60px 0 14px 0;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  color: #111;
  letter-spacing: -0.5px;
`;

const CurrentTime = styled.div`
  font-size: 14px;
  color: #666;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);

  /* Live Indicator */
  &::before {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    background-color: #00C896;
    border-radius: 50%;
    animation: ${blink} 1.5s infinite ease-in-out;
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 14px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const RightColumn = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 30px;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
  border: 1px solid #eaecf0;
  display: flex;
  flex-direction: column;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
`;

const DateLabel = styled.span`
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    font-size: 14px;
    color: #bbb;
  }
`;

// --------------------------------------------------------------------------
// 4. Components: Top Navigation (With Sliding Animation)
// --------------------------------------------------------------------------

const NavContainer = styled.nav`
  background: #fff;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 18px;
  color: #333;

  .logo-icon {
    width: 32px;
    height: 32px;
    background: #D31145;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 10px rgba(211, 17, 69, 0.3);
  }
`;

const MenuArea = styled.div`
  display: flex;
  align-items: center;
  gap: 4px; /* 간격 조정 */
  position: relative; /* Glider 배치를 위한 relative */
`;

// 움직이는 배경 (Glider)
const MenuGlider = styled.div`
  position: absolute;
  height: 36px; /* MenuItem 높이와 매칭 */
  background-color: #FFF0F3;
  border-radius: 8px;
  z-index: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 자연스러운 움직임 */
  top: 50%;
  transform: translateY(-50%);
`;

const MenuItem = styled.button<{ $isActive?: boolean }>`
  border: none;
  background: transparent; /* 배경은 Glider가 담당 */
  color: ${props => props.$isActive ? '#D31145' : '#666'};
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  z-index: 1; /* Glider 위에 텍스트 표시 */
  transition: color 0.3s ease;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  height: 36px; /* Glider와 높이 맞춤 */

  &:hover {
    color: ${props => props.$isActive ? '#D31145' : '#333'};
  }
`;

const IconActions = styled.div`
  display: flex;
  gap: 16px;
  margin-left: 24px;
  padding-left: 24px;
  border-left: 1px solid #ddd;
  color: #666;

  svg {
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    &:hover { 
      color: #111; 
      transform: rotate(15deg);
    }
  }
`;

// --------------------------------------------------------------------------
// 5. Components: Status Card
// --------------------------------------------------------------------------

const CardBase = styled.div<{ $status: 'good' | 'error' }>`
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-shadow: rgba(50, 50, 93, 0.25) 0px 2px 5px -1px, rgba(0, 0, 0, 0.3) 0px 1px 3px -1px;
  border: 2px solid ${props => props.$status === 'good' ? '#4ADCB5' : '#FF9BA3'};
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif !important;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 150px;
    background: ${props => props.$status === 'good' 
      ? 'linear-gradient(180deg, rgba(220,252,243,0.5) 0%, rgba(255,255,255,0) 100%)' 
      : 'linear-gradient(180deg, rgba(255,241,240,0.5) 0%, rgba(255,255,255,0) 100%)'};
    z-index: 0;
  }
`;

const CardHeader = styled.div`
  width: 100%;
  text-align: left;
  font-size: 20px;
  font-weight: 800;
  z-index: 1;
`;

const StatusCircle = styled.div<{ $status: 'good' | 'error' }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.$status === 'good' ? '#00C896' : '#EE4648'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 60px;
  box-shadow: 0 15px 35px ${props => props.$status === 'good' ? 'rgba(0, 200, 150, 0.3)' : 'rgba(238, 70, 72, 0.3)'};
  z-index: 1;
  margin-top: -10px;
  animation: ${props => props.$status === 'good' ? pulseGreen : pulseRed} 2s infinite;

  svg {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  }
`;

const StatusText = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: #111;
  z-index: 1;
`;

const StatusBadge = styled.div<{ $status: 'good' | 'error' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1;
  
  ${props => props.$status === 'good' ? css`
    background-color: #E6F9F3;
    color: #00A87E;
  ` : css`
    background-color: #FFF1F0;
    color: #E03E3E;
  `}
`;

const LegendContainer = styled.div`
  width: 100%;
  background: #faf9f9;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  justify-content: center;
  gap: 16px;
  z-index: 1;
  margin-top: 20px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #555;
  font-weight: 500;

  &::before {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => props.color};
  }
`;

const StatusCard = ({ 
  type, 
  title, 
  mainText, 
  subText 
}: { 
  type: 'good' | 'error', 
  title: string, 
  mainText: string, 
  subText: string 
}) => {
  return (
    <CardBase $status={type}>
      <CardHeader>{title}</CardHeader>
      <StatusCircle $status={type}>
        {type === 'good' ? <FiCheck /> : <FiAlertTriangle />}
      </StatusCircle>
      <StatusText>{mainText}</StatusText>
      <StatusBadge $status={type}>
        {type === 'good' ? <FiCheck size={16} /> : <FiAlertTriangle size={16} />}
        {subText}
      </StatusBadge>
      <LegendContainer>
        <LegendItem color="#00C896">{type === 'good' ? '양호' : '없음'}</LegendItem>
        <LegendItem color="#FFC107">{type === 'good' ? '주의' : '1건 이상'}</LegendItem>
        <LegendItem color="#EE4648">{type === 'good' ? '불량' : '3건 이상'}</LegendItem>
      </LegendContainer>
    </CardBase>
  );
};

// --------------------------------------------------------------------------
// 6. Components: Metric Row
// --------------------------------------------------------------------------

const RowContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 24px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child { border-bottom: none; }

  transition: background-color 0.2s;
  &:hover {
    background-color: rgba(0,0,0,0.01);
  }
`;

const MetricInfo = styled.div`
  width: 220px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
`;

const IconBox = styled.div`
  width: 44px;
  height: 44px;
  background-color: #EDF1F5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #778ca2;
  font-size: 20px;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.03);
`;

const MetricLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricName = styled.span`
  font-weight: 700;
  font-size: 17px;
  color: #111;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetricUnit = styled.span`
  font-size: 13px;
  color: #999;
  font-weight: 400;
`;

const GaugeColumn = styled.div`
  flex: 1;
  padding: 0 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 60px;
`;

const TrackArea = styled.div`
  position: relative;
  width: 100%;
  height: 14px;
  margin-top: 10px;
`;

const GaugeTrack = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 7px;
  background: linear-gradient(90deg, 
    #A2DDF8 0%, 
    #BAF4D6 30%, 
    #FDF3B6 70%, 
    #FBC9BE 100%
  );
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: linear-gradient(
      90deg, 
      rgba(255,255,255,0) 0%, 
      rgba(255,255,255,0.4) 50%, 
      rgba(255,255,255,0) 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s infinite linear;
  }
`;

const GaugeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  font-weight: 500;
  width: 100%;
`;

const GaugeMarker = styled.div<{ $percent: number }>`
  position: absolute;
  top: -28px; 
  left: ${props => props.$percent}%; 
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1); 

  .value-text {
    font-size: 16px;
    font-weight: 600;
    color: #111;
    margin-bottom: 2px;
    white-space: nowrap;
  }

  .handle {
    width: 28px;
    height: 14px;
    background: #fff;
    border: 3px solid #666;
    border-radius: 14px;
    box-shadow: 0 3px 6px rgba(0,0,0,0.2);
  }
`;

const ValueBox = styled.div`
  width: 110px;
  height: 48px;
  background-color: #00C48C;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 
    0 4px 10px rgba(0, 196, 140, 0.3),
    inset 0 2px 4px rgba(255,255,255,0.2),
    inset 0 -2px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
`;

const MetricRow = ({ data }: { data: GaugeData }) => {
  const range = data.max - data.min;
  let percent = ((data.value - data.min) / range) * 100;
  
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;

  return (
    <RowContainer>
      <MetricInfo>
        <IconBox>{data.icon}</IconBox>
        <MetricLabelGroup>
          <MetricName>
            {data.label} 
            <MetricUnit>({data.unit})</MetricUnit>
          </MetricName>
        </MetricLabelGroup>
      </MetricInfo>

      <GaugeColumn>
        <TrackArea>
          <GaugeMarker $percent={percent}>
            <span className="value-text">{data.value}</span>
            <div className="handle" />
          </GaugeMarker>
          <GaugeTrack />
        </TrackArea>
        <GaugeLabels>
          <span>{data.min}</span>
          <span>{data.max}</span>
        </GaugeLabels>
      </GaugeColumn>

      <ValueBox>
        {data.value}
      </ValueBox>
    </RowContainer>
  );
};

// --------------------------------------------------------------------------
// 7. NEW: Notification System Components
// --------------------------------------------------------------------------

// Alert Data Interface
interface AlertItemData {
  id: number;
  type: 'error' | 'warning';
  title: string;
  desc: string;
  time: string;
  value?: string;
}

// Fixed Container Top-Right
const NotificationContainer = styled.div`
  position: fixed;
  top: 80px; 
  right: 24px;
  width: 440px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none; /* Allows clicking through gaps */
  font-family: 'Pretendard', sans-serif;
`;

// Summary Header (Red)
const SummaryBanner = styled.div`
  pointer-events: auto;
  /* 수정: opacity 제거하고 RGBA + backdrop-filter 적용 */
  background-color: rgba(238, 70, 72, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  padding: 16px 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 20px rgba(238, 70, 72, 0.25);
  animation: ${slideInRight} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;

  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 800;
    margin-bottom: 4px;
  }

  .sub-text {
    font-size: 14px;
    opacity: 0.9;
    padding-left: 30px; /* Align with text start */
  }
`;

// Individual Alert Card
const AlertCard = styled.div<{ $type: 'error' | 'warning' }>`
  pointer-events: auto;
  /* 수정: opacity 제거하고 RGBA + backdrop-filter 적용 */
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  border-radius: 16px;
  padding: 18px 20px;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 2px solid ${props => props.$type === 'error' ? '#FF9BA3' : '#FCD34D'};
  display: flex;
  flex-direction: column;
  animation: ${slideInRight} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  transition: transform 0.2s;

  &:hover {
    transform: translateX(-4px);
  }

  .top-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    color: white;
    background-color: ${props => props.$type === 'error' ? '#EE4648' : '#F59E0B'};
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    color: #111;
  }

  .time {
    font-size: 12px;
    color: #999;
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    margin-right: 8px;
  }

  .close-btn {
    cursor: pointer;
    color: #bbb;
    transition: color 0.2s;
    &:hover { color: #333; }
  }

  .desc {
    font-size: 14px;
    color: #444;
    line-height: 1.5;
    font-weight: 500;
  }

  .value-highlight {
    display: block;
    margin-top: 4px;
    font-weight: 700;
    color: #333;
  }
`;

const NotificationSystem = () => {
  const [alerts, setAlerts] = useState<AlertItemData[]>([
    {
      id: 1,
      type: 'error',
      title: 'Spec Out 발생',
      desc: 'R액 압력이 관리 상한선(150 kg/m²)을 초과하였습니다.',
      value: '현재 수치: 156.3 kg/m²',
      time: '13:45:22'
    },
    {
      id: 2,
      type: 'warning',
      title: '센서 이상 감지',
      desc: 'P액 헤드온도 센서 응답 지연이 발생하였습니다.\n점검이 필요합니다.',
      time: '17:25:06'
    }
  ]);

  const removeAlert = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <NotificationContainer>
      {/* Summary Banner matches Image */}
      <SummaryBanner>
        <div className="header">
          <FiAlertTriangle size={24} />
          WARNING - 특이사항 발생
        </div>
        <div className="sub-text">
          총 {alerts.length}건의 알림이 있습니다
        </div>
      </SummaryBanner>

      {/* Individual Alerts */}
      {alerts.map(alert => (
        <AlertCard key={alert.id} $type={alert.type}>
          <div className="top-row">
            <div className="title-group">
              <div className="badge">{alert.type === 'error' ? '긴급' : '주의'}</div>
              <div className="title">{alert.title}</div>
            </div>
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="time">{alert.time}</span>
              <FiX className="close-btn" size={18} onClick={() => removeAlert(alert.id)} />
            </div>
          </div>
          <div className="desc">
            {alert.desc.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {alert.value && <span className="value-highlight">{alert.value}</span>}
          </div>
        </AlertCard>
      ))}
    </NotificationContainer>
  );
};

// --------------------------------------------------------------------------
// 8. Main Page Component
// --------------------------------------------------------------------------

export default function ProcessMonitorPage() {
  return (
    <PageContainer>
      
      {/* Add Notification System Here */}
      <NotificationSystem />

      <ContentWrapper>
        <PageHeaderRow>
          <PageTitle>설비 이상 징후 및 공정 데이터 분석</PageTitle>
          <CurrentTime>
            2025-12-18 13:53:34
          </CurrentTime>
        </PageHeaderRow>

        <DashboardGrid>
          {/* Left: Status Cards (Animated) */}
          <LeftColumn>
            <StatusCard 
              type="good"
              title="공정 상태"
              mainText="양호"
              subText="관리 범위 내 안정적으로 운영중"
            />
            <StatusCard 
              type="error"
              title="금일 특이사항"
              mainText="3건"
              subText="특이사항이 3건 발생했습니다."
            />
          </LeftColumn>

          {/* Right: Metrics List (Animated) */}
          <RightColumn>
            <SectionHeader>
              <SectionTitle>핵심 공정 지표 및 운영 범위</SectionTitle>
              <DateLabel>
                <FiRefreshCw /> 
                실시간 데이터 수신중
              </DateLabel>
            </SectionHeader>
            
            {METRIC_DATA.map((item) => (
              <MetricRow key={item.id} data={item} />
            ))}
          </RightColumn>
        </DashboardGrid>
      </ContentWrapper>
    </PageContainer>
  );
}