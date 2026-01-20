"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";
import { 
  Sun, Navigation, Truck, Activity, 
  BarChart2, ArrowRight, Calendar, RefreshCw, CheckCircle,
  PlayCircle, StopCircle
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

// --- 더미 데이터 생성기 (소요시간 25~30분 내외로 단축) ---
const generateDummyData = (): SimulationVehicle[] => {
  const now = Date.now();
  
  // LG -> GMT (약 45km, 현실적 25~30분 설정)
  const v1: SimulationVehicle = {
    id: "dummy-1", vehicleNo: "부산80바 1234", driver: "김철수",
    startPos: LOCATION_MAP["LG1_선진화"], destPos: LOCATION_MAP["GMT_부산"],
    totalDistanceKm: 45, baseDurationSec: 1600, // 약 26분
    startTime: now - (1000 * 60 * 20), // 20분 전 출발 (도착 임박)
    status: 'Moving', cargo: "세탁기 모터 부품", temp: "상온"
  };
  const v2: SimulationVehicle = {
    id: "dummy-2", vehicleNo: "부산81사 5678", driver: "이영희",
    startPos: LOCATION_MAP["LG1_선진화"], destPos: LOCATION_MAP["GMT_부산"],
    totalDistanceKm: 45, baseDurationSec: 1800, // 30분
    startTime: now - (1000 * 60 * 5), // 5분 전 출발
    status: 'Moving', cargo: "건조기 패널", temp: "상온"
  };

  // GMT -> LG (약 45km)
  const v3: SimulationVehicle = {
    id: "dummy-3", vehicleNo: "경남90아 9999", driver: "박민수",
    startPos: LOCATION_MAP["GMT_부산"], destPos: LOCATION_MAP["LG1_선진화"],
    totalDistanceKm: 45, baseDurationSec: 1700, // 약 28분
    startTime: now - (1000 * 60 * 25), // 25분 전 출발 (도착 임박)
    status: 'Moving', cargo: "빈 팔레트 회수", temp: "상온"
  };
  const v4: SimulationVehicle = {
    id: "dummy-4", vehicleNo: "경남88자 1111", driver: "최동훈",
    startPos: LOCATION_MAP["GMT_부산"], destPos: LOCATION_MAP["LG1_선진화"],
    totalDistanceKm: 45, baseDurationSec: 1500, // 약 25분
    startTime: now - (1000 * 60 * 2), // 2분 전 출발
    status: 'Moving', cargo: "불량 반송품", temp: "상온"
  };

  return [v1, v2, v3, v4];
};

const useVehicleSimulation = () => {
  const [vehicles, setVehicles] = useState<SimulationVehicle[]>([]);
  const [markers, setMarkers] = useState<VWorldMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDummyMode, setIsDummyMode] = useState(false);
  const [targetIds, setTargetIds] = useState<{ lgId: string | null; gmtId: string | null }>({ lgId: null, gmtId: null });
  const vehiclesRef = useRef<SimulationVehicle[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let mappedVehicles: SimulationVehicle[] = [];
      if (isDummyMode) {
        mappedVehicles = generateDummyData();
        await new Promise(r => setTimeout(r, 500)); 
      } else {
        try {
          const res = await axios.get('http://1.254.24.170:24828/api/DX_API000002');
          const data: ApiVehicleData[] = res.data;
          const now = Date.now();
          mappedVehicles = data.map((item) => {
            const startPos = parseCoordinate(item.출발위치, item.출발지);
            const destPos = parseCoordinate(item.도착위치, item.도착지);
            const startTime = new Date(item.출발시간).getTime();
            let durationSec = 1800; // API 데이터 없을 시 기본 30분으로 단축
            if (item.소요시간) {
              const [h, m, s] = item.소요시간.split(':').map(Number);
              durationSec = h * 3600 + m * 60 + s;
            }
            const elapsedSec = (now - startTime) / 1000;
            const isTimeOver = elapsedSec >= durationSec;
            const isArrived = (item.상태 === "도착") || isTimeOver;
            return {
              id: item.출도착처리ID,
              vehicleNo: item.차량번호,
              driver: item.운전자명 || '미지정',
              startPos, destPos, totalDistanceKm: 45, baseDurationSec: durationSec,
              startTime: startTime, status: isArrived ? 'Arrived' : 'Moving', 
              cargo: "전자부품/사출물", temp: "상온"
            };
          });
        } catch (apiError) {
          console.error("API Call Failed", apiError);
          mappedVehicles = [];
        }
      }
      setVehicles(mappedVehicles);
      vehiclesRef.current = mappedVehicles;

      const moving = mappedVehicles.filter(v => v.status === 'Moving');
      const getBestVehicleId = (filterFn: (v: SimulationVehicle) => boolean) => {
        const candidates = moving.filter(filterFn);
        if (candidates.length === 0) return null;
        return candidates.sort((a, b) => a.startTime - b.startTime)[0].id;
      };
      const bestLg = getBestVehicleId(v => v.startPos.title.includes("LG"));
      const bestGmt = getBestVehicleId(v => v.startPos.title.includes("GMT") || v.startPos.title.includes("부산") || v.startPos.title.includes("고모텍"));
      setTargetIds({ lgId: bestLg, gmtId: bestGmt });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isDummyMode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    let animationFrameId: number;
    let lastFrameTime = 0;
    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    const baseMarkers = [
      { id: 'fac-gmt', ...LOCATION_MAP["GMT_부산"], isFacility: true, imageUrl: "/icons/GMT.png" },
      { id: 'fac-lg', ...LOCATION_MAP["LG1_선진화"], isFacility: true, imageUrl: "/icons/LG.jpg" }
    ];

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTime;
      if (deltaTime >= FRAME_INTERVAL) {
        lastFrameTime = timestamp - (deltaTime % FRAME_INTERVAL);
        const now = Date.now();
        const currentVehicles = vehiclesRef.current;
        const currentMarkers: VWorldMarker[] = [...baseMarkers];
        
        currentVehicles.forEach(v => {
          if (v.status === 'Arrived') return;
          const elapsedSec = (now - v.startTime) / 1000;
          let progress = elapsedSec / v.baseDurationSec;
          if (progress > 1) progress = 1;
          if (progress < 0) progress = 0;

          const currentLat = v.startPos.lat + (v.destPos.lat - v.startPos.lat) * progress;
          const currentLng = v.startPos.lng + (v.destPos.lng - v.startPos.lng) * progress;
          const isTarget = v.id === targetIds.lgId || v.id === targetIds.gmtId;
          const isLgToGomotek = v.startPos.title.includes("LG");

          currentMarkers.push({
            id: v.id, lat: currentLat, lng: currentLng, title: v.id, vehicleNo: v.vehicleNo,
            imageUrl: isTarget ? TRUCK_ICON_URL : ARROW_ICON,
            isFocused: isTarget, progress: progress,
            startLat: v.startPos.lat, startLng: v.startPos.lng, destLat: v.destPos.lat, destLng: v.destPos.lng,
            driver: v.driver, cargo: v.cargo, eta: "이동 중", flip: isLgToGomotek,
          } as VWorldMarker);
        });
        setMarkers(currentMarkers);
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetIds]);

  return { vehicles, markers, targetIds, fetchData, isLoading, isDummyMode, setIsDummyMode };
};

