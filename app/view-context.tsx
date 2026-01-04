"use client";

import React, { createContext, useContext, useState } from "react";

type ViewContextType = {
  currentView: string;
  setCurrentView: (view: string) => void;
  // ✅ 로딩 상태 추가
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState("AI 운송관리");
  const [isLoading, setIsLoading] = useState(false); // ✅ 기본값 false

  return (
    <ViewContext.Provider value={{ currentView, setCurrentView, isLoading, setIsLoading }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useViewContext() {
  const context = useContext(ViewContext);
  if (!context) throw new Error("useViewContext must be used within a ViewProvider");
  return context;
}