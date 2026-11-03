import type { NextConfig } from "next";

import { API_URL } from "./lib/api";

const api = new URL(API_URL);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: api.protocol.replace(":", "") as "http" | "https",
        hostname: api.hostname,
        port: api.port,
        pathname: "/usuarios/*/foto-perfil",
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
