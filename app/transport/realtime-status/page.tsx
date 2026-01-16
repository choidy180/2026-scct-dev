"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";
import { 
  Sun, Navigation, Truck, Activity, 
  BarChart2, ArrowRight, Calendar, RefreshCw, CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import VehicleStatusCard from "@/components/vehicle-status-card";
import type { VWorldMarker } from "@/components/vworld-map";

const VWorldMap = dynamic(
  () => import("@/components/vworld-map"),
  { 
    ssr: false,
    loading: () => <div style={{width: '100%', height: '100%', background: '#f8fafc'}} /> 
  }
);

/* --- Types & Constants --- */

type VehicleStatus = 'Arrived' | 'Moving';

interface ApiVehicleData {
  출도착처리ID: string;
  출발시간: string;
  출발위치: string;
  도착시간: string | null;
  도착위치: string | null;
  상태: string;
  차량번호: string;
  출발지: string;
  도착지: string;
  소요시간: string | null;
  운전자명: string | null;
}

interface SimulationVehicle {
  id: string;        
  vehicleNo: string; 
  driver: string;
  startPos: { lat: number; lng: number; title: string };
  destPos: { lat: number; lng: number; title: string };
  totalDistanceKm: number;
  baseDurationSec: number;
  startTime: number;
  status: VehicleStatus;
  cargo: string;
  temp: string;
}

const LOCATION_MAP: Record<string, { lat: number; lng: number; title: string }> = {
  "GMT_부산": { lat: 35.1487345915681, lng: 128.859885213419, title: "고모텍 부산" },
  "GMT": { lat: 35.1487345915681, lng: 128.859885213419, title: "고모텍 본사" },
  "LG1_선진화": { lat: 35.2078432680624, lng: 128.666263957419, title: "LG전자 1공장" },
  "신창원물류": { lat: 35.2255, lng: 128.6044, title: "신창원 물류센터" },
  "CKD납품": { lat: 35.213020, lng: 128.635923, title: "CKD 납품장" },
  "성철사": { lat: 35.1855, lng: 128.9044, title: "성철사" }
};

const DEFAULT_POS = { lat: 35.148734, lng: 128.859885, title: "Unknown" };
const ARROW_ICON = "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='%233B82F6' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M12 2l7 19-7-4-7 4 7-19z'/%3e%3c/svg%3e";
const TRUCK_ICON_URL = "/truck-image.png"; 

const parseCoordinate = (coordStr: string | null, locName: string) => {
  if (coordStr && coordStr !== "0.000000, 0.000000") {
    const parts = coordStr.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (lat !== 0 && lng !== 0) return { lat, lng, title: locName };
    }
  }
  for (const key in LOCATION_MAP) {
    if (locName.includes(key) || key.includes(locName)) return { ...LOCATION_MAP[key], title: locName };
  }
  return { ...DEFAULT_POS, title: locName };
};

