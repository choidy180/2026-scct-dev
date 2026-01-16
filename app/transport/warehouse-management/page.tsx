'use client';

import GmtLoadingScreen from '@/components/loading/gmt-loading';
import React, { useEffect, useState, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

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
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
`;

// =============================================================================
// 1. DATA DEFINITIONS (LAYOUT CONSTANTS)
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

const Layout = styled.div`
  display: flex;
  width: 100vw;
  height: calc(100vh - 64px);
  padding: 20px;
  gap: 20px;
  background-color: #F5F7FA;
`;

const Panel = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  border: 1px solid #EDF2F7;
`;

const LeftPanel = styled(Panel)` width: 260px; `;
const RightPanel = styled(Panel)` width: 260px; `;

const Header = styled.div`
  padding: 18px 20px;
  font-size: 16px;
  font-weight: 800;
  color: #2D3748;
  border-bottom: 1px solid #EDF2F7;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MapCanvas = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 10px;
  transform: scale(0.95);
`;

const MapContent = styled.div`
  display: flex;
  gap: 40px;
  transform-origin: top center;
  @media (max-height: 1000px) { transform: scale(0.95); }
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

const Row = styled.div`
  display: flex;
`;

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

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #718096;
  margin-bottom: 5px;
  margin-left: 2px;
`;

const StatusCard = styled.div`
  padding: 12px 15px;
  border-bottom: 1px solid #F7FAFC;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #F7FAFC;
  }
`;

const StatLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #2D3748;
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
  
  &:hover {
    background-color: #F0FFF4;
  }
`;

const InvCode = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #4A5568;
`;

const InvQty = styled.div`
  font-size: 13px;
  font-weight: 800;
  color: #2F855A;
  background: #F0FFF4;
  padding: 2px 8px;
  border-radius: 10px;
`;

const TooltipBox = styled.div`
  position: fixed;
  z-index: 1000;
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
    font-size: 14px;
    font-weight: 800;
    color: #2D3748;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 4px;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .tooltip-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    
    .label { color: #718096; font-weight: 500; }
    .value { color: #2D3748; font-weight: 700; }
  }

  .status-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    &.occupied { background: #C6F6D5; color: #22543D; }
    &.empty { background: #EDF2F7; color: #718096; }
  }
`;

// =============================================================================
// 3. TYPES
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

interface SlotDataMap {
  [locCode: string]: ApiSlotDetail;
}

interface InventoryItem {
  code: string;
  qty: number;
}

interface ZoneStat {
  name: string;
  total: number;
  used: number;
}

interface TooltipState {
  x: number;
  y: number;
  data: ApiSlotDetail | null;
  locCode: string;
}

// =============================================================================
// 4. COMPONENTS
// =============================================================================

export default function FinalDashboard() {
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<SlotDataMap>({});
  const [hoverInfo, setHoverInfo] = useState<TooltipState | null>(null);
  
  // 데이터 Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://1.254.24.170:24828/api/DX_API000014');
        const json: ApiResponse = await res.json();
        
        const newMap: SlotDataMap = {};
        
        Object.values(json).forEach((zone) => {
          if (zone.slots_detail) {
            zone.slots_detail.forEach((slot) => {
              if (slot.loc_code) {
                newMap[slot.loc_code] = slot;
              }
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

  // 통계 계산
  const stats = useMemo<ZoneStat[]>(() => {
    const zones = ['GA', 'GB', 'GC', 'GD', 'GE', 'GF'];
    const result = zones.map(zoneName => ({ name: zoneName, total: 0, used: 0 }));
    
    Object.values(mapData).forEach(slot => {
      const prefix = slot.loc_code.substring(0, 2); 
      const zoneIdx = zones.indexOf(prefix);
      if (zoneIdx !== -1) {
        result[zoneIdx].total += 1;
        if (slot.occupied) {
          result[zoneIdx].used += 1;
        }
      }
    });

    return result;
  }, [mapData]);

  // 재고 집계
  const inventory = useMemo<InventoryItem[]>(() => {
    const invMap: Record<string, number> = {};
    Object.values(mapData).forEach(slot => {
      if (slot.occupied && slot.label001) {
        const code = slot.label001;
        invMap[code] = (invMap[code] || 0) + 1;
      }
    });
    return Object.entries(invMap)
      .map(([code, qty]) => ({ code, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [mapData]);

  const totalCap = stats.reduce((a, b) => a + b.total, 0);
  const totalUsed = stats.reduce((a, b) => a + b.used, 0);
  const totalPercent = totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0;

  // 날짜 포맷팅
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  // Cell 컴포넌트
  const Cell = ({ id, w }: { id: string, w: string }) => {
    const slot = mapData[id];
    const isOccupied = slot?.occupied;
    
    // [수정] 적재됨 && ID 존재 시 뒤 4자리, ID 없으면 0000
    const displayVal = isOccupied 
      ? (slot?.label001 ? slot.label001.slice(-4) : '0000') 
      : '';

    return (
      <CellBox 
        w={w}
        onMouseEnter={(e) => {
          setHoverInfo({
            x: e.clientX,
            y: e.clientY,
            data: slot || null,
            locCode: id
          });
        }}
        onMouseLeave={() => {
          setHoverInfo(null);
        }}
      >
        <CellHeader>{id}</CellHeader>
        <CellValue $active={isOccupied}>
          {displayVal}
        </CellValue>
      </CellBox>
    );
  };

  const JigStrip = ({ ids }: { ids: string[] }) => (
    <Row>
      {ids.map(id => <Cell key={id} id={id} w={W_JIG} />)}
    </Row>
  );

  return (
    <>
      <GlobalStyle />
      {loading && <GmtLoadingScreen />}
      
      {/* 툴팁 UI */}
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
              <div className="tooltip-row">
                <span className="label">Label ID</span>
                {/* [수정] ID 없으면 0000 표시 */}
                <span className="value">{hoverInfo.data.label001 || '0000'}</span>
              </div>
              <div className="tooltip-row">
                <span className="label">Vehicle</span>
                <span className="value">{hoverInfo.data.vehicle_id || '-'}</span>
              </div>
              <div className="tooltip-row">
                <span className="label">입고 시간</span>
                <span className="value">{formatTime(hoverInfo.data.entry_time)}</span>
              </div>
            </>
          ) : (
            <div className="tooltip-row" style={{justifyContent: 'center', color: '#A0AEC0', padding: '10px 0'}}>
              데이터 없음
            </div>
          )}
        </TooltipBox>
      )}

      <Layout>
        {/* LEFT: STATUS */}
        <LeftPanel>
          <Header>구역별 가동 현황</Header>
          <div style={{overflowY:'auto', flex:1, padding:'5px 0'}}>
            {stats.map(s => {
              const pct = s.total > 0 ? Math.round((s.used / s.total) * 100) : 0;
              return (
                <StatusCard key={s.name}>
                  <StatLabelRow>
                    <span>{s.name} 구역</span>
                    <span style={{color:'#718096'}}>{s.used} / {s.total} ({pct}%)</span>
                  </StatLabelRow>
                  <ProgressBarBg>
                    <ProgressBarFill percent={pct} />
                  </ProgressBarBg>
                </StatusCard>
              );
            })}
          </div>
          <div style={{padding:'20px', background:'#F9FAFB', borderTop:'1px solid #EDF2F7'}}>
            <div style={{fontSize:'12px', color:'#718096', marginBottom:'5px'}}>전체 가동률</div>
            <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
              <div style={{fontSize:'24px', fontWeight:'800', color:'#2D3748'}}>{totalPercent}%</div>
              <div style={{fontSize:'13px', fontWeight:'600', color:'#48BB78'}}>
                {totalPercent > 90 ? '혼잡' : '정상 운영 중'}
              </div>
            </div>
          </div>
        </LeftPanel>

        {/* CENTER: MAP */}
        <MapCanvas>
          <MapContent>
            {/* ... 기존 레이아웃 유지 ... */}
            
            {/* === LEFT COLUMN === */}
            <ColLeft>
              
              {/* JIG ZONE */}
              <div>
                <SectionTitle>JIG ZONE</SectionTitle>
                <div style={{display:'flex', gap:'20px', alignItems:'flex-end'}}>
                  <GridContainer>
                    <JigStrip ids={JIG_1_L} />
                    <JigStrip ids={JIG_1_L} />
                  </GridContainer>
                  <GridContainer>
                    <JigStrip ids={JIG_1_R} />
                    <JigStrip ids={JIG_1_R} />
                  </GridContainer>
                </div>
                <div style={{marginTop:'10px', marginLeft:'60px'}}>
                  <GridContainer>
                    <JigStrip ids={JIG_BTM} />
                    <JigStrip ids={JIG_BTM} />
                  </GridContainer>
                </div>
              </div>

              {/* GA TOP */}
              <div>
                <SectionTitle>GA</SectionTitle>
                <GridContainer>
                  <Row>
                      {GA_TOP_1.slice(0,3).map((n) => <Cell key={n} id={`GA${n}`} w={W_NARROW} />)}
                      {GA_TOP_1.slice(3).map((n) => <Cell key={n} id={`GA${n}`} w={W_WIDE} />)}
                  </Row>
                  <Row>
                      {GA_TOP_2.slice(0,3).map((n) => <Cell key={n} id={`GA${n}`} w={W_NARROW} />)}
                      {GA_TOP_2.slice(3).map((n) => <Cell key={n} id={`GA${n}`} w={W_WIDE} />)}
                  </Row>
                </GridContainer>
              </div>

              {/* MAIN RACK (GA/GB) */}
              <div>
                <SectionTitle>GA / GB</SectionTitle>
                <GridContainer>
                  {/* GA Rows */}
                  {GA_ROWS.map((row, i) => (
                      <Row key={i}>
                          {row.l.map(n => <Cell key={n} id={`GA${n}`} w={W_NARROW} />)}
                          {row.r.map(n => <Cell key={n} id={`GA${n}`} w={W_WIDE} />)}
                      </Row>
                  ))}
                  
                  {/* GB Rows */}
                  <Row>
                      {GB_34_L.map(n => <Cell key={n} id={`GB${n}`} w={W_NARROW} />)}
                      {GB_34_R.map(n => <Cell key={n} id={`GB${n}`} w={W_NARROW} />)}
                  </Row>
                  <Row>
                      {GB_17_L.map(n => <Cell key={n} id={`GB${n}`} w={W_NARROW} />)}
                      {GB_17_R.map(n => <Cell key={n} id={`GB${n}`} w={W_NARROW} />)}
                  </Row>
                </GridContainer>
              </div>

              {/* GC */}
              <div>
                <SectionTitle>GC</SectionTitle>
                <div style={{display:'flex', gap:'20px'}}>
                  <GridContainer>
                      <Row>{GC_L_TOP.map(n => <Cell key={n} id={`GC${n}`} w={W_NARROW} />)}</Row>
                      <Row>{GC_L_BTM.map(n => <Cell key={n} id={`GC${n}`} w={W_NARROW} />)}</Row>
                  </GridContainer>
                  <GridContainer>
                      <Row>{GC_R_TOP.map(n => <Cell key={n} id={`GC${n}`} w={W_NARROW} />)}</Row>
                      <Row>{GC_R_BTM.map(n => <Cell key={n} id={`GC${n}`} w={W_NARROW} />)}</Row>
                  </GridContainer>
                </div>
              </div>

            </ColLeft>

            {/* === RIGHT COLUMN === */}
            <ColRight>
              
               {/* GF */}
              <div>
                <SectionTitle>GF</SectionTitle>
                <div style={{display:'flex', gap:'15px'}}>
                    <GridContainer>
                        <Row>
                          <div style={{display:'flex', flexDirection:'column'}}>
                              {GF_LEFT_COL.map(n => <Cell key={n} id={`GF${n}`} w={W_NARROW} />)}
                          </div>
                          <div style={{display:'flex', flexDirection:'column'}}>
                              {GF_RIGHT_COL.map(n => <Cell key={n} id={`GF${n}`} w={W_NARROW} />)}
                          </div>
                        </Row>
                    </GridContainer>
                    <GridContainer>
                        {GF_GRID.map((row, i) => (
                            <Row key={i}>
                                {row.map(n => <Cell key={n} id={`GF${n}`} w={W_NARROW} />)}
                            </Row>
                        ))}
                    </GridContainer>
                </div>
              </div>

              {/* CLUSTER: GD (Left) + GE (Right) */}
              <div>
                <SectionTitle>GE / GD</SectionTitle>
                <div style={{display:'flex', gap:'20px'}}>
                    {/* Left Sub-Col: GE28 + GD Strip */}
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
                        <GridContainer style={{marginRight: W_NARROW}}>
                            <Cell id={`GE${GE_L[0]}`} w={W_NARROW} />
                        </GridContainer>
                        <GridContainer style={{marginBottom:'20px'}}>
                            {GE_BODY.map((p,i) => (
                                <Row key={i}>
                                    <Cell id={`GE${p.l}`} w={W_NARROW} />
                                    <Cell id={`GE${p.r}`} w={W_NARROW} />
                                </Row>
                            ))}
                        </GridContainer>

                        {/* GD Strip */}
                        <GridContainer>
                            {GD_STRIP.map((p,i) => (
                                <Row key={i}>
                                    <Cell id={`GD${p.l}`} w={W_NARROW} />
                                    <Cell id={`GD${p.r}`} w={W_NARROW} />
                                </Row>
                            ))}
                        </GridContainer>
                    </div>

                    {/* Right Sub-Col: GE Grid + GD Grid */}
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <div style={{height:'40px'}}></div> {/* Spacer */}
                        
                        {/* GE Grid */}
                        <GridContainer style={{marginBottom:'20px'}}>
                            {GE_GRID.map((row,i) => (
                                <Row key={i}>
                                    {row.map(n => <Cell key={n} id={`GE${n}`} w={W_NARROW} />)}
                                </Row>
                            ))}
                        </GridContainer>

                        {/* GD Grid */}
                        <GridContainer>
                            <Row>{GD_GRID_H.map(id => <Cell key={id} id={id} w={W_NARROW} />)}</Row>
                            {GD_GRID.map((row,i) => (
                                <Row key={i}>
                                    {row.map(n => <Cell key={n} id={`GD${n}`} w={W_NARROW} />)}
                                </Row>
                            ))}
                        </GridContainer>
                    </div>
                </div>
              </div>

            </ColRight>

          </MapContent>
        </MapCanvas>

        {/* RIGHT: INVENTORY */}
        <RightPanel>
          <Header>
            실시간 재고
            <span style={{fontSize:'12px', background:'#C6F6D5', color:'#22543D', padding:'2px 8px', borderRadius:'12px'}}>Live</span>
          </Header>
          <div style={{overflowY:'auto', flex:1, padding:'5px 0'}}>
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <InvCard key={item.code}>
                  <InvCode>{item.code}</InvCode>
                  <InvQty>{item.qty}</InvQty>
                </InvCard>
              ))
            ) : (
              <div style={{padding:'20px', textAlign:'center', color:'#A0AEC0', fontSize:'13px'}}>
                데이터 없음
              </div>
            )}
          </div>
        </RightPanel>

      </Layout>
    </>
  );
}