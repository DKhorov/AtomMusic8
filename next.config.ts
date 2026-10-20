/*
 * AtomGlide Labs® 2025-2026 All Rights Reserved.
 * File: next.config.ts
 * Project: AtomGlide.com
 * Engine: Powered by AtomGlide APi Celton
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  turbopack: {},
  experimental: {
    // Убираем лимиты прокси Next.js для работы с большими PDF
    middlewareClientMaxBodySize: "150mb",
    serverActions: {
      bodySizeLimit: "150mb",
    },
    proxyTimeout: 120000,
  },
  async rewrites() {
    const apiServerUrl = "https://atomglide.of.by"; // Замени на 127.0.0.1 для локального сокета

    return [
      { source: "/api/:path*", destination: `${apiServerUrl}/api/:path*` },
      { source: "/storage/:path*", destination: `${apiServerUrl}/storage/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;