const fastFormatTime = (date: Date) => {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}`;
};

// --- [Hook] Vehicle Simulation ---
const useVehicleSimulation = () => {
  const [vehicles, setVehicles] = useState<SimulationVehicle[]>([]);
  const [markers, setMarkers] = useState<VWorldMarker[]>([]);
  const [targetVehicleId, setTargetVehicleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const vehiclesRef = useRef<SimulationVehicle[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://1.254.24.170:24828/api/DX_API000002');
      const data: ApiVehicleData[] = res.data;
      const now = Date.now();

      const mappedVehicles: SimulationVehicle[] = data.map((item) => {
        const startPos = parseCoordinate(item.출발위치, item.출발지);
        const destPos = parseCoordinate(item.도착위치, item.도착지);
        const startTime = new Date(item.출발시간).getTime();
        
        let durationSec = 3600; // 기본 60분
        if (item.소요시간) {
          const [h, m, s] = item.소요시간.split(':').map(Number);
          durationSec = h * 3600 + m * 60 + s;
        }

        // 🟢 [수정됨] 상태 판단 로직 강화
        // 1. API 상태가 "도착" 이면 도착
        // 2. 혹은 (현재시간 - 출발시간)이 소요시간을 넘겼으면(남은시간 0 이하) 도착으로 간주
        const elapsedSec = (now - startTime) / 1000;
        const isTimeOver = elapsedSec >= durationSec;
        const isArrived = (item.상태 === "도착") || isTimeOver;

        return {
          id: item.출도착처리ID,
          vehicleNo: item.차량번호,
          driver: item.운전자명 || '미지정',
          startPos,
          destPos,
          totalDistanceKm: 45, 
          baseDurationSec: durationSec,
          startTime: startTime,
          status: isArrived ? 'Arrived' : 'Moving', // 조건에 따라 상태 강제 할당
          cargo: "전자부품/사출물",
          temp: "상온"
        };
      });

      setVehicles(mappedVehicles);
      vehiclesRef.current = mappedVehicles;

      // 🟢 [수정됨] 운행 중인 차량만 필터링하여 타겟 설정
      const movingVehicles = mappedVehicles.filter(v => v.status === 'Moving');
      
      if (movingVehicles.length > 0) {
        setTargetVehicleId(prev => {
          const stillMoving = movingVehicles.find(v => v.id === prev);
          return stillMoving ? prev : movingVehicles[0].id;
        });
      } else {
        setTargetVehicleId(null); // 모두 도착이면 타겟 해제 -> 카드 숨김
      }

    } catch (err) {
      console.error("Failed to fetch vehicle data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastFrameTime = 0;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    const baseMarkers = [
      { ...LOCATION_MAP["GMT_부산"], isFacility: true, imageUrl: "/icons/GMT.png" },
      { ...LOCATION_MAP["LG1_선진화"], isFacility: true, imageUrl: "/icons/LG.jpg" }
    ];

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTime;
      
      if (deltaTime >= FRAME_INTERVAL) {
        lastFrameTime = timestamp - (deltaTime % FRAME_INTERVAL);

        const now = Date.now();
        const currentVehicles = vehiclesRef.current;
        const currentMarkers: VWorldMarker[] = [...baseMarkers];
        
        currentVehicles.forEach(v => {
          // 🟢 [수정됨] 도착한 차량('Arrived')은 지도 마커 생성 루프에서 제외
          // 즉, 지도에 표시되지 않음.
          if (v.status === 'Arrived') return;

          // --- 아래는 'Moving' 상태인 차량만 실행됨 ---
          const elapsedSec = (now - v.startTime) / 1000;
          const totalDuration = v.baseDurationSec;
          let progress = elapsedSec / totalDuration;
          
          if (progress > 1) progress = 1;
          if (progress < 0) progress = 0;

          // 만약 루프 도중 시간이 다 되어 100%가 되면, 다음 fetch때 status가 Arrived로 바뀌겠지만
          // 시각적으로 100% 위치에 잠깐 있는 것은 자연스러우므로 렌더링 함.
          // 단, 이미 status가 Arrived로 데이터가 들어온 놈들은 위에서 return됨.

          const currentLat = v.startPos.lat + (v.destPos.lat - v.startPos.lat) * progress;
          const currentLng = v.startPos.lng + (v.destPos.lng - v.startPos.lng) * progress;
          
          const isTarget = v.id === targetVehicleId; 
          const isLgToGomotek = v.startPos.title.includes("LG");

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
            eta: "이동 중",
            flip: isLgToGomotek,
            rotation: 0
          } as VWorldMarker);
        });

        setMarkers(currentMarkers);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetVehicleId]);

  return { vehicles, markers, targetVehicleId, setTargetVehicleId, fetchData, isLoading };
};

// ─── [Components] ───

const KpiItem = React.memo(({ label, value, unit, trend, trendColor }: any) => (
  <StyledKpiItem>
    <div className="label">{label}</div>
    <div className="value">{value}<span className="unit">{unit}</span></div>
    <div className="trend" style={{ color: trendColor }}>{trend}</div>
  </StyledKpiItem>
));
KpiItem.displayName = 'KpiItem';

const KpiWidget = React.memo(({ vehicleCount, movingCount }: { vehicleCount: number, movingCount: number }) => (
  <KpiWidgetBox>
    <KpiHeader>
      <Activity size={20} color="#3b82f6" />
      <span>실시간 운행 지표</span>
      <LiveBadge>LIVE</LiveBadge>
    </KpiHeader>
    <KpiGrid>
      <KpiItem label="총 배차 건수" value={vehicleCount} unit="건" trend="Today" trendColor="#94a3b8" />
      <div className="divider" />
      <KpiItem 
        label="운행 중" 
        value={movingCount} 
        unit="대" 
        trend={movingCount === 0 ? "All Clear" : `${movingCount} Active`} 
        trendColor={movingCount === 0 ? "#10b981" : "#3B82F6"} 
      />
      <div className="divider" />
      <KpiItem label="완료율" value={vehicleCount > 0 ? Math.round(((vehicleCount - movingCount)/vehicleCount)*100) : 0} unit="%" trend="-" trendColor="#10b981" />
    </KpiGrid>
  </KpiWidgetBox>
));
KpiWidget.displayName = "KpiWidget";

const RightInfoPanel = React.memo(({ currentTime, weather, vehicles }: any) => {
    // 통계 계산 시 v.status를 기준으로 함 (이미 로직에서 시간 초과면 Arrived로 변경되어 있음)
    const arrivedCount = vehicles.filter((v: SimulationVehicle) => v.status === 'Arrived').length;
    const movingCount = vehicles.filter((v: SimulationVehicle) => v.status === 'Moving').length;

    return (
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
                <div className="route"><Navigation size={14} color="#1E40AF" /> <span>LG전자 → 고모텍</span></div>
                <div className="time">55분</div>
                </EtaRow>
                <div className="line" />
                <EtaRow>
                <div className="route"><Navigation size={14} color="#1E40AF" /> <span>고모텍 → LG전자</span></div>
                <div className="time">48분</div>
                </EtaRow>
            </EtaBox>
            </StatusWidget>

            <AnalyticsWidget>
            <WidgetTitle><BarChart2 size={18} /> 통합 운영 현황</WidgetTitle>
            <CompactTable>
                <thead>
                <tr>
                    <th style={{width: '40%'}}>상태</th>
                    <th style={{width: '30%', textAlign: 'center'}}>건수</th>
                    <th style={{width: '30%', textAlign: 'right'}}>비율</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td className="status"><span className="dot blue" /> 운행중</td>
                    <td className="count">{movingCount}</td>
                    <td className="ratio">{vehicles.length > 0 ? Math.round((movingCount/vehicles.length)*100) : 0}%</td>
                </tr>
                <tr>
                    <td className="status"><span className="dot green" /> 도착완료</td>
                    <td className="count">{arrivedCount}</td>
                    <td className="ratio">{vehicles.length > 0 ? Math.round((arrivedCount/vehicles.length)*100) : 0}%</td>
                </tr>
                </tbody>
            </CompactTable>
            </AnalyticsWidget>
        </RightColumn>
    );
});
RightInfoPanel.displayName = "RightInfoPanel";

const TopControlPanel = React.memo(({ currentTime, onRefresh, loading }: any) => (
  <TopPanel>
    <TopGroup>
      <div className="item active"><Truck size={18} /> 실시간 물류 관제</div>
      <div className="divider" />
      <div className="item"><Activity size={18} /> API 연동: {loading ? '갱신중...' : '정상'}</div>
    </TopGroup>
    <SystemTicker onClick={onRefresh} style={{cursor: 'pointer'}}>
      <RefreshCw size={14} className={loading ? 'spin' : ''} />
      Updated: {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
    </SystemTicker>
  </TopPanel>
));
TopControlPanel.displayName = "TopControlPanel";

// ─── [Main Page] ───

export default function LocalMapPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [weather] = useState({ temp: 12, desc: '맑음', icon: <Sun size={24} color="#FDB813" /> });
  
  const { vehicles, markers, targetVehicleId, setTargetVehicleId, fetchData, isLoading } = useVehicleSimulation();

  const markerMap = useMemo(() => {
    const map = new Map<string, VWorldMarker>();
    for (const m of markers) {
      if(m.title) map.set(m.title, m);
    }
    return map;
  }, [markers]);

  // 타겟 차량 데이터 계산
  const targetTruckData = useMemo(() => {
    if (!targetVehicleId) return null;
    
    const v = vehicles.find(veh => veh.id === targetVehicleId);
    // 🟢 [수정됨] 만약 선택된 차량이 시간 초과로 인해 'Arrived'가 되었다면 null 처리 (카드 숨김)
    if (!v || v.status === 'Arrived') return null;

    const marker = markerMap.get(v.id);
    const progress = marker?.progress || 0;
    
    const remainingSec = Math.max(0, v.baseDurationSec * (1 - progress));
    const arrivalTimeMs = Date.now() + (remainingSec * 1000);
    const arrivalDate = new Date(arrivalTimeMs);

    return {
      vehicleId: v.vehicleNo,
      imageUrl: "/truck-image.png",
      departure: v.startPos.title,
      arrival: v.destPos.title,
      progress: Math.floor(progress * 100),
      eta: fastFormatTime(arrivalDate),
      remainingTime: `${Math.ceil(remainingSec / 60)}분`,
      distanceLeft: `${(v.totalDistanceKm * (1 - progress)).toFixed(1)} km`,
      speed: 70 + Math.floor(Math.random() * 10), 
      cargoInfo: v.cargo,
      temperature: v.temp,
      driverName: v.driver,
      driverStatus: '운행 중'
    };
  }, [vehicles, markerMap, targetVehicleId]);

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
    return () => clearInterval(timer);
  }, []);

  if (!isMounted) return null;

  return (
    <Container>
      <MapWrapper>
        <VWorldMap markers={markers} focusedTitle={targetVehicleId} />
      </MapWrapper>

      <TopControlPanel currentTime={currentTime} onRefresh={fetchData} loading={isLoading} />

      {/* 좌측 패널 */}
      <LeftControlPanel>
        <KpiWidget 
          vehicleCount={vehicles.length} 
          movingCount={vehicles.filter(v => v.status === 'Moving').length} // 🟢 실제 운행 차량 수
        />

        {/* 🟢 타겟 차량이 있고, 운행 중일 때만 표시 */}
        {targetTruckData && (
          <DetailCardWrapper>
            <VehicleStatusCard {...targetTruckData} />
          </DetailCardWrapper>
        )}

        <VehicleListWidget>
          <div className="header">
            <Truck size={20} strokeWidth={2.5} color="#3b82f6" />
            <span>금일 운행 이력 ({vehicles.length})</span>
          </div>
          <div className="list-container">
            {vehicles.map((v) => {
              // 🟢 [수정됨] 지도에 마커가 없어도(도착 차량) 리스트에는 표시
              // 단, 진행률은 상태에 따라 강제 설정
              const isArrived = v.status === 'Arrived';
              const progressPct = isArrived ? 100 : 0; 
              // *운행 중* 차량의 디테일한 진행률은 markerMap(애니메이션 루프)에서 가져오면 더 부드러움
              // 하지만 도착 차량은 markerMap에 없으므로 위처럼 처리.
              
              const m = markerMap.get(v.id);
              const displayPct = isArrived ? 100 : Math.floor((m?.progress || 0) * 100);

              const remainingSec = Math.max(0, v.baseDurationSec * (1 - (m?.progress || 0)));
              const remainingMin = Math.ceil(remainingSec / 60);

              return (
                <VehicleListItem 
                  key={v.id}
                  $active={v.id === targetVehicleId} 
                  $isDelayed={false}
                  // 도착 차량 클릭 시에는 타겟팅 하지 않거나, 히스토리 조회만 하도록 함 (여기선 타겟팅 제외)
                  onClick={() => !isArrived && setTargetVehicleId(v.id)} 
                  style={{ cursor: isArrived ? 'default' : 'pointer', opacity: isArrived ? 0.8 : 1 }}
                >
                  <div className="main-row">
                    <div className="info">
                      <div className="id-row">
                        <span className="v-id">{v.vehicleNo}</span>
                        <span className={`status ${isArrived ? 'arrived' : 'moving'}`}>
                          {isArrived ? '도착' : '운행중'}
                        </span>
                      </div>
                      <div className="driver-name">{v.driver}</div>
                      <div className="route-text">
                        {v.startPos.title.replace("LG전자 1공장", "LG").replace("고모텍 부산", "GMT")} 
                        <ArrowRight size={10} /> 
                        {v.destPos.title.replace("LG전자 1공장", "LG").replace("고모텍 부산", "GMT")}
                      </div>
                    </div>
                    <div className="progress-info">
                      {isArrived ? (
                        <CheckCircle size={18} color="#10B981" />
                      ) : (
                        <div className="time">{remainingMin}분</div>
                      )}
                      <div className="pct">{displayPct}%</div>
                    </div>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="fill" style={{ width: `${displayPct}%`, background: isArrived ? '#10B981' : '#3B82F6' }} />
                  </div>
                </VehicleListItem>
              );
            })}
          </div>
        </VehicleListWidget>
      </LeftControlPanel>

      <RightInfoPanel 
          currentTime={currentTime}
          weather={weather}
          formatDuration={formatDuration}
          vehicles={vehicles}
      />
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

const TopPanel = styled(GlassCard)`
  position: absolute; top: 24px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 24px; padding: 14px 32px; z-index: 200;
  animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;
