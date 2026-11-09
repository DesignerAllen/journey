import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 같은 와이파이의 폰에서 개발 서버(http://<PC IP>:3000)에 접속할 수 있도록 허용
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
