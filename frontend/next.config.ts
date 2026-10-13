import type { NextConfig } from "next";

import { API_URL } from "./lib/api";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  // El navegador le habla al backend a través de este proxy para que la
  // cookie de sesión quede en el dominio del frontend (ver lib/api.ts).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
