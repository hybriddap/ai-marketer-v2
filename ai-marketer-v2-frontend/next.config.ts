import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:8000";

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
        destination: `${backendUrl}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
