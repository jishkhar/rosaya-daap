import { NextResponse, type NextRequest } from "next/server";
import { LIVE_PREVIEW_COOKIE, PREVIEW_COOKIE } from "@/themes/preview";

/**
 * Theme preview from the portal editor: /preview?token=<signed token>[&path=/collections/sarees] starts it, /preview?exit=1 ends it.
 * /preview?live=1 opens the portal's live card with fresh published settings and clears any draft token.
 * The token is only stored here; the store API checks it (signature, expiry, this tenant) on every page, so a bad one shows the live site.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const path = params.get("path") ?? "/";
  // A relative Location keeps the browser on the address it came in on (the shop's own, e.g. rosaya.ecommerce.daaprimetech.com);
  // req.nextUrl.origin is the server's own name and would drop the shop's subdomain.
  const target =
    path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\")
      ? path
      : "/";
  const res = new NextResponse(null, {
    status: 303,
    headers: { Location: target },
  });
  const token = params.get("token");
  // The theme editor shows this inside an iframe on the portal, which is another site (always for a custom domain like rosaya.in, and
  // locally localhost vs rosaya.localhost). Only a SameSite=None + Partitioned cookie reaches an embedded site; browsers treat
  // localhost and *.localhost as secure, so Secure works in development too.
  const cookie = {
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
    partitioned: true,
    path: "/",
  };
  const live = params.get("live") === "1" && !params.has("exit");
  if (live || params.get("exit") || !token) {
    res.cookies.set(PREVIEW_COOKIE, "", { ...cookie, maxAge: 0 });
  } else {
    res.cookies.set(PREVIEW_COOKIE, token.slice(0, 2000), {
      ...cookie,
      maxAge: 2 * 3600,
    });
  }
  res.cookies.set(LIVE_PREVIEW_COOKIE, live ? "1" : "", {
    ...cookie,
    maxAge: live ? 2 * 3600 : 0,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
