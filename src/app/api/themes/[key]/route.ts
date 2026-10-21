import { NextResponse } from "next/server";
import { collections } from "@/content/site";
import { themes } from "@/themes/registry";

/**
 * A theme's editable schema and starting content, for the portal's theme editor (this app is the single source of both). Public design
 * data, no tenant settings, so any origin may read it. `collections` lists the collection slugs this storefront knows, for the pickers.
 */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Cache-Control": "public, max-age=300" };

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const theme = themes[(await params).key];
  if (!theme) return NextResponse.json({ error: { code: "not_found", message: "No such theme." } }, { status: 404, headers: CORS });
  return NextResponse.json(
    { key: theme.key, name: theme.name, schema: theme.schema, defaults: theme.defaults, collections: collections.map((c) => ({ slug: c.slug, name: c.name, kind: c.kind })) },
    { headers: CORS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
