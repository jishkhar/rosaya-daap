/** Catalogue view-model shared by server and client code. Data comes from the ERP store API (see lib/store.ts); prices are in rupees. */

export type Variant = {
  id: string;
  name: string;
  size?: string;
  colour?: string;
  price: number;
  mrp: number | null;
  inStock: boolean;
  maxQty: number;
  lowStock: boolean;
};

export type Product = {
  id: string;
  /** the variant the quick-add button puts in the bag (the ERP sells variants) */
  variantId: string;
  hasChoices: boolean;
  slug: string;
  title: string;
  category: string;
  categorySlug: string | null;
  price: number;
  mrp: number | null;
  images: string[];
  colors: string[];
  crafts: string[];
  occasions: string[];
  sizes: string[];
  inStock: boolean;
  desc: string;
  date: string;
  variants: Variant[];
  attributes: Record<string, unknown>;
};

/* ---------- listing: filters / sort (URL is the source of truth) ---------- */

export type Filters = {
  price?: [number, number];
  colors: string[];
  crafts: string[];
  inStock: boolean;
  sort: "featured" | "new" | "price-asc" | "price-desc";
};

export const SORTS: { value: Filters["sort"]; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined) =>
  (one(v) ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function parseFilters(sp: Params): Filters {
  const [lo, hi] = (one(sp.price) ?? "").split("-").map(Number);
  const sort = one(sp.sort) as Filters["sort"];
  return {
    price: Number.isFinite(lo) && Number.isFinite(hi) && hi > 0 ? [lo, hi] : undefined,
    colors: list(sp.color),
    crafts: list(sp.craft),
    inStock: one(sp.stock) === "1",
    sort: SORTS.some((s) => s.value === sort) ? sort : "featured",
  };
}

const HEX: Record<string, string> = {
  black: "#1c1c1c", white: "#ffffff", red: "#c0392b", pink: "#e58ca5", blue: "#334fb4",
  green: "#2f7d4f", yellow: "#e8b923", orange: "#e6762b", purple: "#7a4a9c", maroon: "#6d1f2c",
  beige: "#d8c3a5", cream: "#f2e6cf", gold: "#c9a961", grey: "#8a8a8a", gray: "#8a8a8a", brown: "#7a5a3a",
  navy: "#1b2a5c", teal: "#1f7a7a", multi: "linear-gradient(135deg,#e58ca5,#e8b923,#334fb4)",
};
/** Swatch colour for a colour name, whatever its case. */
export const colorHex = (name: string) => HEX[name.toLowerCase()] ?? "#ccc";
export const COLOR_HEX = new Proxy({} as Record<string, string>, { get: (_t, k) => (typeof k === "string" ? HEX[k.toLowerCase()] : undefined) });
