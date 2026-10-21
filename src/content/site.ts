/**
 * Rosaya's catalogue mapping: storefront collection slugs -> catalogue keys. Catalogue structure, not theme content
 * (header, hero, footer etc. live in the theme config, src/themes/<theme>/defaults.json).
 */
export type Collection = {
  slug: string;
  name: string;
  kind: "category" | "craft" | "occasion";
  /** catalogue collection keys this storefront collection draws products from */
  keys: string[];
  blurb: string;
};

export const collections: Collection[] = [
  { slug: "sarees", name: "Sarees", kind: "category", keys: ["saree"], blurb: "Handloom silks, hand-block prints and heirloom drapes." },
  { slug: "kurtis", name: "Kurtis", kind: "category", keys: ["kurti"], blurb: "Everyday kurtis with festive hearts." },
  { slug: "lehengas", name: "Lehengas", kind: "category", keys: ["lehenga"], blurb: "Statement lehengas for the big days." },
  { slug: "blouses", name: "Blouses", kind: "category", keys: ["blouse"], blurb: "Designer blouses that finish the look." },
  { slug: "suits", name: "Suits", kind: "category", keys: ["suits"], blurb: "Co-ord and suit sets, ready to wear." },
  { slug: "dresses", name: "Dresses", kind: "category", keys: ["dresses"], blurb: "Indo-western dresses with handcrafted detail." },
  { slug: "dupattas", name: "Dupattas", kind: "category", keys: ["duppatta"], blurb: "Bandhani, gajji silk and more." },
  { slug: "bridal", name: "Bridal", kind: "category", keys: ["bridal"], blurb: "Rooted & regal — for the bride." },
  { slug: "garba", name: "Garba Collection", kind: "category", keys: ["garba-collection"], blurb: "Twirl-ready outfits for Navratri nights." },

  { slug: "kalamkari", name: "Kalamkari", kind: "craft", keys: ["kalamkari"], blurb: "Hand-painted storytelling from Andhra." },
  { slug: "ajrakh", name: "Ajrakh", kind: "craft", keys: ["ajrakh"], blurb: "Centuries-old resist block-printing from Kutch." },
  { slug: "bandhani", name: "Bandhani", kind: "craft", keys: ["bandhani"], blurb: "Tie-dyed dots of Gujarat and Rajasthan, knotted one by one." },
  { slug: "madhubani", name: "Madhubani", kind: "craft", keys: ["madhubani"], blurb: "Folk art of Mithila, painted by hand." },


  { slug: "wedding", name: "Wedding", kind: "occasion", keys: ["lehenga", "saree", "bridal"], blurb: "Dress for the main event." },
  { slug: "reception", name: "Reception", kind: "occasion", keys: ["saree", "lehenga"], blurb: "Evening elegance." },
  { slug: "haldi", name: "Haldi", kind: "occasion", keys: ["suits", "kurti", "duppatta"], blurb: "Sunny, easy, photograph-ready." },
  { slug: "cocktail", name: "Cocktail", kind: "occasion", keys: ["dresses", "saree"], blurb: "After-dark glamour." },
  { slug: "engagement", name: "Engagement", kind: "occasion", keys: ["lehenga", "suits"], blurb: "Say yes in style." },
];

export const getCollection = (slug: string) => collections.find((c) => c.slug === slug);
export const byKind = (kind: Collection["kind"]) => collections.filter((c) => c.kind === kind);
