import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const url = await siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/checkout", "/account", "/pay/", "/order/", "/reset-password"] }],
    sitemap: `${url}/sitemap.xml`,
  };
}
