import { api, route } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };

/** What of a delivered order can still be returned, and until when. */
export const GET = (req: Request, ctx: Ctx) =>
  route(async ({ token }) =>
    api(`/me/orders/${encodeURIComponent((await ctx.params).id)}/returnable`, {
      token,
    }),
  )(req);
