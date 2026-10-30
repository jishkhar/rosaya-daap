import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Tag, Truck } from "lucide-react";
import { CollectionTiles } from "@/components/home/CollectionTiles";
import { ProductRail } from "@/components/home/ProductRail";
import { Section } from "@/components/home/Section";
import type { Product } from "@/lib/catalog";
import {
  collectionCovers,
  getCatalogue,
  getCollection,
  getStoreCollections,
  distinct,
  diverse,
  listProducts,
  NEW_ARRIVALS,
  scopeOf,
  type Collection,
  type StoreCollection,
} from "@/lib/store";
import { Newsletter } from "@/themes/heritage/layout/Newsletter";
import {
  Hero,
  type HeroImages,
  type HeroSlide,
} from "@/themes/heritage/sections/Hero";
import type { Values } from "@/themes/schema";
import type { SectionDef } from "@/themes/types";

const ICONS = { truck: Truck, badge: BadgeCheck, tag: Tag };

const IN_STOCK = { stock: "1" };
const peek = async (slug: string, n: number) => {
  const c = await getCollection(slug);
  return c
    ? listProducts({
        scope: scopeOf(c),
        searchParams: IN_STOCK,
        limit: 24,
        revalidate: 60,
      }).then((r) => distinct(r.items, n))
    : [];
};
const newest = () =>
  listProducts({
    scope: NEW_ARRIVALS,
    searchParams: IN_STOCK,
    limit: 40,
    revalidate: 60,
  }).then((r) => diverse(r.items).slice(0, 10));

// Settings arrive validated (resolveConfig), so every schema key is present with its declared type.
const str = (s: Values, key: string) => s[key] as string;
const opt = (s: Values, key: string) => (s[key] as string) || undefined;
type Covers = { list: Collection[]; covers: Record<string, string> };
const coverOf = (d: Covers, slug: string) =>
  d.covers[slug] ?? "/placeholder.svg";

const slidesOf = (s: Values) => s.slides as HeroSlide[];

export const hero: SectionDef<HeroImages> = {
  async load(s) {
    const slides = slidesOf(s);
    // a slide without a collection shows the newest products (a new shop has no collections chosen yet)
    const picks = await Promise.all(
      slides.map((slide) =>
        slide.collection
          ? peek(slide.collection, 3)
          : newest().then((items) => items.slice(0, 3)),
      ),
    );
    return Object.fromEntries(
      slides.map((slide, i) => [
        slide.collection,
        picks[i].map((p) => p.images[0]),
      ]),
    );
  },
  Component: ({ settings, data }) => {
    const slides = slidesOf(settings);
    if (!slides.length) return null;
    const badges = (settings.badges as { text: string }[])
      .map((b) => b.text)
      .filter(Boolean);
    return <Hero slides={slides} badges={badges} images={data ?? {}} />;
  },
};

export const featuredCollections: SectionDef<StoreCollection[]> = {
  load: () => getStoreCollections(),
  Component: ({ settings, data }) =>
    data && data.length > 0 ? (
      <Section
        eyebrow={opt(settings, "eyebrow")}
        title={str(settings, "title")}
        href={opt(settings, "href")}
      >
        <CollectionTiles
          collections={data.slice(0, settings.limit as number)}
        />
      </Section>
    ) : null,
};

/** `source: "new"` = newest in stock; `"value"` = cheapest in stock, minus anything the new-arrivals rail already shows. */
export const productRail: SectionDef<Product[]> = {
  async load(s) {
    if (s.source !== "value") return newest();
    const [fresh, cheapest] = await Promise.allSettled([
      newest(),
      listProducts({
        scope: { sort: "price-asc" },
        searchParams: IN_STOCK,
        limit: 60,
        revalidate: 60,
      }),
    ]);
    if (cheapest.status === "rejected") throw cheapest.reason;
    const freshIds = new Set(
      fresh.status === "fulfilled" ? fresh.value.map((p) => p.id) : [],
    );
    return diverse(
      cheapest.value.items.filter((p) => !freshIds.has(p.id)),
    ).slice(0, 10);
  },
  Component: ({ settings, data }) => (
    <Section
      eyebrow={opt(settings, "eyebrow")}
      title={str(settings, "title")}
      href={opt(settings, "href")}
      linkLabel={opt(settings, "link_label")}
    >
      <ProductRail items={data ?? []} />
    </Section>
  ),
};

