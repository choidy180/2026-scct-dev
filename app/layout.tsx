// app/layout.tsx

import type { Metadata } from "next";
import StyledComponentsRegistry from "@/lib/registry"; 
import { ViewProvider } from "./view-context"; // ✅ ViewProvider import 필수
import "./globals.css";
import ClientLayoutWrapper from "./layout-client";

export const metadata: Metadata = {
  title: "스마트 팩토리 대시보드",
  description: "물류 및 생산 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <StyledComponentsRegistry>
          {/* ✅ ViewProvider가 가장 바깥에 있어야 합니다 */}
          <ViewProvider>
          {/* ✅ 여기서 한 번만 감싸줍니다. */}
            <ClientLayoutWrapper>
              {children} 
            </ClientLayoutWrapper>
          </ViewProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}