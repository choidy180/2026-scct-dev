'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled, { css, keyframes } from 'styled-components';
import {
  LayoutGrid,
  X as XIcon,
  PieChart as PieIcon,
  Package as PackageIcon,
  Search,
  Box,
  Layers
} from "lucide-react";

// ─── [1. INTERFACES] ─────────────────────────────

interface SlotData {
  no: number;
  active: boolean;
}

interface ZoneData {
  id: string;
  total: number;
  used: number;
  free: number;
  status: string;
  slots: SlotData[];
}

interface InventoryItem {
  code: string;
  qty: number;
  loc: string;
}

// ─── [2. STYLES & ANIMATIONS] ─────────────────────

const hideScrollbar = css`
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const pulseRingGreen = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } /* Green Pulse */
  70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

const BoardContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #f0fdf4; /* Very Light Green Background */
  display: flex;
  flex-direction: column;
  font-family: 'Pretendard', sans-serif;
  color: #1e293b;

  * { box-sizing: border-box; }

  .board-header {
    height: 60px;
    background: #fff;
    border-bottom: 1px solid #dcfce7; /* Green-tinted border */
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;

    .title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.2rem;
      font-weight: 800;
      color: #14532d; /* Dark Green Text */
    }
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #86efac;
      transition: color 0.2s;
    }
    .close-btn:hover {
      color: #15803d;
    }
  }

  .board-body {
    flex: 1;
    padding: 20px;
    display: flex;
    gap: 20px;
    overflow: hidden;

    /* --- Left Column --- */
    .left-col {
      width: 340px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .summary-card {
        background: #fff;
        padding: 20px;
        border-radius: 16px;
        border: 1px solid #dcfce7;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

        h3 {
          margin: 0 0 16px 0;
          font-size: 0.95rem;
          color: #166534;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chart-area {
          display: flex;
          align-items: center;
          gap: 16px;

          .pie-mock {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 8px solid #f1f5f9;
            border-top-color: #10b981; /* Green Main */
            border-right-color: #10b981;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: 800;
            color: #10b981;
          }
          .legend {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 0.8rem;
          }
          .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
          }
          .primary { background: #10b981; } /* Green */
          .secondary { background: #cbd5e1; } /* Gray */
        }
      }

      .inv-list-wrapper {
        flex: 1;
        background: #fff;
        border-radius: 16px;
        border: 1px solid #dcfce7;
        display: flex;
        flex-direction: column;
        min-height: 0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

        .search-row {
          padding: 16px;
          border-bottom: 1px solid #f0fdf4;
          display: flex;
          justify-content: space-between;
          align-items: center;

          h3 {
            font-size: 0.95rem;
            margin: 0;
            display: flex;
            gap: 6px;
            align-items: center;
            color: #166534;
          }
          .s-box {
            display: flex;
            align-items: center;
            background: #f0fdf4;
            padding: 4px 8px;
            border-radius: 6px;
            width: 140px;
            border: 1px solid #dcfce7;
            color: #15803d;
          }
          input {
            border: none;
            background: transparent;
            width: 100%;
            outline: none;
            font-size: 0.8rem;
            color: #15803d;
          }
          input::placeholder { color: #86efac; }
        }

        .list-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          &::-webkit-scrollbar { width: 4px; }
          &::-webkit-scrollbar-thumb {
            background: #bbf7d0;
            border-radius: 4px;
          }

          .inv-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #f0fdf4;
            border-radius: 8px;
            border: 1px solid #dcfce7;
            transition: all 0.2s;

            &:hover {
              background: #dcfce7;
            }

            .icon {
              width: 32px;
              height: 32px;
              background: #fff;
              border-radius: 8px;
              display: flex;
              justify-content: center;
              align-items: center;
              color: #10b981;
            }
            .info { flex: 1; }
            .c {
              font-size: 0.85rem;
              font-weight: 600;
              color: #14532d;
            }
            .l {
              font-size: 0.75rem;
              color: #16a34a;
            }
            .q {
              font-weight: 700;
              color: #10b981;
              font-family: monospace;
            }
          }
        }
      }
    }

    /* --- Right Column (Map) --- */
    .map-col {
      flex: 1;
      background: #fff;
      border-radius: 16px;
      border: 1px solid #dcfce7;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);

      .map-legend {
        padding: 16px;
        border-bottom: 1px solid #f0fdf4;
        display: flex;
        justify-content: center;
        gap: 20px;

        .badge {
          font-size: 0.85rem;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .empty {
          background: #f1f5f9;
          color: #94a3b8;
          border: 1px solid #e2e8f0;
        }
        .active {
          background: #ecfdf5; /* Light Green */
          color: #10b981; /* Green Text */
          border: 1px solid #a7f3d0;
        }
        .full {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid #fecaca;
        }
        .dot {
          width: 8px; 
          height: 8px; 
          border-radius: 50%;
        }
      }

      .zone-wrapper {
        flex: 1;
        padding: 20px;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        overflow: hidden;

        .zone-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
          min-height: 0;
          
          .z-head {
            background: #fff;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid #dcfce7;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);

            .top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            .id {
              font-weight: 900;
              font-size: 1.2rem;
              color: #14532d;
            }
            .st {
              font-size: 0.75rem;
              font-weight: 800;
              padding: 4px 8px;
              border-radius: 6px;
            }
            .g { background: #dcfce7; color: #166534; }
            .o { background: #ffedd5; color: #9a3412; }
            .r { background: #fee2e2; color: #991b1b; }
            
            .usage-text {
                font-size: 0.8rem;
                color: #64748b;
                margin-bottom: 6px;
                display: flex;
                justify-content: space-between;
                font-weight: 600;
                
                b { color: #15803d; }
            }

            .bar {
              height: 8px;
              background: #f1f5f9;
              border-radius: 4px;
              overflow: hidden;
            }
            .fill {
              height: 100%;
              /* Green Gradient */
              background: linear-gradient(90deg, #10b981, #059669); 
              border-radius: 4px;
              transition: width 0.5s ease-out;
            }
          }

          .slot-grid-container {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            background: #f0fdf4;
            border-radius: 12px;
            border: 1px solid #dcfce7;
            padding: 8px;

            .slot-grid {
              flex: 1;
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: repeat(10, 1fr);
              gap: 8px;
              
              .slot {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                font-size: 0.9rem;
                font-weight: 700;
                color: #cbd5e1;
                transition: all 0.3s;
                box-shadow: 0 1px 2px rgba(0,0,0,0.03);
              }
              /* Green Active State */
              .on {
                background: #dcfce7; /* Green-100 */
                border-color: #4ade80; /* Green-400 */
                color: #15803d; /* Green-700 */
                box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
              }
              /* Target Pulse */
              .new-item {
                animation: ${pulseRingGreen} 1.5s infinite;
                border-color: #10b981;
                background: #bbf7d0;
              }
              .icon-box {
                  margin-bottom: 2px;
              }
            }
          }
        }
      }
    }
  }
`;

