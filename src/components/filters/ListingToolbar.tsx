"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { SORTS } from "@/lib/catalog";
import { formatINR } from "@/lib/money";
import { FilterPanel, type FacetData } from "@/components/filters/FilterPanel";
import { useUrlFilters } from "@/components/filters/useUrlFilters";

export function ListingToolbar({
  total,
  facets,
  defaultSort = "featured",
}: {
  total: number;
  facets: FacetData;
  defaultSort?: string;
}) {
  const f = useUrlFilters();
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheet]);

  const chips: { label: string; remove: () => void }[] = [
    ...f
      .getList("color")
      .map((v) => ({ label: v, remove: () => f.toggle("color", v) })),
    ...f
      .getList("craft")
      .map((v) => ({ label: v, remove: () => f.toggle("craft", v) })),
    ...(f.sp.get("price")
      ? [
          {
            label: f.sp
              .get("price")!
              .split("-")
              .map((n) => formatINR(Number(n)))
              .join(" – "),
            remove: () => f.set("price", null),
          },
        ]
      : []),
    ...(f.sp.get("stock") === "1"
      ? [{ label: "In stock", remove: () => f.set("stock", null) }]
      : []),
  ];

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur sm:top-[72px] sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setSheet(true)}
          className="flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-sm font-medium lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filter
          {chips.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] text-white">
              {chips.length}
            </span>
          )}
        </button>
        <p className="hidden text-sm text-ink-soft lg:block" aria-live="polite">
          {total} {total === 1 ? "product" : "products"}
        </p>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-ink-soft sm:inline">Sort by</span>
          <select
            value={f.sp.get("sort") ?? defaultSort}
            onChange={(e) =>
              f.set(
                "sort",
                e.target.value === defaultSort ? null : e.target.value,
              )
            }
            className="h-10 rounded-full border border-line bg-white px-4 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <li key={c.label}>
              <button
                onClick={c.remove}
                className="flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-xs hover:bg-taupe/40"
                aria-label={`Remove filter ${c.label}`}
              >
                {c.label} <X className="h-3 w-3" />
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={f.clearAll}
              className="px-2 text-xs underline underline-offset-4"
            >
              Clear all
            </button>
          </li>
        </ul>
      )}

      {sheet &&
        createPortal(
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <button
              aria-label="Close filters"
              className="absolute inset-0 bg-ink/50"
              onClick={() => setSheet(false)}
            />
            <div className="animate-slide-up absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-cream">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-heading text-xl">Filters</h2>
                <button
                  onClick={() => setSheet(false)}
                  aria-label="Close"
                  className="rounded-full p-1.5 hover:bg-sand"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5">
                <FilterPanel facets={facets} />
              </div>
              <div className="flex gap-3 border-t border-line p-4">
                <button
                  onClick={f.clearAll}
                  className="h-12 flex-1 rounded-full border border-ink text-sm font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={() => setSheet(false)}
                  className="h-12 flex-[2] rounded-full bg-ink text-sm font-medium text-cream"
                >
                  Show {total} products
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
