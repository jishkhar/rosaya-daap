"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { byKind, getCollection, nav } from "@/content/site";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

type Mega = { key: string; label: string; groups: { title?: string; slugs: string[] }[]; feature: string };

const MEGA: Mega[] = [
  { key: "women", label: "Women", groups: [{ title: "Shop by style", slugs: nav.women }], feature: "sarees" },
  { key: "craft", label: "Shop by Craft", groups: [{ title: "Handcrafted traditions", slugs: byKind("craft").map((c) => c.slug) }], feature: "ajrakh" },
  { key: "occasion", label: "Occasion", groups: [{ title: "Dress for the day", slugs: byKind("occasion").map((c) => c.slug) }], feature: "wedding" },
  { key: "acc", label: "Accessories", groups: [{ title: "Finishing touches", slugs: nav.accessories }], feature: "dupattas" },
];

export function Header({ covers }: { covers: Record<string, string> }) {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const [mega, setMega] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  const active = MEGA.find((m) => m.key === mega);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur" onMouseLeave={() => setMega(null)}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:h-[76px] sm:px-6">
        <button className="-ml-2 rounded-full p-2 hover:bg-sand lg:hidden" aria-label="Open menu" onClick={() => setMobile(true)}>
          <Menu className="h-6 w-6" />
        </button>
        <Logo />

        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 lg:flex">
          <Link href="/c/new-arrivals" className="rounded-full px-3.5 py-2 text-sm font-medium hover:bg-sand" onMouseEnter={() => setMega(null)}>
            New Arrivals
          </Link>
          {MEGA.slice(0, 3).map((m) => (
            <MegaTrigger key={m.key} m={m} open={mega === m.key} setMega={setMega} />
          ))}
          <Link href="/c/garba" className="rounded-full px-3.5 py-2 text-sm font-medium hover:bg-sand" onMouseEnter={() => setMega(null)}>
            Garba
          </Link>
          <MegaTrigger m={MEGA[3]} open={mega === "acc"} setMega={setMega} />
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button className="flex items-center gap-2 rounded-full p-2.5 text-sm hover:bg-sand lg:border lg:border-line lg:bg-white lg:py-2 lg:pl-4 lg:pr-12 lg:text-ink-soft lg:hover:border-ink" aria-label="Search" onClick={() => setSearch(true)}>
            <Search className="h-[22px] w-[22px] lg:h-4 lg:w-4" />
            <span className="hidden lg:inline">Search</span>
          </button>
          <Link href={user ? "/account" : "/login"} className="hidden rounded-full p-2.5 hover:bg-sand sm:block" aria-label={user ? "My account" : "Log in"}>
            <User className="h-[22px] w-[22px]" />
          </Link>
          <button className="relative rounded-full p-2.5 hover:bg-sand" aria-label={`Cart, ${count} items`} onClick={() => setOpen(true)}>
            <ShoppingBag className="h-[22px] w-[22px]" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {active && (
        <div className="animate-fade-up absolute inset-x-0 top-full hidden border-b border-line bg-cream shadow-lg lg:block" onMouseEnter={() => setMega(active.key)}>
          <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_320px] gap-10 px-6 py-8">
            <div className="grid grid-cols-2 gap-x-8">
              {active.groups.map((g) => (
                <div key={g.title} className="col-span-2">
                  <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-taupe-dark">{g.title}</p>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {g.slugs.map((s) => (
                      <li key={s}>
                        <Link href={`/c/${s}`} onClick={() => setMega(null)} className="block rounded py-2 font-heading text-lg hover:text-taupe-dark hover:underline hover:underline-offset-4">
                          {getCollection(s)?.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link href={`/c/${active.feature}`} onClick={() => setMega(null)} className="group relative block h-56 overflow-hidden rounded-xl">
              <Image src={covers[active.feature] ?? "/placeholder.svg"} alt="" fill sizes="320px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              <span className="absolute bottom-4 left-4 font-heading text-xl text-cream">Shop {getCollection(active.feature)?.name} →</span>
            </Link>
          </div>
        </div>
      )}

      {mobile && <MobileMenu onClose={() => setMobile(false)} />}
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </header>
  );
}

function MegaTrigger({ m, open, setMega }: { m: Mega; open: boolean; setMega: (k: string | null) => void }) {
  return (
    <button
      aria-expanded={open}
      onMouseEnter={() => setMega(m.key)}
      onFocus={() => setMega(m.key)}
      onClick={() => setMega(open ? null : m.key)}
      className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium hover:bg-sand ${open ? "bg-sand" : ""}`}
    >
      {m.label}
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button aria-label="Close menu" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="animate-slide-in-left relative flex h-full w-[86%] max-w-sm flex-col bg-cream text-ink">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Logo />
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-sand">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2" aria-label="Mobile">
          <Link href="/c/new-arrivals" onClick={onClose} className="block border-b border-line py-4 font-heading text-lg">New Arrivals</Link>
          {MEGA.slice(0, 3).map((m) => (
            <div key={m.key} className="border-b border-line">
              <button className="flex w-full items-center justify-between py-4 font-heading text-lg" aria-expanded={openKey === m.key} onClick={() => setOpenKey(openKey === m.key ? null : m.key)}>
                {m.label}
                <ChevronDown className={`h-5 w-5 transition-transform ${openKey === m.key ? "rotate-180" : ""}`} />
              </button>
              {openKey === m.key && (
                <ul className="pb-3 pl-2">
                  {m.groups.flatMap((g) => g.slugs).map((s) => (
                    <li key={s}>
                      <Link href={`/c/${s}`} onClick={onClose} className="block py-2.5 text-ink-soft">{getCollection(s)?.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <Link href="/c/garba" onClick={onClose} className="block border-b border-line py-4 font-heading text-lg">Garba Collection</Link>
          <Link href="/c/dupattas" onClick={onClose} className="block border-b border-line py-4 font-heading text-lg">Accessories</Link>
          <Link href="/shop" onClick={onClose} className="block py-4 font-heading text-lg">Shop All</Link>
        </nav>
        <div className="border-t border-line p-4">
          <Link href={user ? "/account" : "/login"} onClick={onClose} className="flex items-center gap-2 text-sm font-medium"><User className="h-5 w-5" /> {user ? user.name : "Log in / Register"}</Link>
        </div>
      </div>
    </div>
  );
}
