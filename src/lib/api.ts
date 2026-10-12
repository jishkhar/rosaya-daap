import "server-only";
import { cache } from "react";

/**
 * Server-side client for the ERP store API (`/api/v1/store/*`).
 *
 * The channel key authenticates this storefront as the tenant's 'online' channel. It lives only in server env
 * (STORE_CHANNEL_KEY) -- this module is `server-only`, so importing it from a client component fails the build.
 * The customer's session token (httpOnly cookie) is forwarded per call as X-Customer-Token.
 */
const BASE = (process.env.STORE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const KEY = process.env.STORE_CHANNEL_KEY ?? "";

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
};

async function request(path: string, opts: Opts = {}): Promise<unknown> {
  if (!KEY) throw new ApiError(500, "not_configured", "The storefront has no STORE_CHANNEL_KEY configured.");
  const headers: Record<string, string> = { "X-Channel-Key": KEY };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["X-Customer-Token"] = opts.token;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
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
  return ((opts.method ?? "GET") === "GET"
    ? read(path, opts.revalidate, opts.token)
    : request(path, opts)) as Promise<T>;
}
