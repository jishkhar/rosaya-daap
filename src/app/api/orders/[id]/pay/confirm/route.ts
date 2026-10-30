import { api, route } from "@/lib/bff";

/** Razorpay Checkout's success answer, handed to the store API, which verifies it with Razorpay before the order is marked paid. */
export const POST = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  route(
    async ({ body }) =>
      api(`/orders/${encodeURIComponent((await ctx.params).id)}/pay/confirm`, {
        method: "POST",
        body,
      }),
    { write: true },
  )(req);
