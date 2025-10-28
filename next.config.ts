import type { NextConfig } from "next";

const nextConfig = {
    async headers() {
    return [
      // {
      //   source: "/(.*)",
      //   headers: [
      //     {
      //       key: "Content-Security-Policy",
      //       value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com;",
      //     },
      //   ],
      // },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "appx-wsb-gcp.akamai.net.in",
      },
    ],
  },
};

export default nextConfig;
