import type { NextConfig } from "next";

const API_SERVER = 'http://34.232.62.142:8080';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_SERVER}/:path*` },
    ];
  },
};

export default nextConfig;
