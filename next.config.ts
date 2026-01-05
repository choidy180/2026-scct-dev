import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // ✅ 이 설정이 없으면 페이지 이동 시 스타일 불일치로 새로고침이 발생합니다.
    styledComponents: true, 
  },
  /* config options here */
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
