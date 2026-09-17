import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/event', destination: '/events/destiny', permanent: true },
    ];
  },
};

export default nextConfig;