const TopGroup = styled.div`
  display: flex; align-items: center; gap: 20px; font-size: 15px; font-weight: 700; color: #475569; .item { display: flex; align-items: center; gap: 8px; } .item.active { color: #2563eb; } .divider { width: 1px; height: 16px; background: #cbd5e1; }
`;

const LeftControlPanel = styled.div`
  position: absolute; top: 24px; left: 24px; bottom: 24px; width: 360px; z-index: 100;
  display: flex; flex-direction: column; gap: 16px; pointer-events: none; 
`;

const KpiWidgetBox = styled(GlassCard)`padding: 24px; width: 100%; flex-shrink: 0; pointer-events: auto; max-width:340px;`;
const KpiHeader = styled.div`display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 800; color: #1e293b; margin-bottom: 20px;`;
const LiveBadge = styled.span`margin-left: auto; background: #fee2e2; color: #ef4444; font-size: 13px; padding: 4px 10px; border-radius: 99px; font-weight: 800; animation: pulseRed 2s infinite; @keyframes pulseRed { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }`;
const KpiGrid = styled.div`display: flex; justify-content: space-between; .divider { width: 1px; background: #e2e8f0; height: 44px; }`;
const StyledKpiItem = styled.div`display: flex; flex-direction: column; gap: 4px; .label { font-size: 14px; color: #64748b; font-weight: 600; } .value { font-size: 24px; font-weight: 800; color: #0f172a; .unit { font-size: 15px; color: #64748b; margin-left: 2px; } } .trend { font-size: 13px; font-weight: 700; }`;

