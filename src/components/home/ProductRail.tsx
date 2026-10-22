"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

/** Horizontal scroll-snap carousel of product cards with desktop arrows. */
export function ProductRail({ items }: { items: Product[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({
      left: dir * ref.current.clientWidth * 0.85,
      behavior: "smooth",
    });
  return (
    <div className="group/rail relative">
      <ul
        ref={ref}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        {items.map((p) => (
          <li
            key={p.id}
            className="w-[62%] shrink-0 snap-start sm:w-[34%] lg:w-[calc(25%-12px)]"
          >
            <ProductCard p={p} sizes="(min-width:1024px) 22vw, 60vw" />
          </li>
        ))}
      </ul>
      <button
        aria-label="Scroll left"
        onClick={() => scroll(-1)}
        className="absolute -left-4 top-[38%] hidden h-11 w-11 items-center justify-center rounded-full bg-cream shadow-lg hover:bg-ink hover:text-cream lg:group-hover/rail:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Scroll right"
        onClick={() => scroll(1)}
        className="absolute -right-4 top-[38%] hidden h-11 w-11 items-center justify-center rounded-full bg-cream shadow-lg hover:bg-ink hover:text-cream lg:group-hover/rail:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
