"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { DeliverTo } from "@/components/delivery/DeliverTo";
import { Logo } from "@/components/ui/Logo";
import { SearchOverlay } from "@/themes/heritage/layout/SearchOverlay";
import type { StoreCollection } from "@/lib/store";
import type { Values } from "@/themes/schema";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

export function Header({
  collections,
  settings,
}: {
  collections: StoreCollection[];
  settings: Values;
}) {
  const headerCollections = collections
    .filter((c) => c.show_in_header)
    .sort((a, b) => a.header_order - b.header_order)
    .slice(0, settings.menu_limit as number);
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  useBodyScrollLock(mobile);

  useEffect(() => {
    if (!mobile) return;
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onResize = () => {
      if (desktop.matches) setMobile(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobile(false);
    };
    desktop.addEventListener("change", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      desktop.removeEventListener("change", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobile]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-[var(--store-header-height)] max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <button
          className="touch-target -ml-2 rounded-full p-2 hover:bg-sand xl:hidden"
          aria-label="Open menu"
          onClick={() => setMobile(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
        <Logo />

        <nav
          aria-label="Main"
          className="mx-auto hidden items-center gap-1 self-stretch xl:flex"
        >
          {headerCollections.map((c) => (
            <CollectionNavItem key={c.id} collection={c} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 xl:ml-0">
          <DeliverTo />
          {settings.show_search ? (
            <button
              className="touch-target flex items-center gap-2 rounded-full p-2.5 text-sm hover:bg-sand xl:border xl:border-line xl:bg-white xl:py-2 xl:pl-4 xl:pr-12 xl:text-ink-soft xl:hover:border-ink"
              aria-label="Search"
              onClick={() => setSearch(true)}
            >
              <Search className="h-[22px] w-[22px] xl:h-4 xl:w-4" />
              <span className="hidden xl:inline">Search</span>
            </button>
          ) : null}
          <Link
            href={user ? "/account" : "/login"}
            className="hidden rounded-full p-2.5 hover:bg-sand sm:block"
            aria-label={user ? "My account" : "Log in"}
          >
            <User className="h-[22px] w-[22px]" />
          </Link>
          <button
            className="touch-target relative rounded-full p-2.5 hover:bg-sand"
            aria-label={`Cart, ${count} items`}
            onClick={() => setOpen(true)}
          >
            <ShoppingBag className="h-[22px] w-[22px]" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobile &&
        createPortal(
          <MobileMenu
            collections={headerCollections}
            onClose={() => setMobile(false)}
          />,
          document.body,
        )}
      {search &&
        createPortal(
          <SearchOverlay
            suggestions={[
              ...new Set(
                [...headerCollections, ...collections].map((c) => c.name),
              ),
            ].slice(0, 6)}
            onClose={() => setSearch(false)}
          />,
          document.body,
        )}
    </header>
  );
}

function MobileMenu({
  collections,
  onClose,
}: {
  collections: StoreCollection[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  return (
    <div
      className="fixed inset-0 z-50 xl:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <button
        aria-label="Close menu"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
      />
      <div className="animate-slide-in-left relative flex h-full w-[86%] max-w-sm flex-col bg-cream text-ink">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Logo />
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 hover:bg-sand"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav
          className="min-h-0 flex-1 overflow-y-auto px-4 py-2"
          aria-label="Mobile"
        >
          {collections.map((c) => (
            <CollectionNavItem
              key={c.id}
              collection={c}
              mobile
              onNavigate={onClose}
            />
          ))}
          <Link
            href="/shop"
            onClick={onClose}
            className="block py-4 font-heading text-lg"
          >
            Shop All
          </Link>
        </nav>
        <div className="shrink-0 border-t border-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Link
            href={user ? "/account" : "/login"}
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <User className="h-5 w-5" />{" "}
            {user ? user.name : "Log in / Register"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function CollectionNavItem({
  collection,
  mobile = false,
  onNavigate,
}: {
  collection: StoreCollection;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const children = collection.dropdown_collections ?? [];
  const linkClass = mobile
    ? "block border-b border-line py-4 font-heading text-lg"
    : "block rounded-full px-3.5 py-2 text-sm font-medium hover:bg-sand";
  if (!collection.header_dropdown || !children.length) {
    return (
      <Link
        href={`/c/${collection.slug}`}
        onClick={onNavigate}
        className={linkClass}
      >
        {collection.name}
      </Link>
    );
  }
  const navigate = () => {
    setOpen(false);
    onNavigate?.();
  };
  return (
    <div
      className={
        mobile ? "border-b border-line" : "flex items-center self-stretch"
      }
      onMouseEnter={() => {
        if (!mobile) setOpen(true);
      }}
      onMouseLeave={() => {
        if (!mobile) setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        className={
          mobile
            ? "flex w-full items-center justify-between py-4 text-left font-heading text-lg"
            : "flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium hover:bg-sand"
        }
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() =>
              document
                .getElementById(menuId)
                ?.querySelector<HTMLAnchorElement>("a")
                ?.focus(),
            );
          }
        }}
      >
        {collection.name}
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className={
          mobile
            ? "pb-3 pl-3"
            : "absolute inset-x-0 top-full z-50 border-y border-line bg-cream shadow-lg"
        }
      >
        <ul
          className={
            mobile
              ? "space-y-1"
              : "mx-auto grid max-h-[65vh] max-w-[1400px] grid-cols-4 gap-x-8 gap-y-1 overflow-y-auto px-6 py-6"
          }
        >
          {children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/c/${child.slug}`}
                onClick={navigate}
                className="block rounded-lg px-3 py-2.5 text-lg text-ink-soft hover:bg-sand hover:text-ink"
              >
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
