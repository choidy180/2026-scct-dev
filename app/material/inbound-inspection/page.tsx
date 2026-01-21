'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ref, onValue, query, limitToLast } from "firebase/database";
import { db } from '@/lib/firebase';
import styled from 'styled-components'; 
import { 
  DashboardContainer, Column, TopCard, CardTitle, 
  VehicleImagePlaceholder, PlateContainer, InfoRow, DwellTimeBadge, 
  MiniEmptyState, FullHeightCard, 
  HistoryListContainer, HistoryItem as BaseHistoryItem, VideoCard, VideoHeader, 
  IpInputWrapper, PinkButton, StyledErrorState, Backdrop, SlidePanel 
} from '@/styles/styles';
import { WearableApiEntry } from '@/types/types';
import AIDashboardModal from '@/components/ai-dashboard-modal';
import WarehouseBoard from '@/components/wearable-warehouse-board';
import { 
  Loader2, RefreshCw, Signal, AlertTriangle, Search, ListChecks, FileWarning, 
  Maximize2, X
} from "lucide-react";
import { LuMaximize, LuMinimize } from "react-icons/lu";

// --- Constants ---
const PORT = 8080;
const API_URL_VEHICLE = "http://1.254.24.170:24828/api/DX_API000020";
const API_URL_INVOICE = "http://1.254.24.170:24828/api/V_PurchaseIn";
const API_URL_MATERIAL_LIST = "http://1.254.24.170:24828/api/DX_API000034";

// --- Types ---
interface VehicleSlotDetail {
  slot_id: number;
  PLATE: string | null;
  FILENAME: string | null;
  FILEPATH: string;
  entry_time: string | null;
  exit_time: string | null;
}

interface VehicleApiResponse {
  [key: string]: {
    total: number;
    slots_detail: VehicleSlotDetail[];
  };
}

interface MaterialListItem {
  PrjGubun: string;
  PrjCode: string;
  PrjName: string;
  NmCustm: string;        
  InvoiceNo: string;      
  NmGItem: string;        
  InspConf: string;       
  NmInspGB: string;       
  PurInDate: string;      
  [key: string]: any;
}

// --- Styled Components (기존 유지 + 단일 화면용 스타일) ---

const SingleCamWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    object-fit: cover;
  }
`;

const ScanOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 10;
  backdrop-filter: blur(4px);

  h3 { margin-top: 16px; font-size: 1.2rem; font-weight: 600; color: #3b82f6; }
  p { margin-top: 8px; color: #94a3b8; font-size: 0.9rem; }
`;

