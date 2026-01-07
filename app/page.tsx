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
  return (
    <div/>
  );
};

export default ScctDevPage;