// ─── [3. SUB-COMPONENTS] ──────────────────────────

const MemoizedInventoryItem = React.memo(({ item }: { item: InventoryItem }) => (
  <div className="inv-item">
    <div className="icon"><Layers size={14}/></div>
    <div className="info">
      <div className="c">{item.code}</div>
      <div className="l">{item.loc}</div>
    </div>
    <div className="q">{item.qty}</div>
  </div>
));
MemoizedInventoryItem.displayName = 'MemoizedInventoryItem';

const MemoizedSlot = React.memo(({ s, isTarget }: { s: SlotData, isTarget: boolean }) => (
    <div className={`slot ${s.active?'on':''} ${isTarget ? 'new-item' : ''}`}>
        {s.active && (
            <div className="icon-box">
                {/* Green Box Icon */}
                <Box size={14} fill={isTarget ? "#10b981" : "#86efac"} color={isTarget ? "#065f46" : "#22c55e"}/>
            </div>
        )}
        {s.no}
    </div>
));
MemoizedSlot.displayName = 'MemoizedSlot';

const ZoneColumn = React.memo(({ zone }: { zone: ZoneData }) => (
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
            <div className="bar"><div className="fill" style={{width: `${(zone.used/zone.total)*100}%`}}/></div>
        </div>
        <div className="slot-grid-container">
            <div className="slot-grid">
                {/* D101 구역의 5번 슬롯만 타겟팅 */}
                {zone.slots.map((s) => <MemoizedSlot key={s.no} s={s} isTarget={zone.id === 'D101' && s.no === 5 && s.active} />)}
            </div>
        </div>
    </div>
));
ZoneColumn.displayName = 'ZoneColumn';

