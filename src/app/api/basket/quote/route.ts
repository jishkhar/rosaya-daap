import { api, route } from "@/lib/bff";

// The server prices the basket; the browser only sends (variant, quantity) and an optional coupon code.
export const POST = route(
  ({ token, body }) => api("/basket/quote", { method: "POST", body, token }),
  { write: true },
);
