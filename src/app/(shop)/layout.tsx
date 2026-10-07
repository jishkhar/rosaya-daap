import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { collectionCovers } from "@/lib/store";

/** Storefront chrome (announcement bar, header, footer). Checkout lives outside this group and is distraction-free. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const covers = await collectionCovers();
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