/** The shop's collections a section points at, in the tenant's order (slugs the shop no longer has are skipped), with cover pictures. */
const loadCovers = async (s: Values): Promise<Covers> => {
  const [catalogue, covers] = await Promise.all([
    getCatalogue(),
    collectionCovers().catch(() => ({})),
  ]);
  const list = (s.collections as string[])
    .map((slug) => catalogue.find((c) => c.slug === slug))
    .filter((c): c is Collection => !!c);
  return { list, covers };
};

export const categoryCircles: SectionDef<Covers> = {
  load: loadCovers,
  Component: ({ settings, data }) => {
    if (!data?.list.length) return null;
    const list = data.list;
    return (
      <Section
        eyebrow={opt(settings, "eyebrow")}
        title={str(settings, "title")}
        href={opt(settings, "href")}
        linkLabel={opt(settings, "link_label")}
      >
        <ul className="grid grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-8">
          {list.map((c) => {
            const n = c.count;
            return (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="group flex flex-col items-center text-center"
                >
                  <span className="relative block aspect-square w-full max-w-[168px] overflow-hidden rounded-full bg-sand ring-1 ring-gold/50 ring-offset-4 ring-offset-cream transition-all duration-300 group-hover:ring-2 group-hover:ring-gold">
                    <Image
                      src={coverOf(data, c.slug)}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 12vw, 22vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </span>
                  <span className="mt-4 font-heading text-sm sm:text-lg">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-ink-soft sm:text-xs">
                    {n} {n === 1 ? "product" : "products"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>
    );
  },
};

export const occasions: SectionDef<Covers> = {
  load: loadCovers,
  Component: ({ settings, data }) => {
    if (!data?.list.length) return null;
    const list = data.list;
    return (
      <Section
        eyebrow={opt(settings, "eyebrow")}
        title={str(settings, "title")}
      >
        <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-5 sm:overflow-visible sm:px-0">
          {list.map((c) => (
            <li key={c.slug} className="w-36 shrink-0 sm:w-auto">
              <Link href={`/collections/${c.slug}`} className="group block text-center">
                <div className="relative mx-auto aspect-[3/4] overflow-hidden rounded-t-[999px] bg-sand ring-1 ring-gold/40 ring-offset-4 ring-offset-cream">
                  <Image
                    src={coverOf(data, c.slug)}
                    alt=""
                    fill
                    sizes="(min-width:640px) 18vw, 150px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 font-heading text-lg">{c.name}</p>
                {c.blurb ? (
                  <p className="text-xs text-ink-soft">{c.blurb}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    );
  },
};

export const crafts: SectionDef<Covers> = {
  load: loadCovers,
  Component: ({ settings, data }) => {
    if (!data?.list.length) return null;
    const list = data.list;
    return (
      <section className="mt-16 bg-ink py-16 text-cream sm:mt-24 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10 max-w-xl">
            {settings.eyebrow ? (
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
                {str(settings, "eyebrow")}
              </p>
            ) : null}
            <h2 className="font-heading text-3xl font-medium sm:text-4xl">
              {str(settings, "title")}
            </h2>
            {settings.text ? (
              <p className="mt-3 text-cream/70">{str(settings, "text")}</p>
            ) : null}
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {list.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-2xl"
                >
                  <Image
                    src={coverOf(data, c.slug)}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 22vw, 46vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <span className="block font-heading text-2xl sm:text-3xl">
                      {c.name}
                    </span>
                    {c.blurb ? (
                      <span className="mt-1 hidden text-sm text-cream/75 sm:block">
                        {c.blurb}
                      </span>
                    ) : null}
                    {settings.link_label ? (
                      <span className="mt-3 inline-block border-b border-gold pb-0.5 text-sm text-gold">
                        {str(settings, "link_label")} →
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  },
};

type Promise_ = {
  icon: keyof typeof ICONS;
  stat: string;
  stat_label: string;
  text: string;
  href: string;
};

/** Editorial split: story on the left, the promises as rows on the right. */
export const promise: SectionDef<undefined> = {
  Component: ({ settings }) => {
    const items = settings.items as Promise_[];
    return (
      <section
        className="mx-auto max-w-[1400px] px-4 pt-16 sm:px-6 sm:pt-24"
        aria-labelledby="promise-title"
      >
        <div className="relative grid overflow-hidden rounded-[2rem] bg-sand lg:grid-cols-[1fr_1.5fr]">
          <div
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col justify-center p-8 sm:p-12 lg:p-14">
            {settings.eyebrow ? (
              <p className="mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">
                <span className="h-px w-10 bg-gold" aria-hidden />{" "}
                {str(settings, "eyebrow")}
              </p>
            ) : null}
            <h2
              id="promise-title"
              className="font-heading text-3xl font-medium leading-[1.15] sm:text-4xl lg:text-[2.6rem]"
            >
              {str(settings, "title")}{" "}
              {settings.title_accent ? (
                <span className="text-taupe-dark">
                  {str(settings, "title_accent")}
                </span>
              ) : null}
            </h2>
            {settings.text ? (
              <p className="mt-5 max-w-sm text-ink-soft">
                {str(settings, "text")}
              </p>
            ) : null}
            {settings.cta_label && settings.cta_href ? (
              <Link
                href={str(settings, "cta_href")}
                className="mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-cream transition-colors hover:bg-taupe-dark"
              >
                {str(settings, "cta_label")} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          {items.length > 0 && (
            <ul className="relative divide-y divide-ink/10 bg-white/60 backdrop-blur-sm lg:m-3 lg:rounded-[1.5rem]">
              {items.map((v, k) => {
                const Icon = ICONS[v.icon];
                const body = (
                  <>
                    {/* arch medallion: gold outline + dark inner arch on a gold base, icon optically centred */}
                    <span
                      className="flex shrink-0 flex-col items-center"
                      aria-hidden
                    >
                      <span className="rounded-t-full border border-b-0 border-gold/70 p-1.5 transition-colors duration-300 group-hover:border-gold">
                        <span className="flex h-[76px] w-[60px] items-center justify-center rounded-t-full bg-ink pt-3 text-gold transition-colors duration-300 group-hover:bg-taupe-dark sm:h-[88px] sm:w-[68px]">
                          <Icon
                            className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
                            strokeWidth={1.25}
                          />
                        </span>
                      </span>
                      <span className="h-[3px] w-[calc(100%+2px)] rounded-full bg-gold" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-heading text-3xl font-medium sm:text-4xl">
                          {v.stat}
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-taupe-dark">
                          {v.stat_label}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">
                        {v.text}
                      </span>
                    </span>
                  </>
                );
                const row =
                  "group flex items-center gap-5 p-6 transition-colors sm:gap-7 sm:p-8 lg:first:rounded-t-[1.5rem] lg:last:rounded-b-[1.5rem]";
                return (
                  <li key={k}>
                    {v.href ? (
                      <Link href={v.href} className={`${row} hover:bg-white`}>
                        {body}
                        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/20 transition-all group-hover:border-ink group-hover:bg-ink group-hover:text-cream sm:flex">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    ) : (
                      <div className={row}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    );
  },
};

/** Light brownish card with a product arch, so it reads separately from the sand promise panel above. */
export const newsletter: SectionDef<string[]> = {
  async load(s) {
    const slugs = s.image_collections as string[];
    const picks = slugs.length
      ? (await Promise.all(slugs.map((slug) => peek(slug, 1)))).flat()
      : (await newest()).slice(0, 2);
    return picks.map((p) => p.images[0]);
  },
  Component: ({ settings, data }) => (
    <section
      className="mx-auto mt-16 max-w-[1400px] px-4 sm:mt-24 sm:px-6"
      aria-labelledby="nl-title"
    >
      <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-3xl border border-gold/50 bg-latte p-6 sm:p-10 md:grid-cols-[auto_minmax(0,34rem)] md:justify-center md:gap-16 lg:py-12">
        <div className="mx-auto flex items-end gap-3" aria-hidden>
          {(data ?? []).map((src, k) => (
            <span
              key={src}
              className={`relative overflow-hidden rounded-t-[999px] bg-sand ring-1 ring-gold/40 ${k === 0 ? "h-44 w-28 sm:h-56 sm:w-36" : "h-32 w-24 sm:h-44 sm:w-28"}`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="144px"
                className="object-cover"
              />
            </span>
          ))}
        </div>
        <div className="min-w-0 text-center md:text-left">
          {settings.eyebrow ? (
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">
              {str(settings, "eyebrow")}
            </p>
          ) : null}
          <h2
            id="nl-title"
            className="font-heading text-3xl font-medium sm:text-4xl"
          >
            {str(settings, "title")}
          </h2>
          {settings.text ? (
            <p className="mt-3 max-w-lg text-ink-soft md:max-w-md">
              {str(settings, "text")}
            </p>
          ) : null}
          <div className="mt-6 flex justify-center md:justify-start">
            <Newsletter />
          </div>
          {settings.note ? (
            <p className="mt-3 text-xs text-ink-soft">
              {str(settings, "note")}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  ),
};
