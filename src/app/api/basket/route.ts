import { api, route } from "@/lib/bff";

export const GET = route(({ token }) => api("/basket", { token }));
export const PUT = route(
  ({ token, body }) => api("/basket", { method: "PUT", body, token }),
  { write: true },
);
