"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/** URL is the single source of truth for filters: shareable, SEO-friendly, back-button safe. */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(sp.toString());
      mutate(next);
      next.delete("page");
      const qs = next.toString();
      start(() =>
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
      );
    },
    [sp, pathname, router],
  );

  const getList = (key: string) =>
    (sp.get(key) ?? "").split(",").filter(Boolean);

  const toggle = (key: string, value: string) =>
    push((p) => {
      const cur = new Set((p.get(key) ?? "").split(",").filter(Boolean));
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      if (cur.size) p.set(key, [...cur].join(","));
      else p.delete(key);
    });

  const set = (key: string, value: string | null) =>
    push((p) => (value ? p.set(key, value) : p.delete(key)));
  const clearAll = () =>
    push((p) =>
      ["price", "color", "craft", "stock"].forEach((k) => p.delete(k)),
    );

  return { sp, pending, getList, toggle, set, clearAll };
}
