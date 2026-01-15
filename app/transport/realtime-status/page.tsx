"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import axios from "axios";
import { 
  Cloud, Sun, CloudRain, Navigation, Truck, Activity, Bell, 
  AlertTriangle, CheckCircle, Radio, BarChart2, Siren, 
  MoreHorizontal, User, Clock, ArrowRight, Calendar
} from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import VehicleStatusCard from "@/components/vehicle-status-card";
import type { VWorldMarker } from "@/components/vworld-map";

// --- [Dynamic Import] VWorld Map ---
const VWorldMap = dynamic(
  () => import("@/components/vworld-map"),
  { 
    ssr: false,
    loading: () => <div style={{width: '100%', height: '100%', background: '#f8fafc'}} /> 
  }
);

/* --- Types & Constants --- */

type VehicleStatus = 'Normal' | 'Delayed' | 'Arrived' | 'Maintenance';

interface SimulationVehicle {
  id: string;
  index: number;
  driver: string;
  startPos: { lat: number; lng: number; title: string };
  destPos: { lat: number; lng: number; title: string };
  totalDistanceKm: number;
  baseDurationSec: number;
  startTime: number;
  delaySec: number;
  status: VehicleStatus;
  cargo: string;
  temp: string;
}

const GOMOTEK_POS = { lat: 35.1487345915681, lng: 128.859885213419, title: "고모텍 부산", imageUrl: "/icons/GMT.png" };
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
  { id: 4, time: "15:50", msg: "물류 센터 입고 지연 예상", type: "warning" },
  { id: 5, time: "15:30", msg: "오후 배차 계획 확정", type: "info" },
];

