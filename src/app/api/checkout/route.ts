import { api, ApiError, clearSession, route } from "@/lib/bff";

export const POST = route(async ({ token, body, req }) => {
  if (!token) throw new ApiError(401, "unauthorized", "Please log in to check out.");
  try {
    await api("/me", { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await clearSession();
    throw error;
  }
  const key = req.headers.get("idempotency-key");
  return api("/checkout", { method: "POST", body, token, idempotencyKey: key ?? undefined });
}, { write: true });
