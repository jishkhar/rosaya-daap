import { api, route } from "@/lib/bff";

/** Do we deliver to this pincode; `variant_id` and `quantity` (a product page) also ask whether that item can reach it. */
export const GET = (req: Request, ctx: { params: Promise<{ pin: string }> }) =>
  route(async () => {
    const pin = encodeURIComponent((await ctx.params).pin);
    const asked = new URL(req.url).searchParams;
    const item = new URLSearchParams();
    for (const k of ["variant_id", "quantity"]) {
      const v = asked.get(k);
      if (v) item.set(k, v);
    }
    return api(`/serviceability/${pin}${item.size ? `?${item}` : ""}`);
  })(req);
