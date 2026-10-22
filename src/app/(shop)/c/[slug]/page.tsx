import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Listing } from "@/components/product/Listing";
import { NEW_ARRIVALS, scopeOf, getCollection, getStoreCollection } from "@/lib/store";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const NEW = { slug: "new-arrivals", name: "New Arrivals", blurb: "The newest additions to the store." };

const resolve = async (slug: string) => {
  if (slug.startsWith("collection-")) {
    const c = await getStoreCollection(slug.slice("collection-".length));
    return c ? { ...c, kind: "custom" as const, scope: { collectionId: c.id } } : null;
  }
  if (slug === NEW.slug) return { ...NEW, kind: "special" as const, scope: NEW_ARRIVALS };
  const c = await getCollection(slug).catch(() => undefined);
  return c ? { ...c, scope: scopeOf(c) } : null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await resolve((await params).slug);
  return c ? { title: c.name, description: c.blurb || undefined } : {};
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const slug = (await params).slug;
  const c = await resolve(slug);
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6">
      <div className="py-6"><Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: c.name }]} /></div>
      <header className="mb-8 rounded-3xl bg-sand px-6 py-10 text-center sm:py-14">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">{c.kind === "special" ? "Just in" : ({ custom: "Curated collection", category: "Collection", craft: "Craft", occasion: "Shop by occasion" } as const)[c.kind]}</p>
        <h1 className="font-heading text-4xl font-medium sm:text-5xl">{c.name}</h1>
        <span className="mx-auto mt-4 block h-px w-12 bg-gold" aria-hidden />
        {c.blurb ? <p className="mx-auto mt-4 max-w-xl text-ink-soft">{c.blurb}</p> : null}
      </header>
      {c.kind === "custom" && c.image_url && <div className="relative mb-8 h-56 overflow-hidden rounded-3xl bg-sand sm:h-80"><Image unoptimized src={c.image_url} alt={c.name} fill sizes="(min-width: 1400px) 1352px, 100vw" className="object-cover" /></div>}
      <Listing scope={c.scope} searchParams={await searchParams} basePath={`/c/${slug}`} />
    </div>
  );
}
