import { api, route } from "@/lib/bff";

export const GET = route(({ token }) => api("/me/addresses", { token }));
export const POST = route(
  ({ token, body }) => api("/me/addresses", { method: "POST", body, token }),
  { write: true },
);
