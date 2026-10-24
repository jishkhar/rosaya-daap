import { NextResponse } from "next/server";
import { api, route } from "@/lib/bff";

/** City, state and area names for a pincode. The same for every shop and fixed between directory imports, so the browser may keep it. */
export const GET = (req: Request, ctx: { params: Promise<{ pin: string }> }) =>
  route(async () => {
    const place = await api(
      `/pincodes/${encodeURIComponent((await ctx.params).pin)}`,
    );
    return NextResponse.json(place, {
      headers: { "Cache-Control": "private, max-age=86400" },
    });
  })(req);
