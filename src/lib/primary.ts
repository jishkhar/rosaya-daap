import "server-only";
import { cookies, headers } from "next/headers";
import { storeHost } from "@/lib/api";
import { PATH_HEADER } from "@/proxy";
import { PREVIEW_COOKIE } from "@/themes/preview";

const ONE_SHOP = !!process.env.STORE_CHANNEL_KEY;

const hostname = (host: string) =>
  host.toLowerCase().replace(/\.$/, "").replace(/:\d+$/, "");
/** Local development addresses (rosaya.localhost:3001) keep plain http and their port. */
const isLocal = (host: string) =>
  host === "localhost" || host.endsWith(".localhost");

/** `https://<host>` for the shop's primary address; http and the visited port on a local address. */
export async function originOf(primaryHost: string): Promise<string> {
  if (!isLocal(primaryHost)) return `https://${primaryHost}`;
  const port = (await storeHost()).match(/:(\d+)$/)?.[1];
  return `http://${primaryHost}${port ? `:${port}` : ""}`;
}

/**
 * Where to send this request instead, or null to serve it: on the DAAP-hosted storefront, a shop's other addresses (its platform address
 * once a custom domain is primary, a connected non-primary domain) go to the primary one, same path. Never in one-shop mode (the site
 * lives wherever it is deployed), never during a theme preview (the preview cookie belongs to the address the editor opened).
 */
export async function primaryRedirect(
  primaryHost: string | null,
): Promise<string | null> {
  if (ONE_SHOP || !primaryHost) return null;
  const visited = hostname(await storeHost());
  if (!visited || visited === hostname(primaryHost)) return null;
  if ((await cookies()).get(PREVIEW_COOKIE)) return null;
  const path = (await headers()).get(PATH_HEADER) ?? "/";
  return `${await originOf(primaryHost)}${path.startsWith("/") ? path : "/"}`;
}
