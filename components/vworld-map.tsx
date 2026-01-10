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

// ✅ Marker 인터페이스
export interface VWorldMarker {
  lat: number;
  lng: number;
  title?: string;
  imageUrl?: string;
  isFacility?: boolean;
  startLat?: number;
  startLng?: number;
  destLat?: number;
  destLng?: number;
  arrival?: string;
  progress?: number;
  rotation?: number; 
  isFocused?: boolean;
  driver?: string;
  cargo?: string;
  eta?: string;
}

interface EtaData { toBusan: number; toLG: number; }

interface VWorldMapProps {
  markers?: VWorldMarker[];
  focusedTitle?: string | null;
  onEtaUpdate?: (eta: EtaData) => void;
}

// 🟢 [고정 경로] LG전자 -> 창원터널 -> 녹산
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
  
  // 소스 & 오버레이 Refs
  const routeSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const remainingRouteSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const markerSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const routeGeomRef = useRef<LineString | null>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  const popupElementRef = useRef<HTMLDivElement | null>(null);

  // 🎨 스타일
  const createStyles = () => ({
    baseRoute: [
      new Style({ stroke: new Stroke({ color: 'white', width: 10, lineCap: 'round' }), zIndex: 1 }),
      new Style({ stroke: new Stroke({ color: '#3B82F6', width: 6, lineCap: 'round' }), zIndex: 2 })
    ],
    remainingRoute: [
      new Style({ stroke: new Stroke({ color: '#22C55E', width: 6, lineCap: 'round' }), zIndex: 3 })
    ]
  });

  // 1. 지도 초기화 (최초 1회 실행)
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
        zoom: 8, minZoom: 6, maxZoom: 18    
      }),
      controls: [], 
    });
    mapRef.current = map;

    // 🟢 [중요] 시설물 오버레이는 여기서 딱 한 번만 생성합니다.
    // markers prop이 바뀌어도 이 부분은 재실행되지 않아야 합니다.
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

    // 🟢 팝업 오버레이 생성 (딱 하나만)
    const popupEl = document.createElement('div');
    popupEl.style.pointerEvents = 'none'; // 클릭 통과
    popupEl.style.zIndex = '1000';

    popupElementRef.current = popupEl;
    
    const popupOverlay = new Overlay({
      element: popupEl,
      positioning: 'bottom-center',
      offset: [0, -35], // 아이콘 위로 띄움
      stopEvent: false,
    });
    map.addOverlay(popupOverlay);
    popupOverlayRef.current = popupOverlay;

    // 경로 그리기
    const projectedCoords = FIXED_NAV_PATH.map(coord => fromLonLat([coord[0], coord[1]]));
    const routeGeom = new LineString(projectedCoords);
    routeGeomRef.current = routeGeom;

    const routeFeature = new Feature({ geometry: routeGeom });
    routeFeature.setStyle(createStyles().baseRoute);
    routeSource.addFeature(routeFeature);

    // 지도 뷰 조정
    const extent = boundingExtent(projectedCoords);
    map.getView().fit(extent, { padding: [200, 200, 200, 200], duration: 1000 });

    setTimeout(() => map.updateSize(), 300);

    if (onEtaUpdate) onEtaUpdate({ toBusan: 2400, toLG: 2400 });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  // 2. 마커 & 팝업 업데이트
  // components/vworld-map.tsx 의 두 번째 useEffect

  // 2. 마커 & 팝업 업데이트
  useEffect(() => {
    const markerSource = markerSourceRef.current;
    const remainingRouteSource = remainingRouteSourceRef.current;
    const map = mapRef.current;
    const routeGeom = routeGeomRef.current;
    const popupOverlay = popupOverlayRef.current;
    const popupElement = popupElementRef.current;

    if (!map || !markerSource || !remainingRouteSource || !routeGeom || !popupOverlay || !popupElement) return;

    markerSource.clear();
    remainingRouteSource.clear();
    popupOverlay.setPosition(undefined);

    // 🟢 [추가 1] 현재 줌 레벨 가져오기 및 동적 크기 계산
    const currentZoom = map.getView().getZoom() || 10; // 값이 없으면 기본 10

    // 기준 줌(예: 13)에서 현재 줌이 얼마나 차이나는지 계산 (1.2배씩 증감)
    // 이 수치(13, 1.2)를 조절하면 커지는 속도를 바꿀 수 있습니다.
    const zoomFactor = Math.pow(1.2, currentZoom - 13);

    // 1) 타겟 트럭 이미지 스케일 계산 (기준 0.3)
    let dynamicIconScale = 0.3 * zoomFactor;
    // 너무 작아지거나 너무 커지지 않게 제한 (최소 0.05, 최대 1.0)
    dynamicIconScale = Math.max(0.05, Math.min(dynamicIconScale, 1.0));
    // 좌우 반전을 위해 X축은 음수 적용
    const finalIconScale = [-dynamicIconScale, dynamicIconScale];

    // 2) 빨간 점 반지름 계산 (기준 6px)
    let dynamicDotRadius = 6 * zoomFactor;
    // 최소 크기 제한 (2px 이하로는 안 작아지게)
    dynamicDotRadius = Math.max(2, dynamicDotRadius);


    markers.filter(car => !car.isFacility).forEach(car => {
      let carPos: Coordinate;
      let rotation = 0;
      let dx = 0;
      let dy = 0;
      
      const isTarget = car.title === focusedTitle; // 타겟 차량 여부 확인

      if (typeof car.progress === 'number') {
        // ... (경로 계산 및 팝업 로직은 기존과 동일하여 생략, 위 코드 참고) ...
        const progress = Math.max(0, Math.min(1, car.progress));
        carPos = routeGeom.getCoordinateAt(progress);
        
        const nextPos = routeGeom.getCoordinateAt(Math.min(progress + 0.02, 1));
        dx = nextPos[0] - carPos[0];
        dy = nextPos[1] - carPos[1];
        rotation = -Math.atan2(dy, dx) + Math.PI / 2;

        if (isTarget) {
          // ... (팝업 관련 기존 코드 유지) ...
          const flatCoords = routeGeom.getCoordinates();
          const startIndex = Math.floor((flatCoords.length - 1) * progress);
          const remainingCoords = [carPos, ...flatCoords.slice(startIndex)];

          if (remainingCoords.length > 1) {
            const remainingFeature = new Feature({ geometry: new LineString(remainingCoords) });
            remainingFeature.setStyle(new Style({ stroke: new Stroke({ color: '#22C55E', width: 6, lineCap: 'round' }), zIndex: 3 }));
            remainingRouteSource.addFeature(remainingFeature);
          }

          popupOverlay.setPosition(carPos);
          popupElement.innerHTML = `
            <div style="background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(8px); padding: 12px 16px; border-radius: 12px; box-shadow: 0 12px 30px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; min-width: 200px; font-family: 'Pretendard', sans-serif; pointer-events: none;">
              <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid rgba(255,255,255,0.95);"></div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
                <div style="display:flex; align-items:center; gap:6px;">
                  <div style="width:8px; height:8px; background:#22c55e; border-radius:50%; box-shadow:0 0 5px #22c55e;"></div>
                  <span style="font-size: 15px; font-weight: 800; color: #1e293b;">${car.title}</span>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: 3px 8px; border-radius: 6px;">배송중</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b;"><span>기사명</span><span style="font-weight: 700; color: #334155;">${car.driver || '-'}</span></div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b;"><span>화물정보</span><span style="font-weight: 700; color: #334155;">${car.cargo || '-'}</span></div>
                <div style="background: #f8fafc; padding: 8px; border-radius: 8px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; font-weight: 600; color: #64748b;">도착 예정</span>
                  <span style="font-size: 14px; font-weight: 800; color: #3b82f6;">${car.eta || '--:--'}</span>
                </div>
              </div>
            </div>`;
        }
      } else {
        carPos = routeGeom.getFirstCoordinate();
      }

      // 🟢 [수정] 타겟 차량 및 일반 차량 스타일에 동적 크기 적용
      const carFeature = new Feature({ geometry: new Point(carPos) });
      
      if (isTarget && car.imageUrl) {
        // 타겟 차량: 트럭 이미지
        carFeature.setStyle(new Style({
          image: new Icon({
            src: car.imageUrl,
            // 🟢 [수정 2] 고정값 대신 계산된 finalIconScale 사용
            scale: finalIconScale, 
            rotation: rotation - (Math.PI / 2),
            rotateWithView: true,
            anchor: [0.5, 0.5]
          }),
          zIndex: 100 
        }));
      } else {
        // 그 외 차량: 흰 테두리 빨간 점
        carFeature.setStyle(new Style({
          image: new CircleStyle({
            // 🟢 [수정 3] 고정값(6) 대신 계산된 dynamicDotRadius 사용
            radius: dynamicDotRadius,
            fill: new Fill({ color: '#EF4444' }),
            stroke: new Stroke({ color: '#FFFFFF', width: 2 })
          }),
          zIndex: 50
        }));
      }
      
      markerSource.addFeature(carFeature);
    });

  }, [markers, focusedTitle]);

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v9.0.0/ol.css" />
      <div ref={mapElement} style={{ width: "100%", height: "100%", background: "#f8fafc" }} />
    </>
  );
}