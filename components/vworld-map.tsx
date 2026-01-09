"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { GeoJSON } from "ol/format";
import axios from "axios";

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
}

interface EtaData { toBusan: number; toLG: number; }

interface VWorldMapProps {
  markers?: VWorldMarker[];
  onEtaUpdate?: (eta: EtaData) => void;
  focusedTitle?: string | null;
}

export default function VWorldMap({ markers = [], onEtaUpdate, focusedTitle }: VWorldMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const routeCache = useRef(new globalThis.Map<string, any>());
  const initialFitRef = useRef(false);

  // 🟢 [추가] 에러 상태 관리
  const [apiError, setApiError] = useState(false);

  const routeSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const markerSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);

  // 🎨 경로 스타일
  const createRouteStyle = () => [
    new Style({ stroke: new Stroke({ color: 'white', width: 10, lineCap: 'round', lineJoin: 'round' }), zIndex: 1 }),
    new Style({ stroke: new Stroke({ color: '#3B82F6', width: 6, lineCap: 'round', lineJoin: 'round' }), zIndex: 2 })
  ];

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const routeSource = new VectorSource<Feature<Geometry>>();
    const markerSource = new VectorSource<Feature<Geometry>>();
    routeSourceRef.current = routeSource;
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
        new VectorLayer({ source: markerSource, zIndex: 20 })
      ],
      view: new View({ 
        center: fromLonLat([128.76, 35.18]), 
        zoom: 12,        
        minZoom: 9,     
        maxZoom: 18     
      }),
      controls: [], 
    });
    mapRef.current = map;

    setTimeout(() => map.updateSize(), 300);
  }, []);

  // 2. 데이터 그리기 (API 호출)
  useEffect(() => {
    const map = mapRef.current;
    const routeSource = routeSourceRef.current;
    const markerSource = markerSourceRef.current;
    if (!map || !routeSource || !markerSource) return;

    routeSource.clear();
    markerSource.clear();
    map.getOverlays().clear();

    const allCoords: Coordinate[] = [];
    const routePromises: Promise<void>[] = [];
    const drawnRoutes = new Set<string>();
    const etaResults = { toBusan: 0, toLG: 0 };

    // 중복 경로 제거
    const uniqueRoutes = new globalThis.Map<string, VWorldMarker>();
    markers.forEach(m => {
      if (m.startLat && m.destLat) {
        const routeKey = `${m.startLat.toFixed(4)},${m.startLng?.toFixed(4)}-${m.destLat.toFixed(4)},${m.destLng?.toFixed(4)}`;
        if (!uniqueRoutes.has(routeKey)) uniqueRoutes.set(routeKey, m);
      }
    });

    uniqueRoutes.forEach((m, routeKey) => {
      const fetchAndDraw = async () => {
        let geometry: Geometry | null = null;
        let duration = 0;

        if (routeCache.current.has(routeKey)) {
          const cached = routeCache.current.get(routeKey);
          geometry = cached.geometry;
          duration = cached.duration;
        } else {
          try {
            // 🟢 실제 도로 API 호출 (OSRM)
            const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${m.startLng},${m.startLat};${m.destLng},${m.destLat}?overview=full&geometries=geojson`);
            
            console.log(`https://router.project-osrm.org/route/v1/driving/${m.startLng},${m.startLat};${m.destLng},${m.destLat}?overview=full&geometries=geojson`);
            if (res.data.code === 'Ok' && res.data.routes && res.data.routes.length > 0) {
              const route = res.data.routes[0];
              geometry = new GeoJSON().readGeometry(route.geometry, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
              duration = route.duration;
              routeCache.current.set(routeKey, { geometry, duration });
              
              // 성공 시 에러 상태 해제
              setApiError(false);
            } else {
              throw new Error("No Route Found");
            }
          } catch (err) {
             // 🔴 [핵심] API 실패 시, 억지로 선을 긋지 않고 에러 상태 true로 변경
             console.error("OSRM API Error:", err);
             setApiError(true); 
             return; // 함수 종료 (경로 안 그림)
          }
        }

        // ETA 업데이트
        if (m.arrival?.includes("GMT")) etaResults.toBusan = duration;
        else etaResults.toLG = duration;

        // 경로 그리기 (성공한 경우에만)
        if (geometry && !drawnRoutes.has(routeKey)) {
          drawnRoutes.add(routeKey);
          const routeFeature = new Feature({ geometry });
          routeFeature.setStyle(createRouteStyle());
          routeSource.addFeature(routeFeature);
          
          if (geometry instanceof LineString) {
             geometry.getCoordinates().forEach(c => allCoords.push(c));
          }
        }

        // 차량 마커 그리기
        markers.filter(car => {
          const k = `${car.startLat?.toFixed(4)},${car.startLng?.toFixed(4)}-${car.destLat?.toFixed(4)},${car.destLng?.toFixed(4)}`;
          return k === routeKey && !car.isFacility;
        }).forEach(car => {
          let carPos: Coordinate;
          let rotation = 0;

          if (geometry instanceof LineString && typeof car.progress === 'number') {
            const progress = Math.max(0, Math.min(1, car.progress));
            carPos = geometry.getCoordinateAt(progress);
            
            const nextPos = geometry.getCoordinateAt(Math.min(progress + 0.01, 1));
            const dx = nextPos[0] - carPos[0];
            const dy = nextPos[1] - carPos[1];
            rotation = -Math.atan2(dy, dx) + Math.PI / 2;
          } else {
            // 경로가 없으면 출발지 대기
            carPos = fromLonLat([car.startLng!, car.startLat!]);
          }

          const carFeature = new Feature({ geometry: new Point(carPos) });
          const isTarget = car.title === focusedTitle;

          if (car.imageUrl) {
            carFeature.setStyle(new Style({
              image: new Icon({
                src: car.imageUrl,
                scale: isTarget ? 0.1 : 0.08,
                rotation: rotation,
                rotateWithView: true,
                anchor: [0.5, 0.5]
              }),
              zIndex: isTarget ? 100 : 50 
            }));
          } 
          markerSource.addFeature(carFeature);
        });
      };
      
      routePromises.push(fetchAndDraw());
    });

    // 시설물 마커
    markers.filter(m => m.isFacility).forEach(m => {
      const mPos = fromLonLat([m.lng, m.lat]);
      allCoords.push(mPos);
      const el = document.createElement('div');
      const isLG = m.title?.includes("LG");
      const borderColor = isLG ? '#EF4444' : '#3B82F6';
      
      el.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="width: 52px; height: 52px; background: white; border: 3px solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
            <img src="${m.imageUrl}" style="width: 80%; height: auto; object-fit: contain;">
          </div>
          <div style="margin-top: 4px; font-size: 11px; font-weight: 700; color: #1f2937; background: rgba(255,255,255,0.95); padding: 3px 8px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); white-space: nowrap;">
            ${m.title}
          </div>
        </div>
      `;
      map.addOverlay(new Overlay({ position: mPos, element: el, positioning: 'center-center' }));
    });

    Promise.all(routePromises).then(() => {
      if (onEtaUpdate) onEtaUpdate(etaResults);
      if (allCoords.length > 0 && !initialFitRef.current && !apiError) {
        initialFitRef.current = true;
        map.getView().fit(boundingExtent(allCoords), { padding: [100, 100, 100, 100], duration: 1000 });
      }
    });

  }, [markers, onEtaUpdate, focusedTitle]);

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v10.4.0/ol.css" />
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        
        {/* 지도 영역 */}
        <div
          ref={mapElement}
          style={{ width: "100%", height: "100%", backgroundColor: "#f8fafc" }}
        />

        {/* 🟢 [핵심] API 에러 발생 시 반투명 모달 표시 */}
        {apiError && (
          <div style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)", // 반투명 검정
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            color: "white",
            pointerEvents: "none" // 클릭은 통과되게 할지, 막을지 선택 (여기선 막지 않음)
          }}>
            <div style={{ 
              backgroundColor: "rgba(30, 41, 59, 0.9)", 
              padding: "24px 40px", 
              borderRadius: "16px", 
              border: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="48" height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#EF4444" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ marginBottom: "16px" }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>경로 데이터를 불러올 수 없습니다</h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#CBD5E1" }}>
                API 호출이 실패하여 상세 경로를 표시할 수 없습니다.<br/>
                네트워크 연결 상태를 확인해주세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}