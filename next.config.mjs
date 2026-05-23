import path from 'node:path';

const API_SERVER = 'http://34.232.62.142:8080';

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
