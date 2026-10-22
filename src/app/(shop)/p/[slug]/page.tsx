import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/product/Gallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductRail } from "@/components/home/ProductRail";
import { Section } from "@/components/home/Section";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Price } from "@/components/ui/Price";
import { colorHex } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import { getProduct, related } from "@/lib/store";
import { descriptionText } from "@/lib/richText";
import { getStorefront } from "@/themes/registry";
import type { Values } from "@/themes/schema";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.title, description: descriptionText(p.desc).slice(0, 155), alternates: { canonical: `/p/${p.slug}` }, openGraph: { images: [p.images[0]] } } : {};
}

/** The description, then the shop's own care and shipping/returns text (theme editor > Store pages); empty ones are left out. */
const accordions = (desc: string, pages: Values) => [
  { title: "Product details", body: desc, html: /<[a-z][^>]*>/i.test(desc) },
  { title: "Care instructions", body: (pages.care as string).trim(), html: false },
  { title: "Shipping & returns", body: [pages.shipping as string, pages.returns as string].map((t) => t.trim()).filter(Boolean).join("\n\n"), html: false },
].filter((a) => a.body);

export default async function ProductPage({ params }: Props) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const more = await related(p);
  const base = await siteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    image: p.images,
    description: descriptionText(p.desc) || p.title,
    sku: p.variants[0]?.id ?? p.id,
    category: p.category,
    offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${base}/p/${p.slug}` },
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="py-6">
        <Breadcrumb trail={[{ label: "Home", href: "/" }, ...(p.categorySlug ? [{ label: p.category, href: `/c/${p.categorySlug}` }] : []), { label: p.title.length > 40 ? p.title.slice(0, 40) + "…" : p.title }]} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <Gallery images={p.images} title={p.title} />
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-taupe-dark">{p.category}</p>
          <h1 className="mt-2 font-heading text-3xl font-medium leading-tight sm:text-4xl">{p.title}</h1>
          <div className="mt-4"><Price price={p.price} mrp={p.mrp} size="lg" /></div>
          <p className="mt-1 text-xs text-ink-soft">Inclusive of all taxes. Free shipping on every order.</p>

          {p.colors.length > 0 && (
            <p className="mt-5 flex items-center gap-2 text-sm">
              Colour:
              {p.colors.map((c) => (
                <span key={c} className="flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-1.5 pr-3 text-xs">
                  <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: colorHex(c) }} />{c}
                </span>
              ))}
            </p>
          )}

          <div className="mt-6"><PurchasePanel p={p} /></div>

          <div className="mt-8 border-t border-line">
            {accordions(p.desc, (await getStorefront()).config.settings.pages).map((a, i) => (
              <details key={a.title} open={i === 0} className="group border-b border-line py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-heading text-base uppercase tracking-[0.12em]">
                  {a.title}<span className="text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                {a.html ? <div className="rich-description pt-3 text-sm leading-relaxed text-ink-soft" dangerouslySetInnerHTML={{ __html: a.body }} /> : <p className="whitespace-pre-wrap pt-3 text-sm leading-relaxed text-ink-soft">{a.body}</p>}
              </details>
            ))}
          </div>
          <ProductReviews key={p.slug} slug={p.slug} />
        </div>
      </div>

      {more.length > 0 && (
        <Section eyebrow="Complete the look" title="You may also love">
          <ProductRail items={more} />
        </Section>
      )}
    </div>
  );
}
