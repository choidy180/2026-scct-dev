import React, { useState, useMemo } from 'react';
import { LayoutGrid, PieChart as PieIcon, Package as PackageIcon, Search, Layers, Box, X as XIcon } from "lucide-react";
// 스타일 파일에서 RedBoardContainer를 가져오거나 이름을 변경해야 합니다.
import { RedBoardContainer } from '@/styles/styles'; 
import { WearableInventoryItem, WearableSlotData, WearableZoneData } from '@/types/types';

// 컴포넌트 이름을 Red로 변경
const MemoizedRedInventoryItem = React.memo(({ item }: { item: WearableInventoryItem }) => (
  <div className="inv-item">
    <div className="icon"><Layers size={14}/></div>
    <div className="info">
      <div className="c">{item.code}</div>
      <div className="l">{item.loc}</div>
    </div>
    <div className="q">{item.qty}</div>
  </div>
));
MemoizedRedInventoryItem.displayName = 'MemoizedRedInventoryItem';

const MemoizedRedSlot = React.memo(({ s }: { s: WearableSlotData }) => (
    <div className={`slot ${s.active?'on':''}`}>
        {s.active && (
            <div className="icon-box">
                {/* 아이콘 색상을 붉은색 계열로 변경 (Red-300, Red-500) */}
                <Box size={14} fill="#fca5a5" color="#ef4444"/>
            </div>
        )}
        {s.no}
    </div>
));
MemoizedRedSlot.displayName = 'MemoizedRedSlot';

const RedZoneColumn = React.memo(({ zone }: { zone: WearableZoneData }) => (
    <div className="zone-col">
        <div className="z-head">
            <div className="top">
                <span className="id">{zone.id}</span>
                {/* 상태 표시 색상 로직 수정 가능 (현재는 기존 로직 유지하되 CSS 클래스에 따라 색상 적용) */}
                <span className={`st ${zone.status==='만차'?'r':zone.status==='혼잡'?'o':'g'}`}>{zone.status}</span>
            </div>
            <div className="usage-text">
                <span>점유율</span>
                <b>{Math.round((zone.used/zone.total)*100)}%</b>
            </div>
            {/* 진행 바 색상은 CSS 혹은 인라인 스타일로 제어. 테마에 맞춰 붉은색 계열 적용이 필요할 수 있음 */}
            <div className="bar"><div className="fill" style={{width: `${(zone.used/zone.total)*100}%`, backgroundColor: '#ef4444'}}/></div>
        </div>
        <div className="slot-grid-container">
            <div className="slot-grid">
                {zone.slots.map((s) => <MemoizedRedSlot key={s.no} s={s} />)}
            </div>
        </div>
    </div>
));
RedZoneColumn.displayName = 'RedZoneColumn';

const WarehouseBoard = ({ onClose }: { onClose: () => void }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const initialMapData: WearableZoneData[] = [
    { id: 'D101', total: 10, used: 2, free: 8, status: '여유', slots: Array.from({length: 10}, (_, i) => ({ no: i+1, active: i < 2 })) },
    { id: 'D102', total: 19, used: 15, free: 4, status: '혼잡', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: i < 15 })) },
    { id: 'D103', total: 20, used: 20, free: 0, status: '만차', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: true })) },
    { id: 'D104', total: 20, used: 8, free: 12, status: '보통', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 8 })) },
    { id: 'D105', total: 19, used: 0, free: 19, status: '비어있음', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: false })) },
  ];
  const mapData = initialMapData;

  const inventoryData: WearableInventoryItem[] = useMemo(() => [
    { code: 'ADC30009358', qty: 708, loc: 'D101' }, { code: 'ADC30014326', qty: 294, loc: 'D102' },
    { code: 'ADC30003801', qty: 204, loc: 'D102' }, { code: 'AGF04075606', qty: 182, loc: 'D103' },
    { code: 'ADC30009359', qty: 150, loc: 'D104' }, { code: 'AGM76970201', qty: 120, loc: 'D101' },
    { code: 'AGM76970202', qty: 100, loc: 'D105' }, { code: 'AGM76970203', qty: 50, loc: 'D101' },
    { code: 'AGM76970204', qty: 30, loc: 'D102' }, { code: 'AGM76970205', qty: 10, loc: 'D103' },
    { code: 'AGM76970206', qty: 120, loc: 'D104' }, { code: 'AGM76970207', qty: 100, loc: 'D105' },
  ], []);

  const filteredInventory = useMemo(() => 
    inventoryData.filter(item => 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.loc.toLowerCase().includes(searchTerm.toLowerCase()) 
    ), 
  [inventoryData, searchTerm]);
  
  return ( 
    <RedBoardContainer> 
        <div className="board-header"> 
            {/* 타이틀 아이콘 색상 변경 (Red-500) */}
            <div className="title"><LayoutGrid size={24} color="#ef4444"/> D동 실시간 적재 현황판</div> 
            <button className="close-btn" onClick={onClose}><XIcon size={28}/></button> 
        </div> 
        <div className="board-body"> 
            <div className="left-col"> 
                <div className="summary-card"> 
                    <h3><PieIcon size={16}/> 종합 적재 현황</h3> 
                    <div className="chart-area"> 
                        <div className="pie-mock" style={{borderColor: '#ef4444'}}><span className="val">48%</span></div> 
                        <div className="legend"> 
                            {/* 범례 텍스트 색상 및 닷 컬러 변경 */}
                            <div><span className="dot primary" style={{background: '#ef4444'}}></span>사용: <b>48</b></div> 
                            <div><span className="dot secondary"></span>여유: <b>52</b></div> 
                        </div> 
                    </div> 
                </div> 
                <div className="inv-list-wrapper"> 
                    <div className="search-row"> 
                        {/* 텍스트 변경: 재고 리스트 -> 부품 리스트 */}
                        <h3><PackageIcon size={16}/> 부품 리스트</h3> 
                        <div className="s-box"><Search size={14}/><input placeholder="검색..." onChange={e=>setSearchTerm(e.target.value)}/></div> 
                    </div> 
                    <div className="list-scroll"> 
                        {filteredInventory.map((item, i) => ( <MemoizedRedInventoryItem key={i} item={item} /> ))} 
                    </div> 
                </div> 
            </div> 
            <div className="map-col"> 
                <div className="map-legend"> 
                    <span className="badge empty"><div className="dot" style={{background:'#cbd5e1'}}/> 여유</span>
                    {/* Active 상태를 붉은색 테마로 변경 */}
                    <span className="badge active"><div className="dot" style={{background:'#ef4444'}}/> 사용</span>
                    {/* 만차는 더 짙은 붉은색이나 기존 유지 */}
                    <span className="badge full"><div className="dot" style={{background:'#991b1b'}}/> 만차</span> 
                </div> 
                <div className="zone-wrapper"> 
                    {mapData.map(zone => <RedZoneColumn key={zone.id} zone={zone} />)} 
                </div> 
            </div> 
        </div> 
    </RedBoardContainer> 
  )
};

export default WarehouseBoard;