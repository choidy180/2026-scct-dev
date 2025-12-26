import React from 'react';
import styled, { keyframes } from 'styled-components';
import { MapPin, Box, User, Activity } from 'lucide-react';

interface VehicleStatusProps {
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

const VehicleStatusCard: React.FC<VehicleStatusProps> = (props) => {
  return (
    <Container>
      <GlassCard>
        {/* 상단 헤더 & 트럭 이미지 */}
        <TopSection>
          <HeaderRow>
            <StatusBadge>운행 중</StatusBadge>
            <HeaderId>ID: {props.vehicleId}</HeaderId>
          </HeaderRow>
          
          <ImageArea>
            <TruckImage src={props.imageUrl} alt="차량 이미지" />
          </ImageArea>
        </TopSection>

        <ContentSection>
          {/* 1. 경로 프로세스 바 */}
          <RouteBlock>
            <RouteHeader>
              <LocationBox>
                <MapPin size={14} color="#64748b" />
                <span>{props.departure}</span>
              </LocationBox>
              <LocationBox $align="right">
                <span>{props.arrival}</span>
                <MapPin size={14} color="#64748b" />
              </LocationBox>
            </RouteHeader>

            <ProgressContainer>
              <Track />
              <Fill $width={props.progress} />
              
              <FloatingTag style={{ left: `${props.progress}%` }}>
                <TagText>{props.progress}%</TagText>
                <TagSubText>완료</TagSubText>
                <TagArrow />
              </FloatingTag>
            </ProgressContainer>
          </RouteBlock>

          {/* 2. 핵심 메트릭 */}
          <MetricsGrid>
            <MetricItem>
              <Label>도착 예정 (ETA)</Label>
              <ValueLarge>{props.eta}</ValueLarge>
              <SubText>{props.remainingTime}</SubText>
            </MetricItem>
            <DividerVertical />
            <MetricItem>
              <Label>남은 거리</Label>
              <ValueMedium>{props.distanceLeft}</ValueMedium>
              <SubTextFlex>
                <Activity size={14} /> {props.speed} km/h
              </SubTextFlex>
            </MetricItem>
          </MetricsGrid>

          {/* 3. 하단 정보 카드 */}
          <CardGrid>
            <DetailCard>
              <IconBox>
                <Box size={18} color="#475569" />
              </IconBox>
              <CardContent>
                <CardLabel>화물 정보</CardLabel>
                <CardValue>{props.cargoInfo}</CardValue>
                <Tag $color="#10b981" $bg="#dcfce7">온도 {props.temperature}</Tag>
              </CardContent>
            </DetailCard>

            <DetailCard>
              <IconBox>
                <User size={18} color="#475569" />
              </IconBox>
              <CardContent>
                <CardLabel>운전자</CardLabel>
                <CardValue>{props.driverName}</CardValue>
                <Tag $color="#2563eb" $bg="#dbeafe">{props.driverStatus}</Tag>
              </CardContent>
            </DetailCard>
          </CardGrid>

        </ContentSection>

        <StatusIndicator />
      </GlassCard>
    </Container>
  );
};

export default VehicleStatusCard;

// --- Keyframes ---
const pulse = keyframes` 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } `;

// --- Styled Components ---

const Container = styled.div`
  width: 100%;
  max-width: 400px; /* ✅ 여기서도 max-width를 맞춰줍니다 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
`;

const GlassCard = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.75); /* ✅ 투명도 조절 */
  backdrop-filter: blur(20px);
  border-radius: 32px;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  overflow: visible;
`;

const TopSection = styled.div` background: linear-gradient(180deg, #FFFFFF 0%, rgba(241,245,249,0.5) 100%); padding: 24px; display: flex; flex-direction: column; align-items: center; border-radius: 32px 32px 0 0; border-bottom: 1px solid rgba(0,0,0,0.05); `;
const HeaderRow = styled.div` width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; `;
const StatusBadge = styled.span` background: #E0F2FE; color: #0284C7; font-size: 13px; font-weight: 700; padding: 6px 10px; border-radius: 8px; `;
const HeaderId = styled.span` font-size: 14px; font-weight: 600; color: #64748B; letter-spacing: 0.5px; `;
const ImageArea = styled.div` position: relative; width: 100%; height: 150px; display: flex; justify-content: center; align-items: center; `;
const TruckImage = styled.img` width: 95%; height: auto; object-fit: contain; z-index: 2; transition: transform 0.3s; &:hover { transform: scale(1.02); } `;
const ContentSection = styled.div` padding: 28px 24px; `;
const RouteBlock = styled.div` margin-bottom: 32px; `;
const RouteHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; `;
const LocationBox = styled.div<{ $align?: string }>` display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #475569; `;
const ProgressContainer = styled.div` position: relative; width: 100%; height: 8px; `;
const Track = styled.div` position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #E2E8F0; border-radius: 99px; `;
const Fill = styled.div<{ $width: number }>` position: absolute; top: 0; left: 0; width: ${props => props.$width}%; height: 100%; background: linear-gradient(90deg, #3B82F6, #2563EB); border-radius: 99px; transition: width 0.5s ease-out; `;
const FloatingTag = styled.div` position: absolute; top: -34px; transform: translateX(-50%); background: #2563EB; padding: 4px 10px; border-radius: 8px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3); white-space: nowrap; transition: left 0.5s ease-out; z-index: 10; `;
const TagText = styled.span` color: white; font-size: 13px; font-weight: 800; `;
const TagSubText = styled.span` color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 600; `;
const TagArrow = styled.div` position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background: #2563EB; `;
const MetricsGrid = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; padding: 0 4px; `;
const MetricItem = styled.div` display: flex; flex-direction: column; gap: 6px; `;
const DividerVertical = styled.div` width: 1px; height: 40px; background: #CBD5E1; `;
const Label = styled.span` font-size: 13px; color: #94A3B8; font-weight: 600; text-transform: uppercase; `;
const ValueLarge = styled.div` font-size: 28px; font-weight: 600; color: #1E293B; line-height: 1; letter-spacing: -0.5px; `;
const ValueMedium = styled.div` font-size: 22px; font-weight: 700; color: #334155; line-height: 1; `;
const SubText = styled.span` font-size: 14px; color: #64748B; font-weight: 500; `;
const SubTextFlex = styled(SubText)` display: flex; align-items: center; gap: 6px; margin-top: 2px; `;
const CardGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 16px; `;
const DetailCard = styled.div` background: rgba(248, 250, 252, 0.5); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: transform 0.2s, background-color 0.2s; &:hover { background: rgba(241, 245, 249, 0.8); transform: translateY(-2px); } `;
const IconBox = styled.div` width: 36px; height: 36px; background: #FFFFFF; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); `;
const CardContent = styled.div` display: flex; flex-direction: column; `;
const CardLabel = styled.span` font-size: 12px; color: #94A3B8; font-weight: 700; margin-bottom: 4px; `;
const CardValue = styled.span` font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; `;
const Tag = styled.span<{ $color: string, $bg: string }>` align-self: flex-start; font-size: 11px; font-weight: 600; color: ${props => props.$color}; background: ${props => props.$bg}; padding: 4px 8px; border-radius: 6px; `;
const StatusIndicator = styled.div` position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 40px; height: 4px; background: #22C55E; border-radius: 4px 4px 0 0; box-shadow: 0 -2px 10px rgba(34, 197, 94, 0.6); &::after { content: ''; position: absolute; inset: 0; border-radius: inherit; animation: ${pulse} 2s infinite; } `;