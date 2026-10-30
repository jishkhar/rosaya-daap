import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getCatalogue, listProducts, getStoreCollections } from "@/lib/store";

// Rendered on request (the catalogue lives in the ERP, which a build cannot reach); the product fetches below are cached for an hour.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = await siteUrl();
  const statics = [
    "",
    "/shop",
    "/collections",
    "/collections/new-arrivals",
    "/about",
    "/contact",
    "/help/shipping",
    "/help/returns",
    "/privacy",
    "/terms",
  ].map((p) => ({ url: `${base}${p}`, lastModified: now }));
  const cols: MetadataRoute.Sitemap = [];
  const products: MetadataRoute.Sitemap = [];
  try {
    (await getCatalogue()).forEach((c) =>
      cols.push({ url: `${base}/collections/${c.slug}`, lastModified: now }),
    );
    const custom = await getStoreCollections();
    custom.forEach((c) =>
      cols.push({
        url: `${base}/collections/${c.slug}`,
        lastModified: new Date(c.updated_at),
      }),
    );
  } catch {
    // The ERP being unreachable leaves the static pages (and whatever collections were read before the failure).
  }
  try {
    for (let offset = 0; offset < 5000; offset += 100) {
      const page = await listProducts({ limit: 100, offset, revalidate: 3600 });
      page.items.forEach((p) =>
        products.push({
          url: `${base}/products/${p.slug}`,
          lastModified: new Date(p.date),
        }),
      );
      if (offset + 100 >= page.total) break;
    }
  } catch {
    // The catalogue being unreachable must not break the sitemap's static part.
  }
  return [...statics, ...cols, ...products];
}