const fastFormatTime = (date: Date) => {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}`;
};

// --- [Hook] Vehicle Simulation ---
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
    let lastFrameTime = 0;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    const baseMarkers = [
      { ...GOMOTEK_POS, isFacility: true, imageUrl: "/icons/GMT.png" },
      { ...LG_POS, isFacility: true, imageUrl: "/icons/LG.jpg" }
    ];

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTime;
      
      if (deltaTime >= FRAME_INTERVAL) {
        lastFrameTime = timestamp - (deltaTime % FRAME_INTERVAL);

        const now = Date.now();
        const currentVehicles = vehiclesRef.current;
        const currentMarkers: VWorldMarker[] = new Array(baseMarkers.length + currentVehicles.length);
        
        currentMarkers[0] = baseMarkers[0];
        currentMarkers[1] = baseMarkers[1];

        let maxProgress = -1;
        let bestVehicleId: string | null = null; 
        
        for (let i = 0; i < currentVehicles.length; i++) {
          const v = currentVehicles[i];
          const elapsedSec = (now - v.startTime) / 1000;
          const totalDuration = v.baseDurationSec + v.delaySec;
          let progress = elapsedSec / totalDuration;
          
          if (progress > 1) progress = 1; 
          if (progress < 0) progress = 0;

          const remainingSec = totalDuration * (1 - progress);
          const arrivalTimeMs = now + (remainingSec * 1000);
          const arrivalDate = new Date(arrivalTimeMs); 
          const etaTime = fastFormatTime(arrivalDate);
          const remainingMin = (remainingSec / 60) | 0;
          const etaString = `${etaTime} (약 ${remainingMin + 1}분 남음)`; 

          const currentLat = v.startPos.lat + (v.destPos.lat - v.startPos.lat) * progress;
          const currentLng = v.startPos.lng + (v.destPos.lng - v.startPos.lng) * progress;

          if (progress < 1 && progress > maxProgress) {
              maxProgress = progress;
              bestVehicleId = v.id;
          }

          const isTarget = v.id === bestVehicleId;
          const isLgToGomotek = v.startPos.title.includes("LG");

          currentMarkers[i + 2] = {
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
            eta: etaString,
            flip: isLgToGomotek, 
            rotation: 0 
          } as VWorldMarker; 
        }

        setMarkers(currentMarkers);
        setTargetVehicleId(bestVehicleId);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return { vehicles, markers, targetVehicleId, addDelayToVehicle };
};

// ─── [Components] ───

// 1. KPI Widget
const KpiItem = React.memo(({ label, value, unit, trend, trendColor }: any) => (
  <StyledKpiItem>
    <div className="label">{label}</div>
    <div className="value">{value}<span className="unit">{unit}</span></div>
    <div className="trend" style={{ color: trendColor }}>{trend}</div>
  </StyledKpiItem>
));
KpiItem.displayName = 'KpiItem';

const KpiWidget = React.memo(() => (
  <KpiWidgetBox>
    <KpiHeader>
      <Activity size={20} color="#3b82f6" />
      <span>실시간 운행 지표</span>
      <LiveBadge>LIVE</LiveBadge>
    </KpiHeader>
    <KpiGrid>
      <KpiItem label="차량 가동률" value="98.5" unit="%" trend="▲ 1.2%" trendColor="#10b981" />
      <div className="divider" />
      <KpiItem label="정시 도착률" value="96" unit="%" trend="▼ 2.0%" trendColor="#ef4444" />
      <div className="divider" />
      <KpiItem label="평균 속도" value="78" unit="km/h" trend="-" trendColor="#94a3b8" />
    </KpiGrid>
  </KpiWidgetBox>
));
KpiWidget.displayName = "KpiWidget";

// 2. Right Panel Components
const RightInfoPanel = React.memo(({ 
  currentTime, 
  weather, 
  etaDisplay, 
  formatDuration 
}: any) => (
  <RightColumn>
    <StatusWidget>
      <TimeRow>
        <div className="time">{currentTime ? format(currentTime, "HH:mm") : "00:00"}</div>
        <div className="date">
          <Calendar size={16} style={{ marginRight: 6 }} />
          {currentTime ? format(currentTime, "yyyy.MM.dd (EEE)") : "-"}
        </div>
      </TimeRow>
      <WeatherRow>
        <div className="temp-box">
          {weather.icon} <span>{weather.temp}°C</span>
        </div>
        <span className="desc">{weather.desc}</span>
      </WeatherRow>
      <EtaBox>
        <div className="box-title">구간별 평균 소요 시간</div>
        <EtaRow>
          <div className="route"><Navigation size={14} color="#1E40AF" /> <span>고모텍 → LG전자</span></div>
          <div className="time">{formatDuration(etaDisplay.toLG)}</div>
        </EtaRow>
        <div className="line" />
        <EtaRow>
          <div className="route"><Navigation size={14} color="#1E40AF" /> <span>LG전자 → 고모텍</span></div>
          <div className="time">{formatDuration(etaDisplay.toBusan)}</div>
        </EtaRow>
      </EtaBox>
    </StatusWidget>

    <AlertWidget>
      <WidgetTitle>
        <Bell size={18} /> 실시간 알림 <span className="count">5</span>
      </WidgetTitle>
      <AlertList>
        {MOCK_ALERTS.map((alert) => (
          <AlertItem key={alert.id} $type={alert.type}>
            <div className="icon-wrapper">
              {alert.type === 'success' && <CheckCircle size={16} />}
              {alert.type === 'warning' && <AlertTriangle size={16} />}
              {alert.type === 'info' && <Radio size={16} />}
            </div>
            <div className="content">
              <span className={`msg ${alert.msg.includes("정체") ? 'alert-red' : ''}`}>{alert.msg}</span>
              <span className="time">{alert.time}</span>
            </div>
          </AlertItem>
        ))}
      </AlertList>
    </AlertWidget>

    {/* 🟢 [수정됨] 초간소화된 통합 운영 현황 */}
    <AnalyticsWidget>
      <WidgetTitle><BarChart2 size={18} /> 통합 운영 현황</WidgetTitle>
      <CompactTable>
        <thead>
          <tr>
            <th style={{width: '40%'}}>상태</th>
            <th style={{width: '30%', textAlign: 'center'}}>차량</th>
            <th style={{width: '30%', textAlign: 'right'}}>비율</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="status"><span className="dot blue" /> 운행중</td>
            <td className="count">3</td>
            <td className="ratio">60%</td>
          </tr>
          <tr>
            <td className="status"><span className="dot green" /> 대기중</td>
            <td className="count">1</td>
            <td className="ratio">20%</td>
          </tr>
          <tr>
            <td className="status"><span className="dot gray" /> 점검중</td>
            <td className="count">1</td>
            <td className="ratio">20%</td>
          </tr>
        </tbody>
      </CompactTable>
    </AnalyticsWidget>
  </RightColumn>
));
RightInfoPanel.displayName = "RightInfoPanel";

// 3. Top Control
const TopControlPanel = React.memo(({ currentTime }: { currentTime: Date | null }) => (
  <TopPanel>
    <TopGroup>
      <div className="item active"><Truck size={18} /> 운행: 5대</div>
      <div className="divider" />
      <div className="item"><Activity size={18} /> 상태: 정상</div>
      <div className="divider" />
      <div className="item"><Navigation size={18} /> 경로 최적화: ON</div>
    </TopGroup>
    <SystemTicker>
      <span className="dot"></span> Updated: {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
    </SystemTicker>
  </TopPanel>
));
TopControlPanel.displayName = "TopControlPanel";

// ─── [Main Page] ───

export default function LocalMapPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState({ temp: 0, desc: '-', icon: <Sun size={24} color="#aaa" /> });
  const [hasWarning, setHasWarning] = useState(false);
  
  const { vehicles, markers, targetVehicleId, addDelayToVehicle } = useVehicleSimulation(INITIAL_VEHICLES);

  const markerMap = useMemo(() => {
    const map = new Map<string, VWorldMarker>();
    for (const m of markers) {
      if(m.title) map.set(m.title, m);
    }
    return map;
  }, [markers]);

  const targetTruckData = useMemo(() => {
    if (!targetVehicleId) return null;
    const v = vehicles.find(veh => veh.id === targetVehicleId);
    if (!v) return null;

    const marker = markerMap.get(v.id);
    const progress = marker?.progress || 0;
    const totalDuration = v.baseDurationSec + v.delaySec;
    const remainingSec = totalDuration * (1 - progress);
    const arrivalTimeMs = Date.now() + (remainingSec * 1000);
    const arrivalDate = new Date(arrivalTimeMs);

    return {
      vehicleId: v.id,
      imageUrl: "/truck-image.png",
      departure: v.startPos.title.includes("LG") ? "LG전자" : "고모텍 공장",
      arrival: v.destPos.title.includes("LG") ? "LG전자" : "고모텍 공장",
      progress: Math.floor(progress * 100),
      eta: fastFormatTime(arrivalDate),
      remainingTime: `${Math.ceil(remainingSec / 60)}분`,
      distanceLeft: `${(v.totalDistanceKm * (1 - progress)).toFixed(1)} km`,
      speed: 82, 
      cargoInfo: v.cargo,
      temperature: v.temp,
      driverName: v.driver,
      driverStatus: v.status === 'Delayed' ? '운행 중 (지연)' : '운행 중 (정상)'
    };
  }, [vehicles, markerMap, targetVehicleId]);

  const etaDisplay = useMemo(() => {
    const toLG = targetTruckData?.arrival.includes("LG") 
      ? parseInt(targetTruckData.remainingTime) * 60 
      : 1920; 
    const toBusan = targetTruckData?.arrival.includes("고모텍")
      ? parseInt(targetTruckData.remainingTime) * 60
      : 2450;
    return { toLG, toBusan };
  }, [targetTruckData]);

  const formatDuration = useCallback((sec: number) => {
    const m = (sec / 60) | 0;
    const h = (m / 60) | 0;
    const rm = m % 60;
    return h > 0 ? `${h}시간 ${rm}분` : `${m}분`;
  }, []);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const fetchWeather = async () => {
      try {
        const res = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=35.22&longitude=128.68&current_weather=true&timezone=auto');
        const d = res.data.current_weather;
        let desc = '맑음', icon = <Sun size={24} color="#FDB813" />;
        if (d.weathercode >= 1 && d.weathercode <= 3) { desc = '구름 많음'; icon = <Cloud size={24} color="#A0A0A0" />; }
        else if (d.weathercode >= 51) { desc = '비/눈'; icon = <CloudRain size={24} color="#60A5FA" />; }
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
    <Container>
      <MapWrapper>
        {/* 🟢 [수정됨] fit 옵션에 padding을 조정하여 초기 카메라 위치를 좌측으로 이동 */}
        <VWorldMap markers={markers} focusedTitle={targetVehicleId} />
      </MapWrapper>

      <TopControlPanel currentTime={currentTime} />

      {/* 🟢 [좌측 패널] - top 24px로 상향 조정 */}
      <LeftControlPanel>
        <KpiWidget />

        {targetTruckData && (
          <DetailCardWrapper>
            <VehicleStatusCard {...targetTruckData} />
          </DetailCardWrapper>
        )}

        <VehicleListWidget>
          <div className="header">
            <Truck size={20} strokeWidth={2.5} color="#3b82f6" />
            <span>전체 운행 현황 ({vehicles.length}대)</span>
          </div>
          <div className="list-container">
            {vehicles.map((v) => {
              const m = markerMap.get(v.id);
              const progress = m?.progress || 0;
              const progressPct = Math.floor(progress * 100);
              const isDelayed = v.status === 'Delayed';
              const isFinished = progress >= 1;
              
              const remainingSec = (v.baseDurationSec + v.delaySec) * (1 - progress);
              const remainingMin = Math.ceil(remainingSec / 60);

              const startText = v.startPos.title.includes("LG") ? "LG전자" : "고모텍";
              const destText = v.destPos.title.includes("LG") ? "LG전자" : "고모텍";

              return (
                // 🟢 [수정됨] 더욱 슬림해진 리스트 아이템
                <VehicleListItem key={v.id} $active={v.id === targetVehicleId} $isDelayed={isDelayed}>
                  <div className="main-row">
                    <div className="info">
                      <div className="id-row">
                        <span className="v-id">{v.id}</span>
                        <span className={`status ${isDelayed ? 'delayed' : 'normal'}`}>
                          {isDelayed ? '지연' : '정상'}
                        </span>
                      </div>
                      <div className="route-text">
                        {startText} <ArrowRight size={12} /> {destText}
                      </div>
                    </div>
                    <div className="progress-info">
                      <div className="time">{isFinished ? "도착" : `${remainingMin}분 후`}</div>
                      <div className="pct">{progressPct}%</div>
                    </div>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="fill" style={{ width: `${progressPct}%`, background: isDelayed ? '#F59E0B' : '#3B82F6' }} />
                  </div>
                </VehicleListItem>
              );
            })}
          </div>
        </VehicleListWidget>
      </LeftControlPanel>

      {/* 🟢 [우측 패널] - top 24px로 상향 조정 */}
      <RightInfoPanel 
          currentTime={currentTime}
          weather={weather}
          etaDisplay={etaDisplay}
          formatDuration={formatDuration}
      />

      {hasWarning && (
        <WarningBanner>
          <SirenIconWrapper>
            <Siren size={28} color="#fff" />
          </SirenIconWrapper>
          <WarningContent>
            <div className="title">구간 정체 경고 (Traffic Jam Alert)</div>
            <div className="desc">
              현재 <strong>창원 터널</strong> 구간 정체 감지 (확률 82%)<br/>
              <span style={{fontSize: '13px', fontWeight: 400, opacity: 0.85}}>예상 도착 시간이 재계산 되었습니다. (+15분)</span>
            </div>
          </WarningContent>
        </WarningBanner>
      )}

    </Container>
  );
}

// ─── [Styles] ───

const Container = styled.div`
  width: 100vw; height: calc(100vh - 64px); position: relative; overflow: hidden; background: #f8fafc; font-family: 'Pretendard', sans-serif;
