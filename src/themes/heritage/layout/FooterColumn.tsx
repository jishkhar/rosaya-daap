"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

/** Accordion on mobile, always-open list from `sm` up (pure CSS on desktop). */
export function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-cream/15 py-3 sm:border-0 sm:py-0">
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 font-heading text-base uppercase tracking-[0.15em] text-gold sm:pointer-events-none sm:mb-3"
      >
        {title}
        <Plus className={`h-5 w-5 transition-transform sm:hidden ${open ? "rotate-45" : ""}`} />
      </button>
      <ul className={`space-y-2.5 pb-2 pt-2 text-sm text-cream/75 sm:block ${open ? "block" : "hidden"}`}>
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="hover:text-gold hover:underline hover:underline-offset-4">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
