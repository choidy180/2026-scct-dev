"use client";

import ProcessMonitorPage from "@/components/bar-graph";
import LoadingGate from "@/components/loading/loading-spinner";
import LocalMapPage from "@/components/local-map";
import TopNavigation from "@/components/top-navigation";
import { useState } from "react";

const ScctDevPage = () => {
  // 1. 현재 보고 있는 탭의 상태를 여기서 관리합니다. (초기값: AI 생산관리)
  const [currentView, setCurrentView] = useState("AI 생산관리");
  const [loading, setLoading] = useState(true);

  return (
    <LoadingGate isLoading={false}>
      
      {/* 2. TopNavigation에 현재 상태와 변경 함수를 전달합니다. */}
      <TopNavigation 
        activeTab={currentView} 
        onTabChange={setCurrentView} 
      />

      {/* 3. currentView 값에 따라 조건부 렌더링을 수행합니다. */}
      {currentView === "AI 생산관리" && <ProcessMonitorPage />}
      
      {currentView === "AI 운송관리" && <LocalMapPage />}

      {/* 필요하다면 'AI 자재관리'에 대한 처리도 추가할 수 있습니다. */}
      {currentView === "AI 자재관리" && (
        <div style={{ padding: '100px', textAlign: 'center', fontSize: '20px' }}>
          자재관리 페이지 준비중...
        </div>
      )}
      
    </LoadingGate>
  );
};

export default ScctDevPage;