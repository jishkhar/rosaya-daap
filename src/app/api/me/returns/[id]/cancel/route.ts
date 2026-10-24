import { api, route } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };

/** Withdraw a request the shop has not started on yet. */
export const POST = (req: Request, ctx: Ctx) =>
  route(
    async ({ token }) =>
      api(`/me/returns/${encodeURIComponent((await ctx.params).id)}/cancel`, {
        method: "POST",
        token,
      }),
    { write: true },
  )(req);
