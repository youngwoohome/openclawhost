import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable server components for YAML loading
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
