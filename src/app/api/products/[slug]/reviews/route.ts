import { api, route } from "@/lib/bff";

type Context = { params: Promise<{ slug: string }> };
export const GET = (req: Request, ctx: Context) =>
  route(async ({ token, req }) => {
    const params = new URL(req.url).searchParams;
    const offset = params.get("offset") ?? "0";
    return api(
      `/products/${encodeURIComponent((await ctx.params).slug)}/reviews?offset=${encodeURIComponent(offset)}`,
      { token },
    );
  })(req);

export const POST = (req: Request, ctx: Context) =>
  route(
    async ({ token, body }) =>
      api(`/products/${encodeURIComponent((await ctx.params).slug)}/reviews`, {
        token,
        body,
        method: "POST",
      }),
    { write: true },
  )(req);
