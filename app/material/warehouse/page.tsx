'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  X,
  PieChart,
  Package,
  Search,
  Box,
  Layers,
  MapPin,
  RefreshCw,
  Bell,
  Menu,
  User,
  LogOut,
  Settings,
  ChevronRight,
  History,
  XCircle
} from "lucide-react";

// ─── [1. INTERFACES & DATA] ────────────────────────

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

// ─── [2. SUB-COMPONENTS] ──────────────────────────

// 2-1. Inventory Item -> Parts Item
const MemoizedInventoryItem = React.memo(({ item }: { item: InventoryItem }) => (
  <InvItem>
    <div className="icon"><Layers size={14} /></div>
    <div className="info">
      <div className="code">{item.code}</div>
      <div className="loc"><MapPin size={10} /> {item.loc}</div>
    </div>
    <div className="qty">{item.qty}</div>
  </InvItem>
));
MemoizedInventoryItem.displayName = 'MemoizedInventoryItem';

// 2-2. Slot Component
const MemoizedSlot = React.memo(({ s }: { s: SlotData }) => (
  <Slot $active={s.active}>
    {s.active && (
      <div className="icon-box">
        {/* Active Slot Icon - Red Theme */}
        <Box size={14} fill="#ef4444" color="#7f1d1d" />
      </div>
    )}
    <span className="no">{s.no}</span>
  </Slot>
));
MemoizedSlot.displayName = 'MemoizedSlot';

// 2-3. Zone Column Component
const ZoneColumn = React.memo(({ zone, index }: { zone: ZoneData, index: number }) => (
  <ZoneColumnWrapper
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <div className="z-head">
      <div className="top">
        <span className="id">{zone.id}</span>
        {/* 상태 뱃지는 의미론적 색상 유지 혹은 붉은 테마에 맞게 조정 가능. 여기선 기존 로직 유지하되 CSS에서 색상 제어 */}
        <span className={`st ${zone.status === '만차' ? 'r' : zone.status === '혼잡' ? 'o' : 'g'}`}>{zone.status}</span>
      </div>
      <div className="usage-text">
        <span>점유율</span>
        <b>{Math.round((zone.used / zone.total) * 100)}%</b>
      </div>
      <div className="bar">
        {/* 진행 바 색상 Red */}
        <div className="fill" style={{ width: `${(zone.used / zone.total) * 100}%` }} />
      </div>
    </div>
    <div className="slot-grid-container">
      <div className="slot-grid">
        {zone.slots.map((s) => (
          <MemoizedSlot key={s.no} s={s} />
        ))}
      </div>
    </div>
  </ZoneColumnWrapper>
));
ZoneColumn.displayName = 'ZoneColumn';


// ─── [3. MAIN DASHBOARD] ─────────────────────────────

