import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Listing } from "@/components/product/Listing";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6">
      <div className="py-6"><Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Search" }]} /></div>
      <h1 className="mb-8 font-heading text-3xl font-medium sm:text-4xl">
        {q ? <>Results for “{q}”</> : "Search"}
      </h1>
      {q ? <Listing scope={{ q }} searchParams={sp} basePath="/search" /> : <p className="py-16 text-center text-ink-soft">Type something in the search box to find sarees, crafts and colours.</p>}
    </div>
  );
}