const DetailCardWrapper = styled.div`
  width: 100%; flex-shrink: 0; pointer-events: auto; animation: slideRight 0.4s forwards;
  @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
`;

const VehicleListWidget = styled.div`
  width: 100%; max-width:340px; flex: 1; min-height: 200px; display: flex; flex-direction: column; overflow: hidden; background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); pointer-events: auto;
  .header { padding: 18px 24px; font-size: 17px; font-weight: 800; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.6); color: #1e293b; flex-shrink: 0; }
  .list-container { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } }
`;

const VehicleListItem = styled.div<{ $active: boolean; $isDelayed: boolean }>`
  position: relative; padding: 12px 16px; 
  background: ${props => props.$active ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}; 
  border-radius: 12px; 
  border: ${props => props.$active ? '2px solid #3B82F6' : '1px solid transparent'}; 
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(59, 130, 246, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)'}; 
  transition: all 0.2s ease; 
  
  &:hover { background: #FFFFFF; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.05); }

  .main-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .info { display: flex; flex-direction: column; gap: 2px; }
  .id-row { display: flex; align-items: center; gap: 8px; }
  .v-id { font-weight: 800; font-size: 15px; color: #1e293b; }
  .status { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
  .status.arrived { background: #dcfce7; color: #166534; }
  .status.moving { background: #dbeafe; color: #1e40af; }
  
  .driver-name { font-size: 12px; color: #64748b; }
  .route-text { font-size: 12px; color: #475569; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
  
  .progress-info { text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
  .time { font-size: 14px; font-weight: 800; color: ${props => props.$isDelayed ? '#d97706' : '#2563eb'}; }
  .pct { font-size: 12px; color: #94a3b8; font-weight: 600; }

  .progress-bar-bg { width: 100%; height: 4px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
`;

