import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Listing } from "@/components/product/Listing";
import { collections, getCollection } from "@/content/site";
import { NEW_ARRIVALS, scopeOf } from "@/lib/store";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const NEW = { slug: "new-arrivals", name: "New Arrivals", blurb: "The latest in handcrafted ethnic wear, fresh from our studio." };

const resolve = (slug: string) => {
  if (slug === NEW.slug) return { ...NEW, kind: "special" as const, scope: NEW_ARRIVALS };
  const c = getCollection(slug);
  return c ? { ...c, scope: scopeOf(c) } : null;
};

export function generateStaticParams() {
  return [...collections.map((c) => ({ slug: c.slug })), { slug: NEW.slug }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = resolve((await params).slug);
  return c ? { title: c.name, description: c.blurb } : {};
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const slug = (await params).slug;
  const c = resolve(slug);
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6">
      <div className="py-6"><Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: c.name }]} /></div>
      <header className="mb-8 rounded-3xl bg-sand px-6 py-10 text-center sm:py-14">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">{c.kind === "special" ? "Just in" : ({ category: "Collection", craft: "Handcrafted tradition", occasion: "Shop by occasion" } as const)[c.kind]}</p>
        <h1 className="font-heading text-4xl font-medium sm:text-5xl">{c.name}</h1>
        <span className="mx-auto mt-4 block h-px w-12 bg-gold" aria-hidden />
        <p className="mx-auto mt-4 max-w-xl text-ink-soft">{c.blurb}</p>
      </header>
      <Listing scope={c.scope} searchParams={await searchParams} basePath={`/c/${slug}`} />
    </div>
  );
}
