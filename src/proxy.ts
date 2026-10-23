import { NextResponse, type NextRequest } from "next/server";

/** The header the root layout reads the requested path (+ query) from, to redirect a shop's other addresses to its primary one. */
export const PATH_HEADER = "x-store-path";

/** Pages only: passes the requested path on, since a layout can't see it. No lookups here, nothing else changes. */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(PATH_HEADER, request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Not API routes, the preview hand-off, Next's own files, or files with an extension (images, sitemap.xml, robots.txt).
  matcher: ["/((?!api/|preview|_next/|.*\\..*).*)"],
};
