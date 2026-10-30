import { api, route } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };

/** What a replacement costs against the items going back (nothing is written). */
export const POST = (req: Request, ctx: Ctx) =>
  route(
    async ({ token, body }) =>
      api(
        `/me/orders/${encodeURIComponent((await ctx.params).id)}/exchange-quote`,
        { method: "POST", body, token },
      ),
    { write: true },
  )(req);
