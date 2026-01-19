'use client';

import GmtLoadingScreen from '@/components/loading/gmt-loading';
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { X, ZoomIn, ZoomOut, Maximize2, Video, Clock, Truck, Tag, Activity } from 'lucide-react'; 

// =============================================================================
// 0. GLOBAL STYLE & THEME
// =============================================================================

const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
    background-color: #F5F7FA;
    color: #1A202C;
    overflow: hidden;
  }
  * { box-sizing: border-box; }
`;

// =============================================================================
// 1. DATA DEFINITIONS
// =============================================================================
const JIG_1_L = ['GJ01', 'GJ03', 'GJ05', 'GJ07', 'GJ09', 'GJ11', 'GJ13', 'GJ15', 'GJ17'];
const JIG_1_R = ['GJ19', 'GJ21', 'GJ23', 'GJ25', 'GJ27', 'GJ29', 'GJ31'];
const JIG_BTM = ['GJ33', 'GJ35', 'GJ37', 'GJ39', 'GJ41', 'GJ43', 'GJ45', 'GJ47', 'GJ49', 'GJ51', 'GJ53', 'GJ55', 'GJ57', 'GJ59'];

const GF_LEFT_COL = ['24','18','12','06'];
const GF_RIGHT_COL = ['23','17','11','05'];
const GF_GRID = [
  ['22','21','20','19'], ['16','15','14','13'], ['10','09','08','07'], ['04','03','02','01']
];

const GA_TOP_1 = ['10','09','08','07','06','05','04','03','02','01'];
const GA_TOP_2 = ['20','19','18','17','16','15','14','13','12','11'];

const GA_ROWS = [
  { l:['30','29','28'], r:['27','26','25','24','23','22','21'] },
  { l:['40','39','38'], r:['37','36','35','34','33','32','31'] },
  { l:['50','49','48'], r:['47','46','45','44','43','42','41'] },
  { l:['60','59','58'], r:['57','56','55','54','53','52','51'] },
  { l:['70','69','68'], r:['67','66','65','64','63','62','61'] }
];

const GB_34_L = ['34','33','32'];
const GB_34_R = ['31','30','29','28','27','26','25','24','23','22','21','20','19','18'];
const GB_17_L = ['17','16','15'];
const GB_17_R = ['14','13','12','11','10','09','08','07','06','05','04','03','02','01'];

const GC_L_TOP = ['26','25','24','23','22','21','20','19','18'];
const GC_L_BTM = ['13','12','11','10','09','08','07','06','05'];
const GC_R_TOP = ['17','16','15','14'];
const GC_R_BTM = ['04','03','02','01'];

const GE_L = ['28'];
const GE_BODY = [{l:'27',r:'26'}, {l:'25',r:'24'}, {l:'23',r:'22'}];
const GE_GRID = [
  ['21','20','19'],['18','17','16'],['15','14','13'],['12','11','10'],['09','08','07'],['06','05','04']
];

const GD_STRIP = [
  {l:'45',r:'44'}, {l:'43',r:'42'}, {l:'41',r:'40'}, {l:'39',r:'38'}, {l:'37',r:'36'}, {l:'35',r:'34'}, {l:'33',r:'32'}, {l:'31',r:'30'}, {l:'29',r:'28'}
];
const GD_GRID_H = ['GE03','GE02','GE01'];
const GD_GRID = [
  ['27','26','25'],['24','23','22'],['21','20','19'],['18','17','16'],['15','14','13'],['12','11','10'],['09','08','07'],['06','05','04'],['03','02','01']
];

// =============================================================================
// 2. STYLED COMPONENTS
// =============================================================================

const W_JIG = '58px';
const W_NARROW = '48px';
const W_WIDE = '96px';
const CELL_HEIGHT = '36px';

const pulse = keyframes`
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
`;

/* [수정 완료] flex-direction: column 복구하여 하단 바 위치 정상화 */
const Layout = styled.div`
  display: flex;
  width: 100vw;
  height: calc(100vh - 64px);
  padding: 20px;
  gap: 20px;
  background-color: #F5F7FA;
  flex-direction: column; /* 중요: 세로 배치 복구 */
