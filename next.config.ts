import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Set the root directory to silence the lockfile warning
    root: process.cwd(),
  },
};

export default nextConfig;
