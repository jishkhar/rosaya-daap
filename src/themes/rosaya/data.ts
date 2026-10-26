/** Pure mapping shared by section loaders and their tests. No tenant content lives in the theme. */
export type CollectionChoice = {
  slug: string;
  name: string;
  image?: string | null;
  id?: string;
  kind?: "category" | "craft" | "occasion" | "collection";
};
export type TileChoice = { collection: string };
export type Tile = { label: string; image: string; href: string };

export function collectionTiles(
  items: TileChoice[],
  catalogue: CollectionChoice[],
  covers: Record<string, string>,
): Tile[] {
  return items.flatMap((item) => {
    const collection = catalogue.find((c) => c.slug === item.collection);
    if (!collection) return [];
    return [
      {
        label: collection.name,
        image:
          collection.image || covers[collection.slug] || "/placeholder.svg",
        href: `/c/${collection.slug}`,
      },
    ];
  });
}

export type NavigationCollection = {
  slug: string;
  name: string;
  show_in_header: boolean;
  header_order: number;
  header_dropdown: boolean;
  dropdown_collections: { slug: string; name: string }[];
};
export function headerMenu(collections: NavigationCollection[], limit: number) {
  return collections
    .filter((c) => c.show_in_header)
    .sort((a, b) => a.header_order - b.header_order)
    .slice(0, limit)
    .map((c) => ({
      label: c.name,
      href: `/c/${c.slug}`,
      children: c.header_dropdown
        ? c.dropdown_collections.map((child) => ({
            label: child.name,
            href: `/c/${child.slug}`,
          }))
        : [],
    }));
}
