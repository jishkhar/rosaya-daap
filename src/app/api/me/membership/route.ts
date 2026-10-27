import { api, route } from "@/lib/bff";

export const POST = route(
  ({ token, body }) => api("/me/membership", { method: "POST", body, token }),
  { write: true },
);
