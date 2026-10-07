import { api, route } from "@/lib/bff";

type Hit = { slug: string; title: string; price_minor: number; mrp_minor: number | null; image: string | null };

// Instant-search suggestions from the ERP store API.
export const GET = route(async ({ req }) => {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return { products: [], collections: [], total: 0 };
  const r = await api<{ total: number; products: Hit[]; collections: { slug: string; name: string }[] }>(`/search?q=${encodeURIComponent(q)}&limit=6`);
  return {
    total: r.total,
    products: r.products.map((p) => ({ slug: p.slug, title: p.title, price: p.price_minor / 100, mrp: p.mrp_minor ? p.mrp_minor / 100 : null, image: p.image ?? "/placeholder.svg" })),
    collections: r.collections,
  };
});
