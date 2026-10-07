import { api, route } from "@/lib/bff";

export const POST = route(({ token, body, req }) => {
  const key = req.headers.get("idempotency-key");
  return api("/checkout", { method: "POST", body, token, idempotencyKey: key ?? undefined });
}, { write: true });
