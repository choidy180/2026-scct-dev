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
        hostname: "192.168.2.147",
        port: "24828",
        pathname: "/images/**",
      },
    ],
  },
 webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // 1초마다 파일 변경 확인 (윈도우 도커 필수)
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;