`;

const MainBody = styled.div`
  display: flex;
  flex: 1;
  gap: 20px;
  overflow: hidden;
`;

const LeftColumn = styled.div`
  width: 290px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Panel = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  border: 1px solid #EDF2F7;
  overflow: hidden;
`;

const ZoneStatusCard = styled(Panel)`
  flex: 1; 
  min-height: 0;
`;

const MonitoringCard = styled(Panel)`
  flex-shrink: 0;
  height: auto;
`;

const RightPanel = styled(Panel)` width: 260px; height: 100%; `;

const Header = styled.div`
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 800;
  color: #1A202C;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background-color: #FFFFFF;
`;

const MapCanvas = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center; 
  padding: 0;
  overflow: hidden; 
  background: #F5F7FA;
`;

const MapScaleWrapper = styled.div`
  transform: scale(0.75); 
  transform-origin: center center;
  width: fit-content;
  height: fit-content;
`;

const MapContentWrapper = styled.div`
  display: flex;
  gap: 40px;
`;

const ColLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  width: fit-content;
`;

const ColRight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding-top: 5px;
`;

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: fit-content;
  border-top: 1px solid #A0AEC0;
  border-left: 1px solid #A0AEC0;
  background-color: white;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
`;

const Row = styled.div` display: flex; `;

const CellBox = styled.div<{ w: string }>`
  width: ${props => props.w};
  height: ${CELL_HEIGHT};
  display: flex;
  flex-direction: column;
  border-right: 1px solid #A0AEC0;
  border-bottom: 1px solid #A0AEC0;
  background-color: white;
  position: relative;
  &:hover {
    z-index: 10;
    box-shadow: inset 0 0 0 2px #4299e1;
  }
`;

const CellHeader = styled.div`
  height: 14px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #141414;
  background-color: #EDF2F7;
  border-bottom: 1px solid #E2E8F0;
`;

const CellValue = styled.div<{ $active?: boolean }>`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  background-color: ${props => props.$active ? '#48BB78' : 'white'};
  color: ${props => props.$active ? 'white' : 'transparent'};
  transition: background-color 0.2s;
  cursor: pointer;
`;

const SectionTitleWrapper = styled.div<{ $isActive: boolean }>`
  font-size: 15px;
  font-weight: 800;
  color: ${props => props.$isActive ? '#3182CE' : '#718096'}; 
  margin-bottom: 8px;
  margin-left: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LiveDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #48BB78;
  animation: ${pulse} 1.5s infinite ease-in-out;
`;

const SectionTitle = ({ children, isActive = false }: { children: React.ReactNode, isActive?: boolean }) => (
  <SectionTitleWrapper $isActive={isActive}>
    {children}
    {isActive && <LiveDot />}
  </SectionTitleWrapper>
);

const JigZoneBox = styled.div`
  background-color: rgba(214, 188, 250, 0.3); 
  border: 1px solid #D6BCFA;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const StatusCard = styled.div`
  padding: 10px 20px;
  border-bottom: 1px solid #F7FAFC;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background-color: #F8FAFC; }
`;

const StatLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #4A5568;
`;

const ProgressBarBg = styled.div`
  width: 100%;
  height: 6px;
  background-color: #EDF2F7;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ percent: number }>`
  width: ${props => props.percent}%;
  height: 100%;
  background-color: ${props => props.percent > 80 ? '#F6AD55' : '#48BB78'};
  border-radius: 3px;
`;

const InvCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #EDF2F7;
  transition: background 0.2s;
  &:hover { background-color: #F0FFF4; }
`;

const InvCode = styled.div` font-size: 12px; font-weight: 600; color: #4A5568; `;
const InvQty = styled.div`
  font-size: 13px; font-weight: 800; color: #2F855A;
  background: #F0FFF4; padding: 2px 8px; border-radius: 10px;
`;