// ─── [4. MAIN COMPONENT] ──────────────────────────

export default function GreenWarehouseBoard({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // 초기 데이터 (기존 로직 유지)
  const initialMapData: ZoneData[] = [
    { id: 'D101', total: 10, used: 2, free: 8, status: '여유', slots: Array.from({length: 10}, (_, i) => ({ no: i+1, active: i < 2 })) },
    { id: 'D102', total: 19, used: 15, free: 4, status: '혼잡', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: i < 15 })) },
    { id: 'D103', total: 20, used: 20, free: 0, status: '만차', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: true })) },
    { id: 'D104', total: 20, used: 8, free: 12, status: '보통', slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 8 })) },
    { id: 'D105', total: 19, used: 0, free: 19, status: '비어있음', slots: Array.from({length: 19}, (_, i) => ({ no: i+1, active: false })) },
  ];

  const [mapData, setMapData] = useState<ZoneData[]>(initialMapData);

  // 3초 뒤 적재 시뮬레이션
  useEffect(() => {
      const timer = setTimeout(() => {
          setMapData(prev => prev.map(zone => {
              if (zone.id === 'D101') {
                  const newSlots = zone.slots.map(slot => 
                      slot.no === 5 ? { ...slot, active: true } : slot
                  );
                  return {
                      ...zone,
                      used: zone.used + 1,
                      free: zone.free - 1,
                      slots: newSlots
                  };
              }
              return zone;
          }));
      }, 3000);
      return () => clearTimeout(timer);
  }, []);

  const inventoryData: InventoryItem[] = useMemo(() => [
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
    <BoardContainer> 
        <div className="board-header"> 
            {/* Green Theme Icon */}
            <div className="title"><LayoutGrid size={24} color="#10b981"/> D동 실시간 적재 현황판</div> 
            <button className="close-btn" onClick={onClose}><XIcon size={28}/></button> 
        </div> 
        <div className="board-body"> 
            <div className="left-col"> 
                <div className="summary-card"> 
                    <h3><PieIcon size={16}/> 종합 적재 현황</h3> 
                    <div className="chart-area"> 
                        <div className="pie-mock"><span className="val">48%</span></div> 
                        <div className="legend"> 
                            <div><span className="dot primary"></span>사용: <b>48</b></div> 
                            <div><span className="dot secondary"></span>여유: <b>52</b></div> 
                        </div> 
                    </div> 
                </div> 
                <div className="inv-list-wrapper"> 
                    <div className="search-row"> 
                        <h3><PackageIcon size={16}/> 재고 리스트</h3> 
                        <div className="s-box"><Search size={14}/><input placeholder="검색..." onChange={e=>setSearchTerm(e.target.value)}/></div> 
                    </div> 
                    <div className="list-scroll"> 
                        {filteredInventory.map((item, i) => ( <MemoizedInventoryItem key={i} item={item} /> ))} 
                    </div> 
                </div> 
            </div> 
            <div className="map-col"> 
                <div className="map-legend"> 
                    <span className="badge empty"><div className="dot" style={{background:'#cbd5e1'}}/> 여유</span>
                    {/* Active is now Green */}
                    <span className="badge active"><div className="dot" style={{background:'#10b981'}}/> 사용</span>
                    <span className="badge full"><div className="dot" style={{background:'#ef4444'}}/> 만차</span> 
                </div> 
                <div className="zone-wrapper"> 
                    {mapData.map(zone => <ZoneColumn key={zone.id} zone={zone} />)} 
                </div> 
            </div> 
        </div> 
    </BoardContainer> 
  )
}