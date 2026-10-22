import { api, route } from "@/lib/bff";

export const GET = (req: Request, ctx: { params: Promise<{ pin: string }> }) =>
  route(async () =>
    api(`/serviceability/${encodeURIComponent((await ctx.params).pin)}`),
  )(req);
