// app/(demo)/materials/types.ts 기반

export type Option = { value: string; label: string };

export type Ingredient = { name: string; value: number };

export type CaseCard = { 
  id: string; 
  title: string; 
  ingredients: Ingredient[] 
};

export type PredDetailRow = {
  codeName: string;
  y_pred: number;
  ci_low: number;
  ci_high: number;
};

export type PredictionCard = {
  id: string;
  title: string;
  checked: boolean;
  propCount: number;
  caseId: string;
  props: number[];
  propKeys?: string[];
  ciLow?: number[];
  ciHigh?: number[];
  detailRows?: PredDetailRow[];
};

export interface ApiEntry {
  // 1. 필수 데이터 (API JSON 기준)
  PrjName: string;      
  CdGItem: string;      // 여기가 핵심입니다 (대소문자 주의)
  NmGItem: string;      
  InQty: number;        
  TInQty: number;       
  NmInspGB: string;     
  QmConf: string;       
  InvoiceNo: string;    
  DtPurIn: string;      
  NmCustm: string;      
  PurInDate?: string;

  // 2. 선택적 데이터 (있을 수도 없을 수도 있는 값들)
  PrjGubun?: string;
  PrjCode?: string;
  BigOper?: string;
  SzStand?: string;
  Ingrdnt?: string;
  SzSUnit?: string;
  ProcGB?: string;
  NmProcGB?: string;
  InspGB?: string;
  PurOrdNo?: string;
  PurInNo?: string;
  DtPurOrd?: string;
  InPlnDate?: string;
  CdCustm?: string;
  OrdQty?: number;
  CancelQty?: number;
  ConfQty?: number;
  RemQty?: number;
  PackCnt?: string;
  InspConf?: string;
  InspDate?: string;
  QmDate?: string | null;
  LastConf?: string;
  LastDate?: string | null;
  GMTCloseConf?: string;
  GMTCloseDate?: string | null;
  Remarks?: string;
  
  // 3. 호환성 필드 (API 버전에 따라 이름이 다를 경우 대비)
  CdGlItem?: string; 
  NmGlItem?: string;
}

export interface WearableHistoryItemData {
  id: string;
  company: string;
  purInNo: string;
  status: '정상' | '검수필요';
  time: string;
  fullDate: string;
}

export interface WearableItemData {
  id: number;
  project: string;
  code: string;
  name: string;
  type: string;
  date: string;
  vendor: string;
  qty: number;
  quality: string;
  dwellTime: string;
  invoiceNo?: string;
  totalQty?: number;
  qmConf?: string;
}

export interface WearableSlotData {
  no: number;
  active: boolean;
}

export interface WearableZoneData {
  id: string;
  total: number;
  used: number;
  free: number;
  status: string;
  slots: WearableSlotData[];
}

export interface WearableInventoryItem {
  code: string;
  qty: number;
  loc: string;
}

// ─────────────────────────────────────────────────────────────
// [Compatibility Aliases]
// 기존 컴포넌트(WarehouseBoard, AIDashboardModal 등)가 
// 참조하는 이름과 호환되도록 별칭을 설정합니다.
// ─────────────────────────────────────────────────────────────

export type WearableApiEntry = ApiEntry;
export type HistoryItemData = WearableHistoryItemData;
export type ItemData = WearableItemData;
export type SlotData = WearableSlotData;
export type ZoneData = WearableZoneData;
export type InventoryItem = WearableInventoryItem;