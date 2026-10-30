import { api, route } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };

/** Ask the shop to swap items for the replacement the shopper chose; nothing moves until the shop receives the goods. */
export const POST = (req: Request, ctx: Ctx) =>
  route(
    async ({ token, body }) =>
      api(
        `/me/orders/${encodeURIComponent((await ctx.params).id)}/exchange-requests`,
        { method: "POST", body, token },
      ),
    { write: true },
  )(req);
