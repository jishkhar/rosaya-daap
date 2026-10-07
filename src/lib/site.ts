/** Public site identity. SITE_URL is the canonical origin used in the sitemap, robots and share previews. */
export const site = {
  url: (process.env.SITE_URL ?? "http://localhost:3001").replace(/\/$/, ""),
  name: "Rosaya Fashions",
};
