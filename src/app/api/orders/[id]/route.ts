import { api, route } from "@/lib/bff";

export const GET = (req: Request, ctx: { params: Promise<{ id: string }> }) =>
  route(async ({ token }) => api(`/orders/${encodeURIComponent((await ctx.params).id)}`, { token }))(req);
