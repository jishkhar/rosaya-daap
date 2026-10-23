import "server-only";
import { cache } from "react";
import { api } from "@/lib/api";
import { NO_POLICIES, type Policies } from "@/lib/policies";
import { parseFilters, type Product, type Variant } from "@/lib/catalog";

/* ---------- API shapes (money in paise) ---------- */
type ApiVariant = {
  id: string;
  sku: string;
  name: string;
  price_minor: number;
  mrp_minor: number | null;
  attributes: { size?: string; colour?: string };
  in_stock: boolean;
  max_qty: number;
  low_stock: boolean;
};
type ApiProduct = {
  id: string;
  slug: string;
  title: string;
  variant_id: string | null;
  variant_count: number;
  category: { slug: string; name: string } | null;
  price_minor: number;
  mrp_minor: number | null;
  images: string[];
  colours: string[];
  crafts: string[];
  occasions: string[];
  sizes: string[];
  in_stock: boolean;
  created_at: string;
  description?: string;
  attributes?: Record<string, unknown>;
  variants?: ApiVariant[];
};
type ApiFacet = { value: string; n: number };
type ApiList = {
  items: ApiProduct[];
  total: number;
  facets?: {
    colours: ApiFacet[];
    crafts: ApiFacet[];
    occasions: ApiFacet[];
    price_min_minor: number | null;
    price_max_minor: number | null;
  };
};

const rupees = (minor: number) => minor / 100;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function toProduct(a: ApiProduct): Product {
  const variants: Variant[] = (a.variants ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    size: v.attributes.size,
    colour: v.attributes.colour ? cap(v.attributes.colour) : undefined,
    price: rupees(v.price_minor),
    mrp: v.mrp_minor ? rupees(v.mrp_minor) : null,
    inStock: v.in_stock,
    maxQty: v.max_qty,
    lowStock: v.low_stock,
  }));
  return {
    id: a.id,
    variantId: a.variant_id ?? "",
    hasChoices: a.variant_count > 1,
    slug: a.slug,
    title: a.title,
    category: a.category?.name ?? "",
    categorySlug: a.category?.slug ?? null,
    price: rupees(a.price_minor),
    mrp:
      a.mrp_minor && a.mrp_minor > a.price_minor ? rupees(a.mrp_minor) : null,
    images: a.images.length ? a.images : ["/placeholder.svg"],
    colors: a.colours.map(cap),
    crafts: a.crafts.map(cap),
    occasions: a.occasions.map(cap),
    sizes: a.sizes,
    inStock: a.in_stock,
    desc: a.description ?? "",
    date: a.created_at,
    variants,
    attributes: a.attributes ?? {},
  };
}

/* ---------- queries ---------- */
export type Scope = {
  collectionId?: string;
  category?: string;
  craft?: string;
  occasion?: string;
  q?: string;
  sort?: string;
};
export type Facets = {
  colors: ApiFacet[];
  crafts: ApiFacet[];
  min: number;
  max: number;
};

function query(params: Record<string, string | number | boolean | undefined>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(
    ([k, v]) =>
      v !== undefined && v !== "" && v !== false && p.set(k, String(v)),
  );
  return p.toString();
}

export async function listProducts(opts: {
  scope?: Scope;
  searchParams?: Record<string, string | string[] | undefined>;
  limit?: number;
  offset?: number;
  facets?: boolean;
  revalidate?: number;
}): Promise<{ items: Product[]; total: number; facets: Facets }> {
  const {
    scope = {},
    searchParams = {},
    limit = 24,
    offset = 0,
    facets = false,
    revalidate,
  } = opts;
  const f = parseFilters(searchParams);
  const qs = query({
    collection_id: scope.collectionId,
    category: scope.category,
    in_craft: scope.craft,
    in_occasion: scope.occasion,
    q: scope.q,
    colour: f.colors.join(","),
    craft: f.crafts.join(","),
    min_price: f.price ? Math.round(f.price[0] * 100) : undefined,
    max_price: f.price ? Math.round(f.price[1] * 100) : undefined,
    in_stock: f.inStock,
    sort: scope.sort && f.sort === "featured" ? scope.sort : f.sort,
    limit,
    offset,
    facets,
  });
  const r = await api<ApiList>(`/products?${qs}`, { revalidate });
  const fc = r.facets;
  return {
    items: r.items.map(toProduct),
    total: r.total,
    facets: {
      colors: (fc?.colours ?? []).map((c) => ({ value: cap(c.value), n: c.n })),
      crafts: (fc?.crafts ?? []).map((c) => ({ value: cap(c.value), n: c.n })),
      min:
        fc?.price_min_minor != null
          ? Math.floor(rupees(fc.price_min_minor) / 100) * 100
          : 0,
      max:
        fc?.price_max_minor != null
          ? Math.ceil(rupees(fc.price_max_minor) / 100) * 100
          : 0,
    },
  };
}

/** Where a storefront collection draws its products from. */
export function scopeOf(c: Collection): Scope {
  return c.kind === "category"
    ? { category: c.slug }
    : c.kind === "craft"
      ? { craft: c.slug }
      : { occasion: c.slug };
}

