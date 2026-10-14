import type { NextConfig } from "next";

const isProductionSite = process.env.SITE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com https://*.supabase.co" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      // Vercel rejects request bodies above 4.5 MB; the admin uploader
      // downsizes photos in the browser and the server enforces 4 MB per file.
      bodySizeLimit: "4.4mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      { pathname: "/brand/**", search: "" },
    ],
  },
  async headers() {
    const headers = [...securityHeaders];
    if (!isProductionSite) {
      headers.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
    }
    return [
      { source: "/:path*", headers },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default nextConfig;
