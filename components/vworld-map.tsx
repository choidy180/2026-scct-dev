"use client";

import React, { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { Point, LineString } from "ol/geom";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Stroke, Icon, Circle as CircleStyle, Fill } from "ol/style";
import Feature from "ol/Feature";
import Overlay from "ol/Overlay";
import { boundingExtent } from "ol/extent";
import { Coordinate } from "ol/coordinate";
import { Geometry } from "ol/geom";

export interface VWorldMarker {
  id: string; 
  lat: number;
  lng: number;
  title?: string;
  imageUrl?: string;
  isFacility?: boolean;
  startLat?: number;
  progress?: number;
  isFocused?: boolean;
  driver?: string;
  cargo?: string;
  eta?: string;
  vehicleNo?: string;
  // remainingTime은 이제 내부에서 자동 계산하므로 필수는 아니지만, 오버라이드용으로 남겨둡니다.
  remainingTime?: string; 
}

interface EtaData { toBusan: number; toLG: number; }

interface VWorldMapProps {
  markers?: VWorldMarker[];
  focusedTitle?: string | null;
  onEtaUpdate?: (eta: EtaData) => void;
}

// 🟢 [고정 경로 데이터] LG전자 -> 고모텍 부산
const FIXED_NAV_PATH = [
  [128.665967, 35.207494], [128.667333, 35.206717], [128.666675, 35.205953], [128.666686, 35.205829],
  [128.666654, 35.20562], [128.666284, 35.205149], [128.670354, 35.202816], [128.670434, 35.202671],
  [128.670478, 35.202572], [128.670513, 35.202491], [128.670524, 35.202398], [128.67052, 35.202274],
  [128.668013, 35.199278], [128.667289, 35.198389], [128.666853, 35.197954], [128.666681, 35.197865],
  [128.666394, 35.197724], [128.666353, 35.197716], [128.666316, 35.197699], [128.666286, 35.197674],
  [128.666265, 35.197645], [128.666254, 35.197611], [128.666254, 35.197577], [128.666264, 35.197543],
  [128.666285, 35.197513], [128.666315, 35.197489], [128.666351, 35.197471], [128.666017, 35.196933],
  [128.668354, 35.196195], [128.670413, 35.195055], [128.670736, 35.194878], [128.671904, 35.194217],
  [128.673246, 35.193474], [128.673885, 35.193104], [128.674814, 35.192464], [128.675605, 35.191698],
  [128.675792, 35.191441], [128.676063, 35.191094], [128.676707, 35.189897], [128.676851, 35.18963],
  [128.677079, 35.189205], [128.677316, 35.188811], [128.67751, 35.18853], [128.677805, 35.18814],
  [128.677925, 35.187991], [128.678515, 35.187288], [128.678773, 35.187023], [128.679173, 35.186689],
  [128.680048, 35.186061], [128.680951, 35.185553], [128.682313, 35.184987], [128.684167, 35.184264],
  [128.684818, 35.184034], [128.685543, 35.183778], [128.687345, 35.183078], [128.689093, 35.182403],
  [128.690724, 35.181875], [128.692142, 35.181587], [128.692798, 35.181484], [128.693454, 35.181407],
  [128.694799, 35.181272], [128.695441, 35.181218], [128.695917, 35.181178], [128.696755, 35.181106],
  [128.696965, 35.181087], [128.697175, 35.181078], [128.697596, 35.181067], [128.698022, 35.181064],
  [128.698631, 35.181076], [128.699583, 35.181114], [128.700226, 35.181175], [128.700618, 35.181225],
  [128.701257, 35.181294], [128.701604, 35.181346], [128.701774, 35.181374], [128.701958, 35.181412],
  [128.702592, 35.181584], [128.703363, 35.181773], [128.703794, 35.181929], [128.704658, 35.182268],
  [128.705507, 35.182633], [128.706937, 35.183301], [128.707686, 35.183634], [128.708745, 35.184108],
  [128.709748, 35.184502], [128.710707, 35.184865], [128.71189, 35.1853], [128.712567, 35.185501],
  [128.713294, 35.185609], [128.71423, 35.185715], [128.714837, 35.18576], [128.715627, 35.185781],
  [128.716536, 35.185756], [128.717183, 35.185706], [128.718083, 35.185549], [128.718277, 35.185515],
  [128.718797, 35.185404], [128.719664, 35.185167], [128.720354, 35.184931], [128.721263, 35.184579],
  [128.723691, 35.183624], [128.727195, 35.18283], [128.731126, 35.182116], [128.732744, 35.18196],
  [128.756425, 35.181444], [128.75725, 35.181376], [128.757874, 35.181321], [128.758272, 35.181314],
  [128.762506, 35.181162], [128.764525, 35.181191], [128.765417, 35.181257], [128.768719, 35.181505],
  [128.769076, 35.18151], [128.76987, 35.181505], [128.771311, 35.181399], [128.772841, 35.181183],
  [128.774338, 35.180877], [128.775704, 35.180464], [128.776269, 35.180249], [128.776826, 35.179995],
  [128.778159, 35.179189], [128.778752, 35.178771], [128.779504, 35.17811], [128.779904, 35.177738],
  [128.783108, 35.174603], [128.78322, 35.174511], [128.783424, 35.174345], [128.783767, 35.174064],
  [128.784696, 35.17351], [128.785346, 35.173191], [128.786266, 35.172796], [128.786962, 35.172599],
  [128.787844, 35.172394], [128.78933, 35.172219], [128.790426, 35.172212], [128.791383, 35.172273],
  [128.792618, 35.172409], [128.793965, 35.1725], [128.795116, 35.1725], [128.795952, 35.172478],
  [128.797559, 35.172295], [128.798952, 35.171931], [128.799834, 35.171567], [128.800949, 35.170876],
  [128.802461, 35.169669], [128.803159, 35.16916], [128.80445, 35.168279], [128.805862, 35.167383],
  [128.806651, 35.166928], [128.807431, 35.166503], [128.808824, 35.165872], [128.809735, 35.165554],
  [128.810775, 35.165273], [128.812242, 35.164969], [128.813273, 35.164832], [128.816449, 35.164438],
  [128.818003, 35.164139], [128.819797, 35.163723], [128.820995, 35.163439], [128.822135, 35.163054],
  [128.822615, 35.162897], [128.822884, 35.162802], [128.824357, 35.162194], [128.825462, 35.161669],
  [128.828299, 35.16029], [128.829473, 35.159677], [128.830599, 35.15903], [128.832107, 35.157742],
  [128.834483, 35.155607], [128.835678, 35.154671], [128.836433, 35.154185], [128.836638, 35.154075],
  [128.837112, 35.153891], [128.837655, 35.153688], [128.83803, 35.153559], [128.838715, 35.153383],
  [128.839282, 35.153252], [128.840528, 35.153036], [128.842422, 35.152772], [128.843422, 35.152602],
  [128.84494, 35.152345], [128.8474, 35.151958], [128.847742, 35.151911], [128.848634, 35.151752],
  [128.850031, 35.151467], [128.851295, 35.151063], [128.852563, 35.150482], [128.853883, 35.149751],
  [128.854632, 35.149246], [128.856125, 35.148007], [128.859201, 35.145156], [128.859806, 35.144695],
  [128.860222, 35.144306], [128.86049, 35.144054], [128.860778, 35.143664], [128.860982, 35.143319],
  [128.861179, 35.142913], [128.861271, 35.142564], [128.861309, 35.142237], [128.861305, 35.141496],
  [128.861448, 35.141478], [128.861448, 35.141509], [128.861452, 35.142134], [128.86146, 35.143657],
  [128.861461, 35.143934], [128.861468, 35.145143], [128.861471, 35.145659], [128.861328, 35.145658],
  [128.860623, 35.145673], [128.860122, 35.145699], [128.859814, 35.145833], [128.859629, 35.145946],
  [128.859443, 35.146283], [128.859382, 35.146635], [128.859367, 35.148732]
];

