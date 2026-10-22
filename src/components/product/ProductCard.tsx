"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { colorHex } from "@/lib/catalog";
import { percentOff } from "@/lib/money";
import { Price } from "@/components/ui/Price";
import { useCart } from "@/lib/cart";

export function ProductCard({
  p,
  priority = false,
  sizes = "(min-width:1024px) 25vw, 50vw",
}: {
  p: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const { add, ready } = useCart();
  const off = percentOff(p.price, p.mrp);
  const quickAdd = () =>
    ready &&
    add({
      variantId: p.variantId,
      slug: p.slug,
      title: p.title,
      image: p.images[0],
      price: p.price,
      mrp: p.mrp,
    });

  return (
    <article className="group relative">
      <Link href={`/p/${p.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-sand">
          <Image
            src={p.images[0]}
            alt={p.title}
            fill
            sizes={sizes}
            priority={priority}
            className={`object-cover transition-all duration-500 ${p.images[1] ? "group-hover:opacity-0" : "group-hover:scale-105"}`}
          />
          {p.images[1] && (
            <Image
              src={p.images[1]}
              alt=""
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {!p.inStock && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cream">
                Sold out
              </span>
            )}
            {p.inStock && off > 0 && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                {off}% off
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 space-y-1 px-0.5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-taupe-dark">
            {p.category}
          </p>
          <h3 className="line-clamp-2 min-h-[2.5rem] font-body text-sm leading-snug">
            {p.title}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <Price price={p.price} mrp={p.mrp} />
            {p.colors.length > 0 && (
              <span
                className="flex -space-x-1"
                aria-label={`Colours: ${p.colors.join(", ")}`}
              >
                {p.colors.map((c) => (
                  <span
                    key={c}
                    className="h-3.5 w-3.5 rounded-full border border-line"
                    style={{ background: colorHex(c) }}
                  />
                ))}
              </span>
            )}
          </div>
        </div>
      </Link>
      {p.inStock && !p.hasChoices && p.variantId && (
        <button
          disabled={!ready}
          onClick={quickAdd}
          aria-label={`Quick add ${p.title} to bag`}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-ink shadow transition-all hover:bg-ink hover:text-cream sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
    </article>
  );
}