const RightColumn = styled.div`position: absolute; top: 24px; right: 4px; bottom: 24px; width: 320px; display: flex; flex-direction: column; gap: 16px; z-index: 100; pointer-events: none;`;
const StatusWidget = styled(GlassCard)`padding: 20px; display: flex; flex-direction: column; gap: 16px; pointer-events: auto; flex-shrink: 0; max-width:300px;`;
const TimeRow = styled.div`display: flex; justify-content: space-between; align-items: center; .time { font-size: 32px; font-weight: 800; letter-spacing: -1px; line-height: 1; color: #0f172a; } .date { font-size: 14px; color: #64748b; font-weight: 600; display: flex; align-items: center; }`;
const WeatherRow = styled.div`display: flex; justify-content: space-between; align-items: center; background: rgba(241,245,249,0.7); padding: 12px 16px; border-radius: 12px; .temp-box { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 800; } .desc { font-size: 14px; color: #64748b; font-weight: 600; }`;
const EtaBox = styled.div`background: rgba(241, 245, 249, 0.7); border-radius: 12px; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.4); .box-title { font-size: 13px; font-weight: 700; color: #94a3b8; margin-bottom: 10px; } .line { height: 1px; background: rgba(0,0,0,0.05); margin: 10px 0; }`;
const EtaRow = styled.div`display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; .route { display: flex; align-items: center; gap: 6px; color: #475569; } .time { color: #2563eb; background: rgba(37,99,235,0.1); padding: 4px 8px; border-radius: 6px; }`;
const AnalyticsWidget = styled(GlassCard)`padding: 20px; display: flex; flex-direction: column; gap: 14px; pointer-events: auto; flex-shrink: 0; max-width:300px;`; 
const WidgetTitle = styled.div`font-size: 16px; font-weight: 800; color: #334155; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; .count { background: #ef4444; color: white; font-size: 12px; padding: 2px 8px; border-radius: 99px; }`;
const CompactTable = styled.table`width: 100%; border-collapse: collapse; font-size: 14px; th { text-align: left; color: #94a3b8; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; } td { padding: 8px 0; color: #334155; font-weight: 700; border-bottom: 1px solid #f1f5f9; } tr:last-child td { border-bottom: none; } .status { display: flex; align-items: center; gap: 8px; } .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; } .dot.blue { background: #3B82F6; } .dot.green { background: #10B981; } .dot.gray { background: #E2E8F0; } .count { text-align: center; color: #0f172a; } .ratio { text-align: right; color: #64748b; font-weight: 600; }`;
const SystemTicker = styled.div`display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #94a3b8; padding-left: 24px; border-left: 1px solid #e2e8f0; .spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;