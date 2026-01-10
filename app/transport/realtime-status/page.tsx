"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import axios from "axios";
import { 
  Cloud, Sun, CloudRain, Navigation, Truck, Activity, Bell, 
  AlertTriangle, CheckCircle, Radio, Server, Zap, BarChart2, Siren, 
  MoreHorizontal, Loader, Cpu, Database
} from "lucide-react";
import { format, addMinutes } from "date-fns";
import dynamic from "next/dynamic";
import VehicleStatusCard from "@/components/vehicle-status-card";
// 타입 import
import type { VWorldMarker } from "@/components/vworld-map";

const VWorldMap = dynamic(
  () => import("@/components/vworld-map"),
  { 
    ssr: false,
    loading: () => <div style={{width: '100%', height: '100%', background: '#f1f5f9'}} /> 
  }
);

/* --- Types & Constants --- */

type VehicleStatus = 'Normal' | 'Delayed' | 'Arrived' | 'Maintenance';

interface SimulationVehicle {
  id: string;
  index: number;
  driver: string;
  startPos: { lat: number; lng: number };
  destPos: { lat: number; lng: number };
  totalDistanceKm: number;
  baseDurationSec: number;
  startTime: number;
  delaySec: number;
  status: VehicleStatus;
  cargo: string;
  temp: string;
}

const GOMOTEK_POS = { lat: 35.1487345915681, lng: 128.859885213411, title: "고모텍 부산", imageUrl: "/icons/GMT.png" };
const LG_POS = { lat: 35.2078432680624, lng: 128.666263957419, title: "LG전자", imageUrl: "/icons/LG.jpg" };

const ARROW_ICON = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='%233B82F6' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M12 2l7 19-7-4-7 4 7-19z'/%3e%3c/svg%3e";
const TRUCK_ICON_URL = "/truck-image.png"; 

const INITIAL_VEHICLES: SimulationVehicle[] = [
  { id: 'GMT-101', index: 0, driver: '김철수', startPos: LG_POS, destPos: GOMOTEK_POS, totalDistanceKm: 45, baseDurationSec: 3600, startTime: Date.now() - 2800 * 1000, delaySec: 0, status: 'Normal', cargo: "전자부품 (PCB), 12 PLT", temp: "18°C" },
  { id: 'GMT-102', index: 1, driver: '이영희', startPos: GOMOTEK_POS, destPos: LG_POS, totalDistanceKm: 45, baseDurationSec: 3800, startTime: Date.now() - 1500 * 1000, delaySec: 300, status: 'Delayed', cargo: "사출물, 10 PLT", temp: "22°C" },
  { id: 'GMT-103', index: 2, driver: '박민수', startPos: LG_POS, destPos: GOMOTEK_POS, totalDistanceKm: 45, baseDurationSec: 3500, startTime: Date.now() - 500 * 1000, delaySec: 0, status: 'Normal', cargo: "컴프레서 부품, 8 PLT", temp: "20°C" },
  { id: 'GMT-104', index: 3, driver: '최진호', startPos: GOMOTEK_POS, destPos: LG_POS, totalDistanceKm: 45, baseDurationSec: 3700, startTime: Date.now() - 3200 * 1000, delaySec: 0, status: 'Normal', cargo: "포장재, 20 PLT", temp: "상온" },
  { id: 'GMT-105', index: 4, driver: '정수민', startPos: LG_POS, destPos: GOMOTEK_POS, totalDistanceKm: 45, baseDurationSec: 3600, startTime: Date.now() - 100 * 1000, delaySec: 0, status: 'Normal', cargo: "모터 Ass'y, 6 PLT", temp: "15°C" },
];

const MOCK_ALERTS = [
  { id: 1, time: "16:20", msg: "GMT-102 도착 완료 (LG전자)", type: "success" },
  { id: 2, time: "16:15", msg: "창원대로 구간 정체 감지", type: "warning" },
  { id: 3, time: "16:05", msg: "GMT-105 운행 시작", type: "info" },
];