`;
const MapWrapper = styled.div`position: absolute; inset: 0; z-index: 0;`;

const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); color: #1e293b; transition: all 0.3s ease;
  &:hover { background: rgba(255, 255, 255, 0.98); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); }
`;

// [Top Panel] - 화면 상단 중앙
const TopPanel = styled(GlassCard)`
  position: absolute; top: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 24px; padding: 14px 32px; z-index: 200;
  animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;
const TopGroup = styled.div`
  display: flex; align-items: center; gap: 20px; font-size: 15px; font-weight: 700; color: #475569; .item { display: flex; align-items: center; gap: 8px; } .item.active { color: #2563eb; } .divider { width: 1px; height: 16px; background: #cbd5e1; }
`;

// [Left Panel Container] - 24px로 이동
const LeftControlPanel = styled.div`
  position: absolute; 
  top: 24px; 
  left: 24px; 
  bottom: 24px; 
  width: 360px; 
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 16px; 
  pointer-events: none; 
`;

const KpiWidgetBox = styled(GlassCard)`
  padding: 24px; width: 100%; flex-shrink: 0; pointer-events: auto; max-width:340px;
`;
const KpiHeader = styled.div`display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 800; color: #1e293b; margin-bottom: 20px;`;
const LiveBadge = styled.span`margin-left: auto; background: #fee2e2; color: #ef4444; font-size: 13px; padding: 4px 10px; border-radius: 99px; font-weight: 800; animation: pulseRed 2s infinite; @keyframes pulseRed { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }`;
const KpiGrid = styled.div`display: flex; justify-content: space-between; .divider { width: 1px; background: #e2e8f0; height: 44px; }`;
const StyledKpiItem = styled.div`
  display: flex; flex-direction: column; gap: 4px; .label { font-size: 14px; color: #64748b; font-weight: 600; } .value { font-size: 24px; font-weight: 800; color: #0f172a; .unit { font-size: 15px; color: #64748b; margin-left: 2px; } } .trend { font-size: 13px; font-weight: 700; }
`;

