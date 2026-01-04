"use client";

import React from "react";
import LoadingGate from "@/components/loading/loading-spinner";
import ProcessMonitorPage from "@/components/bar-graph";
import LocalMapPage from "@/components/local-map";
import AiMaterialPlaceholder from "@/components/ai-material-placeholder";
import { useViewContext } from "./view-context"; 

const ScctDevPage = () => {
  // ✅ isLoading을 여기서 가져오지 않습니다. (전역 스피너 안 띄움)
  const { currentView } = useViewContext();

  return (
    // ✅ isLoading={false}로 고정하여, 탭 전환 시 화면을 가리지 않게 함
    <LoadingGate isLoading={false}>
      {currentView === "AI 생산관리" && <ProcessMonitorPage />}
      
      {currentView === "AI 운송관리" && <LocalMapPage />}

      {currentView === "AI 자재관리" && <AiMaterialPlaceholder />}
    </LoadingGate>
  );
};

export default ScctDevPage;