const TooltipBox = styled.div`
  position: fixed;
  z-index: 3000;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 12px;
  min-width: 200px;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  backdrop-filter: blur(4px);
  
  .tooltip-header {
    font-size: 14px; font-weight: 800; color: #2D3748;
    border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 4px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .tooltip-row {
    display: flex; justify-content: space-between; font-size: 12px;
    .label { color: #718096; font-weight: 500; }
    .value { color: #2D3748; font-weight: 700; }
  }
  .status-badge {
    padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;
    &.occupied { background: #C6F6D5; color: #22543D; }
    &.empty { background: #EDF2F7; color: #718096; }
  }
`;

// =============================================================================
// 좌측 패널 내부 스타일
// =============================================================================

const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  background-color: #FFFFFF;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background-color: #E2E8F0; border-radius: 2px; }
`;

const TotalStatusFooter = styled.div`
  padding: 12px 20px;
  background-color: #F8FAFC;
  border-top: 1px solid #EDF2F7;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const VideoWrapper = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #1A202C;
  position: relative;
  overflow: hidden;
`;

const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
`;

const CompactInfo = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CompactRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  
  span.label { color: #718096; font-weight: 500; display: flex; align-items: center; gap: 4px; }
  span.value { color: #2D3748; font-weight: 700; }
`;

// =============================================================================
// Bottom & Modal
// =============================================================================

/* [수정 완료] flex-direction이 column인 Layout 하단에 위치하게 됨 */
const BottomBar = styled.div`
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0;
  flex-shrink: 0; /* 축소 방지 */
`;

const ExpandButton = styled.button`
  background-color: #FFFFFF;
  color: #2D3748;
  border: 1px solid #E2E8F0;
  padding: 12px 28px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-color: #BEE3F8;
    color: #3182CE;
  }
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

const ZoomModalOverlay = styled.div`
  position: fixed;
  top: 64px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 64px);
  background-color: rgba(255, 255, 255, 0.98); 
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid #E2E8F0;
`;

const ZoomContentArea = styled.div<{ $isDragging: boolean }>`
  flex: 1;
  overflow: auto;
  position: relative;
  cursor: ${(props) => (props.$isDragging ? 'grabbing' : 'grab')};
  user-select: none;
  &::-webkit-scrollbar { width: 12px; height: 12px; }
  &::-webkit-scrollbar-track { background: #F1F5F9; }
  &::-webkit-scrollbar-thumb { background-color: #CBD5E0; border-radius: 6px; border: 3px solid #F1F5F9; }
  &::-webkit-scrollbar-thumb:hover { background-color: #A0AEC0; }
`;

const ZoomControls = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 10px 24px;
  border-radius: 50px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 2010;
  border: 1px solid #E2E8F0;
`;

const ZoomBtn = styled.button`
  width: 36px; height: 36px; border-radius: 50%; border: 1px solid #E2E8F0;
  background: white; color: #4A5568; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: #EDF2F7; color: #2D3748; transform: scale(1.1); }
  &:active { transform: scale(0.95); }
`;

const StyledRange = styled.input`
  -webkit-appearance: none; width: 150px; height: 6px; border-radius: 3px; background: #E2E8F0; outline: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%;
    background: #3182CE; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 3px solid white; transition: transform 0.1s;
  }
  &::-webkit-slider-thumb:hover { transform: scale(1.15); }
