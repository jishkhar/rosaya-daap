import { api, route } from "@/lib/bff";

// Development stand-in for the payment gateway: the ERP refuses it unless STORE_MOCK_PAYMENTS is on.
export const POST = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  route(async () => api(`/orders/${encodeURIComponent((await ctx.params).id)}/mock-pay`, { method: "POST" }), { write: true })(req);
