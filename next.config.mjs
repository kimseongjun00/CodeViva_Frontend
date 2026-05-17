import path from 'node:path';

const API_SERVER = 'http://44.220.251.236:8080';

const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_SERVER}/:path*`,
      },
    ];
  },
};

export default nextConfig;
