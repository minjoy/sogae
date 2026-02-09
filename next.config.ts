import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API body size 제한 (10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
