import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Listing } from "@/components/product/Listing";

export const metadata: Metadata = { title: "Shop All" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6">
      <div className="py-6"><Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Shop" }]} /></div>
      <header className="mb-8 rounded-3xl bg-sand px-6 py-10 text-center sm:py-14">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">The full collection</p>
        <h1 className="font-heading text-4xl font-medium sm:text-5xl">Shop All</h1>
        <span className="mx-auto mt-4 block h-px w-12 bg-gold" aria-hidden />
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">Every handcrafted piece, in one place.</p>
      </header>
      <Listing scope={{}} searchParams={await searchParams} basePath="/shop" />
    </div>
  );
}
