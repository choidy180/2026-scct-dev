"use client";

import React, { useEffect, useRef } from "react";
import OlMap from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { Point, LineString } from "ol/geom";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
// 🟢 Icon 추가 import
import { Style, Stroke, Fill, Circle as CircleStyle, Icon } from "ol/style";
import Feature from "ol/Feature";
import Overlay from "ol/Overlay";
import { boundingExtent } from "ol/extent";
import { Coordinate } from "ol/coordinate";
import { Geometry } from "ol/geom";
import { GeoJSON } from "ol/format";
import axios from "axios";

export interface VWorldMarker {
  lat: number; lng: number; title?: string; imageUrl?: string; isFacility?: boolean;
  startLat?: number; startLng?: number; destLat?: number; destLng?: number; arrival?: string;
  progress?: number;
}

interface EtaData { toBusan: number; toLG: number; }

interface VWorldMapProps {
  markers?: VWorldMarker[];
  onEtaUpdate?: (eta: EtaData) => void;
}

// 백업용 곡선 생성
const createCurvedLine = (start: Coordinate, end: Coordinate, arcHeight: number = 0.1): LineString => {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const midX = (start[0] + end[0]) / 2;
  const midY = (start[1] + end[1]) / 2;
  const len = Math.sqrt(dx * dx + dy * dy);
  const normalX = -dy / len * (len * arcHeight);
  const normalY = dx / len * (len * arcHeight);
  const controlX = midX + normalX;
  const controlY = midY + normalY;
  const points: Coordinate[] = [];
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlX + t * t * end[0];
    const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlY + t * t * end[1];
    points.push([x, y]);
  }
  return new LineString(points);
};

