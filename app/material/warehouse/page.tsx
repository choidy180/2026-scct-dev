'use client';

import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Box, 
  Search, 
  Menu,
  LayoutGrid,
  Package,
  PieChart,
  Layers,
  MapPin,
  RefreshCw,
  Bell,
  XCircle,
  X,
  User,
  LogOut,
  Settings,
  ChevronRight,
  History
} from "lucide-react";

// ─── [1. LOADING SCREEN] ─────────────────────────────
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [text, setText] = useState("시스템 초기화 중...");
  
  useEffect(() => {
    const sequence = [
      { t: "D동 구역 데이터 로드 중...", d: 800 },
      { t: "슬롯 점유 상태 동기화...", d: 1800 },
      { t: "시각화 맵 렌더링...", d: 2800 },
      { t: "완료", d: 3500 },
    ];
    sequence.forEach(({ t, d }) => { setTimeout(() => setText(t), d); });
    setTimeout(onComplete, 3800);
  }, [onComplete]);

  return (
    <LoaderWrapper
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="content">
        <div className="logo-circle">
          <motion.div 
            className="ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <LayoutGrid size={40} color="#3b82f6" />
        </div>
        <motion.h2
          key={text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {text}
        </motion.h2>
        <div className="bar-bg">
            <motion.div className="bar-fill" animate={{ width: "100%" }} transition={{ duration: 3.5, ease: "easeInOut" }} />
        </div>
      </div>
    </LoaderWrapper>
  );
};

// ─── [2. MAIN DASHBOARD] ─────────────────────────────

