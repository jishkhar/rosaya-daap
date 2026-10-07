import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Tag, Truck } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { ProductRail } from "@/components/home/ProductRail";
import { Section } from "@/components/home/Section";
import { Newsletter } from "@/components/layout/Newsletter";
import { byKind, getCollection, heroSlides, valueProps } from "@/content/site";
import { collectionCounts, collectionCovers, distinct, diverse, listProducts, NEW_ARRIVALS, scopeOf } from "@/lib/store";

const ICONS = { truck: Truck, badge: BadgeCheck, tag: Tag };
const TILE_SLUGS = ["sarees", "lehengas", "kurtis", "blouses", "suits", "dresses", "dupattas", "bridal"];

const IN_STOCK = { stock: "1" };
const peek = (slug: string, n: number) =>
  listProducts({ scope: scopeOf(getCollection(slug)!), searchParams: IN_STOCK, limit: 24, revalidate: 60 }).then((r) => distinct(r.items, n));

export default async function Home() {
  const [heroPicks, newest, cheapest, covers, counts, dupattas, kalamkari] = await Promise.all([
    Promise.all(heroSlides.map((s) => peek(s.collection, 3))),
    listProducts({ scope: NEW_ARRIVALS, searchParams: IN_STOCK, limit: 40, revalidate: 60 }),
    listProducts({ scope: { sort: "price-asc" }, searchParams: IN_STOCK, limit: 60, revalidate: 60 }),
    collectionCovers(),
    collectionCounts(),
    peek("dupattas", 1),
    peek("kalamkari", 1),
  ]);
  const heroImages = Object.fromEntries(heroSlides.map((s, i) => [s.collection, heroPicks[i].map((p) => p.images[0])]));
  const fresh = diverse(newest.items).slice(0, 10);
  const freshIds = new Set(fresh.map((p) => p.id));
  const value = diverse(cheapest.items.filter((p) => !freshIds.has(p.id))).slice(0, 10);
  const newsletterImages = [...dupattas, ...kalamkari].map((p) => p.images[0]);
  const collectionCover = (slug: string) => covers[slug] ?? "/placeholder.svg";
  const count = (slug: string) => counts[slug] ?? 0;

  return (
    <>
      <Hero images={heroImages} />

      <Section eyebrow="Just in" title="New Arrivals" href="/c/new-arrivals">
        <ProductRail items={fresh} />
      </Section>

      <Section eyebrow="Browse" title="Shop by Category" href="/shop" linkLabel="Shop all">
        <ul className="grid grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-8">
          {TILE_SLUGS.map((slug) => {
            const c = getCollection(slug)!;
            const n = count(slug);
            return (
              <li key={slug}>
                <Link href={`/c/${slug}`} className="group flex flex-col items-center text-center">
                  <span className="relative block aspect-square w-full max-w-[168px] overflow-hidden rounded-full bg-sand ring-1 ring-gold/50 ring-offset-4 ring-offset-cream transition-all duration-300 group-hover:ring-2 group-hover:ring-gold">
                    <Image src={collectionCover(slug)} alt="" fill sizes="(min-width:1024px) 12vw, 22vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  </span>
                  <span className="mt-4 font-heading text-sm sm:text-lg">{c.name}</span>
                  <span className="text-[11px] text-ink-soft sm:text-xs">{n} {n === 1 ? "style" : "styles"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section eyebrow="Celebrate" title="Shop by Occasion">
        <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-5 sm:overflow-visible sm:px-0">
          {byKind("occasion").map((c) => (
            <li key={c.slug} className="w-36 shrink-0 sm:w-auto">
              <Link href={`/c/${c.slug}`} className="group block text-center">
                <div className="relative mx-auto aspect-[3/4] overflow-hidden rounded-t-[999px] bg-sand ring-1 ring-gold/40 ring-offset-4 ring-offset-cream">
                  <Image src={collectionCover(c.slug)} alt="" fill sizes="(min-width:640px) 18vw, 150px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <p className="mt-4 font-heading text-lg">{c.name}</p>
                <p className="text-xs text-ink-soft">{c.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Our Crafts */}
      <section className="mt-16 bg-ink py-16 text-cream sm:mt-24 sm:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10 max-w-xl">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-gold">Made by real hands</p>
            <h2 className="font-heading text-3xl font-medium sm:text-4xl">Our Crafts</h2>
            <p className="mt-3 text-cream/70">Every piece begins with a craft that has outlived centuries. We work directly with the artisans who keep them alive.</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {byKind("craft").map((c) => (
              <li key={c.slug}>
                <Link href={`/c/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl">
                  <Image src={collectionCover(c.slug)} alt="" fill sizes="(min-width:1024px) 22vw, 46vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <span className="block font-heading text-2xl sm:text-3xl">{c.name}</span>
                    <span className="mt-1 hidden text-sm text-cream/75 sm:block">{c.blurb}</span>
                    <span className="mt-3 inline-block border-b border-gold pb-0.5 text-sm text-gold">Explore →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Section eyebrow="Offers" title="Best Value Picks" href="/shop?sort=price-asc">
        <ProductRail items={value} />
      </Section>

      {/* Why Rosaya — editorial split: story on the left, three promises as rows on the right */}
      <section className="mx-auto max-w-[1400px] px-4 pt-16 sm:px-6 sm:pt-24" aria-labelledby="why-rosaya">
        <div className="relative grid overflow-hidden rounded-[2rem] bg-sand lg:grid-cols-[1fr_1.5fr]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" aria-hidden />

          <div className="relative flex flex-col justify-center p-8 sm:p-12 lg:p-14">
            <p className="mb-3 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">
              <span className="h-px w-10 bg-gold" aria-hidden /> The Rosaya promise
            </p>
            <h2 id="why-rosaya" className="font-heading text-3xl font-medium leading-[1.15] sm:text-4xl lg:text-[2.6rem]">
              Made by real hands, meant for <span className="text-taupe-dark">real stories.</span>
            </h2>
            <p className="mt-5 max-w-sm text-ink-soft">Three things we never compromise on, whether it&apos;s your first order or your fiftieth.</p>
            <Link href="/about" className="mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-cream transition-colors hover:bg-taupe-dark">
              Our story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ul className="relative divide-y divide-ink/10 bg-white/60 backdrop-blur-sm lg:m-3 lg:rounded-[1.5rem]">
            {valueProps.map((v) => {
              const Icon = ICONS[v.icon];
              return (
                <li key={v.title}>
                  <Link href={v.href} className="group flex items-center gap-5 p-6 transition-colors hover:bg-white sm:gap-7 sm:p-8 lg:first:rounded-t-[1.5rem] lg:last:rounded-b-[1.5rem]">
                    {/* arch medallion: gold outline + dark inner arch on a gold base, icon optically centred */}
                    <span className="flex shrink-0 flex-col items-center" aria-hidden>
                      <span className="rounded-t-full border border-b-0 border-gold/70 p-1.5 transition-colors duration-300 group-hover:border-gold">
                        <span className="flex h-[76px] w-[60px] items-center justify-center rounded-t-full bg-ink pt-3 text-gold transition-colors duration-300 group-hover:bg-taupe-dark sm:h-[88px] sm:w-[68px]">
                          <Icon className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.25} />
                        </span>
                      </span>
                      <span className="h-[3px] w-[calc(100%+2px)] rounded-full bg-gold" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-heading text-3xl font-medium sm:text-4xl">{v.stat}</span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-taupe-dark">{v.statLabel}</span>
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">{v.text}</span>
                    </span>
                    <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/20 transition-all group-hover:border-ink group-hover:bg-ink group-hover:text-cream sm:flex">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Newsletter — light brownish card with a product arch, so it reads separately from the sand promise panel above */}
      <section className="mx-auto mt-16 max-w-[1400px] px-4 sm:mt-24 sm:px-6" aria-labelledby="nl-title">
        <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-3xl border border-gold/50 bg-latte p-6 sm:p-10 md:grid-cols-[auto_minmax(0,34rem)] md:justify-center md:gap-16 lg:py-12">
          <div className="mx-auto flex items-end gap-3" aria-hidden>
            {newsletterImages.map((src, k) => (
              <span key={src} className={`relative overflow-hidden rounded-t-[999px] bg-sand ring-1 ring-gold/40 ${k === 0 ? "h-44 w-28 sm:h-56 sm:w-36" : "h-32 w-24 sm:h-44 sm:w-28"}`}>
                <Image src={src} alt="" fill sizes="144px" className="object-cover" />
              </span>
            ))}
          </div>
          <div className="min-w-0 text-center md:text-left">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">Join the Rosaya family</p>
            <h2 id="nl-title" className="font-heading text-3xl font-medium sm:text-4xl">Be the first to know</h2>
            <p className="mt-3 max-w-lg text-ink-soft md:max-w-md">New drops, craft stories and early access — straight to your inbox.</p>
            <div className="mt-6 flex justify-center md:justify-start"><Newsletter /></div>
            <p className="mt-3 text-xs text-ink-soft">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </>
  );
}
