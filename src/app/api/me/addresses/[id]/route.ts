import { api, route } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };
const path = async (ctx: Ctx) =>
  `/me/addresses/${encodeURIComponent((await ctx.params).id)}`;

export const PUT = (req: Request, ctx: Ctx) =>
  route(
    async ({ token, body }) =>
      api(await path(ctx), { method: "PUT", body, token }),
    { write: true },
  )(req);
export const DELETE = (req: Request, ctx: Ctx) =>
  route(
    async ({ token }) => api(await path(ctx), { method: "DELETE", token }),
    { write: true },
  )(req);
