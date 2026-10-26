import "server-only";
import { cache } from "react";
import {
  collectionCovers,
  getCatalogue,
  getStoreCollections,
  listProducts,
  NEW_ARRIVALS,
  scopeOf,
} from "@/lib/store";
import type { Values } from "@/themes/schema";
import { collectionTiles, type TileChoice } from "./data";

const catalogue = cache(async () => {
  const [standard, custom, covers] = await Promise.all([
    getCatalogue(true),
    getStoreCollections(),
    collectionCovers(true).catch((): Record<string, string> => ({})),
  ]);
  return {
    standard,
    choices: [
      ...standard.map((c) => ({
        slug: c.slug,
        name: c.name,
        kind: c.kind,
        image: covers[c.slug],
      })),
      ...custom.map((c) => ({
        slug: c.slug,
        name: c.name,
        kind: "collection" as const,
        image: c.image_url,
      })),
    ],
    covers,
    custom,
  };
});

export async function loadTiles(
  settings: Values,
  kind: "category" | "craft" | "occasion" | "collection" = "category",
) {
  if (
    settings.source === "selected" &&
    !(settings.items as TileChoice[]).length
  )
    return [];
  const { choices, covers } = await catalogue();
  const items =
    settings.source === "selected"
      ? (settings.items as TileChoice[])
      : choices
          .filter((c) => c.kind === kind)
          .slice(0, (settings.limit as number) || 8)
          .map((c) => ({ collection: c.slug }));
  return collectionTiles(items, choices, covers);
}

type Slide = {
  collection: string;
  image: string;
  alt: string;
  href: string;
  label: string;
};
export async function loadSlides(settings: Values) {
  const slides = settings.slides as Slide[];
  return Promise.all(
    slides.map(async (slide) => {
      if (slide.image) return slide;
      let scope = NEW_ARRIVALS;
      if (slide.collection) {
        const { standard, custom } = await catalogue();
        const selected = standard.find((c) => c.slug === slide.collection);
        const selection = custom.find((c) => c.slug === slide.collection);
        if (!selected && !selection)
          return { ...slide, image: "/placeholder.svg" };
        scope = selection ? { collectionId: selection.id } : scopeOf(selected!);
      }
      const products = await listProducts({
        scope,
        searchParams: { stock: "1" },
        limit: 12,
        revalidate: 60,
      });
      return {
        ...slide,
        image: products.items[0]?.images[0] || "/placeholder.svg",
      };
    }),
  );
}