export default function VWorldMap({ markers = [], focusedTitle, onEtaUpdate }: VWorldMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  
  const routeSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const remainingRouteSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const markerSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const routeGeomRef = useRef<LineString | null>(null);

  const createStyles = () => ({
    baseRoute: [
      new Style({ stroke: new Stroke({ color: 'white', width: 10, lineCap: 'round' }), zIndex: 1 }),
      new Style({ stroke: new Stroke({ color: '#3B82F6', width: 6, lineCap: 'round' }), zIndex: 2 })
    ],
    remainingRoute: [
      new Style({ stroke: new Stroke({ color: '#22C55E', width: 6, lineCap: 'round' }), zIndex: 3 })
    ]
  });

  // 1. 맵 초기화
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const routeSource = new VectorSource<Feature<Geometry>>();
    const remainingRouteSource = new VectorSource<Feature<Geometry>>();
    const markerSource = new VectorSource<Feature<Geometry>>();
    
    routeSourceRef.current = routeSource;
    remainingRouteSourceRef.current = remainingRouteSource;
    markerSourceRef.current = markerSource;

    const baseLayer = new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap, © CARTO',
      })
    });

    const map = new Map({
      target: mapElement.current,
      layers: [
        baseLayer, 
        new VectorLayer({ source: routeSource, zIndex: 10 }), 
        new VectorLayer({ source: remainingRouteSource, zIndex: 15 }), 
        new VectorLayer({ source: markerSource, zIndex: 20 })
      ],
      view: new View({ 
        center: fromLonLat([128.76, 35.18]), 
        zoom: 9, minZoom: 9, maxZoom: 12
      }),
      controls: [], 
    });
    mapRef.current = map;

    // 공장/본사 오버레이 추가
    const facilities = [
        { lat: 35.207843, lng: 128.666263, title: "LG전자", imageUrl: "/icons/LG.jpg" },
        { lat: 35.148734, lng: 128.859885, title: "고모텍 부산", imageUrl: "/icons/GMT.png" }
    ];

    facilities.forEach(fac => {
      const mPos = fromLonLat([fac.lng, fac.lat]);
      const el = document.createElement('div');
      const isLG = fac.title.includes("LG");
      const borderColor = isLG ? '#EF4444' : '#3B82F6';

      el.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="width: 52px; height: 52px; background: white; border: 3px solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
            <img src="${fac.imageUrl}" style="width: 80%; height: auto; object-fit: contain;">
          </div>
          <div style="margin-top: 4px; font-size: 11px; font-weight: 700; color: #1f2937; background: rgba(255,255,255,0.95); padding: 3px 8px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); white-space: nowrap;">
            ${fac.title}
          </div>
        </div>
      `;
      map.addOverlay(new Overlay({ position: mPos, element: el, positioning: 'center-center' }));
    });

    // 기본 경로 그리기 (LG -> GMT)
    const projectedCoords = FIXED_NAV_PATH.map(coord => fromLonLat([coord[0], coord[1]]));
    const routeGeom = new LineString(projectedCoords);
    routeGeomRef.current = routeGeom;

    const routeFeature = new Feature({ geometry: routeGeom });
    routeFeature.setStyle(createStyles().baseRoute);
    routeSource.addFeature(routeFeature);

    const extent = boundingExtent(projectedCoords);
    map.getView().fit(extent, { padding: [100, 100, 100, 100], duration: 1000 });

    if (onEtaUpdate) onEtaUpdate({ toBusan: 2400, toLG: 2400 });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  // 2. 마커 & 팝업 & 경로 업데이트 (스태킹 로직 적용)
  useEffect(() => {
    const markerSource = markerSourceRef.current;
    const remainingRouteSource = remainingRouteSourceRef.current;
    const map = mapRef.current;
    const routeGeom = routeGeomRef.current;

    if (!map || !markerSource || !remainingRouteSource || !routeGeom) return;

    markerSource.clear();
    remainingRouteSource.clear();

    const currentZoom = map.getView().getZoom() || 10; 
    const zoomFactor = Math.pow(1.2, currentZoom - 13);
    let dynamicIconScale = 0.3 * zoomFactor;
    dynamicIconScale = Math.max(0.05, Math.min(dynamicIconScale, 1.0));
    let dynamicDotRadius = 6 * zoomFactor;
    dynamicDotRadius = Math.max(2, dynamicDotRadius);

    const currentMarkerIds = new Set(markers.filter(m => m.isFocused).map(m => `popup-${m.id}`));

    const existingOverlays = map.getOverlays().getArray();
    [...existingOverlays].forEach(overlay => {
      const oid = overlay.get('id');
      if (oid && String(oid).startsWith('popup-') && !currentMarkerIds.has(String(oid))) {
        map.removeOverlay(overlay);
      }
    });

    // 🟢 [핵심 개선] 차량 간 거리(진행도)를 비교하여 겹침을 방지하는 스태킹 계산
    const activeCars = markers.filter(m => !m.isFacility && m.isFocused).map((m, index) => {
        const progress = Math.max(0, Math.min(1, m.progress || 0));
        const isLgStart = (m.startLat || 0) > 35.18;
        return {
            id: m.id || index,
            absoluteProgress: isLgStart ? progress : (1 - progress) // 동일선상의 절대 진행도
        };
    }).sort((a, b) => a.absoluteProgress - b.absoluteProgress);

    const stackIndexes: Record<string, number> = {};
    activeCars.forEach((car, i) => {
        if (i === 0) {
            stackIndexes[car.id] = 0;
            return;
        }
        const prevCar = activeCars[i - 1];
        // 진행도 차이가 4%(약 0.04) 이내로 가까우면 팝업을 위로 쌓아올림
        if (Math.abs(car.absoluteProgress - prevCar.absoluteProgress) < 0.04) {
            stackIndexes[car.id] = stackIndexes[prevCar.id] + 1;
        } else {
            stackIndexes[car.id] = 0;
        }
    });

    markers.filter(car => !car.isFacility).forEach((car, index) => {
      let carPos: Coordinate;
      const isTarget = car.isFocused; 
      const isLgStart = (car.startLat || 0) > 35.18;
      const progress = Math.max(0, Math.min(1, car.progress || 0));
      const carId = car.id || index;

      if (typeof car.progress === 'number') {
        if (isLgStart) {
            carPos = routeGeom.getCoordinateAt(progress);
        } else {
            carPos = routeGeom.getCoordinateAt(1 - progress);
        }
        
        if (isTarget) {
          const flatCoords = routeGeom.getCoordinates();
          let remainingCoords: Coordinate[] = [];
          
          if (isLgStart) {
            const startIndex = Math.floor((flatCoords.length - 1) * progress);
            remainingCoords = [carPos, ...flatCoords.slice(startIndex)];
          } else {
            const endIndex = Math.floor((flatCoords.length - 1) * (1 - progress));
            remainingCoords = [...flatCoords.slice(0, endIndex), carPos];
          }

          if (remainingCoords.length > 1) {
            const remainingFeature = new Feature({ geometry: new LineString(remainingCoords) });
            remainingFeature.setStyle(new Style({ stroke: new Stroke({ color: '#22C55E', width: 6, lineCap: 'round' }), zIndex: 3 }));
            remainingRouteSource.addFeature(remainingFeature);
          }

          // 🟢 [남은 시간 자동 계산 로직] (기존 동일)
          const totalLengthMeters = routeGeom.getLength(); 
          const remainingMeters = totalLengthMeters * (1 - progress);
          const remainingKm = remainingMeters / 1000;
          const avgSpeedKmH = 60; 
          const remainingHoursTotal = remainingKm / avgSpeedKmH;
          const remainingMinutesTotal = Math.round(remainingHoursTotal * 60);

          const hours = Math.floor(remainingMinutesTotal / 60);
          const minutes = remainingMinutesTotal % 60;
          
          let computedRemainingTimeStr = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
          if (remainingMinutesTotal <= 1) computedRemainingTimeStr = "도착 임박";

          // 🟢 [팝업 오프셋 및 UI 점선 동적 생성]
          const sIndex = stackIndexes[carId] || 0;
          const POPUP_HEIGHT = 135; // 팝업 박스의 여백 포함 높이
          const yOffset = -35 - (sIndex * POPUP_HEIGHT); // 겹칠수록 위로 상승

          // 겹쳐서 위로 올라간 팝업에 대해 점선 꼬리(Tail) 연결
          const tailHtml = sIndex > 0 
              ? `<div style="position: absolute; bottom: -${sIndex * POPUP_HEIGHT}px; left: calc(50% - 1px); width: 0; height: ${(sIndex * POPUP_HEIGHT) - 8}px; border-left: 2px dashed rgba(59, 130, 246, 0.5); z-index: -1;"></div>` 
              : '';

          const overlayId = `popup-${carId}`;
          let overlay = map.getOverlayById(overlayId);

          // 팝업 컨테이너 디자인을 약간 더 슬림하게(컴팩트하게) 다듬었습니다.
          const popupContent = `
            <div style="z-index: ${99999 - sIndex}; position: relative; background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(8px); padding: 10px 14px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.12); border: 1px solid #e2e8f0; min-width: 180px; font-family: 'Pretendard', sans-serif; pointer-events: none;">
              ${tailHtml}
              <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid rgba(255,255,255,0.95);"></div>
              
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <div style="width:8px; height:8px; background:#22c55e; border-radius:50%; box-shadow:0 0 5px #22c55e;"></div>
                  <span style="font-size: 14px; font-weight: 800; color: #1e293b;">${car.vehicleNo || car.title || '차량정보 없음'}</span>
                </div>
                <span style="font-size: 10px; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: 3px 6px; border-radius: 6px;">배송중</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
                    <span>기사명</span>
                    <span style="font-weight: 700; color: #334155;">${car.driver || '-'}</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
                    <span>남은 시간</span>
                    <span style="font-weight: 700; color: #EF4444;">${computedRemainingTimeStr}</span>
                </div>

                <div style="background: #f8fafc; padding: 6px 8px; border-radius: 8px; margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; font-weight: 600; color: #64748b;">도착 예정</span>
                  <span style="font-size: 13px; font-weight: 800; color: #3b82f6;">${car.eta || '이동 중'}</span>
                </div>
              </div>
            </div>`;

          if (overlay) {
            overlay.setPosition(carPos);
            overlay.setOffset([0, yOffset]); // 덮어씌울 때 오프셋도 동기화
            if (overlay.getElement()) {
              overlay.getElement()!.innerHTML = popupContent;
            }
          } else {
            const popupEl = document.createElement('div');
            popupEl.innerHTML = popupContent;
            const newOverlay = new Overlay({
              id: overlayId,
              element: popupEl,
              position: carPos,
              positioning: 'bottom-center',
              offset: [0, yOffset], // 스태킹 적용
              stopEvent: false,
            });
            map.addOverlay(newOverlay);
          }
        }
      } else {
        carPos = routeGeom.getFirstCoordinate();
      }

      // ... (아래 마커 아이콘 설정 부분은 기존과 동일하게 유지)
      const carFeature = new Feature({ geometry: new Point(carPos) });
      
      if (isTarget && car.imageUrl) {
        const scaleX = isLgStart ? -dynamicIconScale : dynamicIconScale;
        const scaleY = dynamicIconScale;

        carFeature.setStyle(new Style({
          image: new Icon({
            src: car.imageUrl,
            scale: [scaleX, scaleY], 
            rotation: 0,
            rotateWithView: true,
            anchor: [0.5, 0.5]
          }),
          zIndex: 100 
        }));
      } else {
        carFeature.setStyle(new Style({
          image: new CircleStyle({
            radius: dynamicDotRadius,
            fill: new Fill({ color: '#EF4444' }),
            stroke: new Stroke({ color: '#FFFFFF', width: 2 })
          }),
          zIndex: 50
        }));
      }
      
      markerSource.addFeature(carFeature);
    });

  }, [markers]);

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v9.0.0/ol.css" />
      <div ref={mapElement} style={{ width: "100%", height: "100%", background: "#f8fafc" }} />
    </>
  );
}