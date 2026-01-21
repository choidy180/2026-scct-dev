import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 개발 인디케이터 숨김 설정 (강제 적용)
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  } as any, // 타입 오류 방지용

  compiler: {
    styledComponents: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "1.254.24.170",
        port: "24828",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;