import "server-only";

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

export async function api<T>(path: string, opts: Opts = {}): Promise<T> {
  if (!KEY) throw new ApiError(500, "not_configured", "The storefront has no STORE_CHANNEL_KEY configured.");
  const headers: Record<string, string> = { "X-Channel-Key": KEY };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["X-Customer-Token"] = opts.token;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1/store${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      ...(opts.revalidate ? { next: { revalidate: opts.revalidate } } : { cache: "no-store" as const }),
    });
  } catch {
    throw new ApiError(503, "unreachable", "The store is temporarily unavailable. Please try again in a moment.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error ?? {};
    throw new ApiError(res.status, e.code ?? "error", e.message ?? "Something went wrong.", e.details ?? {});
  }
  return data as T;
}