const DetailCardWrapper = styled.div`
  width: 100%; flex-shrink: 0; pointer-events: auto; animation: slideRight 0.4s forwards;
  @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
`;

const VehicleListWidget = styled.div`
  width: 100%; max-width:340px; flex: 1; min-height: 200px; display: flex; flex-direction: column; overflow: hidden; background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); pointer-events: auto;
  .header { padding: 18px 24px; font-size: 17px; font-weight: 800; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.6); color: #1e293b; flex-shrink: 0; }
  .list-container { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } }
`;

// [수정됨] 더욱 슬림하고 직관적인 차량 리스트 아이템
const VehicleListItem = styled.div<{ $active: boolean; $isDelayed: boolean }>`
  position: relative; padding: 12px 16px; 
  background: ${props => props.$active ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}; 
  border-radius: 12px; 
  border: ${props => props.$active ? '2px solid #3B82F6' : '1px solid transparent'}; 
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)'}; 
  transition: all 0.2s ease; cursor: pointer;
  
  &:hover { background: #FFFFFF; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.05); }

  .main-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .info { display: flex; flex-direction: column; gap: 2px; }
  .id-row { display: flex; align-items: center; gap: 8px; }
  .v-id { font-weight: 800; font-size: 15px; color: #1e293b; }
  .status { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
  .status.delayed { background: #fee2e2; color: #ef4444; }
  .status.normal { background: #dcfce7; color: #166534; }
  
  .route-text { font-size: 12px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 4px; }
  
  .progress-info { text-align: right; }
  .time { font-size: 14px; font-weight: 800; color: ${props => props.$isDelayed ? '#d97706' : '#2563eb'}; }
  .pct { font-size: 12px; color: #94a3b8; font-weight: 600; }

  .progress-bar-bg { width: 100%; height: 4px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
`;

