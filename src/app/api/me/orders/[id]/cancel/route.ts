import { api, route } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };
export const POST = (req: Request, ctx: Ctx) =>
  route(
    async ({ token, body }) =>
      api(`/me/orders/${encodeURIComponent((await ctx.params).id)}/cancel`, {
        method: "POST",
        body,
        token,
      }),
    { write: true },
  )(req);
