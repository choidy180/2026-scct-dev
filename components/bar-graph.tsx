"use client";

import React, { useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { 
  FiCheck, 
  FiAlertTriangle, 
  FiActivity, 
  FiThermometer, 
  FiClock, 
  FiBox,
  FiRefreshCw,
  FiX
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

interface AlertItemData {
  id: number;
  type: 'error' | 'warning';
  title: string;
  desc: string;
  time: string;
  value?: string;
}

// --------------------------------------------------------------------------
// 2. Keyframes
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
// 3. Styled Components
// --------------------------------------------------------------------------

const PageContainer = styled.div`
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 40px;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  color: #111;
  overflow-x: hidden;

  @media (min-width: 2200px) {
    zoom: 1.35; 
  }
`;

const ContentWrapper = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
`;

const PageHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding-top: 30px;
`;

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 800;
  margin: 0;
  color: #1e293b;
  letter-spacing: -0.5px;
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
  grid-template-columns: 340px 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const RightColumn = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  min-height: 700px; /* 이 높이를 기준으로 내부 아이템이 배치됨 */
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 16px;
  flex-shrink: 0; /* 헤더는 줄어들지 않음 */
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
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
  
  svg {
    font-size: 14px;
    color: #94a3b8;
  }
`;

/* 🔥 새로 추가된 MetricsList: 남은 공간을 채우고 균등 배분 */
const MetricsList = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 아이템들을 위아래 끝까지 벌려줌 */
  flex: 1; /* 부모(RightColumn)의 남은 높이를 100% 차지 */
  width: 100%;
`;

// --------------------------------------------------------------------------
// 4. Status Card Components
// --------------------------------------------------------------------------

const CardBase = styled.div<{ $status: 'good' | 'error' }>`
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  height: 338px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 2px solid ${props => props.$status === 'good' ? '#10b981' : '#ef4444'};
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 120px;
    background: ${props => props.$status === 'good' 
      ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(255,255,255,0) 100%)' 
      : 'linear-gradient(180deg, rgba(239, 68, 68, 0.1) 0%, rgba(255,255,255,0) 100%)'};
    z-index: 0;
  }
`;

const CardHeader = styled.div`
  width: 100%;
  text-align: left;
  font-size: 16px;
  font-weight: 700;
  color: #334155;
  z-index: 1;
`;

const StatusCircle = styled.div<{ $status: 'good' | 'error' }>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${props => props.$status === 'good' ? '#10b981' : '#ef4444'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
  box-shadow: 0 10px 20px ${props => props.$status === 'good' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  z-index: 1;
  animation: ${props => props.$status === 'good' ? pulseGreen : pulseRed} 2s infinite;
`;

const StatusText = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  z-index: 1;
`;

const StatusBadge = styled.div<{ $status: 'good' | 'error' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  z-index: 1;
  
  ${props => props.$status === 'good' ? css`
    background-color: #ecfdf5;
    color: #059669;
  ` : css`
    background-color: #fef2f2;
    color: #dc2626;
  `}
`;

const LegendContainer = styled.div`
  width: 100%;
  background: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: center;
  gap: 16px;
  z-index: 1;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
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
  type, title, mainText, subText 
}: { 
  type: 'good' | 'error', title: string, mainText: string, subText: string 
}) => {
  return (
    <CardBase $status={type}>
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
        <LegendItem color="#ef4444">{type === 'good' ? '불량' : '3건 이상'}</LegendItem>
      </LegendContainer>
    </CardBase>
  );
};

// --------------------------------------------------------------------------
// 5. Metric Row (Updated for Flex Column Layout)
// --------------------------------------------------------------------------

/* 🔥 margin-bottom 제거 (MetricsList가 간격 조절) */
const RowContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 16px;
  background: #f1f5f9;
  border-radius: 16px;
  /* margin-bottom 제거됨 */
  
  &:hover { background-color: #f8fafc; border-radius: 8px; }
`;

const MetricInfo = styled.div`
  width: 240px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
`;

const IconBox = styled.div`
  width: 40px;
  height: 40px;
  background-color: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 18px;
`;

const MetricLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricName = styled.span`
  font-weight: 700;
  font-size: 15px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MetricUnit = styled.span`
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
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
  width: 100%;
  height: 10px;
  margin-top: 12px;
`;

const GaugeTrack = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #3498db 0%, #2ecc71 40%, #fff200 70%, #fd79a8 100%);
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
  }
`;

const GaugeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  width: 100%;
`;

const GaugeMarker = styled.div<{ $percent: number }>`
  position: absolute;
  top: -26px; 
  left: ${props => props.$percent}%; 
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  transition: left 1s cubic-bezier(0.4, 0, 0.2, 1); 

  .value-text {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .handle {
    width: 20px;
    height: 10px;
    background: #fff;
    border: 2px solid #334155;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

const ValueBox = styled.div`
  width: 100px;
  height: 42px;
  background-color: #10b981;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);
  flex-shrink: 0;
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
            {data.label} <MetricUnit>({data.unit})</MetricUnit>
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
// 6. Notification
// --------------------------------------------------------------------------

const NotificationContainer = styled.div`
  position: fixed;
  top: 90px;
  right: 24px;
  width: 400px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none; 
  font-family: 'Pretendard', sans-serif;
`;

const SummaryBanner = styled.div`
  pointer-events: auto;
  background-color: rgba(239, 68, 68, 0.95);
  backdrop-filter: blur(4px);
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
  animation: ${slideInRight} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .sub-text {
    font-size: 13px;
    opacity: 0.9;
    padding-left: 24px; 
  }
`;

const AlertCard = styled.div<{ $type: 'error' | 'warning' }>`
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  
  border-radius: 12px;
  padding: 16px;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef4444' : '#f59e0b'};
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
    align-items: center;
    margin-bottom: 8px;
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    color: white;
    background-color: ${props => props.$type === 'error' ? '#ef4444' : '#f59e0b'};
  }

  .title {
    font-size: 14px;
    font-weight: 700;
    color: #1e293b;
  }

  .time {
    font-size: 11px;
    color: #94a3b8;
  }

  .close-btn {
    cursor: pointer;
    color: #cbd5e1;
    margin-left: 8px;
    transition: color 0.2s;
    &:hover { color: #64748b; }
  }

  .desc {
    font-size: 13px;
    color: #475569;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .value-highlight {
    display: block;
    margin-top: 4px;
    font-weight: 700;
    color: #0f172a;
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
      <SummaryBanner>
        <div className="header">
          <FiAlertTriangle size={20} />
          WARNING - 특이사항 발생
        </div>
        <div className="sub-text">
          총 {alerts.length}건의 알림이 있습니다
        </div>
      </SummaryBanner>

      {alerts.map(alert => (
        <AlertCard key={alert.id} $type={alert.type}>
          <div className="top-row">
            <div className="title-group">
              <div className="badge">{alert.type === 'error' ? '긴급' : '주의'}</div>
              <div className="title">{alert.title}</div>
            </div>
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="time">{alert.time}</span>
              <FiX className="close-btn" size={16} onClick={() => removeAlert(alert.id)} />
            </div>
          </div>
          <div className="desc">
            {alert.desc}
            {alert.value && <span className="value-highlight">{alert.value}</span>}
          </div>
        </AlertCard>
      ))}
    </NotificationContainer>
  );
};

// --------------------------------------------------------------------------
// 7. Main Page
// --------------------------------------------------------------------------

export default function ProcessMonitorPage() {
  return (
    <PageContainer>
      
      <NotificationSystem />

      <ContentWrapper>
        <PageHeaderRow>
          <PageTitle>설비 이상 징후 및 공정 데이터 분석</PageTitle>
          <CurrentTime>
            2025-12-18 13:53:34
          </CurrentTime>
        </PageHeaderRow>

        <DashboardGrid>
          {/* Left: Status Cards */}
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

          {/* Right: Metrics List */}
          <RightColumn>
            <SectionHeader>
              <SectionTitle>핵심 공정 지표 및 운영 범위</SectionTitle>
              <DateLabel>
                <FiRefreshCw /> 
                실시간 데이터 수신중
              </DateLabel>
            </SectionHeader>
            
            {/* 🔥 MetricsList가 남은 높이를 채우고 내부 아이템을 분배합니다 */}
            <MetricsList>
              {METRIC_DATA.map((item) => (
                <MetricRow key={item.id} data={item} />
              ))}
            </MetricsList>
            
          </RightColumn>
        </DashboardGrid>
      </ContentWrapper>
    </PageContainer>
  );
}