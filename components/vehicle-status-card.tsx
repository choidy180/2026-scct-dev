"use client";

import React from "react";
import styled from "styled-components";
import { Clock, MapPin, User, Package, Navigation } from "lucide-react";

interface VehicleStatusCardProps {
  vehicleId: string;
  imageUrl: string;
  departure: string;
  arrival: string;
  progress: number;
  eta: string;
  remainingTime: string;
  distanceLeft: string;
  speed: number;
  cargoInfo: string;
  temperature: string;
  driverName: string;
  driverStatus: string;
}

export default function VehicleStatusCard({
  vehicleId,
  imageUrl, // 🟢 이미지 URL props 추가
  departure,
  arrival,
  progress,
  eta,
  remainingTime,
  distanceLeft,
  speed,
  cargoInfo,
  temperature,
  driverName,
  driverStatus,
}: VehicleStatusCardProps) {
  const simpleDep = departure.split(' ')[0];
  const simpleArr = arrival.split(' ')[0];

  return (
    <CardContainer>
      {/* 1. 헤더: 아이콘 + 차량ID + 차량이미지 + 상태배지 */}
      <Header>
        <div className="left-group">
          <div className="icon-box">
            <Navigation size={16} color="white" />
          </div>
          <Title>{vehicleId}</Title>
        </div>
        
        <div className="right-group">
          {/* 🟢 차량 이미지 추가 (작게) */}
          <CarImage src={imageUrl} alt={vehicleId} />
          <StatusBadge $status={driverStatus.includes("지연") ? "delayed" : "normal"}>
            {driverStatus.includes("지연") ? "지연" : "정상"}
          </StatusBadge>
        </div>
      </Header>

      {/* 2. 진행률 바 */}
      <ProgressSection>
        <div className="route-text">
          <span>{simpleDep}</span>
          <span className="pct">{progress}%</span>
          <span>{simpleArr}</span>
        </div>
        <ProgressBar>
          <div className="fill" style={{ width: `${progress}%` }} />
        </ProgressBar>
      </ProgressSection>

      {/* 3. 정보 그리드 (2x2) */}
      <InfoGrid>
        <GridItem>
          <Label><Clock size={12} /> 도착 예정</Label>
          <Value className="highlight">{eta} <span className="sub">({remainingTime})</span></Value>
        </GridItem>
        
        <GridItem>
          <Label><MapPin size={12} /> 남은 거리</Label>
          <Value>{distanceLeft} <span className="sub">({speed}km/h)</span></Value>
        </GridItem>

        <GridItem>
          <Label><User size={12} /> 담당 기사</Label>
          <Value>{driverName}</Value>
        </GridItem>

        <GridItem>
          <Label><Package size={12} /> 적재 화물</Label>
          <Value>{cargoInfo.split(',')[0]} <TempBadge>{temperature}</TempBadge></Value>
        </GridItem>
      </InfoGrid>
    </CardContainer>
  );
}

// --- Styled Components ---

const CardContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  width: 340px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.8);
  font-family: 'Pretendard', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .left-group, .right-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-box {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
  }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.5px;
`;

// 🟢 차량 이미지 스타일 추가
const CarImage = styled.img`
  height: 32px; /* 높이 고정 */
  width: auto;
  object-fit: contain;
  /* filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); /* 선택사항: 그림자 추가 */
`;

const StatusBadge = styled.div<{ $status: "normal" | "delayed" }>`
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px; /* 패딩 약간 조절 */
  border-radius: 20px;
  background: ${props => props.$status === "delayed" ? "#FEF2F2" : "#ECFDF5"};
  color: ${props => props.$status === "delayed" ? "#EF4444" : "#10B981"};
  border: 1px solid ${props => props.$status === "delayed" ? "#FECACA" : "#A7F3D0"};
  white-space: nowrap;
`;

const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  .route-text {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    
    .pct {
      color: #3b82f6;
      font-weight: 800;
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #E2E8F0;
  border-radius: 99px;
  overflow: hidden;

  .fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    border-radius: 99px;
    transition: width 0.5s ease;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
`;

const GridItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Label = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
`;

const Value = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;

  &.highlight {
    color: #3b82f6;
    font-weight: 800;
  }

  .sub {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
  }
`;

const TempBadge = styled.span`
  font-size: 9px;
  background: #f1f5f9;
  color: #64748b;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 600;
`;