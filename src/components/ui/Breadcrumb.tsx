import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({
  trail,
}: {
  trail: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((t, i) => (
          <li key={t.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            {t.href ? (
              <Link href={t.href} className="hover:text-ink hover:underline">
                {t.label}
              </Link>
            ) : (
              <span className="text-ink" aria-current="page">
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
