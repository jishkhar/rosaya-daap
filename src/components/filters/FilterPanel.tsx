"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { colorHex } from "@/lib/catalog";
import { formatINR } from "@/lib/money";
import { useUrlFilters } from "@/components/filters/useUrlFilters";

export type FacetData = {
  colors: { value: string; n: number }[];
  crafts: { value: string; n: number }[];
  min: number;
  max: number;
};

function Group({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-heading text-base uppercase tracking-[0.12em]">
        {title}
        <span className="text-xl leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}

export function FilterPanel({ facets }: { facets: FacetData }) {
  const f = useUrlFilters();
  const colors = f.getList("color");
  const crafts = f.getList("craft");
  const [lo0, hi0] = (f.sp.get("price") ?? "").split("-");
  const [lo, setLo] = useState(lo0 ?? "");
  const [hi, setHi] = useState(hi0 ?? "");

  const span = facets.max - facets.min;
  const presets =
    span > 0
      ? [
          [facets.min, Math.round((facets.min + span * 0.25) / 100) * 100],
          [
            Math.round((facets.min + span * 0.25) / 100) * 100,
            Math.round((facets.min + span * 0.5) / 100) * 100,
          ],
          [Math.round((facets.min + span * 0.5) / 100) * 100, facets.max],
        ]
      : [];
  const applyPrice = () =>
    f.set(
      "price",
      lo || hi ? `${lo || 0}-${hi || facets.max || 999999}` : null,
    );

  return (
    <div
      aria-busy={f.pending}
      className={
        f.pending ? "opacity-60 transition-opacity" : "transition-opacity"
      }
    >
      <Group title="Availability">
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={f.sp.get("stock") === "1"}
            onChange={(e) => f.set("stock", e.target.checked ? "1" : null)}
            className="h-4 w-4 accent-ink"
          />
          In stock only
        </label>
      </Group>

      <Group title="Price">
        <div className="mb-3 flex flex-wrap gap-2">
          {presets.map(([a, b]) => {
            const on = f.sp.get("price") === `${a}-${b}`;
            return (
              <button
                key={`${a}-${b}`}
                onClick={() => {
                  setLo(String(a));
                  setHi(String(b));
                  f.set("price", on ? null : `${a}-${b}`);
                }}
                className={`rounded-full border px-3 py-1.5 text-xs ${on ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink"}`}
              >
                {formatINR(a)} – {formatINR(b)}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            aria-label="Minimum price"
            placeholder={`₹${facets.min}`}
            value={lo}
            onChange={(e) => setLo(e.target.value.replace(/\D/g, ""))}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
          />
          <span className="text-ink-soft">–</span>
          <input
            inputMode="numeric"
            aria-label="Maximum price"
            placeholder={`₹${facets.max}`}
            value={hi}
            onChange={(e) => setHi(e.target.value.replace(/\D/g, ""))}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm"
          />
        </div>
      </Group>

      {facets.colors.length > 0 && (
        <Group title="Colour">
          <ul className="flex flex-wrap gap-3">
            {facets.colors.map(({ value, n }) => {
              const on = colors.includes(value);
              return (
                <li key={value}>
                  <button
                    onClick={() => f.toggle("color", value)}
                    aria-pressed={on}
                    title={`${value} (${n})`}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${on ? "border-ink" : "border-line"}`}
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10"
                        style={{ background: colorHex(value) }}
                      >
                        {on && (
                          <Check
                            className={`h-3.5 w-3.5 ${["white", "cream", "beige", "yellow"].includes(value.toLowerCase()) ? "text-ink" : "text-white"}`}
                          />
                        )}
                      </span>
                    </span>
                    <span className="text-[10px] text-ink-soft">{value}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Group>
      )}

      {facets.crafts.length > 0 && (
        <Group title="Craft">
          <ul className="space-y-2.5">
            {facets.crafts.map(({ value, n }) => (
              <li key={value}>
                <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={crafts.includes(value)}
                      onChange={() => f.toggle("craft", value)}
                      className="h-4 w-4 accent-ink"
                    />
                    {value}
                  </span>
                  <span className="text-xs text-ink-soft">{n}</span>
                </label>
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}
