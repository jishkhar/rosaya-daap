import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StoreCollection } from "@/lib/store";

export function CollectionTiles({
  collections,
}: {
  collections: StoreCollection[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {collections.map((c) => (
        <li key={c.id}>
          <Link href={`/collections/${c.slug}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
              <Image
                unoptimized
                src={c.image_url ?? "/placeholder.svg"}
                alt={c.name}
                fill
                sizes="(min-width:1024px) 23vw, (min-width:768px) 30vw, 45vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-cream/90">
                <ArrowUpRight size={18} />
              </span>
            </div>
            <h2 className="mt-4 font-heading text-xl font-medium group-hover:underline group-hover:underline-offset-4">
              {c.name}
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              {c.product_count} {c.product_count === 1 ? "piece" : "pieces"}
            </p>
            {c.blurb && (
              <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
                {c.blurb}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
