import "server-only";
import { headers as requestHeaders } from "next/headers";
import { cache } from "react";

/**
 * Server-side client for the ERP store API (`/api/v1/store/*`).
 *
 * Its credentials (see credentials() below) live only in server env -- this module is `server-only`, so importing it from a client
 * component fails the build.
 * The customer's session token (httpOnly cookie) is forwarded per call as X-Customer-Token.
 */
const BASE = (process.env.STORE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const KEY = process.env.STORE_CHANNEL_KEY ?? "";
const PLATFORM_KEY = process.env.STOREFRONT_PLATFORM_KEY ?? "";

/**
 * How this storefront proves itself to the store API:
 *  - one shop: STORE_CHANNEL_KEY (that shop's 'online' key), whatever address the site is opened on;
 *  - the DAAP-hosted storefront (every shop): STOREFRONT_PLATFORM_KEY + the address the shopper opened (rosaya.ecommerce.daaprimetech.com),
 *    which the backend turns into the shop. The address is sent as a header, and Next's fetch cache keys on headers, so one shop's cached
 *    answers are never served to another.
 */
async function credentials(): Promise<Record<string, string>> {
  if (KEY) return { "X-Channel-Key": KEY };
  if (!PLATFORM_KEY) throw new ApiError(500, "not_configured", "The storefront has no STORE_CHANNEL_KEY or STOREFRONT_PLATFORM_KEY configured.");
  return { "X-Storefront-Key": PLATFORM_KEY, "X-Store-Host": await storeHost() };
}

/** The address this request was made to (behind a proxy, the one the shopper typed). */
export async function storeHost(): Promise<string> {
  const h = await requestHeaders();
  return (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

type Opts = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  idempotencyKey?: string;
  /** seconds to cache a GET in Next's data cache; omit for no caching */
  revalidate?: number;
  /** theme preview token from the portal's editor (unpublished draft); never cached */
  preview?: string;
};

async function request(path: string, opts: Opts = {}): Promise<unknown> {
  const headers: Record<string, string> = await credentials();
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["X-Customer-Token"] = opts.token;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  if (opts.preview) headers["X-Theme-Preview"] = opts.preview;
  const method = opts.method ?? "GET";
  const signal = AbortSignal.timeout(method === "GET" ? 10_000 : 30_000);
  try {
    const res = await fetch(`${BASE}/api/v1/store${path}`, {
      method,
      headers,
      signal,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      ...(opts.revalidate ? { next: { revalidate: opts.revalidate } } : { cache: "no-store" as const }),
    });
    if (res.status === 204) return undefined;
    // The same deadline covers reading the body, not just receiving response headers.
    let data;
    try {
      data = await res.json();
    } catch (error) {
      if (signal.aborted) throw error;
      throw new ApiError(502, "invalid_response", "The store returned an invalid response. Please try again.");
    }
    if (!res.ok) {
      const e = data?.error ?? {};
      throw new ApiError(res.status, e.code ?? "error", e.message ?? "Something went wrong.", e.details ?? {});
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal.aborted) {
      console.error("Store API timeout", { method, path: path.split("?")[0] });
      throw new ApiError(504, "timeout", "The store took too long to respond. Please try again in a moment.");
    }
    console.error("Store API connection failed", { method, path: path.split("?")[0] });
    throw new ApiError(503, "unreachable", "The store is temporarily unavailable. Please try again in a moment.");
  }
}

// Passing a deadline signal disables Next's automatic fetch memoization. Keep GET
// deduplication within each server render, with customer tokens in the cache key.
const read = cache((path: string, revalidate: number | undefined, token: string | null | undefined) =>
  request(path, { revalidate, token }));

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  return ((opts.method ?? "GET") === "GET" && !opts.preview
    ? read(path, opts.revalidate, opts.token)
    : request(path, opts)) as Promise<T>;
}
