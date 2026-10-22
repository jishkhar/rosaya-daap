import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

/**
 * Backend-for-frontend helpers: the browser only ever talks to this app's /api routes. They add the channel key
 * (never exposed), carry the customer session in an httpOnly cookie, and pass the ERP's answers (and errors) through.
 */
export const SESSION_COOKIE = "store_session";
const LEGACY_SESSION_COOKIE = "rosaya_session"; // the name before the storefront served many shops; read until those sessions expire
const WEEK = 7 * 24 * 3600;

export async function sessionToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? jar.get(LEGACY_SESSION_COOKIE)?.value ?? null;
}

export async function setSession(token: string, maxAge = WEEK) {
  const jar = await cookies();
  jar.delete(LEGACY_SESSION_COOKIE);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(LEGACY_SESSION_COOKIE);
}

/** State-changing requests must come from this site (the cookie is SameSite=Lax, this is the second lock). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser callers (and same-origin GET-like navigations) send none
  return new URL(origin).host === req.headers.get("host");
}

export function fail(e: unknown) {
  if (e instanceof ApiError) return NextResponse.json({ error: { code: e.code, message: e.message, details: e.details } }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: { code: "error", message: "Something went wrong. Please try again." } }, { status: 500 });
}

type Handler<T> = (ctx: { token: string | null; body: unknown; req: Request }) => Promise<T>;

/** Wrap a route: origin check for writes, JSON body parsing, error mapping. */
export function route<T>(h: Handler<T>, opts: { write?: boolean } = {}) {
  return async (req: Request) => {
    try {
      if (opts.write && !sameOrigin(req)) return NextResponse.json({ error: { code: "forbidden", message: "Cross-site request refused." } }, { status: 403 });
      const body = opts.write ? await req.json().catch(() => ({})) : undefined;
      const out = await h({ token: await sessionToken(), body, req });
      return out instanceof NextResponse ? out : NextResponse.json(out ?? { ok: true });
    } catch (e) {
      return fail(e);
    }
  };
}

export { api, ApiError };
