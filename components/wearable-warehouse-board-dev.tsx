import React, { useState, useMemo, useEffect } from 'react';
import { LayoutGrid, PieChart as PieIcon, Package as PackageIcon, Search, Layers, Box, X as XIcon } from "lucide-react";
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
                <span className={`st ${zone.status==='만차'?'r':zone.status==='혼잡'?'o':'g'}`}>{zone.status}</span>
            </div>
            <div className="usage-text">
                <span>점유율</span>
                <b>{Math.round((zone.used/zone.total)*100)}%</b>
            </div>
            <div className="bar">
                <div className="fill" style={{width: `${(zone.used/zone.total)*100}%`, backgroundColor: '#ef4444'}}/>
            </div>
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

  // 1. 맵 데이터 상태 관리
  const [mapData, setMapData] = useState<WearableZoneData[]>([
    { id: 'D101', total: 10, used: 2, free: 8, status: '여유', slots: Array.from({length: 10}, (_, i) => ({ no: i+1, active: i < 2 })) },
    { id: 'D102', total: 19, used: 15, free: 4, status: '혼잡', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: i < 15 })) },
    { id: 'D103', total: 20, used: 20, free: 0, status: '만차', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: true })) },
    { id: 'D104', total: 20, used: 8, free: 12, status: '보통', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 8 })) },
    { id: 'D105', total: 19, used: 0, free: 19, status: '비어있음', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: false })) },
  ]);

  // 2. 인벤토리 데이터 상태 관리
  const [inventoryData, setInventoryData] = useState<WearableInventoryItem[]>([
    { code: 'ADC30009358', qty: 708, loc: 'D101' }, { code: 'ADC30014326', qty: 294, loc: 'D102' },
    { code: 'ADC30003801', qty: 204, loc: 'D102' }, { code: 'AGF04075606', qty: 182, loc: 'D103' },
    { code: 'ADC30009359', qty: 150, loc: 'D104' }, { code: 'AGM76970201', qty: 120, loc: 'D101' },
    { code: 'AGM76970202', qty: 100, loc: 'D105' }, { code: 'AGM76970203', qty: 50, loc: 'D101' },
    { code: 'AGM76970204', qty: 30, loc: 'D102' }, { code: 'AGM76970205', qty: 10, loc: 'D103' },
    { code: 'AGM76970206', qty: 120, loc: 'D104' }, { code: 'AGM76970207', qty: 100, loc: 'D105' },
  ]);

  // 3. 5초 후 이벤트 발생 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => {
      // D101 구역 5번 슬롯 업데이트
      setMapData(prevMap => prevMap.map(zone => {
        if (zone.id === 'D101') {
          const updatedSlots = zone.slots.map(s => s.no === 5 ? { ...s, active: true } : s);
          const newUsed = zone.used + 1;
          return { 
            ...zone, 
            slots: updatedSlots, 
            used: newUsed, 
            free: zone.total - newUsed,
            status: newUsed > 8 ? '만차' : newUsed > 5 ? '혼잡' : '여유'
          };
        }
        return zone;
      }));

      // 부품 리스트에 새로운 항목 추가
      setInventoryData(prevInv => [
        { code: 'ADC30009673', qty: 195, loc: 'D105' }, // 새로운 데이터 추가
        ...prevInv
      ]);

      console.log("시뮬레이션: D101-5번 적재 완료 및 리스트 업데이트");
    }, 5000);

    return () => clearTimeout(timer); // 언마운트 시 타이머 클리어
  }, []);

  const filteredInventory = useMemo(() => 
    inventoryData.filter(item => 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.loc.toLowerCase().includes(searchTerm.toLowerCase()) 
    ), 
  [inventoryData, searchTerm]);
  
  return ( 
    <RedBoardContainer> 
        <div className="board-header"> 
            <div className="title"><LayoutGrid size={24} color="#ef4444"/> D동 실시간 적재 현황판</div> 
            <button className="close-btn" onClick={onClose}><XIcon size={28}/></button> 
        </div> 
        <div className="board-body"> 
            <div className="left-col"> 
                <div className="summary-card"> 
                    <h3><PieIcon size={16}/> 종합 적재 현황</h3> 
                    <div className="chart-area"> 
                        {/* 전체 사용률 계산 (시뮬레이션 반영) */}
                        <div className="pie-mock" style={{borderColor: '#ef4444'}}>
                          <span className="val">
                            {Math.round((mapData.reduce((acc, cur) => acc + cur.used, 0) / mapData.reduce((acc, cur) => acc + cur.total, 0)) * 100)}%
                          </span>
                        </div> 
                        <div className="legend"> 
                            <div><span className="dot primary" style={{background: '#ef4444'}}></span>사용: <b>{mapData.reduce((acc, cur) => acc + cur.used, 0)}</b></div> 
                            <div><span className="dot secondary"></span>여유: <b>{mapData.reduce((acc, cur) => acc + cur.total, 0) - mapData.reduce((acc, cur) => acc + cur.used, 0)}</b></div> 
                        </div> 
                    </div> 
                </div> 
                <div className="inv-list-wrapper"> 
                    <div className="search-row"> 
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
                    <span className="badge active"><div className="dot" style={{background:'#ef4444'}}/> 사용</span>
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