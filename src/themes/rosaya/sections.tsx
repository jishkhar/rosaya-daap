/* eslint-disable @next/next/no-img-element -- Theme artwork accepts local files and arbitrary validated ERP upload URLs. */
import Link from "next/link";
import { ArrowRight, Box, Star, Tag } from "lucide-react";
import type { Values } from "@/themes/schema";
import type { SectionDef } from "@/themes/types";
import { Occasions, Slideshow, type Tile } from "./interactions";
import styles from "./rosaya.module.css";
import { loadTiles, loadSlides } from "./loaders";

function Picture({ item, className }: { item: Tile; className?: string }) {
  // unoptimized: theme artwork can be any validated HTTPS URL or local asset, including ERP uploads.
  return item.image ? (
    <img
      src={item.image}
      alt={item.label}
      className={className}
      loading="lazy"
    />
  ) : (
    <div className={styles.placeholder} />
  );
}

function Categories({ settings, items }: { settings: Values; items: Tile[] }) {
  if (!items.length) return null;
  return (
    <section
      className={styles.categories}
      aria-label={settings.title as string}
    >
      <div className={styles.categoryContainer}>
        <h2>{settings.title as string}</h2>
        <div className={styles.categoryTrack}>
          {items.map((item, i) => (
            <Link
              href={item.href || "/collections"}
              key={i}
              className={styles.category}
            >
              <span className={styles.circle}>
                <Picture item={item} />
              </span>
              <span className={styles.categoryLabel}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Crafts({ settings, items }: { settings: Values; items: Tile[] }) {
  if (!items.length) return null;
  return (
    <section className={styles.crafts} aria-label={settings.title as string}>
      <div className={styles.craftContainer}>
        <div className={styles.craftHeading}>
          <h2>{settings.title as string}</h2>
          {settings.text ? <p>{settings.text as string}</p> : null}
        </div>
        <div className={styles.craftGrid}>
          {items.map((item, i) => (
            <Link
              href={item.href || "/collections"}
              key={i}
              className={styles.craftCard}
            >
              <Picture item={item} />
              <h3>{item.label}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Promises({ settings }: { settings: Values }) {
  const icons = { box: Box, star: Star, tag: Tag };
  return (
    <section className={styles.promises} aria-label="Our service promises">
      <div className={styles.promiseGrid}>
        {(
          settings.items as {
            icon: keyof typeof icons;
            title: string;
            text: string;
          }[]
        ).map((item, i) => {
          const Icon = icons[item.icon] ?? Box;
          return (
            <article key={i} className={styles.promise}>
              <Icon size={50} strokeWidth={1.6} aria-hidden="true" />
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Banner({ settings }: { settings: Values }) {
  if (!settings.image) return null;
  const image = (
    <img
      src={settings.image as string}
      alt={settings.alt as string}
      loading="lazy"
      width={1920}
      height={1080}
    />
  );
  return (
    <section className={styles.banner}>
      {settings.href ? (
        <Link href={settings.href as string}>{image}</Link>
      ) : (
        image
      )}
    </section>
  );
}

function CollectionCards({
  settings,
  items,
}: {
  settings: Values;
  items: Tile[];
}) {
  if (!items.length) return null;
  return (
    <section
      className={styles.collectionCards}
      aria-label={settings.title as string}
    >
      <h2>{settings.title as string}</h2>
      <div className={styles.collectionGrid}>
        {items.map((item, i) => (
          <Link
            href={item.href || "/collections"}
            key={i}
            className={styles.collectionCard}
          >
            <Picture item={item} />
            <h3>
              {item.label}
              <ArrowRight size={15} aria-hidden="true" />
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}

const slideshow: SectionDef<Awaited<ReturnType<typeof loadSlides>>> = {
  load: loadSlides,
  Component: ({ settings, data }) => (
    <Slideshow settings={{ ...settings, slides: data ?? [] }} />
  ),
};
function tiles(
  Component: (props: { settings: Values; items: Tile[] }) => React.ReactNode,
  kind: "category" | "craft" | "occasion" | "collection",
): SectionDef<Tile[]> {
  return {
    load: (settings) => loadTiles(settings, kind),
    Component: ({ settings, data }) => (
      <Component settings={settings} items={data ?? []} />
    ),
  };
}
export const sections = {
  slideshow,
  "category-circles": tiles(Categories, "category"),
  occasions: tiles(
    ({ settings, items }) =>
      items.length ? <Occasions settings={{ ...settings, items }} /> : null,
    "occasion",
  ),
  crafts: tiles(Crafts, "craft"),
  promises: { Component: Promises },
  "image-banner": { Component: Banner },
  "collection-cards": tiles(CollectionCards, "collection"),
};
