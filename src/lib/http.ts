/** Leave the app (hosted payment page) or hard-reload into a route. */
export const goTo = (url: string) => window.location.assign(url);

/** fetch wrapper for this app's own /api routes: always JSON, never throws, errors come back as a message fit to show. */
export type Call<T> = { ok: true; data: T; status: number } | { ok: false; error: string; status: number; code?: string; details?: Record<string, unknown> };

export async function call<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; headers?: Record<string, string>; signal?: AbortSignal } = {},
): Promise<Call<T>> {
  try {
    const res = await fetch(path, {
      method: opts.method ?? "GET",
      headers: { ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}), ...opts.headers },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const e = data?.error ?? {};
      return { ok: false, status: res.status, error: e.message ?? "Something went wrong. Please try again.", code: e.code, details: e.details };
    }
    return { ok: true, data: data as T, status: res.status };
  } catch (e) {
    if ((e as Error).name === "AbortError") return { ok: false, status: 0, error: "aborted", code: "aborted" };
    return { ok: false, status: 0, error: "You appear to be offline. Please check your connection." };
  }
}