export default function WarehouseMapDashboard() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 🔥 메뉴 열림 상태
  
  // 더미 데이터
  const mapData = [
    { 
      id: 'D101', total: 20, used: 4, free: 16, status: '여유',
      slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 4 })) 
    },
    { 
      id: 'D102', total: 20, used: 16, free: 4, status: '혼잡',
      slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 16 })) 
    },
    { 
      id: 'D103', total: 20, used: 20, free: 0, status: '만차',
      slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: true })) 
    },
    { 
      id: 'D104', total: 20, used: 8, free: 12, status: '보통',
      slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: i < 8 })) 
    },
    { 
      id: 'D105', total: 20, used: 0, free: 20, status: '비어있음',
      slots: Array.from({length: 20}, (_, i) => ({ no: i+1, active: false })) 
    },
  ];

  const inventoryData = [
    { code: 'ADC30009358', qty: 708, loc: 'D101' },
    { code: 'ADC30014326', qty: 294, loc: 'D102' },
    { code: 'ADC30003801', qty: 204, loc: 'D102' },
    { code: 'AGF04075606', qty: 182, loc: 'D103' },
    { code: 'ADC30009359', qty: 150, loc: 'D104' },
    { code: 'AGM76970201', qty: 120, loc: 'D101' },
    { code: 'AGM76970202', qty: 100, loc: 'D105' },
    { code: 'AGM76970203', qty: 50, loc: 'D101' },
    { code: 'AGM76970204', qty: 30, loc: 'D102' },
    { code: 'AGM76970205', qty: 10, loc: 'D103' },
    { code: 'AGM76970206', qty: 120, loc: 'D104' },
    { code: 'AGM76970207', qty: 100, loc: 'D105' },
    { code: 'AGM76970208', qty: 50, loc: 'D101' },
    { code: 'AGM76970209', qty: 30, loc: 'D102' },
    { code: 'AGM76970210', qty: 10, loc: 'D103' },
  ];

  const filteredInventory = inventoryData.filter(item => 
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.loc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <GlobalStyle />
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <Container initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          
          {/* 1. Header */}
          <Header>
            <div className="brand">
              <div className="icon"><Box color="white" size={20}/></div>
              <h1>D동 실시간 적재 현황판</h1>
            </div>
            <div className="actions">
              <div className="time">2026-01-11 14:35:36</div>
              <div className="divider" />
              <IconBtn onClick={() => window.location.reload()}><RefreshCw size={18} /></IconBtn>
              <IconBtn><Bell size={18} /></IconBtn>
              {/* 🔥 메뉴 버튼에 기능 연결 */}
              <IconBtn onClick={() => setIsMenuOpen(true)} $active={isMenuOpen}>
                <Menu size={18} />
              </IconBtn>
            </div>
          </Header>

          <Body>
            {/* 2. Left Sidebar */}
            <Sidebar>
                <SummaryCard>
                    <h3><PieChart size={16}/> 종합 적재 현황</h3>
                    <div className="chart-area">
                        <div className="pie-chart-mock">
                            <div className="inner-text">
                                <span className="val">48%</span>
                                <span className="lbl">점유율</span>
                            </div>
                            <svg viewBox="0 0 36 36">
                                <path className="bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="fill" strokeDasharray="48, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                        </div>
                        <div className="legend">
                            <div className="row"><span className="dot blue"></span>사용: <b>48</b></div>
                            <div className="row"><span className="dot green"></span>여유: <b>52</b></div>
                            <div className="row line-top">총 적재능력: <b>100</b></div>
                        </div>
                    </div>
                </SummaryCard>

                <InventorySection>
                    <div className="sec-head">
                        <h3><Package size={16}/> 품목별 재고 리스트</h3>
                        <div className="search-box">
                            <Search size={14} color="#94a3b8"/>
                            <input 
                                placeholder="품목/구역 검색" 
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
                            filteredInventory.map((item, i) => (
                                <InvItem key={i}>
                                    <div className="icon"><Layers size={14}/></div>
                                    <div className="info">
                                        <div className="code">{item.code}</div>
                                        <div className="loc"><MapPin size={10}/> {item.loc}</div>
                                    </div>
                                    <div className="qty">{item.qty}</div>
                                </InvItem>
                            ))
                        ) : (
                            <EmptyState>검색 결과가 없습니다.</EmptyState>
                        )}
                    </div>
                </InventorySection>
            </Sidebar>

            {/* 3. Main Map Area */}
            <MapArea>
                <MapHeader>
                    <div className="title">구역별 상세 배치도 (D101 ~ D105)</div>
                    <div className="legend-bar">
                        <span className="badge empty">여유</span>
                        <span className="badge active">사용중</span>
                        <span className="badge full">만차</span>
                    </div>
                </MapHeader>

                <ZoneColumnsWrapper>
                    {mapData.map((zone, idx) => (
                        <ZoneColumn 
                            key={zone.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="zone-head">
                                <div className="top-row">
                                    <div className="id">{zone.id}</div>
                                    <span className={`status-badge ${zone.status === '만차' ? 'red' : zone.status === '혼잡' ? 'orange' : 'green'}`}>
                                        {zone.status}
                                    </span>
                                </div>
                                <div className="stats-row">
                                    <div>총 <b>{zone.total}</b></div>
                                    <div>사용 <b className="use">{zone.used}</b></div>
                                </div>
                                <div className="progress-bg">
                                    <div className="progress-fill" style={{width: `${(zone.used/zone.total)*100}%`}} />
                                </div>
                            </div>
                            
                            <SlotGridContainer>
                                <SlotGrid>
                                    {zone.slots.map((slot: any) => (
                                        <Slot key={slot.no} $active={slot.active}>
                                            <div className="no">{slot.no}1</div>
                                            {slot.active && <div className="car-indicator" />}
                                        </Slot>
                                    ))}
                                </SlotGrid>
                            </SlotGridContainer>
                        </ZoneColumn>
                    ))}
                </ZoneColumnsWrapper>
            </MapArea>
          </Body>
          
          {/* 🔥 4. Side Menu (Drawer) - 기능 추가됨 */}
          <AnimatePresence>
            {isMenuOpen && (
                <>
                    <Overlay initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsMenuOpen(false)}/>
                    <SideDrawer
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="drawer-header">
                            <h2>시스템 메뉴</h2>
                            <IconBtn onClick={() => setIsMenuOpen(false)}><X size={20}/></IconBtn>
                        </div>
                        
                        <div className="profile-card">
                            <div className="avatar"><User size={24}/></div>
                            <div className="info">
                                <span className="name">관리자 (Admin)</span>
                                <span className="role">admin@gomotec.com</span>
                            </div>
                        </div>

                        <div className="menu-list">
                            <div className="menu-label">창고 이동</div>
                            <MenuItem $active>
                                <LayoutGrid size={18}/> D동 배치도 (현재)
                                <ChevronRight size={16} className="arrow"/>
                            </MenuItem>
                            <MenuItem>
                                <LayoutGrid size={18}/> G동 배치도
                                <ChevronRight size={16} className="arrow"/>
                            </MenuItem>
                            <MenuItem>
                                <LayoutGrid size={18}/> A동 배치도
                                <ChevronRight size={16} className="arrow"/>
                            </MenuItem>

                            <div className="menu-label">관리</div>
                            <MenuItem>
                                <History size={18}/> 입출고 이력 조회
                            </MenuItem>
                            <MenuItem>
                                <Settings size={18}/> 시스템 환경설정
                            </MenuItem>
                        </div>

                        <div className="drawer-footer">
                            <button className="logout-btn">
                                <LogOut size={16}/> 로그아웃
                            </button>
                            <div className="ver">Ver 2.5.1</div>
                        </div>
                    </SideDrawer>
                </>
            )}
          </AnimatePresence>

        </Container>
      )}
    </>
  );
}

