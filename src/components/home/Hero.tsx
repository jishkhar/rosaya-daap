"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/content/site";

export type HeroImages = Record<string, string[]>;

export function Hero({ images }: { images: HeroImages }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = heroSlides.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <section
      className="relative overflow-hidden bg-sand"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* soft decorative glow */}
      <div className="pointer-events-none absolute -right-32 top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-gold/20 blur-3xl" aria-hidden />

      {/* All slides share one grid cell, so the tallest one sets the height (no layout jump). */}
      <div className="grid">
        {heroSlides.map((s, idx) => {
          const imgs = (images[s.collection] ?? []).slice(0, 3);
          const active = idx === i;
          return (
            <div
              key={s.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${n}`}
              aria-hidden={!active}
              className={`col-start-1 row-start-1 transition-opacity duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <div className="mx-auto grid max-w-[1400px] items-center gap-6 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[1fr_1.1fr] md:gap-10 md:pb-20 md:pt-14 lg:min-h-[640px]">
                <div className="order-2 text-center md:order-1 md:text-left">
                  <p className="mb-4 flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark sm:text-xs md:justify-start">
                    <span className="hidden h-px w-10 bg-gold md:block" aria-hidden />
                    {s.eyebrow}
                  </p>
                  <h1 className="font-heading text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-[5.5rem]">{s.title}</h1>
                  <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-soft md:mx-0">{s.text}</p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                    <Link href={s.cta.href} tabIndex={active ? 0 : -1} className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-cream shadow-sm transition-colors hover:bg-taupe-dark">{s.cta.label}</Link>
                    <Link href={s.cta2.href} tabIndex={active ? 0 : -1} className="inline-flex h-12 items-center rounded-full border border-ink px-8 text-sm font-medium transition-colors hover:bg-ink hover:text-cream">{s.cta2.label}</Link>
                  </div>
                  <ul className="mt-9 hidden flex-wrap gap-x-7 gap-y-1 text-xs text-ink-soft md:flex">
                    <li>✦ Ready to ship</li><li>✦ Free shipping</li><li>✦ Easy exchange</li>
                  </ul>
                </div>

                {/* Arched image collage */}
                <div className="order-1 mx-auto flex w-full max-w-xl items-end justify-center gap-3 md:order-2 md:max-w-none">
                  {imgs.map((src, k) => (
                    <div
                      key={src}
                      className={`relative overflow-hidden rounded-t-[999px] bg-taupe/30 shadow-xl ring-1 ring-gold/40 ${k === 1 ? "aspect-[3/5] w-[38%]" : "aspect-[3/4.2] w-[30%]"} ${k === 2 ? "hidden sm:block" : ""}`}
                    >
                      <Image src={src} alt="" fill sizes="(min-width:768px) 22vw, 35vw" priority={idx === 0} className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
        <button aria-label="Previous slide" onClick={() => setI((i - 1 + n) % n)} className="hidden rounded-full p-1.5 hover:bg-cream/70 sm:block"><ChevronLeft className="h-5 w-5" /></button>
        {heroSlides.map((s, idx) => (
          <button key={s.title} aria-label={`Go to slide ${idx + 1}`} aria-current={idx === i} onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? "w-8 bg-ink" : "w-2 bg-ink/30"}`} />
        ))}
        <button aria-label="Next slide" onClick={() => setI((i + 1) % n)} className="hidden rounded-full p-1.5 hover:bg-cream/70 sm:block"><ChevronRight className="h-5 w-5" /></button>
      </div>
    </section>
  );
}