const useVehicleSimulation = (initialVehicles: SimulationVehicle[]) => {
  const [vehicles, setVehicles] = useState<SimulationVehicle[]>(initialVehicles);
  const [markers, setMarkers] = useState<VWorldMarker[]>([]);
  const [targetVehicleId, setTargetVehicleId] = useState<string | null>(null);
  const vehiclesRef = useRef(initialVehicles);

  const addDelayToVehicle = useCallback((vehicleId: string, seconds: number) => {
    setVehicles(prev => {
      const next = prev.map(v => {
        if (v.id === vehicleId) {
          return { ...v, delaySec: v.delaySec + seconds, status: 'Delayed' as VehicleStatus };
        }
        return v;
      });
      vehiclesRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      
      const currentMarkers: VWorldMarker[] = [
        { ...GOMOTEK_POS, isFacility: true, imageUrl: "/icons/GMT.png" },
        { ...LG_POS, isFacility: true, imageUrl: "/icons/LG.jpg" }
      ];

      let maxProgress = -1;
      let bestVehicleId: string | null = null; 

      vehiclesRef.current.forEach(v => {
        const elapsedSec = (now - v.startTime) / 1000;
        const totalDuration = v.baseDurationSec + v.delaySec;
        let progress = elapsedSec / totalDuration;
        if (progress > 1) progress = 1; 
        if (progress < 0) progress = 0;

        const remainingSec = totalDuration * (1 - progress);
        const arrivalTime = addMinutes(new Date(), remainingSec / 60);
        const etaTime = format(arrivalTime, "HH:mm");
        const remainingMin = Math.ceil(remainingSec / 60);
        const etaString = `${etaTime} (약 ${remainingMin}분 남음)`; 

        const currentLat = v.startPos.lat + (v.destPos.lat - v.startPos.lat) * progress;
        const currentLng = v.startPos.lng + (v.destPos.lng - v.startPos.lng) * progress;

        if (progress < 1 && progress > maxProgress) {
            maxProgress = progress;
            bestVehicleId = v.id;
        }

        const isTarget = v.id === bestVehicleId;

        currentMarkers.push({
          lat: currentLat,
          lng: currentLng,
          title: v.id,
          imageUrl: isTarget ? TRUCK_ICON_URL : ARROW_ICON,
          isFocused: isTarget,
          progress: progress,
          startLat: v.startPos.lat,
          startLng: v.startPos.lng,
          destLat: v.destPos.lat,
          destLng: v.destPos.lng,
          driver: v.driver,
          cargo: v.cargo,
          eta: etaString 
        });
      });

      setMarkers(currentMarkers);
      setTargetVehicleId(bestVehicleId);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return { vehicles, markers, targetVehicleId, addDelayToVehicle };
};

export default function LocalMapPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  // 🟢 로딩 및 퇴장 애니메이션 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false); // 사라지는 중인지 체크
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState({ temp: 0, desc: '-', icon: <Sun size={18} color="#aaa" /> });
  const [hasWarning, setHasWarning] = useState(false);
  
  const { vehicles, markers, targetVehicleId, addDelayToVehicle } = useVehicleSimulation(INITIAL_VEHICLES);

  const targetTruckData = useMemo(() => {
    if (!targetVehicleId) return null;
    const v = vehicles.find(veh => veh.id === targetVehicleId);
    if (!v) return null;

    const marker = markers.find(m => m.title === v.id);
    const progress = marker?.progress || 0;
    
    const totalDuration = v.baseDurationSec + v.delaySec;
    const remainingSec = totalDuration * (1 - progress);
    const arrivalTime = addMinutes(new Date(), remainingSec / 60);

    return {
      vehicleId: v.id,
      imageUrl: "/truck-image.png",
      departure: v.startPos === GOMOTEK_POS ? "GOMOTEK Busan" : "LG Electronics",
      arrival: v.destPos === GOMOTEK_POS ? "GOMOTEK Busan" : "LG Electronics",
      progress: Math.floor(progress * 100),
      eta: format(arrivalTime, "HH:mm"),
      remainingTime: `${Math.ceil(remainingSec / 60)} 분 남음`,
      distanceLeft: `${(v.totalDistanceKm * (1 - progress)).toFixed(1)} km`,
      speed: 82, 
      cargoInfo: v.cargo,
      temperature: v.temp,
      driverName: v.driver,
      driverStatus: v.status === 'Delayed' ? '운행 중 (지연)' : '운행 중 (정상)'
    };
  }, [vehicles, markers, targetVehicleId]);

  const etaDisplay = useMemo(() => {
    const toLG = targetTruckData?.arrival.includes("LG") 
      ? parseInt(targetTruckData.remainingTime) * 60 
      : 1920; 
    const toBusan = targetTruckData?.arrival.includes("Busan")
      ? parseInt(targetTruckData.remainingTime) * 60
      : 2450;
    
    return { toLG, toBusan };
  }, [targetTruckData]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return h > 0 ? `${h}시간 ${rm}분` : `${m}분`;
  }

  // 🟢 로딩 시뮬레이션 및 부드러운 퇴장 로직
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // 100% 도달 시 퇴장 애니메이션 시작 (0.8초간 Fade Out)
          setIsExiting(true);
          setTimeout(() => {
            setIsLoading(false); // 완전히 DOM에서 제거
          }, 800); 
          return 100;
        }
        return prev + 2; // 진행 속도
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const fetchWeather = async () => {
      try {
        const res = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=35.22&longitude=128.68&current_weather=true&timezone=auto');
        const d = res.data.current_weather;
        let desc = '맑음', icon = <Sun size={18} color="#FDB813" />;
        if (d.weathercode >= 1 && d.weathercode <= 3) { desc = '구름 많음'; icon = <Cloud size={18} color="#A0A0A0" />; }
        else if (d.weathercode >= 51) { desc = '비/눈'; icon = <CloudRain size={18} color="#60A5FA" />; }
        setWeather({ temp: Math.round(d.temperature), desc, icon });
      } catch { }
    };
    fetchWeather();

    const warningTimer = setTimeout(() => {
      setHasWarning(true);
      addDelayToVehicle('GMT-102', 900);
      addDelayToVehicle('GMT-104', 900);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(warningTimer);
    };
  }, [addDelayToVehicle]);

  if (!isMounted) return null;

  return (
    <>
      {/* 🟢 로딩 오버레이 (isExiting 상태에 따라 투명도 변화) */}
      {isLoading && (
        <LoadingOverlay $isExiting={isExiting}>
          <LoadingContent>
            
            {/* 타이틀 영역: 심플하고 가독성 높게 */}
            <TitleWrapper>
              <Cpu size={32} color="#ef4444" strokeWidth={2.5} />
              <div>
                <MainTitle>AI LOGISTICS SYSTEM</MainTitle>
                <SubTitleText>Real-time Fleet Management</SubTitleText>
              </div>
            </TitleWrapper>

            {/* 트럭 애니메이션 */}
            <TruckAnimation>
              <DataWave />
              <Truck size={56} color="#ef4444" className="truck-icon" strokeWidth={1.5} />
              <div className="speed-lines">
                <span></span><span></span><span></span>
              </div>
            </TruckAnimation>

            {/* 프로그래스 바 영역 */}
            <ProgressWrapper>
              <LoadingLabel>
                <span>SYSTEM INITIALIZING</span>
                <span className="percent">{loadingProgress}%</span>
              </LoadingLabel>
              <ProgressBarContainer>
                <ProgressBarFill style={{ width: `${loadingProgress}%` }} />
              </ProgressBarContainer>
              <LoadingSubText>
                <Database size={10} /> Fetching vehicle data from server...
              </LoadingSubText>
            </ProgressWrapper>

          </LoadingContent>
        </LoadingOverlay>
      )}
      
      <Container>
        {/* ... (이하 기존 대시보드 코드 동일) ... */}
        <MapWrapper>
          <VWorldMap 
            markers={markers} 
            focusedTitle={targetVehicleId}
          />
        </MapWrapper>

        <TopLeftWidget>
          <KpiHeader>
            <Activity size={16} color="#3b82f6" />
            <span>Fleet KPI Dashboard</span>
            <LiveBadge>LIVE</LiveBadge>
          </KpiHeader>
          <KpiGrid>
            <KpiItem label="가동률" value="98.5" unit="%" trend="▲ 1.2%" trendColor="#10b981" />
            <div className="divider" />
            <KpiItem label="정시 도착" value="96" unit="%" trend="▼ 2.0%" trendColor="#ef4444" />
            <div className="divider" />
            <KpiItem label="평균 속도" value="78" unit="km/h" trend="-" trendColor="#94a3b8" />
          </KpiGrid>
        </TopLeftWidget>

        <VehicleListWidget>
          <div className="header">
            <Truck size={16} /> 운행 차량 현황 ({vehicles.length})
          </div>
          <div className="list-container">
            {vehicles.map((v) => {
              const m = markers.find(mark => mark.title === v.id);
              const progressPct = Math.floor((m?.progress || 0) * 100);
              const isDelayed = v.status === 'Delayed';
              return (
                <VehicleListItem key={v.id} $active={v.id === targetVehicleId}>
                  <div className="row-top">
                    <div className="v-id">{v.id}</div>
                    <StatusTag $status={v.status}>{isDelayed ? 'Delayed' : 'On Route'}</StatusTag>
                  </div>
                  <div className="route-info">
                    {v.startPos === GOMOTEK_POS ? 'BUSAN' : 'LG'} <MoreHorizontal size={10} /> {v.destPos === GOMOTEK_POS ? 'BUSAN' : 'LG'}
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progressPct}%`, background: isDelayed ? '#F59E0B' : '#3B82F6' }} />
                  </div>
                  <div className="meta-row">
                    <span>{progressPct}% 완료</span>
                    <span>{m?.progress && m.progress >= 1 ? '도착' : '운행중'}</span>
                  </div>
                </VehicleListItem>
              )
            })}
          </div>
        </VehicleListWidget>

        {targetTruckData && (
          <CardOverlay>
            <VehicleStatusCard {...targetTruckData} />
          </CardOverlay>
        )}

        <RightColumn>
          <StatusWidget>
            <TimeRow>
              <div className="time">{currentTime ? format(currentTime, "HH:mm") : "00:00"}</div>
              <div className="date">{currentTime ? format(currentTime, "yyyy.MM.dd (EEE)") : "-"}</div>
            </TimeRow>
            <WeatherRow>
              <div className="temp-box">
                {weather.icon} <span>{weather.temp}°C</span>
              </div>
              <span className="desc">{weather.desc}</span>
            </WeatherRow>
            <EtaBox>
              <EtaRow>
                <div className="route"><Navigation size={12} color="#1E40AF" /> <span>고모텍 → LG</span></div>
                <div className="time">{formatDuration(etaDisplay.toLG)}</div>
              </EtaRow>
              <div className="line" />
              <EtaRow>
                <div className="route"><Navigation size={12} color="#1E40AF" /> <span>LG → 고모텍</span></div>
                <div className="time">{formatDuration(etaDisplay.toBusan)}</div>
              </EtaRow>
            </EtaBox>
          </StatusWidget>

          <AlertWidget>
            <WidgetTitle>
              <Bell size={16} /> 실시간 알림 <span className="count">3</span>
            </WidgetTitle>
            <AlertList>
              {MOCK_ALERTS.map((alert) => (
                <AlertItem key={alert.id} $type={alert.type}>
                  <div className="icon-wrapper">
                    {alert.type === 'success' && <CheckCircle size={14} />}
                    {alert.type === 'warning' && <AlertTriangle size={14} />}
                    {alert.type === 'info' && <Radio size={14} />}
                  </div>
                  <div className="content">
                    <span className={`msg ${alert.msg.includes("정체") ? 'alert-red' : ''}`}>{alert.msg}</span>
                    <span className="time">{alert.time}</span>
                  </div>
                </AlertItem>
              ))}
            </AlertList>
          </AlertWidget>

          <AnalyticsWidget>
            <WidgetTitle><BarChart2 size={16} /> 통합 운영 현황</WidgetTitle>
            <ChartRow>
              <DonutContainer>
                <svg viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray="60, 100" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="3" strokeDasharray="20, 100" strokeDashoffset="-60" />
                </svg>
                <div className="center-text">
                  <span className="num">5</span>
                  <span className="label">Total</span>
                </div>
              </DonutContainer>
              <LegendBox>
                <div className="item"><span className="dot" style={{ background: '#3B82F6' }} /> 운행중 (3)</div>
                <div className="item"><span className="dot" style={{ background: '#22C55E' }} /> 대기 (1)</div>
                <div className="item"><span className="dot" style={{ background: '#E2E8F0' }} /> 점검 (1)</div>
              </LegendBox>
            </ChartRow>
            <div>
              <SubTitle>연료 효율 추이 (Daily)</SubTitle>
              <svg width="100%" height="40" viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,50 Q20,40 40,30 T80,25 T120,40 T160,15 T200,30 V60 H0 Z" fill="url(#chartGrad)" />
                <path d="M0,50 Q20,40 40,30 T80,25 T120,40 T160,15 T200,30" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </AnalyticsWidget>

          <ServerWidget>
            <div className="row">
              <div className="label"><Server size={12} /> API Latency</div>
              <div className="val ok">12ms</div>
            </div>
            <div className="row">
              <div className="label"><Zap size={12} /> System Uptime</div>
              <div className="val">99.9%</div>
            </div>
          </ServerWidget>
        </RightColumn>

        {hasWarning && (
          <WarningBanner>
            <SirenIconWrapper>
              <Siren size={24} color="#fff" />
            </SirenIconWrapper>
            <WarningContent>
              <div className="title">구간 정체 경고 (Traffic Jam Alert)</div>
              <div className="desc">
                현재 <strong>창원 터널</strong> 구간 정체 감지 (확률 82%)<br/>
                <span style={{fontSize: '12px', fontWeight: 400, opacity: 0.8}}>예상 도착 시간이 재계산 되었습니다. (+15분)</span>
              </div>
            </WarningContent>
          </WarningBanner>
        )}

        <BottomPanel>
          <BottomGroup>
            <div className="item active"><Truck size={16} /> 운행: 5대</div>
            <div className="divider" />
            <div className="item"><Activity size={16} /> 상태: 정상</div>
            <div className="divider" />
            <div className="item"><Navigation size={16} /> 경로 최적화: ON</div>
          </BottomGroup>
          <SystemTicker>
            <span className="dot"></span> Updated: {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
          </SystemTicker>
        </BottomPanel>
      </Container>
    </>
  );
}

/* --- Sub Components --- */
const KpiItem = React.memo(({ label, value, unit, trend, trendColor }: any) => (
  <StyledKpiItem>
    <div className="label">{label}</div>
    <div className="value">{value}<span className="unit">{unit}</span></div>
    <div className="trend" style={{ color: trendColor }}>{trend}</div>
  </StyledKpiItem>
));
KpiItem.displayName = 'KpiItem';

/* --- Styles (기존과 동일 + 로딩 스타일 추가) --- */
const Container = styled.div`
  width: 100vw; height: calc(100vh - 64px); position: relative; overflow: hidden; background: #f8fafc; font-family: 'Pretendard', sans-serif;
`;
const MapWrapper = styled.div`position: absolute; inset: 0; z-index: 0;`;

const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); color: #1e293b; transition: all 0.3s ease;
  &:hover { background: rgba(255, 255, 255, 0.9); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); }
`;

const slideDown = keyframes`from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); }`;
const TopLeftWidget = styled(GlassCard)`
  position: absolute; top: 24px; left: 24px; padding: 20px; z-index: 100; width: 340px; animation: ${slideDown} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;
const KpiHeader = styled.div`display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 16px;`;
const LiveBadge = styled.span`margin-left: auto; background: #fee2e2; color: #ef4444; font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 800; animation: pulseRed 2s infinite; @keyframes pulseRed { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }`;
const KpiGrid = styled.div`display: flex; justify-content: space-between; .divider { width: 1px; background: #e2e8f0; height: 40px; }`;
const StyledKpiItem = styled.div`
  display: flex; flex-direction: column; gap: 4px; .label { font-size: 12px; color: #94a3b8; font-weight: 600; } .value { font-size: 20px; font-weight: 800; color: #0f172a; .unit { font-size: 12px; color: #64748b; margin-left: 2px; } } .trend { font-size: 11px; font-weight: 700; }
`;

const slideUp = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;
const VehicleListWidget = styled(GlassCard)`
  position: absolute; bottom: 84px; left: 24px; width: 340px; max-height: 35vh; z-index: 95; display: flex; flex-direction: column; overflow: hidden; animation: ${slideUp} 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;
  .header { padding: 12px 16px; font-size: 14px; font-weight: 700; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; background: rgba(248,250,252,0.5); }
  .list-container { overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } }
`;
const VehicleListItem = styled.div<{ $active: boolean }>`
  padding: 10px; background: ${props => props.$active ? '#fff' : 'rgba(255,255,255,0.4)'}; border-radius: 10px; border: ${props => props.$active ? '1px solid #3B82F6' : '1px solid transparent'}; box-shadow: ${props => props.$active ? '0 4px 12px rgba(59, 130, 246, 0.1)' : 'none'}; transition: all 0.2s;
  .row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .v-id { font-weight: 700; font-size: 13px; color: #1e293b; }
  .route-info { font-size: 11px; color: #64748b; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
  .progress-track { width: 100%; height: 4px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-bottom: 4px; }
  .progress-fill { height: 100%; transition: width 0.3s ease; border-radius: 99px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-weight: 600; }
`;
const StatusTag = styled.span<{ $status: VehicleStatus }>`
  font-size: 9px; padding: 1px 5px; border-radius: 4px; font-weight: 700;
  ${props => props.$status === 'Delayed' ? `background: #fef3c7; color: #d97706;` : `background: #dbeafe; color: #2563eb;`}
`;

const slideRight = keyframes`from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); }`;
const CardOverlay = styled.div`
  position: absolute; top: 200px; left: 24px; z-index: 100; width: 340px; animation: ${slideRight} 0.6s 0.1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0;
`;

const slideLeft = keyframes`from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); }`;
const RightColumn = styled.div`
  position: absolute; top: 24px; right: 24px; width: 280px; display: flex; flex-direction: column; gap: 12px; z-index: 100; animation: ${slideLeft} 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;
const StatusWidget = styled(GlassCard)`padding: 16px; display: flex; flex-direction: column; gap: 12px;`;
const TimeRow = styled.div`
  display: flex; justify-content: space-between; align-items: baseline;
  .time { font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1; color: #0f172a; }
  .date { font-size: 12px; color: #64748b; font-weight: 600; }
`;
const WeatherRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; background: rgba(241,245,249,0.6); padding: 8px 12px; border-radius: 8px;
  .temp-box { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 700; }
  .desc { font-size: 11px; color: #64748b; }
`;
const EtaBox = styled.div`background: rgba(241, 245, 249, 0.6); border-radius: 10px; padding: 10px; border: 1px solid rgba(255,255,255,0.4); .line { height: 1px; background: rgba(0,0,0,0.05); margin: 6px 0; }`;
const EtaRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 600; 
  .route { display: flex; align-items: center; gap: 4px; color: #475569; } 
  .time { color: #2563eb; background: rgba(37,99,235,0.1); padding: 2px 6px; border-radius: 4px; }
`;

const AlertWidget = styled(GlassCard)`padding: 16px; display: flex; flex-direction: column; gap: 10px;`;
const WidgetTitle = styled.div`font-size: 13px; font-weight: 700; color: #64748b; display: flex; align-items: center; gap: 6px; .count { background: #ef4444; color: white; font-size: 10px; padding: 1px 6px; border-radius: 99px; }`;
const AlertList = styled.div`display: flex; flex-direction: column; gap: 8px; max-height: 150px; overflow-y: auto; &::-webkit-scrollbar { width: 3px; }`;
const AlertItem = styled.div<{ $type: string }>`
  display: flex; gap: 8px; padding: 8px; background: rgba(255,255,255,0.5); border-radius: 8px; border: 1px solid rgba(255,255,255,0.5);
  .icon-wrapper { margin-top: 2px; color: ${props => props.$type === 'warning' ? '#f59e0b' : props.$type === 'success' ? '#22c55e' : '#3b82f6'}; }
  .content { display: flex; flex-direction: column; gap: 1px; flex: 1; }
  .msg { font-size: 11px; font-weight: 600; color: #334155; line-height: 1.3; } .msg.alert-red { color: #ef4444; font-weight: 800; }
  .time { font-size: 10px; color: #94a3b8; }
`;

const AnalyticsWidget = styled(GlassCard)`padding: 16px; display: flex; flex-direction: column; gap: 12px;`;
const ChartRow = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 10px;`;
const DonutContainer = styled.div`
  position: relative; width: 60px; height: 60px; flex-shrink: 0; svg { transform: rotate(-90deg); width: 100%; height: 100%; }
  .center-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .num { font-size: 16px; font-weight: 800; color: #1e293b; line-height: 1; } .label { font-size: 8px; font-weight: 600; color: #94a3b8; }
`;
const LegendBox = styled.div`
  display: flex; flex-direction: column; gap: 4px; font-size: 10px; font-weight: 600; .item { display: flex; align-items: center; gap: 6px; color: #475569; } .dot { width: 6px; height: 6px; border-radius: 50%; }
`;
const SubTitle = styled.div`font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 4px;`;

const ServerWidget = styled(GlassCard)`
  padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; .row { display: flex; flex-direction: column; gap: 1px; } .label { font-size: 11px; font-weight: 500; color: #64748b; display: flex; align-items: center; gap: 4px; } .val { font-size: 13px; font-weight: 700; color: #334155; } .val.ok { color: #10b981; }
`;

const slideUpBottom = keyframes`from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); }`;
const BottomPanel = styled(GlassCard)`
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 20px; padding: 10px 24px; animation: ${slideUpBottom} 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 100; opacity: 0;
`;
const BottomGroup = styled.div`
  display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 600; color: #475569; .item { display: flex; align-items: center; gap: 6px; } .item.active { color: #2563eb; } .divider { width: 1px; height: 10px; background: #cbd5e1; }
`;
const SystemTicker = styled.div`
  display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; color: #94a3b8; padding-left: 20px; border-left: 1px solid #e2e8f0; .dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; animation: pulseGreen 2s infinite; }
  @keyframes pulseGreen { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
`;

const bannerSlideUp = keyframes`from { opacity: 0; transform: translate(-50%, 50px); } to { opacity: 1; transform: translate(-50%, 0); }`;
const WarningBanner = styled.div`
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; background: rgba(220, 38, 38, 0.95); backdrop-filter: blur(12px); padding: 14px 20px; border-radius: 12px; box-shadow: 0 10px 40px rgba(220, 38, 38, 0.4); z-index: 200; min-width: 420px; animation: ${bannerSlideUp} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid rgba(255,255,255,0.2);
`;
const SirenIconWrapper = styled.div`
  width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: sirenPulse 1s infinite; @keyframes sirenPulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
`;
const WarningContent = styled.div`
  color: white; .title { font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; } .desc { font-size: 12px; font-weight: 500; line-height: 1.4; }
`;

// --- New Loading Styles (Enhanced Readability & Fade Out) ---

const truckMove = keyframes`
  0% { transform: translateX(-10px) translateY(0px); }
  50% { transform: translateX(10px) translateY(-2px); }
  100% { transform: translateX(-10px) translateY(0px); }
`;

const LoadingOverlay = styled.div<{ $isExiting: boolean }>`
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: #ffffff;
  /* Subtle grid pattern for tech feel without clutter */
  background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
  background-size: 24px 24px;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  
  /* Fade out transition */
  opacity: ${props => props.$isExiting ? 0 : 1};
  transition: opacity 0.8s ease-in-out;
  pointer-events: ${props => props.$isExiting ? 'none' : 'all'};
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const MainTitle = styled.h1`
  font-size: 28px;
  font-weight: 900;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.5px;
`;

const SubTitleText = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const TruckAnimation = styled.div`
  position: relative;
  animation: ${truckMove} 2s ease-in-out infinite;
  margin-bottom: 8px;
  
  .truck-icon {
    filter: drop-shadow(0 10px 10px rgba(239, 68, 68, 0.2));
    z-index: 2;
    position: relative;
  }

  .speed-lines {
    position: absolute;
    top: 60%;
    right: 100%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 8px;
    
    span {
      height: 3px;
      background: #ef4444;
      border-radius: 99px;
      animation: dash 0.8s linear infinite;
      opacity: 0;
      
      &:nth-child(1) { animation-delay: 0s; width: 24px; align-self: flex-end; }
      &:nth-child(2) { animation-delay: 0.15s; width: 16px; align-self: flex-end; }
      &:nth-child(3) { animation-delay: 0.3s; width: 32px; align-self: flex-end; }
    }
  }

  @keyframes dash {
    0% { transform: translateX(10px); opacity: 0; }
    40% { opacity: 0.8; }
    100% { transform: translateX(-30px); opacity: 0; }
  }
`;

const DataWave = styled.div`
  position: absolute;
  top: 50%; left: 50%;
  width: 100px; height: 100px;
  border: 1px solid #ef4444;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  opacity: 0;
  animation: wave 2s infinite cubic-bezier(0, 0.55, 0.45, 1);
  z-index: 0;

  @keyframes wave {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.5; }
    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
  }
`;

const ProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 280px;
`;

const LoadingLabel = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;

  .percent {
    color: #ef4444;
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
  position: relative;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: #ef4444;
  border-radius: 99px;
  transition: width 0.1s linear;
  position: relative;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
`;

const LoadingSubText = styled.div`
  margin-top: 4px;
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
`;