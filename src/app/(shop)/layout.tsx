import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getStoreCollections } from "@/lib/store";
import { Suspense } from "react";

// Every page in this group reads the live catalogue from the ERP, so none of them can be built ahead of time: a build (CI, Vercel)
// has no ERP to talk to, and baking one moment's stock and prices into static HTML would be wrong anyway. Data is cached per fetch
// (see lib/store.ts), so rendering on request is cheap.
export const dynamic = "force-dynamic";

async function StoreHeader() {
  const collections = await getStoreCollections().catch(() => []);
  return <Header collections={collections} />;
}

async function StoreFooter() {
  const collections = await getStoreCollections().catch(() => []);
  return <Footer collections={collections} />;
}

/** Render the page immediately; catalogue decoration must not block the bag or account pages. */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only z-[100] bg-ink px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-2 focus:top-2">Skip to content</a>
      <AnnouncementBar />
      <Suspense fallback={<Header collections={[]} />}>
        <StoreHeader />
      </Suspense>
      <main id="main">{children}</main>
      <Suspense fallback={<Footer collections={[]} />}>
        <StoreFooter />
      </Suspense>
    </>
  );
}