export const NEW_ARRIVALS: Scope = { sort: "new" };

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    return toProduct(
      await api<ApiProduct>(`/products/${encodeURIComponent(slug)}`, {
        revalidate: 30,
      }),
    );
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

export type StoreCollection = {
  show_in_header: boolean;
  header_order: number;
  header_dropdown: boolean;
  dropdown_collections: { id: string; slug: string; name: string }[];
  id: string;
  slug: string;
  name: string;
  blurb: string;
  image_url: string | null;
  product_count: number;
  updated_at: string;
};

/** ERP selections stay live: collection metadata is never cached across requests. */
export async function getStoreCollections(): Promise<StoreCollection[]> {
  return (
    (await api<{ custom?: StoreCollection[] }>("/collections")).custom ?? []
  );
}

export async function getStoreCollection(
  id: string,
): Promise<StoreCollection | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  try {
    return await api<StoreCollection>(`/collections/${id}`);
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null;
    throw error;
  }
}

/** Other products from the same category, newest first. */
export async function related(p: Product, n = 8): Promise<Product[]> {
  const r = await listProducts({
    scope: { category: p.categorySlug ?? undefined },
    limit: n + 1,
    revalidate: 60,
  });
  return r.items.filter((x) => x.id !== p.id).slice(0, n);
}

/** The shop's written policies, sanitized HTML from the ERP; "" = not written (lib/policies.ts says where each is shown). */
export const getPolicies = cache((): Promise<Policies> =>
  api<Policies>("/policies", { revalidate: 60 }).catch(() => NO_POLICIES),
);

/** A storefront collection page (/c/<slug>): one of the shop's categories, or a craft / occasion value found on its products. */
export type Collection = {
  slug: string;
  name: string;
  kind: "category" | "craft" | "occasion";
  blurb: string;
  count: number;
};

type ApiCollections = {
  categories: {
    slug: string;
    name: string;
    blurb: string | null;
    product_count: number;
  }[];
  crafts: { slug: string; product_count: number }[];
  occasions: { slug: string; product_count: number }[];
};

const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const titleOf = (slug: string) => slug.split("-").map(cap).join(" ");

/** This shop's collections, from its own catalogue (once per request; the API answer is cached a minute). A slug used twice keeps
 * the first: categories, then crafts, then occasions. Values that are not URL-safe slugs get no page (they still work as filters). */
export const getCatalogue = cache(async (): Promise<Collection[]> => {
  const c = await api<ApiCollections>("/collections", { revalidate: 60 });
  const all: Collection[] = [
    ...c.categories.map((x) => ({
      slug: x.slug,
      name: x.name,
      kind: "category" as const,
      blurb: x.blurb ?? "",
      count: x.product_count,
    })),
    ...c.crafts.map((x) => ({
      slug: x.slug,
      name: titleOf(x.slug),
      kind: "craft" as const,
      blurb: "",
      count: x.product_count,
    })),
    ...c.occasions.map((x) => ({
      slug: x.slug,
      name: titleOf(x.slug),
      kind: "occasion" as const,
      blurb: "",
      count: x.product_count,
    })),
  ];
  const seen = new Set<string>();
  return all.filter(
    (x) => SLUG.test(x.slug) && !seen.has(x.slug) && !!seen.add(x.slug),
  );
});

export async function getCollection(
  slug: string,
): Promise<Collection | undefined> {
  return (await getCatalogue()).find((c) => c.slug === slug);
}

/**
 * One cover image per collection. Walks collections in order and prefers a photo no earlier tile has used,
 * so tiles on the landing page and in the mega-menu don't repeat the same picture.
 */
export async function collectionCovers(): Promise<Record<string, string>> {
  const [catalogue, all] = await Promise.all([
    getCatalogue(),
    api<
      Record<"categories" | "crafts" | "occasions", Record<string, string[]>>
    >("/collections/covers", { revalidate: 300 }),
  ]);
  const kinds = {
    category: all.categories,
    craft: all.crafts,
    occasion: all.occasions,
  } as const;
  const used = new Set<string>();
  const out: Record<string, string> = {};
  catalogue.forEach((c) => {
    const list = kinds[c.kind]?.[c.slug] ?? [];
    const pick = list.find((img) => !used.has(img)) ?? list[0];
    if (pick) {
      used.add(pick);
      out[c.slug] = pick;
    }
  });
  return out;
}

/** A handful of in-stock, visually different products (the API returns near-duplicates of one design together). */
export function distinct(list: Product[], n: number) {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of list) {
    const k = p.title.toLowerCase().split(/\s+/).slice(0, 2).join(" ");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
    if (out.length === n) break;
  }
  return out;
}

/** Round-robin across categories so rails don't show ten near-identical items in a row. */
export function diverse(list: Product[]) {
  const groups = new Map<string, Product[]>();
  list.forEach((p) =>
    groups.set(p.category, [...(groups.get(p.category) ?? []), p]),
  );
  const out: Product[] = [];
  for (let i = 0; out.length < list.length; i++)
    groups.forEach((g) => g[i] && out.push(g[i]));
  return out;
}