// ─── [STYLES] ─────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  body { margin: 0; padding: 0; background: #f8fafc; font-family: 'Pretendard', sans-serif; overflow: hidden; color: #1e293b; }
  * { box-sizing: border-box; }
`;

// Loader
const LoaderWrapper = styled(motion.div)`
  position: fixed; inset: 0; background: #fff; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  .content { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .logo-circle {
    width: 80px; height: 80px; position: relative; display: flex; align-items: center; justify-content: center;
    .ring { position: absolute; inset: 0; border: 3px solid #eff6ff; border-top-color: #3b82f6; border-radius: 50%; }
  }
  h2 { font-size: 1rem; font-weight: 600; color: #64748b; letter-spacing: 2px; }
  .bar-bg { width: 200px; height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden; }
  .bar-fill { height: 100%; background: #3b82f6; }
`;

// Layout
const Container = styled(motion.div)` 
  width: 100vw; height: calc(100vh - 64px); 
  display: flex; flex-direction: column; 
  background-color: #f8fafc;
`;

const Header = styled.header`
  height: 60px; background: #fff; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center; padding: 0 24px; flex-shrink: 0;
  .brand { display: flex; align-items: center; gap: 10px; .icon { width: 32px; height: 32px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; } h1 { font-size: 1.1rem; font-weight: 800; color: #1e293b; } }
  .actions { display: flex; gap: 12px; align-items: center; 
    .time { font-family: monospace; font-weight: 600; color: #64748b; font-size: 0.9rem; }
    .divider { width: 1px; height: 16px; background: #e2e8f0; margin: 0 4px; }
  }
`;

const IconBtn = styled.button<{ $active?: boolean }>` 
  background: ${props => props.$active ? '#eff6ff' : '#fff'}; 
  border: 1px solid ${props => props.$active ? '#3b82f6' : '#e2e8f0'}; 
  width: 32px; height: 32px; border-radius: 8px; 
  display: flex; align-items: center; justify-content: center; 
  color: ${props => props.$active ? '#3b82f6' : '#64748b'}; 
  cursor: pointer; 
  &:hover { background: #f8fafc; color: #3b82f6; }
`;

const Body = styled.div` 
  flex: 1; display: flex; overflow: hidden; padding: 20px; gap: 20px; height: 100%;
`;

// Left Sidebar
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
      .pie-chart-mock {
          width: 90px; height: 90px; position: relative;
          svg { width: 100%; height: 100%; transform: rotate(-90deg); }
          .bg { fill: none; stroke: #f1f5f9; stroke-width: 3; }
          .fill { fill: none; stroke: #3b82f6; stroke-width: 3; stroke-linecap: round; }
          .inner-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
              .val { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
              .lbl { font-size: 0.65rem; color: #94a3b8; }
          }
      }
      .legend {
          flex: 1; display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: #64748b;
          .row { display: flex; align-items: center; justify-content: space-between; b { color: #334155; } }
          .dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; display:inline-block; }
          .blue { background: #3b82f6; } .green { background: #10b981; }
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
        display: flex; align-items: center; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; gap: 6px; width: 130px;
        input { border: none; background: transparent; width: 100%; outline: none; font-size: 0.8rem; }
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
  display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; background: #f8fafc; border: 1px solid #f1f5f9;
  flex-shrink: 0;
  .icon { width: 32px; height: 32px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; }
  .info { flex: 1; .code { font-size: 0.85rem; font-weight: 600; } .loc { font-size: 0.75rem; color: #94a3b8; display: flex; gap: 2px; align-items: center; margin-top: 2px; } }
  .qty { font-weight: 700; color: #3b82f6; font-family: monospace; }
`;

const EmptyState = styled.div`
    text-align: center; color: #94a3b8; font-size: 0.85rem; margin-top: 20px;
`;

// Center Map Area
const MapArea = styled.main`
  flex: 1; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0;
  display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
`;

const MapHeader = styled.div`
  height: 50px; padding: 0 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
  .title { font-weight: 700; color: #334155; }
  .legend-bar { display: flex; gap: 8px; 
    .badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .empty { background: #f1f5f9; color: #94a3b8; }
    .active { background: #eff6ff; color: #3b82f6; }
    .full { background: #fef2f2; color: #ef4444; }
  }
`;

const ZoneColumnsWrapper = styled.div`
  flex: 1; padding: 20px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; overflow: hidden;
`;

const ZoneColumn = styled(motion.div)`
  display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 0;
  
  .zone-head {
    background: #f8fafc; padding: 10px; border-radius: 12px; border: 1px solid #e2e8f0; flex-shrink: 0;
    .top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .id { font-weight: 800; font-size: 1.1rem; color: #1e293b; }
    .status-badge { font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; 
        &.green { background: #dcfce7; color: #166534; }
        &.orange { background: #ffedd5; color: #9a3412; }
        &.red { background: #fee2e2; color: #991b1b; }
    }
    .stats-row { display: flex; justify-content: space-between; font-size: 1rem; color: #64748b; margin-bottom: 6px; b.use { color: #3b82f6; } }
    .progress-bg { height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; .progress-fill { height: 100%; background: #3b82f6; } }
  }
`;

const SlotGridContainer = styled.div`
    flex: 1; min-height: 0; display: flex; flex-direction: column;
`;

const SlotGrid = styled.div`
  flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(10, 1fr); gap: 6px; 
`;

const Slot = styled.div<{ $active: boolean }>`
  background: ${props => props.$active ? '#eff6ff' : '#fff'};
  border: 1px solid ${props => props.$active ? '#93c5fd' : '#e2e8f0'};
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center; position: relative;
  font-size: 1rem; font-weight: 700; color: ${props => props.$active ? '#2563eb' : '#cbd5e1'};
  .car-indicator { position: absolute; bottom: 10%; width: 6px; height: 6px; background: #3b82f6; border-radius: 50%; }
`;

// 🔥 Side Menu Styles
const Overlay = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; backdrop-filter: blur(2px);
`;

const SideDrawer = styled(motion.div)`
  position: fixed; top: 0; right: 0; width: 320px; height: 100%; background: #fff; z-index: 101;
  box-shadow: -10px 0 30px rgba(0,0,0,0.1); display: flex; flex-direction: column;
  
  .drawer-header {
      padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;
      h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
  }
  
  .profile-card {
      padding: 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 16px;
      .avatar { width: 48px; height: 48px; background: #fff; border: 1px solid #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; }
      .info { display: flex; flex-direction: column; gap: 2px;
          .name { font-weight: 700; color: #0f172a; } .role { font-size: 0.8rem; color: #64748b; }
      }
  }

  .menu-list { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
  .menu-label { font-size: 1rem; font-weight: 700; color: #94a3b8; margin: 12px 0 8px 12px; }
  
  .drawer-footer {
      padding: 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;
      .logout-btn { display: flex; align-items: center; gap: 8px; color: #ef4444; background: none; border: none; font-weight: 600; cursor: pointer; &:hover { opacity: 0.8; } }
      .ver { font-size: 1rem; color: #cbd5e1; }
  }
`;

const MenuItem = styled.div<{ $active?: boolean }>`
  padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 12px; font-size: 0.95rem; font-weight: 500;
  color: ${props => props.$active ? '#3b82f6' : '#334155'};
  background: ${props => props.$active ? '#eff6ff' : 'transparent'};
  cursor: pointer; transition: background 0.2s;
  &:hover { background: ${props => props.$active ? '#eff6ff' : '#f8fafc'}; }
  .arrow { margin-left: auto; color: #cbd5e1; }
`;