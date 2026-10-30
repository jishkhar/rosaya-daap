import type { NextConfig } from "next";

// Product images uploaded through the ERP live in Cloudflare R2 and are served from MEDIA_BASE_URL (the same value the backend uses).
const media = process.env.MEDIA_BASE_URL
  ? new URL(process.env.MEDIA_BASE_URL)
  : null;

const nextConfig: NextConfig = {
  // Old short URLs (/c/…, /p/…) keep working for bookmarks, search engines and stored theme links.
  async redirects() {
    return [
      { source: "/c/:slug", destination: "/collections/:slug", permanent: true },
      { source: "/p/:slug", destination: "/products/:slug", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      // The seeded demo catalogue still points at Rosaya's Shopify CDN.
      { protocol: "https", hostname: "cdn.shopify.com" },
      ...(media
        ? [
            {
              protocol: media.protocol.replace(":", "") as "http" | "https",
              hostname: media.hostname,
              ...(media.port ? { port: media.port } : {}),
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
