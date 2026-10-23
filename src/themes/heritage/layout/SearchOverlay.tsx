"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { formatINR } from "@/lib/money";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Result = {
  total: number;
  products: {
    slug: string;
    title: string;
    price: number;
    mrp: number | null;
    image: string;
  }[];
  collections: { slug: string; name: string }[];
};

/** `suggestions`: quick searches shown before typing (the shop's own collection names). */
export function SearchOverlay({
  suggestions,
  onClose,
}: {
  suggestions: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useBodyScrollLock(true);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then(setRes)
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (term: string) => {
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };
  const live = q.trim().length >= 2 ? res : null;

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <button
        aria-label="Close search"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
      />
      <div className="animate-fade-up relative max-h-[85dvh] overflow-y-auto bg-cream shadow-xl">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:py-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) go(q.trim());
            }}
            className="flex items-center gap-3 border-b-2 border-ink pb-3"
          >
            <Search className="h-5 w-5 shrink-0" aria-hidden />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-transparent text-lg outline-none placeholder:text-ink-soft/70"
              aria-label="Search products"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="touch-target rounded-full p-1 hover:bg-sand"
            >
              <X className="h-5 w-5" />
            </button>
          </form>

          {!live ? (
            suggestions.length > 0 && (
              <div className="py-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
                  Popular searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((t) => (
                    <button
                      key={t}
                      onClick={() => go(t)}
                      className="rounded-full border border-line bg-white px-4 py-1.5 text-sm hover:border-ink"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : live.products.length === 0 && live.collections.length === 0 ? (
            <p className="py-8 text-center text-ink-soft">
              No matches for “{q}”. Try a different word.
            </p>
          ) : (
            <div className="py-4">
              {live.collections.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {live.collections.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/c/${c.slug}`}
                      onClick={onClose}
                      className="rounded-full bg-sand px-4 py-1.5 text-sm hover:bg-taupe/40"
                    >
                      {c.name} →
                    </Link>
                  ))}
                </div>
              )}
              <ul className="divide-y divide-line">
                {live.products.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/p/${p.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 py-3 hover:bg-sand/60"
                    >
                      <Image
                        src={p.image}
                        alt=""
                        width={56}
                        height={72}
                        className="h-[72px] w-14 rounded object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm">{p.title}</span>
                        <span className="text-sm font-semibold">
                          {formatINR(p.price)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => go(q.trim())}
                className="mt-3 w-full rounded-full bg-ink py-3 text-sm font-medium text-cream hover:bg-taupe-dark"
              >
                View all {live.total} results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
