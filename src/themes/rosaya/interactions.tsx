/* eslint-disable @next/next/no-img-element -- Theme artwork accepts local files and arbitrary validated ERP upload URLs. */
"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useBrand } from "@/lib/brand";
import { useCart } from "@/lib/cart";
import { useStoreFeatures } from "@/lib/features";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { Values } from "@/themes/schema";
import styles from "./rosaya.module.css";
import type { StoreCollection } from "@/lib/store";
import { headerMenu } from "./data";

export type Tile = { label: string; image: string; href: string };

/** Native modal dialogs supply focus trapping, Escape dismissal and focus restoration. */
function Overlay({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useBodyScrollLock(true);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-label={title}
      className={styles.dialog}
      onCancel={close}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.drawer}>
        <div className={styles.drawerHeading}>
          <span>{title}</span>
          <button
            type="button"
            aria-label={`Close ${title.toLowerCase()}`}
            onClick={close}
          >
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function Header({
  settings,
  collections,
}: {
  settings: Values;
  collections: StoreCollection[];
}) {
  const { name, logo } = useBrand();
  const { user } = useAuth();
  const { count, setOpen } = useCart();
  const features = useStoreFeatures();
  const [panel, setPanel] = useState<"Menu" | "Search" | null>(null);
  const menu = [
    ...headerMenu(collections, settings.menu_limit as number),
    { label: "Shop All", href: "/shop", children: [] },
  ];
  return (
    <header className={styles.header}>
      <div className={styles.headerStart}>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setPanel("Menu")}
        >
          <Menu />
        </button>
        {settings.show_search ? (
          <button
            type="button"
            aria-label="Search"
            className={styles.desktopSearch}
            onClick={() => setPanel("Search")}
          >
            <Search />
          </button>
        ) : null}
      </div>
      <Link href="/" aria-label={`${name} — home`} className={styles.logo}>
        {/* The source logo is a complete lockup, including the wordmark. */}
        {logo ? (
          <img
            src={logo}
            alt={name}
            width={130}
            height={129}
            fetchPriority="high"
          />
        ) : (
          <span>{name}</span>
        )}
      </Link>
      <div className={styles.headerEnd}>
        {settings.show_search ? (
          <button
            type="button"
            aria-label="Search"
            className={styles.mobileSearch}
            onClick={() => setPanel("Search")}
          >
            <Search />
          </button>
        ) : null}
        {features.accounts && (
          <Link
            href={user ? "/account" : "/login"}
            aria-label={user ? "My account" : "Log in"}
          >
            <UserRound />
          </Link>
        )}
        {features.cart && (
          <button
            type="button"
            aria-label={`Cart, ${count} items`}
            onClick={() => setOpen(true)}
            className={styles.bag}
          >
            <ShoppingBag />
            {count > 0 && <span>{count}</span>}
          </button>
        )}
      </div>
      {panel && (
        <Overlay title={panel} close={() => setPanel(null)}>
          {panel === "Menu" ? (
            <>
              <nav aria-label="Main">
                <ul className={styles.menu}>
                  {menu.map((item, i) => (
                    <li key={i}>
                      {item.children.length ? (
                        <details>
                          <summary>
                            {item.label}
                            <ChevronDown size={16} />
                          </summary>
                          <ul>
                            {item.children
                              .filter((c) => c.href)
                              .map((child, j) => (
                                <li key={j}>
                                  <Link
                                    href={child.href}
                                    onClick={() => setPanel(null)}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                          </ul>
                        </details>
                      ) : item.href ? (
                        <Link href={item.href} onClick={() => setPanel(null)}>
                          {item.label}
                        </Link>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
              {features.accounts && (
                <Link
                  href={user ? "/account" : "/login"}
                  className={styles.menuAccount}
                  onClick={() => setPanel(null)}
                >
                  <UserRound size={20} />
                  {user ? "My account" : "Log in"}
                </Link>
              )}
            </>
          ) : (
            <form
              action="/search"
              onSubmit={() => setPanel(null)}
              className={styles.searchForm}
            >
              <label htmlFor="rosaya-search">Search products</label>
              <div>
                <input
                  id="rosaya-search"
                  name="q"
                  type="search"
                  placeholder="Search"
                  required
                  autoFocus
                />
                <button type="submit" aria-label="Submit search">
                  <Search />
                </button>
              </div>
            </form>
          )}
        </Overlay>
      )}
    </header>
  );
}

type Slide = { image: string; alt: string; label: string; href: string };
export function Slideshow({ settings }: { settings: Values }) {
  const slides = settings.slides as Slide[];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (
      !settings.autoplay ||
      paused ||
      slides.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const timer = window.setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [settings.autoplay, paused, slides.length]);
  if (!slides.length) return null;
  return (
    <section
      className={styles.hero}
      aria-label="Featured collections"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`${styles.slide} ${i === active ? styles.activeSlide : ""}`}
          aria-hidden={i !== active}
        >
          {slide.image && (
            <img
              src={slide.image}
              alt={slide.alt}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          )}
          <div className={styles.heroShade} />
          {slide.href && slide.label && (
            <Link
              href={slide.href}
              className={styles.heroCta}
              tabIndex={i === active ? 0 : -1}
            >
              {slide.label}
            </Link>
          )}
        </div>
      ))}
      {slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      )}
      {settings.autoplay && slides.length > 1 ? (
        <button
          type="button"
          className={styles.pause}
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          onClick={() => setPaused(!paused)}
        >
          {paused ? "▶" : "Ⅱ"}
        </button>
      ) : null}
    </section>
  );
}

export function Occasions({ settings }: { settings: Values }) {
  const track = useRef<HTMLDivElement>(null);
  const id = useId();
  const items = settings.items as Tile[];
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const measure = () =>
      setEdges({
        start: node.scrollLeft < 1,
        end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1,
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    node.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", measure);
    };
  }, [items.length]);
  const move = (direction: number) => {
    const node = track.current;
    const first = node?.firstElementChild as HTMLElement | null;
    if (node && first)
      node.scrollBy({
        left: direction * (first.getBoundingClientRect().width + 20),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  return (
    <section className={styles.occasions} aria-labelledby={id}>
      <div className={styles.occasionContainer}>
        <h2 id={id}>{settings.title as string}</h2>
        <div className={styles.occasionWindow}>
          <div ref={track} className={styles.occasionTrack}>
            {items.map((item, i) => (
              <Link
                href={item.href || "/collections"}
                key={i}
                className={styles.occasionCard}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.label}
                    loading="lazy"
                    width={800}
                    height={1067}
                  />
                )}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          {items.length > 1 && (
            <>
              <button
                type="button"
                className={styles.previous}
                aria-label="Previous occasion"
                disabled={edges.start}
                onClick={() => move(-1)}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className={styles.next}
                aria-label="Next occasion"
                disabled={edges.end}
                onClick={() => move(1)}
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/** The ERP has no mailing-list endpoint; use the shop's signup page or an explicit email request. */
export function Newsletter({ url, email }: { url: string; email: string }) {
  const id = useId();
  if (url)
    return (
      <a href={url} className={styles.newsletterLink}>
        Email <ArrowRight size={18} />
        <span className="sr-only"> — Open newsletter signup</span>
      </a>
    );
  if (!email)
    return (
      <Link href="/contact" className={styles.newsletterLink}>
        Contact us to subscribe <ArrowRight size={18} />
      </Link>
    );
  return (
    <form
      className={styles.newsletter}
      onSubmit={(e) => {
        e.preventDefault();
        const value = new FormData(e.currentTarget).get("email") as string;
        window.location.assign(
          `mailto:${encodeURIComponent(email)}?subject=Newsletter%20subscription&body=${encodeURIComponent(`Please subscribe ${value} to your newsletter.`)}`,
        );
      }}
    >
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <input
        id={id}
        name="email"
        type="email"
        placeholder="Email"
        required
        aria-describedby={`${id}-hint`}
      />
      <button type="submit" aria-label="Request newsletter subscription">
        <ArrowRight size={18} />
      </button>
      <span id={`${id}-hint`} className="sr-only">
        Opens your email app to request a subscription.
      </span>
    </form>
  );
}