export default function VWorldMap({ markers = [], onEtaUpdate }: VWorldMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<OlMap | null>(null);
  const routeCache = useRef(new globalThis.Map<string, any>());
  const initialFitRef = useRef(false);

  const routeSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const markerSourceRef = useRef<VectorSource<Feature<Geometry>> | null>(null);
  const baseLayerRef = useRef<TileLayer<XYZ> | null>(null);

  // 🎨 스타일: 파란색 경로 (선명하게)
  const createRouteStyle = () => [
    new Style({ stroke: new Stroke({ color: '#1E40AF', width: 11, lineCap: 'round', lineJoin: 'round' }) }),
    new Style({ stroke: new Stroke({ color: '#3B82F6', width: 8, lineCap: 'round', lineJoin: 'round' }) })
  ];

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapElement.current) return;
    if (mapRef.current) return;

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
    baseLayerRef.current = baseLayer;

    const map = new OlMap({
      target: mapElement.current,
      layers: [baseLayer, new VectorLayer({ source: routeSource, zIndex: 10 }), new VectorLayer({ source: markerSource, zIndex: 20 })],
      // 🔴 [줌 레벨 수정] 14로 설정하여 처음부터 조금 더 확대된 상태로 시작
      view: new View({ 
        center: fromLonLat([128.76, 36.18]), 
        zoom: 13,       // 초기값 (fit 실행 전 잠깐 보임)
        minZoom: 13,     // 제한을 5로 낮춤 (더 축소 가능하게)
        maxZoom: 13     // 제한을 18로 높임 (더 확대 가능하게)
      }),
      controls: [],
    });
    mapRef.current = map;

    setTimeout(() => map.updateSize(), 300);
  }, []);

  // 3. 데이터 그리기
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

    const uniqueRoutes = new Map<string, any>();
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
            const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${m.startLng},${m.startLat};${m.destLng},${m.destLat}?overview=full&geometries=geojson`);
            if (res.data.routes && res.data.routes.length > 0) {
              const route = res.data.routes[0];
              geometry = new GeoJSON().readGeometry(route.geometry, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
              duration = route.duration;
              routeCache.current.set(routeKey, { geometry, duration });
            }
          } catch (e) { }
        }

        if (!geometry) {
          geometry = createCurvedLine(fromLonLat([m.startLng!, m.startLat!]), fromLonLat([m.destLng!, m.destLat!]), 0.1);
          duration = 1800;
        }

        if (m.arrival?.includes("GMT")) etaResults.toBusan = duration;
        else etaResults.toLG = duration;

        if (!drawnRoutes.has(routeKey)) {
          drawnRoutes.add(routeKey);
          const routeFeature = new Feature({ geometry });
          routeFeature.setStyle(() => createRouteStyle());
          routeSource.addFeature(routeFeature);
        }

        markers.filter(car => {
          const k = `${car.startLat?.toFixed(4)},${car.startLng?.toFixed(4)}-${car.destLat?.toFixed(4)},${car.destLng?.toFixed(4)}`;
          return k === routeKey && !car.isFacility;
        }).forEach(car => {
          let carPos: Coordinate;
          // 차량 회전 각도 계산용
          let rotation = 0;

          if (geometry instanceof LineString && typeof car.progress === 'number') {
            carPos = geometry.getCoordinateAt(car.progress);

            // 🟢 [방향 계산 로직 수정]
            // 현재 위치보다 아주 조금 앞선 위치를 가져와서 각도를 구함
            const nextPos = geometry.getCoordinateAt(Math.min(car.progress + 0.005, 1)); // look-ahead 간격 미세 조정
            const dx = nextPos[0] - carPos[0];
            const dy = nextPos[1] - carPos[1];

            // Math.atan2(dy, dx)는 반시계 방향 각도(라디안)를 반환합니다.
            // OpenLayers 회전은 시계 방향이 양수이므로 부호를 반대로 합니다. (-Math.atan2)
            // 사용 중인 화살표 SVG가 위쪽(북쪽)을 향하고 있으므로,
            // OpenLayers의 기준 방향인 오른쪽(동쪽, 0도)에 맞추기 위해 90도(PI/2)를 더해줍니다.
            rotation = -Math.atan2(dy, dx) + Math.PI / 2;

          } else {
            const s = fromLonLat([car.startLng!, car.startLat!]);
            const e = fromLonLat([car.destLng!, car.destLat!]);
            carPos = [s[0] + (e[0] - s[0]) * (car.progress || 0.5), s[1] + (e[1] - s[1]) * (car.progress || 0.5)];
            // 직선일 경우 각도 계산 (필요시 구현)
            // const dx = e[0] - s[0]; const dy = e[1] - s[1];
            // rotation = -Math.atan2(dy, dx) + Math.PI / 2;
          }

          const carFeature = new Feature({ geometry: new Point(carPos) });

          // 🟢 [수정됨] 마커 스타일: 이미지가 있으면 Icon(회전 적용), 없으면 원형
          if (car.imageUrl) {
            carFeature.setStyle(new Style({
              image: new Icon({
                src: car.imageUrl,
                scale: 0.6, // 크기 조절 (이전 요청 반영)
                rotation: rotation, // 🟢 계산된 회전 각도 적용
                rotateWithView: true,
                anchor: [0.5, 0.5] // 회전 중심점을 아이콘 중앙으로 설정
              })
            }));
          } else {
            carFeature.setStyle(new Style({
              image: new CircleStyle({
                radius: 7,
                fill: new Fill({ color: '#3B82F6' }),
                stroke: new Stroke({ color: '#ffffff', width: 3 }),
              })
            }));
          }

          markerSource.addFeature(carFeature);
        });
      };
      routePromises.push(fetchAndDraw());
    });

    markers.filter(m => m.isFacility).forEach(m => {
      const mPos = fromLonLat([m.lng, m.lat]);
      allCoords.push(mPos);
      const el = document.createElement('div');
      const isLG = m.title?.includes("LG");
      const borderColor = isLG ? '#EF4444' : '#3B82F6';
      const bgColor = '#ffffff';
      const textColor = '#111827';

      el.innerHTML = `
            <div style="position: relative; width: 56px; height: 56px; background: ${bgColor}; border: 3px solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <img src="${m.imageUrl}" style="width: 75%; height: auto;">
            </div>
            <div style="margin-top: 6px; font-size: 12px; font-weight: 700; color: ${textColor}; background: rgba(255,255,255,0.95); padding: 4px 10px; border-radius: 8px; text-align: center; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">${m.title}</div>`;
      map.addOverlay(new Overlay({ position: mPos, element: el, positioning: 'center-center' }));
    });

    Promise.all(routePromises).then(() => {
      if (onEtaUpdate) onEtaUpdate(etaResults);
      markers.forEach(m => {
        if (m.startLng) allCoords.push(fromLonLat([m.startLng, m.startLat!]));
        if (m.destLng) allCoords.push(fromLonLat([m.destLng, m.destLat!]));
      });
      if (allCoords.length > 0 && !initialFitRef.current) {
        initialFitRef.current = true;
        map.getView().fit(boundingExtent(allCoords), { padding: [200, 200, 200, 200], duration: 1000 });
      }
    });
  }, [markers, onEtaUpdate]);

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v10.4.0/ol.css" />
      <div
        ref={mapElement}
        style={{
          width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0,
          backgroundColor: "#ffffff", // 로딩 전 배경
          zIndex: 0
        }}
      />
    </>
  );
}