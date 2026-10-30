import { api, route } from "@/lib/bff";

type Ctx = { params: Promise<{ id: string }> };

/** Pay (again) the difference of an exchange the shopper asked for: {mode: "gateway", url} to pay on the hosted page, "paid" once covered. */
export const POST = (req: Request, ctx: Ctx) =>
  route(
    async ({ token }) =>
      api(
        `/me/returns/${encodeURIComponent((await ctx.params).id)}/pay-difference`,
        { method: "POST", token },
      ),
    { write: true },
  )(req);
