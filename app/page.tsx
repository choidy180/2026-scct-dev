"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter, notFound } from "next/navigation";
import LoadingGate from "@/components/loading/loading-spinner";
import ProcessMonitorPage from "@/components/bar-graph";
import LocalMapPage from "@/components/local-map";
import AiMaterialPlaceholder from "@/components/ai-material-placeholder";

const ScctDevPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  // 1. 루트 경로('/')로 들어오면 강제로 운송관리 페이지로 보냄
  useEffect(() => {
    if (pathname === '/' || pathname === '') {
      router.replace('/transport/realtime-status');
    }
  }, [pathname, router]);

  // const renderContent = () => {
  //   // 리다이렉트 중 깜빡임 방지
  //   if (pathname === '/' || pathname === '') return null;

  //   // URL에 포함된 단어를 기준으로 컴포넌트 매핑
  //   if (pathname.includes('/transport/realtime-status')) {
  //     return <LocalMapPage />;
  //   }
  //   if (pathname.includes('production')) {
  //     return <ProcessMonitorPage />;
  //   }
  //   if (pathname.includes('material')) {
  //     return <AiMaterialPlaceholder />;
  //   }

  //   // 아무것도 안 맞으면 404 처리
  //   return notFound();
  // };

  return (
    // <LoadingGate isLoading={false}>
    //   {renderContent()}
    // </LoadingGate>
    <div/>
  );
};

export default ScctDevPage;