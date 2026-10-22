import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CollectionTiles } from "@/components/home/CollectionTiles";
import { getStoreCollections } from "@/lib/store";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Discover our curated edits for occasions, celebrations and everyday moments.",
};

export default async function CollectionsPage() {
  const collections = await getStoreCollections();
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-12 sm:px-6">
      <div className="py-6">
        <Breadcrumb
          trail={[{ label: "Home", href: "/" }, { label: "Collections" }]}
        />
      </div>
      <header className="mb-10 rounded-3xl bg-sand px-6 py-12 text-center">
        <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-taupe-dark">
          Thoughtfully brought together
        </p>
        <h1 className="font-heading text-4xl font-medium sm:text-5xl">
          Our collections
        </h1>
        <span className="mx-auto mt-4 block h-px w-12 bg-gold" aria-hidden />
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">
          Handpicked pieces for every occasion, mood and moment.
        </p>
      </header>
      {collections.length ? (
        <CollectionTiles collections={collections} />
      ) : (
        <div className="py-16 text-center">
          <p className="font-heading text-2xl">
            New collections are on their way
          </p>
          <p className="mt-3 text-ink-soft">
            Explore our latest pieces while we put together something special.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm text-cream"
          >
            Shop all pieces
          </Link>
        </div>
      )}
    </div>
  );
}
