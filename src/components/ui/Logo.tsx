"use client";

import Image from "next/image";
import Link from "next/link";
import { useBrand } from "@/lib/brand";

export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  const { name, tagline, logo } = useBrand();
  return (
    <Link href="/" aria-label={`${[name, tagline].filter(Boolean).join(" ")} — home`} className={`inline-flex items-center gap-2.5 ${className}`}>
      {logo && <Image src={logo} alt="" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10" priority />}
      <span className="flex flex-col leading-none">
        <span className={`font-heading text-xl font-semibold uppercase tracking-[0.28em] sm:text-2xl ${light ? "text-cream" : "text-ink"}`}>{name}</span>
        {tagline && <span className={`mt-1 hidden text-[9px] uppercase tracking-[0.3em] sm:block ${light ? "text-gold" : "text-taupe-dark"}`}>{tagline}</span>}
      </span>
    </Link>
  );
}
