import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { collectionCovers } from "@/lib/store";

// Every page in this group reads the live catalogue from the ERP, so none of them can be built ahead of time: a build (CI, Vercel)
// has no ERP to talk to, and baking one moment's stock and prices into static HTML would be wrong anyway. Data is cached per fetch
// (see lib/store.ts), so rendering on request is cheap.
export const dynamic = "force-dynamic";

/** Storefront chrome (announcement bar, header, footer). Checkout lives outside this group and is distraction-free. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // The header's collection pictures are decoration: if the ERP is briefly unreachable, show the page without them rather than an error.
  const covers = await collectionCovers().catch(() => ({}) as Record<string, string>);
  return (
    <>
      <a href="#main" className="sr-only z-[100] bg-ink px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-2 focus:top-2">Skip to content</a>
      <AnnouncementBar />
      <Header covers={covers} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
