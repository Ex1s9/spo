import type { NextConfig } from "next";

// Адрес бэкенда. Фронт всегда ходит на свой же origin (/api/...), а Next проксирует
// запрос дальше — поэтому httpOnly-cookie остаётся first-party, CORS не нужен,
// SameSite=Lax работает как положено.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8080";

// Пока бэкенда нет, оставляем встроенные моки (src/app/api/**): USE_MOCKS=true.
const USE_MOCKS = process.env.USE_MOCKS === "true";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
  async rewrites() {
    if (USE_MOCKS) return [];
    return {
      // beforeFiles — иначе Route Handlers из src/app/api перехватят запрос раньше rewrite.
      beforeFiles: [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }],
      afterFiles: [],
      fallback: [],
    };
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