export default function WarehouseDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 초기 데이터
  const initialMapData: ZoneData[] = [
    { id: 'D101', total: 10, used: 2, free: 8, status: '여유', slots: Array.from({ length: 10 }, (_, i) => ({ no: i + 1, active: i < 2 })) },
    { id: 'D102', total: 19, used: 15, free: 4, status: '혼잡', slots: Array.from({ length: 19 }, (_, i) => ({ no: i + 1, active: i < 15 })) },
    { id: 'D103', total: 20, used: 20, free: 0, status: '만차', slots: Array.from({ length: 20 }, (_, i) => ({ no: i + 1, active: true })) },
    { id: 'D104', total: 20, used: 8, free: 12, status: '보통', slots: Array.from({ length: 20 }, (_, i) => ({ no: i + 1, active: i < 8 })) },
    { id: 'D105', total: 19, used: 0, free: 19, status: '비어있음', slots: Array.from({ length: 19 }, (_, i) => ({ no: i + 1, active: false })) },
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
    <>
      <GlobalStyle />
      <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        
        {/* Header */}
        <Header>
          <div className="brand">
            <div className="icon"><LayoutGrid color="white" size={20} /></div>
            <h1>D동 실시간 적재 현황판</h1>
          </div>
          <div className="actions">
            <div className="time">2026-01-15 14:35:36</div>
            <div className="divider" />
            <IconBtn onClick={() => window.location.reload()}><RefreshCw size={18} /></IconBtn>
            <IconBtn><Bell size={18} /></IconBtn>
            <IconBtn onClick={() => setIsMenuOpen(true)} $active={isMenuOpen}>
              <Menu size={18} />
            </IconBtn>
          </div>
        </Header>

        <Body>
          {/* Left Sidebar */}
          <Sidebar>
            <SummaryCard>
              <h3><PieChart size={16} /> 종합 적재 현황</h3>
              <div className="chart-area">
                <div className="pie-mock">
                  <span className="val">48%</span>
                  <span className="lbl">점유율</span>
                </div>
                <div className="legend">
                  <div><span className="dot primary"></span>사용: <b>48</b></div>
                  <div><span className="dot secondary"></span>여유: <b>52</b></div>
                  <div className="line-top">총 적재능력: <b>100</b></div>
                </div>
              </div>
            </SummaryCard>

            <InventorySection>
              <div className="sec-head">
                {/* 용어 변경: 재고 -> 부품 */}
                <h3><Package size={16} /> 부품 리스트</h3>
                <div className="search-box">
                  <Search size={14} color="#94a3b8" />
                  <input
                    placeholder="검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <XCircle
                      size={14}
                      className="clear-btn"
                      onClick={() => setSearchTerm("")}
                    />
                  )}
                </div>
              </div>
              <div className="inv-list-scroll">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item, i) => <MemoizedInventoryItem key={i} item={item} />)
                ) : (
                  <EmptyState>검색 결과가 없습니다.</EmptyState>
                )}
              </div>
            </InventorySection>
          </Sidebar>

          {/* Main Map Area */}
          <MapArea>
            <MapHeader>
              <div className="title">구역별 상세 배치도 (D101 ~ D105)</div>
              <div className="legend-bar">
                <span className="badge empty"><div className="dot" style={{ background: '#cbd5e1' }} /> 여유</span>
                {/* Active 색상 Red 계열로 변경 */}
                <span className="badge active"><div className="dot" style={{ background: '#ef4444' }} /> 사용</span>
                {/* 만차 색상 더 진한 Red로 변경하여 구분 */}
                <span className="badge full"><div className="dot" style={{ background: '#7f1d1d' }} /> 만차</span>
              </div>
            </MapHeader>

            <ZoneWrapper>
              {mapData.map((zone, idx) => (
                <ZoneColumn key={zone.id} zone={zone} index={idx} />
              ))}
            </ZoneWrapper>
          </MapArea>
        </Body>

        {/* Side Drawer Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <Overlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
              />
              <SideDrawer
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="drawer-header">
                  <h2>시스템 메뉴</h2>
                  <IconBtn onClick={() => setIsMenuOpen(false)}><X size={20} /></IconBtn>
                </div>

                <div className="profile-card">
                  <div className="avatar"><User size={24} /></div>
                  <div className="info">
                    <span className="name">관리자 (Admin)</span>
                    <span className="role">admin@gomotec.com</span>
                  </div>
                </div>

                <div className="menu-list">
                  <div className="menu-label">창고 이동</div>
                  <MenuItem $active>
                    <LayoutGrid size={18} /> D동 배치도 (현재)
                    <ChevronRight size={16} className="arrow" />
                  </MenuItem>
                  <MenuItem>
                    <LayoutGrid size={18} /> G동 배치도
                    <ChevronRight size={16} className="arrow" />
                  </MenuItem>
                  <div className="menu-label">관리</div>
                  <MenuItem>
                    <History size={18} /> 부품 입출고 이력 조회
                  </MenuItem>
                  <MenuItem>
                    <Settings size={18} /> 시스템 환경설정
                  </MenuItem>
                </div>

                <div className="drawer-footer">
                  <button className="logout-btn">
                    <LogOut size={16} /> 로그아웃
                  </button>
                  <div className="ver">Ver 2.5.1</div>
                </div>
              </SideDrawer>
            </>
          )}
        </AnimatePresence>
      </Container>
    </>
  );
}

// ─── [STYLES] ─────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Pretendard', sans-serif; overflow: hidden; color: #1e293b; }
  * { box-sizing: border-box; }
`;

const Container = styled(motion.div)` 
  width: 100vw; height: calc(100vh - 64px); 
  display: flex; flex-direction: column; 
  background-color: #f8fafc;
`;

const Header = styled.header`
  height: 60px; background: #fff; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center; padding: 0 24px; flex-shrink: 0;
  .brand { display: flex; align-items: center; gap: 10px; 
    /* Red Theme */
    .icon { width: 32px; height: 32px; background: #ef4444; border-radius: 8px; display: flex; align-items: center; justify-content: center; } 
    h1 { font-size: 1.1rem; font-weight: 800; color: #1e293b; } 
  }
  .actions { display: flex; gap: 12px; align-items: center; 
    .time { font-family: monospace; font-weight: 600; color: #64748b; font-size: 0.9rem; }
    .divider { width: 1px; height: 16px; background: #e2e8f0; margin: 0 4px; }
  }
`;

const IconBtn = styled.button<{ $active?: boolean }>` 
  /* Red Theme Hover/Active */
  background: ${props => props.$active ? '#fef2f2' : '#fff'}; 
  border: 1px solid ${props => props.$active ? '#ef4444' : '#e2e8f0'}; 
  width: 32px; height: 32px; border-radius: 8px; 
  display: flex; align-items: center; justify-content: center; 
  color: ${props => props.$active ? '#ef4444' : '#64748b'}; 
  cursor: pointer; 
  transition: all 0.2s;
  &:hover { background: ${props => props.$active ? '#fee2e2' : '#f8fafc'}; color: ${props => props.$active ? '#ef4444' : '#1e293b'}; }
`;

const Body = styled.div` 
  flex: 1; display: flex; overflow: hidden; padding: 20px; gap: 20px; height: 100%;
`;

const Sidebar = styled.aside`
  width: 320px; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
  display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  height: 100%;
`;

const SummaryCard = styled.div`
  padding: 24px; border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
  h3 { margin: 0 0 16px 0; font-size: 0.95rem; color: #334155; display: flex; align-items: center; gap: 8px; }
  .chart-area {
      display: flex; align-items: center; gap: 20px;
      .pie-mock {
        width: 80px; height: 80px; border-radius: 50%;
        border: 8px solid #f1f5f9; 
        /* Red Theme */
        border-top-color: #ef4444; border-right-color: #ef4444;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        .val { font-weight: 800; color: #ef4444; font-size: 1.1rem; }
        .lbl { font-size: 0.7rem; color: #64748b; }
      }
      .legend {
          flex: 1; display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: #64748b;
          b { color: #334155; }
          .dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; display:inline-block; }
          .primary { background: #ef4444; }
          .secondary { background: #cbd5e1; }
          .line-top { border-top: 1px solid #f1f5f9; padding-top: 6px; margin-top: 4px; }
      }
  }
`;

const InventorySection = styled.div`
  flex: 1; display: flex; flex-direction: column; min-height: 0; background: #fff;

  .sec-head { 
    padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; flex-shrink: 0;
    h3 { margin: 0; font-size: 0.95rem; color: #334155; display: flex; gap: 8px; align-items: center; }
    
    .search-box {
        display: flex; align-items: center; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; gap: 6px; width: 130px; border: 1px solid #e2e8f0;
        input { border: none; background: transparent; width: 100%; outline: none; font-size: 0.8rem; color: #334155; }
        .clear-btn { cursor: pointer; color: #94a3b8; &:hover { color: #64748b; } }
    }
  }
  
  .inv-list-scroll { 
    flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px; 
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
  }
`;

const InvItem = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; background: #fff; border: 1px solid #e2e8f0;
  flex-shrink: 0; transition: all 0.2s;
  &:hover { background: #f8fafc; }
  .icon { width: 32px; height: 32px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; }
  .info { flex: 1; .code { font-size: 0.85rem; font-weight: 600; color: #334155; } .loc { font-size: 0.75rem; color: #94a3b8; display: flex; gap: 2px; align-items: center; margin-top: 2px; } }
  /* Red Theme */
  .qty { font-weight: 700; color: #ef4444; font-family: monospace; }
`;

const EmptyState = styled.div`
    text-align: center; color: #94a3b8; font-size: 0.85rem; margin-top: 20px;
`;

const MapArea = styled.main`
  flex: 1; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
  display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
`;

const MapHeader = styled.div`
  height: 50px; 
  padding: 0 20px; 
  border-bottom: 1px solid #f1f5f9; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  flex-shrink: 0;

  .title { font-weight: 700; color: #334155; }
  
  .legend-bar { 
    display: flex; 
    gap: 8px; 

    /* 공통 뱃지 스타일 */
    .badge { 
      font-size: 0.75rem; 
      padding: 6px 12px; /* 패딩을 살짝 키워 터치감 개선 */
      border-radius: 6px; 
      font-weight: 700; 
      display: flex; 
      align-items: center; 
      gap: 6px; 
      transition: all 0.2s;
    }

    /* 1. 여유 (회색 톤) */
    .empty { 
      background: #f1f5f9; 
      color: #64748b; 
      border: 1px solid #e2e8f0; 
      .dot { background: #cbd5e1; }
    }

    /* 2. 사용 (연한 빨강 - 기존 유지하되 테두리 색 조정) */
    .active { 
      background: #fef2f2; 
      color: #ef4444; 
      border: 1px solid #fecaca; 
      .dot { background: #ef4444; }
    }

    /* 3. 만차 (진한 빨강 - 수정됨) 
       - 기존의 어두운 배경(#7f1d1d)을 제거하고 선명한 Red(#ef4444) 적용
       - 텍스트를 흰색으로 변경하여 가독성 확보
    */
    .full { 
      background: #ef4444; 
      color: #ffffff; 
      border: 1px solid #ef4444; 
      /* 만차는 배경이 진하므로 내부 점을 흰색으로 변경 */
      .dot { background: #ffffff; } 
    }

    .dot { 
      width: 6px; 
      height: 6px; 
      border-radius: 50%; 
    }
  }
`;

const ZoneWrapper = styled.div`
  flex: 1; padding: 20px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; overflow: hidden;
`;

const ZoneColumnWrapper = styled(motion.div)`
  display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 0;
  
  .z-head {
    background: #fff; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .id { font-weight: 800; font-size: 1.1rem; color: #334155; }
    .st { font-size: 0.75rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; }
    .g { background: #dcfce7; color: #166534; }
    .o { background: #ffedd5; color: #9a3412; }
    .r { background: #fee2e2; color: #991b1b; }

    /* Red Theme */
    .usage-text { font-size: 0.8rem; color: #64748b; margin-bottom: 6px; display: flex; justify-content: space-between; font-weight: 600; b { color: #ef4444; } }
    .bar { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; background: #ef4444; border-radius: 4px; transition: width 0.5s ease-out; }
  }

  .slot-grid-container {
    flex: 1; min-height: 0; display: flex; flex-direction: column;
    background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 8px;
  }
  .slot-grid {
    flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(10, 1fr); gap: 8px;
  }
`;

const Slot = styled.div<{ $active: boolean }>`
  /* Red Theme */
  background: ${props => props.$active ? '#fef2f2' : '#fff'};
  border: 1px solid ${props => props.$active ? '#fecaca' : '#e2e8f0'};
  border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;
  font-size: 0.9rem; font-weight: 700; 
  color: ${props => props.$active ? '#b91c1c' : '#cbd5e1'};
  transition: all 0.3s;
  box-shadow: ${props => props.$active ? '0 2px 4px rgba(239, 68, 68, 0.1)' : '0 1px 2px rgba(0,0,0,0.03)'};
  
  .icon-box { margin-bottom: 2px; }
`;

const Overlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; backdrop-filter: blur(2px);
`;

const SideDrawer = styled(motion.div)`
  position: fixed; top: 0; right: 0; width: 320px; height: 100%; background: #fff; z-index: 101;
  box-shadow: -10px 0 30px rgba(0,0,0,0.1); display: flex; flex-direction: column;
  
  .drawer-header {
      padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;
      h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #334155; }
  }
  
  .profile-card {
      padding: 24px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px;
      .avatar { width: 48px; height: 48px; background: #fff; border: 1px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; }
      .info { display: flex; flex-direction: column; gap: 2px;
          .name { font-weight: 700; color: #0f172a; } .role { font-size: 0.8rem; color: #64748b; }
      }
  }

  .menu-list { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
  .menu-label { font-size: 0.9rem; font-weight: 700; color: #94a3b8; margin: 12px 0 8px 12px; }
  
  .drawer-footer {
      padding: 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;
      .logout-btn { display: flex; align-items: center; gap: 8px; color: #ef4444; background: none; border: none; font-weight: 600; cursor: pointer; &:hover { opacity: 0.8; } }
      .ver { font-size: 1rem; color: #cbd5e1; }
  }
`;

const MenuItem = styled.div<{ $active?: boolean }>`
  padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 12px; font-size: 0.95rem; font-weight: 500;
  /* Red Theme */
  color: ${props => props.$active ? '#ef4444' : '#334155'};
  background: ${props => props.$active ? '#fef2f2' : 'transparent'};
  cursor: pointer; transition: background 0.2s;
  &:hover { background: ${props => props.$active ? '#fef2f2' : '#f8fafc'}; }
  .arrow { margin-left: auto; color: #cbd5e1; }
`;