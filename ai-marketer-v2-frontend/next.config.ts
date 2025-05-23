import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: process.env.NEXT_PUBLIC_IMAGE_DOMAINS
      ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(",")
      : [],
    unoptimized: isDev,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://backend-0vrq.onrender.com/api/:path*/",
      },
    ];
  },
};

export default nextConfig;