// ─── [Components] ───

const NoDataModal = React.memo(() => (
  <ModalOverlay>
    <ModalContent>
      <div className="icon-wrapper">
        <div className="pulse-ring"></div>
        <Truck size={42} strokeWidth={1.5} color="#64748b" />
      </div>
      <div className="text-content">
        <h2 className="title">현재 운행 중인 차량이 없습니다</h2>
        <p className="desc">
          모든 배차가 완료되었거나 대기 중입니다.<br />
          새로운 배차 정보가 수신되면 자동으로 갱신됩니다.
        </p>
      </div>
      <div className="status-pill">
        <span className="dot" /> 시스템 대기 중
      </div>
    </ModalContent>
  </ModalOverlay>
));
NoDataModal.displayName = "NoDataModal";

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

// 🟢 우측 패널 (금일 운행 이력 포함)
const RightControlPanel = React.memo(({ currentTime, weather, vehicles, markerMap, targetIds }: any) => {
    // 🟢 구간별 평균 시간 계산 (실제 차량 데이터 기반 + 현실적 기본값)
    const calculateAvgTime = (startKeyword: string) => {
        const relevantVehicles = vehicles.filter((v: SimulationVehicle) => 
            v.startPos.title.includes(startKeyword) && v.status === 'Moving'
        );

        if (relevantVehicles.length === 0) {
            // 차량이 없어도 평시 기준 시간 표시 (25~30분)
            return "약 28분"; 
        }

        const totalSec = relevantVehicles.reduce((acc: number, cur: SimulationVehicle) => acc + cur.baseDurationSec, 0);
        const avgMin = Math.round((totalSec / relevantVehicles.length) / 60);
        return `${avgMin}분`;
    };

    const avgLgToGmt = calculateAvgTime("LG");
    const avgGmtToLg = calculateAvgTime("고모텍"); 

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
                    <div className="box-title">실시간 구간별 평균 소요 시간</div>
                    <EtaRow>
                        <div className="route"><Navigation size={14} color="#1E40AF" /> <span>LG전자 → 고모텍</span></div>
                        <div className="time">{avgLgToGmt}</div>
                    </EtaRow>
                    <div className="line" />
                    <EtaRow>
                        <div className="route"><Navigation size={14} color="#1E40AF" /> <span>고모텍 → LG전자</span></div>
                        <div className="time">{avgGmtToLg}</div>
                    </EtaRow>
                </EtaBox>
            </StatusWidget>

            <VehicleListWidget>
                <div className="header">
                    <Truck size={20} strokeWidth={2.5} color="#3b82f6" />
                    <span>금일 운행 이력 ({vehicles.length})</span>
                </div>
                <div className="list-container">
                    {vehicles.map((v: any) => {
                        const isArrived = v.status === 'Arrived';
                        const displayPct = isArrived ? 100 : Math.floor((markerMap.get(v.id)?.progress || 0) * 100);
                        const remainingSec = Math.max(0, v.baseDurationSec * (1 - (markerMap.get(v.id)?.progress || 0)));
                        const remainingMin = Math.ceil(remainingSec / 60);
                        const isActive = v.id === targetIds.lgId || v.id === targetIds.gmtId;

                        return (
                            <VehicleListItem 
                                key={v.id}
                                $active={isActive} 
                                $isDelayed={false}
                                style={{ cursor: 'default', opacity: isArrived ? 0.8 : 1 }}
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
        </RightColumn>
    );
});
RightControlPanel.displayName = "RightControlPanel";

const TopControlPanel = React.memo(({ currentTime, onRefresh, loading, isDummyMode }: any) => (
  <TopPanel>
    <TopGroup>
      <div className="item active"><Truck size={18} /> 실시간 물류 관제</div>
      <div className="divider" />
      <div className="item">
        <Activity size={18} /> 
        {isDummyMode ? 
          <span style={{color: '#f59e0b'}}>TEST MODE</span> : 
          `API 연동: ${loading ? '갱신중...' : '정상'}`
        }
      </div>
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
  
  const { vehicles, markers, targetIds, fetchData, isLoading, isDummyMode, setIsDummyMode } = useVehicleSimulation();

  const markerMap = useMemo(() => {
    const map = new Map<string, VWorldMarker>();
    for (const m of markers) {
      if(m.title) map.set(m.title, m);
    }
    return map;
  }, [markers]);

  const movingCount = vehicles.filter(v => v.status === 'Moving').length;

  const generateCardData = useCallback((vehicleId: string | null) => {
    if (!vehicleId) return null;
    
    const v = vehicles.find(veh => veh.id === vehicleId);
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
  }, [vehicles, markerMap]);

  const lgToGmtCardData = generateCardData(targetIds.lgId);
  const gmtToLgCardData = generateCardData(targetIds.gmtId);

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
        <VWorldMap markers={markers} focusedTitle={targetIds.lgId || targetIds.gmtId || null} />
      </MapWrapper>

      {!isLoading && movingCount === 0 && <NoDataModal />}

      <TopControlPanel currentTime={currentTime} onRefresh={fetchData} loading={isLoading} isDummyMode={isDummyMode} />

      <LeftControlPanel>
        <KpiWidget 
          vehicleCount={vehicles.length} 
          movingCount={movingCount}
        />

        <CardsStack>
            {lgToGmtCardData && (
            <DetailCardWrapper>
                <div className="route-badge lg">LG ➔ GMT</div>
                <VehicleStatusCard {...lgToGmtCardData} />
            </DetailCardWrapper>
            )}

            {gmtToLgCardData && (
            <DetailCardWrapper>
                <div className="route-badge gmt">GMT ➔ LG</div>
                <VehicleStatusCard {...gmtToLgCardData} />
            </DetailCardWrapper>
            )}
        </CardsStack>
      </LeftControlPanel>

      <RightControlPanel 
          currentTime={currentTime}
          weather={weather}
          vehicles={vehicles}
          markerMap={markerMap}
          targetIds={targetIds}
      />

      <DummyToggleBtn onClick={() => setIsDummyMode(!isDummyMode)} $active={isDummyMode}>
        {isDummyMode ? <StopCircle size={20} /> : <PlayCircle size={20} />}
        {isDummyMode ? "Stop Test" : "Test Mode"}
      </DummyToggleBtn>

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

const CardsStack = styled.div`
  display: flex; flex-direction: column; gap: 12px; pointer-events: none;
`;

const DetailCardWrapper = styled.div`
  width: 100%; flex-shrink: 0; pointer-events: auto; animation: slideRight 0.4s forwards;
  position: relative;
  
  .route-badge {
    position: absolute; top: -10px; left: 16px; z-index: 10;
    padding: 4px 12px; border-radius: 20px;
    font-size: 11px; font-weight: 800; color: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  .route-badge.lg { background: #3b82f6; }
  .route-badge.gmt { background: #8b5cf6; }

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

// Modal Styles
const ModalOverlay = styled.div`
  position: absolute; inset: 0; z-index: 999;
  background: rgba(248, 250, 252, 0.4); 
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.5s ease-out;

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 40px 60px;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 20px 50px -12px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0,0,0,0.02);
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 24px;
  animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes scaleUp { 
    from { opacity: 0; transform: scale(0.95) translateY(10px); } 
    to { opacity: 1; transform: scale(1) translateY(0); } 
  }

  .icon-wrapper {
    position: relative;
    width: 96px; height: 96px;
    background: #f1f5f9;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
    
    .pulse-ring {
      position: absolute; inset: -12px; border-radius: 50%;
      border: 2px solid #e2e8f0;
      animation: ripple 2s infinite;
    }
    
    .status-badge {
      position: absolute; bottom: 0; right: 0;
      width: 32px; height: 32px;
      background: #94a3b8;
      border-radius: 50%;
      border: 4px solid #fff;
      display: flex; align-items: center; justify-content: center;
    }
  }

  .text-content {
    display: flex; flex-direction: column; gap: 8px;
    .title { font-size: 22px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; margin: 0; }
    .desc { font-size: 15px; color: #64748b; line-height: 1.5; font-weight: 500; margin: 0; }
  }

  .status-pill {
    margin-top: 8px;
    background: #f8fafc; border: 1px solid #e2e8f0;
    padding: 8px 16px; border-radius: 99px;
    font-size: 13px; font-weight: 700; color: #64748b;
    display: flex; align-items: center; gap: 8px;
    
    .dot {
      width: 8px; height: 8px; background: #10b981; border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
      animation: blink 2s infinite ease-in-out;
    }
  }

  @keyframes ripple {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(1.2); opacity: 0; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

const DummyToggleBtn = styled.button<{ $active: boolean }>`
  position: absolute; bottom: 24px; right: 24px; 
  z-index: 2000; /* 🔥 z-index를 높여서 모달 위로 올라오게 수정 */
  display: flex; align-items: center; gap: 8px;
  padding: 12px 20px;
  background: ${props => props.$active ? '#3b82f6' : 'white'};
  color: ${props => props.$active ? 'white' : '#475569'};
  border: 1px solid ${props => props.$active ? '#2563eb' : '#e2e8f0'};
  border-radius: 99px;
  font-size: 14px; font-weight: 700;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  }
`;