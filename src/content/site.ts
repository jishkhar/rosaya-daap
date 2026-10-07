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

export const nav = {
  women: ["sarees", "kurtis", "lehengas", "blouses", "suits", "dresses", "bridal"],
  accessories: ["dupattas"],
};

export const valueProps = [
  {
    icon: "truck",
    stat: "90%",
    statLabel: "ready to ship",
    title: "Ready To Ship",
    text: "Most pieces leave our studio within 24 hours and reach you in 5–6 business days.",
    points: ["Dispatched in 24 hours", "Free shipping on every order"],
    href: "/help/shipping",
  },
  {
    icon: "badge",
    stat: "100%",
    statLabel: "original quality",
    title: "Original Quality",
    text: "Authentic handcrafted textiles, made by real artisans and checked by hand.",
    points: ["Made by real artisans", "Every piece quality-checked"],
    href: "/about",
  },
  {
    icon: "tag",
    stat: "Best",
    statLabel: "price challenge",
    title: "Price Challenge",
    text: "Found it cheaper elsewhere? Tell us — we'll make it right.",
    points: ["Fair, transparent pricing", "Easy 7-day exchange"],
    href: "/help/returns",
  },
] as const;

export const announcements = [
  "Free shipping on every order",
  "90% of styles ready to ship · delivery in 5–6 business days",
  "Use code ROSAYA10 for 10% off your first order",
];

export const heroSlides = [
  {
    eyebrow: "Navratri is here",
    title: "Garba Nights",
    text: "Twirl-ready chaniya cholis, mirror-work and bandhani in every colour of the festival.",
    cta: { label: "Shop Garba", href: "/c/garba" },
    cta2: { label: "New Arrivals", href: "/c/new-arrivals" },
    collection: "garba",
  },
  {
    eyebrow: "Celebrate the beauty of handmade heritage",
    title: "Rooted & Regal",
    text: "Silks, hand-block prints and bridal heirlooms — made by real hands, meant for real stories.",
    cta: { label: "Shop Sarees", href: "/c/sarees" },
    cta2: { label: "Bridal Edit", href: "/c/bridal" },
    collection: "sarees",
  },
  {
    eyebrow: "Wedding season",
    title: "Lehengas, Reimagined",
    text: "Statement lehengas with heirloom craft — dressed for the big day and every ceremony around it.",
    cta: { label: "Shop Lehengas", href: "/c/lehengas" },
    cta2: { label: "By Occasion", href: "/c/wedding" },
    collection: "lehengas",
  },
] as const;
