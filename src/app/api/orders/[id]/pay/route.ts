import { api, route } from "@/lib/bff";

export const POST = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  route(
    async () =>
      api(`/orders/${encodeURIComponent((await ctx.params).id)}/pay`, {
        method: "POST",
      }),
    { write: true },
  )(req);
