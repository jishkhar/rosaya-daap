"use client";

import Image from "next/image";
import { useState } from "react";
import { ZoomIn } from "lucide-react";

export function Gallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const photos = images.length ? images : ["/placeholder.svg"];
  const current = Math.min(active, photos.length - 1);

  return (
    <section
      aria-label={`${title} images`}
      className="mx-auto w-full min-w-0 max-w-md"
    >
      <div
        className="relative aspect-[4/5] min-w-0 overflow-hidden rounded-2xl bg-sand lg:cursor-zoom-in"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setZoom({
            x: ((event.clientX - rect.left) / rect.width) * 100,
            y: ((event.clientY - rect.top) / rect.height) * 100,
          });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <Image
          key={photos[current]}
          src={photos[current]}
          alt={`${title} — view ${current + 1}`}
          fill
          priority
          sizes="(min-width:448px) 448px, 100vw"
          className="object-contain transition-transform duration-200"
          style={
            zoom
              ? {
                  transform: "scale(1.9)",
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                }
              : undefined
          }
        />
        {photos.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-cream/90 px-2.5 py-1 text-xs">
            {current + 1} / {photos.length}
          </span>
        )}
      </div>

      {photos.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, index) => (
            <li key={`${src}-${index}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === current}
                className={`relative block h-20 w-16 overflow-hidden rounded-lg bg-sand ring-2 transition ${
                  index === current
                    ? "ring-ink"
                    : "ring-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 hidden items-center gap-1.5 text-xs text-ink-soft lg:flex">
        <ZoomIn className="h-3.5 w-3.5" /> Hover over the image to zoom
      </p>
    </section>
  );
}