`;

const CloseZoomButton = styled.button`
  position: absolute; top: 20px; right: 30px; background: white; border: 1px solid #E2E8F0; color: #4A5568;
  padding: 10px 20px; border-radius: 30px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700;
  cursor: pointer; z-index: 2010; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.2s;
  &:hover { background: #FFF5F5; border-color: #FEB2B2; color: #C53030; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
  &:active { transform: translateY(0); }
`;

// =============================================================================
// 3. TYPES & 4. SUB-COMPONENTS
// =============================================================================

interface ApiSlotDetail {
  slot_id: number;
  occupied: boolean;
  loc_code: string;
  label001: string | null;
  vehicle_id: string | null;
  entry_time: string | null;
}

interface ApiZoneData {
  total: number;
  occupied: number;
  slots_detail: ApiSlotDetail[];
}

type ApiResponse = Record<string, ApiZoneData>;
interface SlotDataMap { [locCode: string]: ApiSlotDetail; }
interface InventoryItem { code: string; qty: number; }
interface ZoneStat { name: string; total: number; used: number; }
interface TooltipState { x: number; y: number; data: ApiSlotDetail | null; locCode: string; }
interface WarehouseLayoutProps { renderCell: (id: string, w: string) => React.ReactNode; }

const CellItem = React.memo(({ id, w, data, onHover }: { 
  id: string, w: string, data: ApiSlotDetail | undefined, 
  onHover: (e: React.MouseEvent, id: string, data: ApiSlotDetail | undefined) => void 
}) => {
  const isOccupied = data?.occupied;
  const displayVal = isOccupied ? (data?.label001 ? data.label001.slice(-4) : '0000') : '';
  return (
    <CellBox w={w} onMouseEnter={(e) => onHover(e, id, data)} onMouseLeave={(e) => onHover(e, id, undefined)}>
      <CellHeader>{id}</CellHeader>
      <CellValue $active={isOccupied}>{displayVal}</CellValue>
    </CellBox>
  );
}, (prev, next) => prev.id === next.id && prev.w === next.w && prev.data === next.data);
CellItem.displayName = "CellItem";


const WarehouseLayout = React.memo(({ renderCell }: WarehouseLayoutProps) => {
  const JigStrip = ({ ids }: { ids: string[] }) => ( <Row>{ids.map(id => renderCell(id, W_JIG))}</Row> );
  return (
    <MapContentWrapper>
      <ColLeft>
        <JigZoneBox>
          <SectionTitle>JIG ZONE</SectionTitle>
          <div style={{display:'flex', gap:'20px', alignItems:'flex-end'}}>
            <GridContainer><JigStrip ids={JIG_1_L} /><JigStrip ids={JIG_1_L} /></GridContainer>
            <GridContainer><JigStrip ids={JIG_1_R} /><JigStrip ids={JIG_1_R} /></GridContainer>
          </div>
          <div style={{marginTop:'10px', marginLeft:'60px'}}>
            <GridContainer><JigStrip ids={JIG_BTM} /><JigStrip ids={JIG_BTM} /></GridContainer>
          </div>
        </JigZoneBox>

        <div>
          <SectionTitle isActive={true}>GA</SectionTitle>
          <GridContainer>
            <Row>{GA_TOP_1.slice(0,3).map((n) => renderCell(`GA${n}`, W_NARROW))}{GA_TOP_1.slice(3).map((n) => renderCell(`GA${n}`, W_WIDE))}</Row>
            <Row>{GA_TOP_2.slice(0,3).map((n) => renderCell(`GA${n}`, W_NARROW))}{GA_TOP_2.slice(3).map((n) => renderCell(`GA${n}`, W_WIDE))}</Row>
          </GridContainer>
        </div>
        <div>
          <SectionTitle isActive={true}>GA / GB</SectionTitle>
          <GridContainer>
            {GA_ROWS.map((row, i) => (
                <Row key={i}>{row.l.map(n => renderCell(`GA${n}`, W_NARROW))}{row.r.map(n => renderCell(`GA${n}`, W_WIDE))}</Row>
            ))}
            <Row>{GB_34_L.map(n => renderCell(`GB${n}`, W_NARROW))}{GB_34_R.map(n => renderCell(`GB${n}`, W_NARROW))}</Row>
            <Row>{GB_17_L.map(n => renderCell(`GB${n}`, W_NARROW))}{GB_17_R.map(n => renderCell(`GB${n}`, W_NARROW))}</Row>
          </GridContainer>
        </div>
        <div>
          <SectionTitle isActive={true}>GC</SectionTitle>
          <div style={{display:'flex', gap:'20px'}}>
            <GridContainer><Row>{GC_L_TOP.map(n => renderCell(`GC${n}`, W_NARROW))}</Row><Row>{GC_L_BTM.map(n => renderCell(`GC${n}`, W_NARROW))}</Row></GridContainer>
            <GridContainer><Row>{GC_R_TOP.map(n => renderCell(`GC${n}`, W_NARROW))}</Row><Row>{GC_R_BTM.map(n => renderCell(`GC${n}`, W_NARROW))}</Row></GridContainer>
          </div>
        </div>
      </ColLeft>

      <ColRight>
        <div>
          <SectionTitle>GF</SectionTitle>
          <div style={{display:'flex', gap:'15px'}}>
              <GridContainer>
                  <Row>
                    <div style={{display:'flex', flexDirection:'column'}}>{GF_LEFT_COL.map(n => renderCell(`GF${n}`, W_NARROW))}</div>
                    <div style={{display:'flex', flexDirection:'column'}}>{GF_RIGHT_COL.map(n => renderCell(`GF${n}`, W_NARROW))}</div>
                  </Row>
              </GridContainer>
              <GridContainer>{GF_GRID.map((row, i) => (<Row key={i}>{row.map(n => renderCell(`GF${n}`, W_NARROW))}</Row>))}</GridContainer>
          </div>
        </div>
        <div>
          <SectionTitle>GE / GD</SectionTitle>
          <div style={{display:'flex', gap:'20px'}}>
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
                  <GridContainer style={{marginRight: W_NARROW}}>{renderCell(`GE${GE_L[0]}`, W_NARROW)}</GridContainer>
                  <GridContainer style={{marginBottom:'20px'}}>{GE_BODY.map((p,i) => (<Row key={i}>{renderCell(`GE${p.l}`, W_NARROW)}{renderCell(`GE${p.r}`, W_NARROW)}</Row>))}</GridContainer>
                  <GridContainer>{GD_STRIP.map((p,i) => (<Row key={i}>{renderCell(`GD${p.l}`, W_NARROW)}{renderCell(`GD${p.r}`, W_NARROW)}</Row>))}</GridContainer>
              </div>
              <div style={{display:'flex', flexDirection:'column'}}>
                  <div style={{height:'40px'}}></div>
                  <GridContainer style={{marginBottom:'20px'}}>{GE_GRID.map((row,i) => (<Row key={i}>{row.map(n => renderCell(`GE${n}`, W_NARROW))}</Row>))}</GridContainer>
                  <GridContainer>
                      <Row>{GD_GRID_H.map(id => renderCell(id, W_NARROW))}</Row>
                      {GD_GRID.map((row,i) => (<Row key={i}>{row.map(n => renderCell(`GD${n}`, W_NARROW))}</Row>))}
                  </GridContainer>
              </div>
          </div>
        </div>
      </ColRight>
    </MapContentWrapper>
  );
});
WarehouseLayout.displayName = "WarehouseLayout";

// =============================================================================
// 5. MAIN COMPONENT
// =============================================================================

export default function FinalDashboard() {
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<SlotDataMap>({});
  const [hoverInfo, setHoverInfo] = useState<TooltipState | null>(null);
  
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // [설정] 비디오 URL
  const VIDEO_URL = "/videos/aivideo.mp4"; 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://1.254.24.170:24828/api/DX_API000014');
        const json: ApiResponse = await res.json();
        const newMap: SlotDataMap = {};
        Object.values(json).forEach((zone) => {
          if (zone.slots_detail) {
            zone.slots_detail.forEach((slot) => {
              if (slot.loc_code) newMap[slot.loc_code] = slot;
            });
          }
        });
        setMapData(newMap);
      } catch (error) {
        console.error("API Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo<ZoneStat[]>(() => {
    const zones = ['GA', 'GB', 'GC', 'GD', 'GE', 'GF'];
    const result = zones.map(zoneName => ({ name: zoneName, total: 0, used: 0 }));
    Object.values(mapData).forEach(slot => {
      const prefix = slot.loc_code.substring(0, 2); 
      const zoneIdx = zones.indexOf(prefix);
      if (zoneIdx !== -1) {
        result[zoneIdx].total += 1;
        if (slot.occupied) result[zoneIdx].used += 1;
      }
    });
    return result;
  }, [mapData]);

  const inventory = useMemo<InventoryItem[]>(() => {
    const invMap: Record<string, number> = {};
    Object.values(mapData).forEach(slot => {
      if (slot.occupied && slot.label001) {
        const code = slot.label001;
        invMap[code] = (invMap[code] || 0) + 1;
      }
    });
    return Object.entries(invMap).map(([code, qty]) => ({ code, qty })).sort((a, b) => b.qty - a.qty);
  }, [mapData]);

  const recentEntry = useMemo<ApiSlotDetail | null>(() => {
    let latest: ApiSlotDetail | null = null;
    let maxTime = 0;

    Object.values(mapData).forEach(slot => {
      if (slot.occupied && slot.entry_time) {
        const time = new Date(slot.entry_time).getTime();
        if (time > maxTime) {
          maxTime = time;
          latest = slot;
        }
      }
    });
    return latest;
  }, [mapData]);

  const totalCap = stats.reduce((a, b) => a + b.total, 0);
  const totalUsed = stats.reduce((a, b) => a + b.used, 0);
  const totalPercent = totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0;

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    } catch { return isoString; }
  };

  const handleCellHover = useCallback((e: React.MouseEvent, id: string, data: ApiSlotDetail | undefined) => {
    if (data || id) { 
      setHoverInfo(data !== undefined ? {
        x: e.clientX, y: e.clientY, data: data || null, locCode: id
      } : null);
    }
  }, []);

  const renderCell = useCallback((id: string, w: string) => {
    return <CellItem key={id} id={id} w={w} data={mapData[id]} onHover={handleCellHover} />;
  }, [mapData, handleCellHover]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setStartY(e.pageY - containerRef.current.offsetTop);
    setScrollLeft(containerRef.current.scrollLeft);
    setScrollTop(containerRef.current.scrollTop);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const y = e.pageY - containerRef.current.offsetTop;
    const walkX = (x - startX) * 1.5; 
    const walkY = (y - startY) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walkX;
    containerRef.current.scrollTop = scrollTop - walkY;
  };

  return (
    <>
      <GlobalStyle />
      {loading && <GmtLoadingScreen />}
      
      {hoverInfo && (
        <TooltipBox style={{ top: hoverInfo.y + 15, left: hoverInfo.x + 15 }}>
          <div className="tooltip-header">
            <span>{hoverInfo.locCode}</span>
            <span className={`status-badge ${hoverInfo.data?.occupied ? 'occupied' : 'empty'}`}>
              {hoverInfo.data?.occupied ? '적재됨' : '빈 공간'}
            </span>
          </div>
          {hoverInfo.data?.occupied ? (
            <>
              <div className="tooltip-row"><span className="label">Label ID</span><span className="value">{hoverInfo.data.label001 || '0000'}</span></div>
              <div className="tooltip-row"><span className="label">Vehicle</span><span className="value">{hoverInfo.data.vehicle_id || '-'}</span></div>
              <div className="tooltip-row"><span className="label">입고 시간</span><span className="value">{formatTime(hoverInfo.data.entry_time)}</span></div>
            </>
          ) : (
            <div className="tooltip-row" style={{justifyContent: 'center', color: '#A0AEC0', padding: '10px 0'}}>데이터 없음</div>
          )}
        </TooltipBox>
      )}

      {isZoomMode && (
        <ZoomModalOverlay>
          <CloseZoomButton onClick={() => { setIsZoomMode(false); setZoomLevel(1); }}>
            <X size={18} /> 닫기 / 축소
          </CloseZoomButton>
          <ZoomContentArea 
            ref={containerRef} $isDragging={isDragging}
            onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}
          >
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: '0 0', padding: '100px', width: 'fit-content', height: 'fit-content' }}>
              <WarehouseLayout renderCell={renderCell} />
            </div>
          </ZoomContentArea>
          <ZoomControls>
            <ZoomBtn onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}><ZoomOut size={16} /></ZoomBtn>
            <StyledRange type="range" min="1" max="5" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} />
            <ZoomBtn onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.5))}><ZoomIn size={16} /></ZoomBtn>
            <div style={{fontSize:'14px', fontWeight:'700', color:'#4A5568', width:'40px', textAlign:'right', fontVariantNumeric:'tabular-nums'}}>{zoomLevel.toFixed(1)}x</div>
          </ZoomControls>
        </ZoomModalOverlay>
      )}

      <Layout>
        <MainBody>
          <LeftColumn>
            {/* 1. 구역 현황 카드 */}
            <ZoneStatusCard>
              <Header>
                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <Activity size={18} color="#2D3748" />
                  <span>구역별 현황</span>
                </div>
              </Header>
              <ScrollableList>
                {stats.map(s => {
                  const pct = s.total > 0 ? Math.round((s.used / s.total) * 100) : 0;
                  return (
                    <StatusCard key={s.name}>
                      <StatLabelRow><span>{s.name} 구역</span><span>{s.used} / {s.total} ({pct}%)</span></StatLabelRow>
                      <ProgressBarBg><ProgressBarFill percent={pct} /></ProgressBarBg>
                    </StatusCard>
                  );
                })}
              </ScrollableList>
              <TotalStatusFooter>
                <div style={{fontSize:'13px', fontWeight:'600', color:'#64748B'}}>전체 가동률</div>
                <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                   <div style={{fontSize:'13px', fontWeight:'700', color: totalPercent > 90 ? '#E53E3E' : '#48BB78'}}>
                    {totalPercent > 90 ? '혼잡' : '원활'}
                  </div>
                  <div style={{fontSize:'16px', fontWeight:'800', color:'#1A202C'}}>{totalPercent}%</div>
                </div>
              </TotalStatusFooter>
            </ZoneStatusCard>

            {/* 2. 모니터링 카드 */}
            <MonitoringCard>
              <Header style={{padding:'12px 16px', fontSize:'14px'}}>
                 <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <Video size={16} color="#2D3748" />
                  <span>현장 모니터링</span>
                </div>
              </Header>
              <div style={{position:'relative'}}>
                 <VideoWrapper>
                  <StyledVideo src={VIDEO_URL} autoPlay loop muted playsInline />
                </VideoWrapper>
              </div>
              
              <CompactInfo>
                <div style={{fontSize:'12px', fontWeight:'700', color:'#A0AEC0', marginBottom:'6px', display:'flex', alignItems:'center', gap:'4px'}}>
                   <Clock size={12}/> 최근 입고
                </div>
                {recentEntry ? (
                  <>
                    <CompactRow>
                      <span className="label">라벨</span>
                      <span className="value">{recentEntry.label001 || '-'}</span>
                    </CompactRow>
                     <CompactRow>
                      <span className="label">차량</span>
                      <span className="value">{recentEntry.vehicle_id || '-'}</span>
                    </CompactRow>
                    {/* [추가된 부분] 입고 시간 표시 */}
                    <CompactRow>
                      <span className="label">시간</span>
                      <span className="value">{formatTime(recentEntry.entry_time)}</span>
                    </CompactRow>
                  </>
                ) : (
                  <div style={{fontSize:'12px', color:'#A0AEC0', textAlign:'center'}}>대기 중...</div>
                )}
              </CompactInfo>
            </MonitoringCard>

          </LeftColumn>

          <MapCanvas>
            <MapScaleWrapper>
              <WarehouseLayout renderCell={renderCell} />
            </MapScaleWrapper>
          </MapCanvas>

          <RightPanel>
            <Header>실시간 재고 <span style={{fontSize:'12px', background:'#C6F6D5', color:'#22543D', padding:'2px 8px', borderRadius:'12px'}}>Live</span></Header>
            <div style={{overflowY:'auto', flex:1, padding:'5px 0'}}>
              {inventory.length > 0 ? inventory.map((item) => (
                <InvCard key={item.code}><InvCode>{item.code}</InvCode><InvQty>{item.qty}</InvQty></InvCard>
              )) : <div style={{padding:'20px', textAlign:'center', color:'#A0AEC0', fontSize:'13px'}}>데이터 없음</div>}
            </div>
          </RightPanel>
        </MainBody>
        
        {/* [원복] 원래 위치(화면 맨 아래) 및 원래 용어(Maximize2 아이콘 + 확대해서 보기) */}
        <BottomBar>
          <ExpandButton onClick={() => setIsZoomMode(true)}>
            <Maximize2 size={18} /> 확대해서 보기
          </ExpandButton>
        </BottomBar>
      </Layout>
    </>
  );
}