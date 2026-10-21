import { AnnouncementBar } from "@/themes/heritage/layout/AnnouncementBar";
import { Footer } from "@/themes/heritage/layout/Footer";
import { Header } from "@/themes/heritage/layout/Header";
import defaults from "@/themes/heritage/defaults.json";
import { schema } from "@/themes/heritage/schema";
import { categoryCircles, crafts, featuredCollections, hero, newsletter, occasions, productRail, promise } from "@/themes/heritage/sections/home";
import type { Theme } from "@/themes/types";

/** Heritage: warm sand, gold and ink, arches and serif headings. The original Rosaya look. */
export const heritage: Theme = {
  key: "heritage",
  name: "Heritage",
  schema,
  defaults,
  AnnouncementBar,
  Header,
  Footer,
  sections: {
    hero,
    "featured-collections": featuredCollections,
    "product-rail": productRail,
    "category-circles": categoryCircles,
    occasions,
    crafts,
    promise,
    newsletter,
  },
};