// [Right Column] - 24px로 이동
const RightColumn = styled.div`
  position: absolute; top: 24px; right: 4px; bottom: 24px; width: 320px; display: flex; flex-direction: column; gap: 16px; z-index: 100; pointer-events: none;
`;

const StatusWidget = styled(GlassCard)`
  padding: 20px; display: flex; flex-direction: column; gap: 16px; pointer-events: auto; flex-shrink: 0; max-width:300px;
`;
const TimeRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; .time { font-size: 32px; font-weight: 800; letter-spacing: -1px; line-height: 1; color: #0f172a; } .date { font-size: 14px; color: #64748b; font-weight: 600; display: flex; align-items: center; }
`;
const WeatherRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; background: rgba(241,245,249,0.7); padding: 12px 16px; border-radius: 12px;
  .temp-box { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 800; } .desc { font-size: 14px; color: #64748b; font-weight: 600; }
`;
const EtaBox = styled.div`
  background: rgba(241, 245, 249, 0.7); border-radius: 12px; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.4);
  .box-title { font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 10px; } .line { height: 1px; background: rgba(0,0,0,0.05); margin: 10px 0; }
`;
const EtaRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; 
  .route { display: flex; align-items: center; gap: 6px; color: #475569; } .time { color: #2563eb; background: rgba(37,99,235,0.1); padding: 4px 8px; border-radius: 6px; }
`;

const AlertWidget = styled(GlassCard)`
  padding: 20px; display: flex; flex-direction: column; gap: 12px; pointer-events: auto; flex: 1; min-height: 0; max-width:300px;
`;
const WidgetTitle = styled.div`font-size: 16px; font-weight: 800; color: #334155; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; .count { background: #ef4444; color: white; font-size: 12px; padding: 2px 8px; border-radius: 99px; }`;
const AlertList = styled.div`display: flex; flex-direction: column; gap: 10px; overflow-y: auto; &::-webkit-scrollbar { width: 3px; }`;
const AlertItem = styled.div<{ $type: string }>`
  display: flex; gap: 12px; padding: 12px; background: rgba(255,255,255,0.5); border-radius: 12px; border: 1px solid rgba(255,255,255,0.6);
  .icon-wrapper { margin-top: 2px; color: ${props => props.$type === 'warning' ? '#f59e0b' : props.$type === 'success' ? '#22c55e' : '#3b82f6'}; }
  .content { display: flex; flex-direction: column; gap: 3px; flex: 1; }
  .msg { font-size: 14px; font-weight: 700; color: #334155; line-height: 1.3; } .msg.alert-red { color: #ef4444; font-weight: 800; }
  .time { font-size: 12px; color: #94a3b8; font-weight: 500; }
`;

const AnalyticsWidget = styled(GlassCard)`padding: 20px; display: flex; flex-direction: column; gap: 14px; pointer-events: auto; flex-shrink: 0; max-width:300px;`; 

// 🟢 [수정됨] 직관적이고 심플한 테이블 스타일
const CompactTable = styled.table`
  width: 100%; border-collapse: collapse; font-size: 14px;
  th { text-align: left; color: #94a3b8; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  td { padding: 8px 0; color: #334155; font-weight: 700; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  .status { display: flex; align-items: center; gap: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .dot.blue { background: #3B82F6; } .dot.green { background: #10B981; } .dot.gray { background: #E2E8F0; }
  .count { text-align: center; color: #0f172a; } .ratio { text-align: right; color: #64748b; font-weight: 600; }
`;

const SystemTicker = styled.div`
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #94a3b8; padding-left: 24px; border-left: 1px solid #e2e8f0; .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; animation: pulseGreen 2s infinite; }
  @keyframes pulseGreen { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
`;

const WarningBanner = styled.div`
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; background: rgba(220, 38, 38, 0.95); backdrop-filter: blur(12px); padding: 16px 24px; border-radius: 16px; box-shadow: 0 10px 40px rgba(220, 38, 38, 0.4); z-index: 200; min-width: 460px; animation: bannerSlideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid rgba(255,255,255,0.2);
  @keyframes bannerSlideUp { from { opacity: 0; transform: translate(-50%, 50px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;
const SirenIconWrapper = styled.div`
  width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: sirenPulse 1s infinite; @keyframes sirenPulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
`;
const WarningContent = styled.div`
  color: white; .title { font-size: 15px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; } .desc { font-size: 13px; font-weight: 500; line-height: 1.4; }
`;