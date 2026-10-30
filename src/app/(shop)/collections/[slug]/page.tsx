import Image from "next/image";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Listing } from "@/components/product/Listing";
import {
  NEW_ARRIVALS,
  scopeOf,
  getCollection,
  getStoreCollection,
  getStoreCollections,
} from "@/lib/store";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const NEW = {
  slug: "new-arrivals",
  name: "New Arrivals",
  blurb: "The newest additions to the store.",
};

const resolve = async (slug: string) => {
  if (/^collection-[0-9a-f-]{36}$/i.test(slug)) {
    const c = await getStoreCollection(slug.slice("collection-".length));
    return c
      ? { ...c, kind: "custom" as const, scope: { collectionId: c.id } }
      : null;
  }
  if (slug === NEW.slug)
    return { ...NEW, kind: "special" as const, scope: NEW_ARRIVALS };
  const custom = (await getStoreCollections()).find((c) => c.slug === slug);
  if (custom)
    return {
      ...custom,
      kind: "custom" as const,
      scope: { collectionId: custom.id },
    };
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
  const filters = await searchParams;
  if (slug !== c.slug) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      for (const entry of Array.isArray(value) ? value : value ? [value] : [])
        query.append(key, entry);
    }
    permanentRedirect(`/collections/${c.slug}${query.size ? `?${query}` : ""}`);
  }
  const image = c.kind === "custom" ? c.image_url : null;
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-6 sm:px-6">
      <div className="py-6">
        <Breadcrumb
          trail={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: c.name },
          ]}
        />
      </div>
      <header
        className={`relative isolate mb-8 flex min-h-56 items-center justify-center overflow-hidden rounded-3xl bg-sand px-6 py-10 text-center sm:min-h-80 sm:py-14 ${image ? "text-white" : ""}`}
      >
        {image && (
          <>
            <Image
              unoptimized
              src={image}
              alt=""
              fill
              sizes="(min-width: 1400px) 1352px, 100vw"
              className="scale-110 object-cover blur-sm"
            />
            <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          </>
        )}
        <div className="relative z-10 min-w-0 max-w-full [overflow-wrap:anywhere]">
          {c.kind !== "custom" && (
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">
              {c.kind === "special"
                ? "Just in"
                : {
                    category: "Collection",
                    craft: "Craft",
                    occasion: "Shop by occasion",
                  }[c.kind]}
            </p>
          )}
          <h1 className="font-heading text-4xl font-medium sm:text-5xl">
            {c.name}
          </h1>
          <span className="mx-auto mt-4 block h-px w-12 bg-gold" aria-hidden />
          {c.blurb ? (
            <p
              className={`mx-auto mt-4 max-w-xl ${image ? "text-white/90" : "text-ink-soft"}`}
            >
              {c.blurb}
            </p>
          ) : null}
        </div>
      </header>
      <Listing
        scope={c.scope}
        searchParams={filters}
        basePath={`/collections/${slug}`}
      />
    </div>
  );
}