// ... (기존 Styled Components 유지: ModalBackdrop ~ ViewAllButton) ...
const ModalBackdrop = styled(motion.div)`
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); z-index: 2000;
`;
const ModalContainer = styled(motion.div)`
  position: fixed; top: calc(50% + 32px); left: 50%; transform: translate(-50%, -50%);
  width: 95%; max-width: 1400px; height: 80vh; background: #ffffff; color: #334155;
  border-radius: 20px; z-index: 2001; padding: 32px; display: flex; flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #f1f5f9;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
  h2 { color: #0f172a; font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 12px; white-space: nowrap; }
`;
const ControlBar = styled.div`
  display: flex; gap: 16px; margin-bottom: 20px; align-items: center;
`;
const SearchInput = styled.div`
  flex: 1; position: relative;
  input { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 12px 12px 44px; border-radius: 12px; color: #334155; font-size: 0.95rem; transition: all 0.2s; &:focus { outline: none; background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); } }
  svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; }
`;
const FilterGroup = styled.div`
  display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; gap: 4px;
`;
const FilterButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px; border-radius: 8px; border: none; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
  background: ${props => props.$active ? '#ffffff' : 'transparent'}; color: ${props => props.$active ? '#2563eb' : '#64748b'};
  box-shadow: ${props => props.$active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
  &:hover { color: ${props => props.$active ? '#2563eb' : '#334155'}; }
`;
const TableWrapper = styled.div`
  flex: 1; overflow: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;
  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-track { background: #f1f5f9; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
`;
const StyledTable = styled.table`
  width: 100%; min-width: 1000px; border-collapse: collapse; table-layout: auto;
  thead { position: sticky; top: 0; z-index: 10; background: #f1f5f9; }
  th { color: #475569; font-weight: 700; text-align: left; padding: 16px 20px; font-size: 0.9rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
  td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.95rem; vertical-align: middle; white-space: nowrap; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }
`;
const StatusBadge = styled.span<{ $status: string }>`
  padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; min-width: 80px;
  ${props => props.$status === 'Y' ? `background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;` : `background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;` }
`;
const CloseButton = styled.button`
  background: #f1f5f9; border: none; color: #64748b; cursor: pointer; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
  &:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }
`;
const ViewAllButton = styled.button`
  background: #ffffff; color: #2563eb; border: 1px solid #e2e8f0; border-radius: 20px; padding: 6px 16px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  &:hover { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
`;

// --- Sub Components ---

const MemoizedHistoryItem = React.memo(({ item }: { item: MaterialListItem }) => {
  const truncatedName = item.NmCustm.length > 12 ? item.NmCustm.slice(0, 12) + "..." : item.NmCustm;
  return (
    <BaseHistoryItem>
        <div className="left-grp">
            <span className="comp" title={item.NmCustm}>{truncatedName}</span>
            <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, marginTop: '4px', fontFamily: 'monospace' }}>
                {item.InvoiceNo || "-"}
            </span>
        </div>
        <div className="info">
            <span className="status bad" style={{ background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0' }}>
                {item.NmInspGB || "대기"}
            </span>
        </div>
    </BaseHistoryItem>
  );
});
MemoizedHistoryItem.displayName = "MemoizedHistoryItem";

const MaterialListModal = ({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: MaterialListItem[];}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); 

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterType === 'Y') { if (item.InspConf !== 'Y') return false; }
      if (filterType === 'N') { if (item.InspConf === 'Y') return false; }
      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        return (
          (item.NmCustm && item.NmCustm.toLowerCase().includes(lowerTerm)) ||
          (item.NmGItem && item.NmGItem.toLowerCase().includes(lowerTerm)) ||
          (item.InvoiceNo && item.InvoiceNo.toLowerCase().includes(lowerTerm))
        );
      }
      return true;
    });
  }, [data, searchTerm, filterType]);

  if (!isOpen) return null;

  return (
    <>
      <ModalBackdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <ModalContainer initial={{ scale: 0.95, opacity: 0, y: "-50%", x: "-50%" }} animate={{ scale: 1, opacity: 1, y: "-50%", x: "-50%" }} exit={{ scale: 0.95, opacity: 0, y: "-50%", x: "-50%" }}>
        <ModalHeader>
          <h2>
            <div style={{background: '#eff6ff', padding: 10, borderRadius: 12}}><ListChecks size={24} color="#3b82f6"/></div>
            자재 입고 현황 전체보기
          </h2>
          <CloseButton onClick={onClose}><X size={20} /></CloseButton>
        </ModalHeader>
        <ControlBar>
          <SearchInput>
            <Search size={18} />
            <input placeholder="업체명, 자재명, 송장번호로 검색하세요" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </SearchInput>
          <FilterGroup>
            <FilterButton $active={filterType === 'ALL'} onClick={() => setFilterType('ALL')}>전체보기</FilterButton>
            <FilterButton $active={filterType === 'N'} onClick={() => setFilterType('N')}>대기중</FilterButton>
            <FilterButton $active={filterType === 'Y'} onClick={() => setFilterType('Y')}>완료됨</FilterButton>
          </FilterGroup>
        </ControlBar>
        <TableWrapper>
          <StyledTable>
            <colgroup><col style={{width:'120px'}}/><col style={{width:'200px'}}/><col style={{width:'250px'}}/><col style={{width:'auto'}}/><col style={{width:'180px'}}/></colgroup>
            <thead><tr><th>상태</th><th>송장번호</th><th>업체명</th><th>자재명</th><th>입고일시</th></tr></thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr key={`${item.InvoiceNo || 'unknown'}-${idx}`}>
                    <td>
                      <StatusBadge $status={item.InspConf === 'Y' ? 'Y' : 'N'}>
                        {item.InspConf === 'Y' ? <><span>●</span>완료</> : <><span>●</span>{item.NmInspGB || "대기"}</>}
                      </StatusBadge>
                    </td>
                    <td style={{fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem'}}>{item.InvoiceNo}</td>
                    <td style={{fontWeight: 600}}>{item.NmCustm}</td>
                    <td>{item.NmGItem}</td>
                    <td style={{color: '#64748b'}}>{item.PurInDate || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{textAlign: 'center', padding: '60px', color: '#94a3b8'}}><Search size={48} style={{opacity: 0.2, marginBottom: 16}} /><br/>검색 결과가 없습니다.</td></tr>
              )}
            </tbody>
          </StyledTable>
        </TableWrapper>
      </ModalContainer>
    </>
  );
};

// --- Main Page ---

export default function DashboardPage() {
  const [streamHostsInput, setStreamHostsInput] = useState("192.168.0.53, 192.168.0.54");
  
  // [NEW] 연결된 단일 IP 상태
  const [connectedIp, setConnectedIp] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  const [showDashboard, setShowDashboard] = useState(false);
  const [showMapBoard, setShowMapBoard] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showListModal, setShowListModal] = useState(false); 
  
  const [now, setNow] = useState<Date | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleSlotDetail | null>(null);
  const [isVehicleLoading, setIsVehicleLoading] = useState(false);
  const [isVehicleDataLoaded, setIsVehicleDataLoaded] = useState(false);
  const [dwellString, setDwellString] = useState("-");
  const [isLongDwell, setIsLongDwell] = useState(false);

  const [materialList, setMaterialList] = useState<MaterialListItem[]>([]); 
  const [pendingList, setPendingList] = useState<MaterialListItem[]>([]);   
  const [materialStats, setMaterialStats] = useState({ total: 0, done: 0, percent: 0 });
  const [isMaterialLoading, setIsMaterialLoading] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);

  const [scannedInvoiceData, setScannedInvoiceData] = useState<WearableApiEntry[]>([]);
  const lastProcessedKeyRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // --- IP 스캔 및 고정 로직 ---
  const scanAndLockIp = useCallback(async () => {
    // 1. 이미 연결된 IP가 있다면 스캔 중지 (Search & Lock)
    if (connectedIp) return;

    const candidateIps = streamHostsInput.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    if (candidateIps.length === 0) {
      setScanMessage("IP를 입력해주세요.");
      return;
    }

    setIsScanning(true);
    setScanMessage("카메라 신호를 찾는 중...");

    let found = false;

    for (const ip of candidateIps) {
      if (found) break; // 이미 찾았으면 루프 종료
      
      const url = `http://${ip}:${PORT}/`;
      setScanMessage(`${ip} 연결 시도 중...`);
      
      try {
        // [핵심] fetch로 연결 확인. mode: 'no-cors'는 네트워크 에러(타임아웃, 거부)를 제외하고는 resolve됨
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2초 타임아웃
        
        await fetch(url, { 
            method: 'HEAD', 
            mode: 'no-cors', 
            signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        // 에러가 안 났다면 연결 성공으로 간주하고 Lock
        setConnectedIp(ip);
        found = true;
      } catch (e) {
        // 연결 실패 시 다음 IP로 넘어감
        console.log(`Failed to connect to ${ip}`, e);
      }
    }

    setIsScanning(false);
    if (!found) {
        setScanMessage("연결 가능한 카메라가 없습니다.");
    }
  }, [connectedIp, streamHostsInput]);

  // 입력값이 바뀌면 연결 초기화 (원하면 이 부분 제거하여 기존 연결 유지 가능)
  useEffect(() => {
    // 사용자가 IP를 수정하면 연결을 끊고 대기 상태로 변경
    // setConnectedIp(null); 
    // -> (옵션) 사용자가 입력을 수정할 때마다 바로 끊기는게 싫으면 위 줄 주석 처리.
    // 여기서는 버튼 눌러서 재스캔하는 방식으로 구현.
  }, [streamHostsInput]);

  // 최초 로드 시 혹은 수동 트리거 시 스캔 시작
  useEffect(() => {
     if (!connectedIp) {
         scanAndLockIp();
     }
  }, [scanAndLockIp, connectedIp]);

  const handleRetryScan = () => {
      setConnectedIp(null); // 현재 연결 해제
      setTimeout(() => scanAndLockIp(), 100); // 재스캔
  };

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => { setNow(new Date()); }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleHostChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setStreamHostsInput(e.target.value);
  }, []);

  const fetchVehicleData = useCallback(async () => {
    try {
      setIsVehicleLoading(true);
      const res = await fetch(API_URL_VEHICLE);
      if (!res.ok) throw new Error("Vehicle API Error");
      const data: VehicleApiResponse = await res.json();
      const allSlots = Object.values(data).flatMap(area => area.slots_detail);
      const validSlots = allSlots.filter(slot => 
        slot.FILEPATH && slot.FILENAME && (slot.FILENAME.toLowerCase().endsWith('.jpg') || slot.FILENAME.toLowerCase().endsWith('.png'))
      );
      validSlots.sort((a, b) => {
        if (!a.entry_time) return 1;
        if (!b.entry_time) return -1;
        return new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime();
      });
      if (validSlots.length > 0) {
        setVehicleInfo(validSlots[0]); 
        setIsVehicleDataLoaded(true);
      } else {
        setIsVehicleDataLoaded(true); 
      }
    } catch (err) { console.error(err); } finally { setIsVehicleLoading(false); }
  }, []);

  const fetchMaterialData = useCallback(async () => {
    setMaterialError(null);
    setIsMaterialLoading(true);
    try {
      const res = await fetch(API_URL_MATERIAL_LIST);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const json = await res.json();
      const data: MaterialListItem[] = Array.isArray(json) ? json : [];
      setMaterialList(data);
      const total = data.length;
      const done = data.filter(item => item.InspConf === 'Y').length;
      setMaterialStats({ total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 });
      setPendingList(data.filter(item => item.InspConf !== 'Y'));
    } catch (err: any) {
      setMaterialError(err.message || "데이터 로드 실패");
      setMaterialList([]);
      setPendingList([]);
      setMaterialStats({ total: 0, done: 0, percent: 0 });
    } finally { setIsMaterialLoading(false); }
  }, []);

  useEffect(() => {
    if (!now || !vehicleInfo || !vehicleInfo.entry_time) {
      setDwellString("-");
      setIsLongDwell(false);
      return;
    }
    const entryTime = new Date(vehicleInfo.entry_time);
    const diffMs = now.getTime() - entryTime.getTime();
    if (diffMs < 0) { setDwellString("0분"); setIsLongDwell(false); }
    else {
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      setIsLongDwell(diffMins >= 30);
      setDwellString(hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`);
    }
  }, [now, vehicleInfo]);

  useEffect(() => { fetchMaterialData(); }, [fetchMaterialData]);

  const manualTrigger = useCallback(() => { 
    fetchVehicleData(); 
    fetchMaterialData();
    setShowDashboard(true); 
  }, [fetchVehicleData, fetchMaterialData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (showListModal) setShowListModal(false);
            else if (showMapBoard) setShowMapBoard(false);
            else if (showDashboard) setShowDashboard(false);
            else if (isFullScreen) setIsFullScreen(false);
        }
        if (e.key === 'Enter') {
            manualTrigger();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, showDashboard, showMapBoard, showListModal, manualTrigger]);

  const lastProcessedContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const logsRef = ref(db, 'vuzix_log');
    const q = query(logsRef, limitToLast(1));
    const unsubscribe = onValue(q, async (snapshot) => {
      const dataWrapper = snapshot.val();
      if (!dataWrapper) return;
      const key = Object.keys(dataWrapper)[0];
      const data = dataWrapper[key];
      const currentContent = JSON.stringify(data);
      if (isInitialLoadRef.current) {
          lastProcessedKeyRef.current = key;
          lastProcessedContentRef.current = currentContent;
          setTimeout(() => { isInitialLoadRef.current = false; }, 500);
          return;
      }
      if (lastProcessedKeyRef.current === key && lastProcessedContentRef.current === currentContent) return;
      lastProcessedKeyRef.current = key;
      lastProcessedContentRef.current = currentContent;
      fetchVehicleData();
      fetchMaterialData();
      setShowDashboard(true); 
      const barcode = data.barcode || data.Barcode; 
      if (barcode) {
        try {
            const apiUrl = `${API_URL_INVOICE}?InvoiceNo=${barcode}`;
            const res = await fetch(apiUrl);
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json)) setScannedInvoiceData(json);
            }
        } catch (err) { console.error(err); }
      }
    });
    return () => unsubscribe();
  }, [fetchVehicleData, fetchMaterialData]);

  const toggleMapBoard = useCallback(() => setShowMapBoard(true), []);
  const closeDashboard = useCallback(() => setShowDashboard(false), []);
  const closeMapBoard = useCallback(() => setShowMapBoard(false), []);
  const toggleFullScreen = useCallback(() => setIsFullScreen(prev => !prev), []);
  const toggleListModal = useCallback(() => setShowListModal(true), []);
  const closeListModal = useCallback(() => setShowListModal(false), []);

  return (
    <LayoutGroup>      
      <DashboardContainer $show={true}>
            <Column>
                <TopCard>
                    <CardTitle>입고 차량 정보</CardTitle>
                    {isVehicleDataLoaded && vehicleInfo ? (
                      <>
                        <VehicleImagePlaceholder>
                          <img 
                            src={vehicleInfo.FILEPATH} 
                            alt="Vehicle" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                          />
                        </VehicleImagePlaceholder>
                        <PlateContainer>
                            <span className="label">차량 번호</span>
                            <div className="plate-badge">{vehicleInfo.PLATE || "번호미상"}</div>
                        </PlateContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
                            <InfoRow><span className="label">도착시간</span><span className="value">{vehicleInfo.entry_time ? vehicleInfo.entry_time.split(' ')[1] : "-"}</span></InfoRow>
                            <InfoRow>
                                <span className="label">체류시간</span>
                                <DwellTimeBadge $isWarning={isLongDwell}>{isLongDwell && <AlertTriangle size={12} style={{marginRight:4}}/>}{dwellString}</DwellTimeBadge>
                            </InfoRow>
                            <InfoRow><span className="label">상태</span><span className="value highlight-box">입고대기</span></InfoRow>
                        </div>
                      </>
                    ) : (
                      <MiniEmptyState>
                        <div className="icon-circle">{isVehicleLoading ? <Loader2 className="spin" size={28}/> : <Search size={28} />}</div>
                        <h3>{isVehicleLoading ? "데이터 조회 중..." : "차량 데이터 대기"}</h3>
                        <p>{isVehicleLoading ? "잠시만 기다려주세요." : "바코드를 스캔하면 차량정보가 표시됩니다."}</p>
                      </MiniEmptyState>
                    )}
                </TopCard>

                <FullHeightCard>
                    <CardTitle>입고 대기 리스트</CardTitle>
                    <div style={{ padding: '0 16px 16px 16px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
                            <span>금일 입고 진행률</span>
                            <span>{materialStats.percent}% ({materialStats.done} / {materialStats.total})</span>
                        </div>
                        <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${materialStats.percent}%` }} transition={{ duration: 1, ease: "easeOut" }} style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '6px' }} />
                        </div>
                    </div>
                    <HistoryListContainer>
                        <div className="h-title" style={{ justifyContent: 'space-between', paddingRight: '0px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isMaterialLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: 'flex' }}><Loader2 size={16} color="#3b82f6" /></motion.div> : <ListChecks size={16} />}
                                대기 목록 ({pendingList.length}건)
                            </div>
                            <ViewAllButton onClick={toggleListModal}><Maximize2 size={14}/> 전체보기</ViewAllButton>
                        </div>
                        <div className="h-scroll-area">
                            {isMaterialLoading ? (
                                <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#64748b', gap:'12px'}}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={32} color="#3b82f6"/></motion.div>
                                    <span style={{fontSize:'0.9rem', fontWeight:500}}>데이터를 불러오는 중입니다...</span>
                                </div>
                            ) : materialError ? (
                                <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#ef4444', gap:'10px'}}>
                                    <FileWarning size={32} />
                                    <span style={{fontSize:'0.9rem', textAlign:'center'}}>로드 실패<br/><span style={{fontSize:'0.8rem', color:'#94a3b8'}}>{materialError}</span></span>
                                    <PinkButton onClick={fetchMaterialData} style={{height:30, fontSize:'0.8rem', padding:'0 12px'}}>재시도</PinkButton>
                                </div>
                            ) : pendingList.length > 0 ? (
                                pendingList.map((item, idx) => (
                                  <MemoizedHistoryItem 
                                    key={`${item.InvoiceNo || 'unknown'}-${idx}`} 
                                    item={item} 
                                  />
                                ))
                            ) : (
                                <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#94a3b8', fontSize:'0.9rem'}}>항목이 없습니다.</div>
                            )}
                        </div>
                    </HistoryListContainer>
                </FullHeightCard>
            </Column>

            <Column>
                <VideoCard $isFullScreen={isFullScreen} layout transition={{ layout: { duration: 0.6, type: "spring", stiffness: 80, damping: 20 } }}>
                    <VideoHeader>
                        <div className="title-group">
                            <h3>자재검수 화면</h3>
                            {/* <IpInputWrapper style={{width: 350}}>
                                <span className="label">IPs</span>
                                <input value={streamHostsInput} onChange={handleHostChange} placeholder="192.168.0.53, 192.168.0.54" />
                            </IpInputWrapper> */}
                        </div>
                        <div className="btn-group">
                            {/* <PinkButton onClick={handleRetryScan} style={{marginRight: 8, background: '#475569'}}>
                                <RefreshCw size={14} className={isScanning ? 'spin' : ''} style={{marginRight: 4}}/>
                                재검색
                            </PinkButton> */}
                            <PinkButton onClick={toggleMapBoard}>D동 현황</PinkButton>
                        </div>
                    </VideoHeader>

                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
                      <motion.div layoutId="camera-view" style={{ width: '100%', height: '100%', zIndex: 1 }}>
                        
                        {/* 1. 연결된 IP가 있을 때 (화면 표시) */}
                        {connectedIp && !isScanning ? (
                            <SingleCamWrapper>
                                <iframe 
                                    src={`http://${connectedIp}:${PORT}/`} 
                                    title={`Stream ${connectedIp}`} 
                                    allow="fullscreen"
                                />
                                <div style={{position:'absolute', top:10, left:10, background:'rgba(0,0,0,0.6)', color:'#4ade80', padding:'4px 8px', borderRadius:6, fontSize:'0.8rem', fontWeight:600, display:'flex', alignItems:'center', gap:6}}>
                                    <div style={{width:8, height:8, borderRadius:'50%', background:'#4ade80'}}></div>
                                    Connected: {connectedIp}
                                </div>
                            </SingleCamWrapper>
                        ) : (
                        /* 2. 연결된 IP가 없을 때 (스캔 중 화면 or 실패 화면) */
                            <StyledErrorState>
                                {isScanning ? (
                                    <>
                                        <RefreshCw className="spin" size={40} color="#3b82f6" />
                                        <h3 style={{marginTop: 16, color: '#93c5fd'}}>SCANNING...</h3>
                                        <p style={{marginTop: 8, color: '#64748b'}}>{scanMessage}</p>
                                    </>
                                ) : (
                                    <>
                                        <Signal size={40} color="#64748b" />
                                        <h3 style={{marginTop: 16, color: '#94a3b8'}}>NO SIGNAL</h3>
                                        <p style={{marginTop: 8, color: '#64748b'}}>{scanMessage || "연결 가능한 카메라가 없습니다."}</p>
                                        <PinkButton onClick={handleRetryScan} style={{marginTop: 16}}>재시도</PinkButton>
                                    </>
                                )}
                            </StyledErrorState>
                        )}

                      </motion.div>
                      
                      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 50 }}>
                          <button onClick={toggleFullScreen} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', width: '40px', height: '40px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isFullScreen ? <LuMinimize size={20}/> : <LuMaximize size={20}/>}
                          </button>
                      </div>
                      
                      <AnimatePresence>
                          {showDashboard && connectedIp && (
                            <AIDashboardModal onClose={closeDashboard} streamUrl={`http://${connectedIp}:${PORT}/`} streamStatus={"ok"} externalData={scannedInvoiceData} />
                          )}
                      </AnimatePresence>
                    </div>
                </VideoCard>
            </Column>
      </DashboardContainer>

      <AnimatePresence>
        {showListModal && <MaterialListModal isOpen={showListModal} onClose={closeListModal} data={materialList} />}
        {showMapBoard && (
            <>
                <Backdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMapBoard} />
                <SlidePanel initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}><WarehouseBoard onClose={closeMapBoard} /></SlidePanel>
            </>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}