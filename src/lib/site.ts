import "server-only";
import { headers } from "next/headers";
import { originOf } from "@/lib/primary";
import { getStorefront } from "@/themes/registry";

/**
 * The public address of the shop being served, for the sitemap, robots, canonical links and share previews. One-shop mode
 * (STORE_CHANNEL_KEY): SITE_URL. The DAAP-hosted storefront serves every shop: the shop's primary address (its connected custom
 * domain, else its platform address), so search engines index one address; failing that, the address this request came in on.
 */
export async function siteUrl(): Promise<string> {
  if (process.env.STORE_CHANNEL_KEY)
    return (process.env.SITE_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const { primaryHost } = await getStorefront();
  if (primaryHost) return originOf(primaryHost);
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001")
    .split(",")[0]
    .trim();
  const proto = (
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.includes(".localhost")
      ? "http"
      : "https")
  )
    .split(",")[0]
    .trim();
  return `${proto}://${host}`;
}
