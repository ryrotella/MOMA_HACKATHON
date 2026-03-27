import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.moma.org",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
