"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);

  const go = (n: number) => {
    const next = (n + images.length) % images.length;
    setI(next);
    track.current?.scrollTo({ left: next * track.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto lg:max-h-[640px] lg:flex-col lg:overflow-y-auto">
          {images.map((src, k) => (
            <li key={src} className="shrink-0">
              <button onClick={() => go(k)} aria-label={`Show image ${k + 1}`} aria-current={k === i} className={`relative block h-20 w-16 overflow-hidden rounded-lg border-2 ${k === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}>
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative min-w-0 flex-1">
        {/* Mobile: swipeable scroll-snap. Desktop: hover-zoom on the active image. */}
        <div
          ref={track}
          onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl lg:overflow-hidden"
        >
          {images.map((src, k) => (
            <div
              key={src}
              className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-sand lg:cursor-zoom-in"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }}
              onMouseLeave={() => setZoom(null)}
            >
              <Image
                src={src}
                alt={`${title} — view ${k + 1}`}
                fill
                priority={k === 0}
                sizes="(min-width:1024px) 45vw, 100vw"
                className="object-cover transition-transform duration-200"
                style={k === i && zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            </div>
          ))}
        </div>
        <span className="pointer-events-none absolute right-3 top-3 hidden items-center gap-1 rounded-full bg-cream/90 px-3 py-1.5 text-xs lg:flex"><ZoomIn className="h-3.5 w-3.5" /> Hover to zoom</span>
        {images.length > 1 && (
          <>
            <button aria-label="Previous image" onClick={() => go(i - 1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-cream/90 p-2 shadow hover:bg-cream sm:block lg:hidden"><ChevronLeft className="h-5 w-5" /></button>
            <button aria-label="Next image" onClick={() => go(i + 1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-cream/90 p-2 shadow hover:bg-cream sm:block lg:hidden"><ChevronRight className="h-5 w-5" /></button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden">
              {images.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-ink" : "w-1.5 bg-ink/35"}`} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
