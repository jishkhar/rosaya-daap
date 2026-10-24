import { api, route } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };

/** Ask the shop to take items back; nothing is refunded until the shop receives them. */
export const POST = (req: Request, ctx: Ctx) =>
  route(
    async ({ token, body }) =>
      api(
        `/me/orders/${encodeURIComponent((await ctx.params).id)}/return-requests`,
        { method: "POST", body, token },
      ),
    { write: true },
  )(req);
