import Link from "next/link";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { ListingToolbar } from "@/components/filters/ListingToolbar";
import { ProductCard } from "@/components/product/ProductCard";
import { listProducts, type Scope } from "@/lib/store";

const PAGE = 24;

/** Shared listing body: sticky filters + grid + load more. Server-rendered from URL params. */
export async function Listing({
  scope,
  searchParams,
  basePath,
}: {
  scope: Scope;
  searchParams: Record<string, string | string[] | undefined>;
  basePath: string;
}) {
  const page = Math.max(
    1,
    Math.min(
      50,
      Number(
        Array.isArray(searchParams.page)
          ? searchParams.page[0]
          : searchParams.page,
      ) || 1,
    ),
  );
  // The ERP filters, sorts and counts; "Load more" simply asks for one more page's worth.
  const {
    items: shown,
    total,
    facets,
  } = await listProducts({
    scope,
    searchParams,
    limit: page * PAGE,
    facets: true,
  });
  const scopeEmpty = facets.max === 0 && facets.colors.length === 0;

  const nextHref = (() => {
    const p = new URLSearchParams();
    Object.entries(searchParams).forEach(
      ([k, v]) => v && k !== "page" && p.set(k, Array.isArray(v) ? v[0] : v),
    );
    p.set("page", String(page + 1));
    return `${basePath}?${p}`;
  })();

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--store-header-height)+1rem)] max-h-[calc(100dvh-var(--store-header-height)-2rem)] overflow-y-auto pr-2 no-scrollbar">
          <p className="border-b border-line pb-3 font-heading text-lg uppercase tracking-[0.12em]">
            Filters
          </p>
          <FilterPanel facets={facets} />
        </div>
      </aside>

      <div>
        <ListingToolbar
          total={total}
          facets={facets}
          defaultSort={scope.sort === "new" ? "new" : "featured"}
        />
        {scopeEmpty ? (
          <div className="py-24 text-center">
            <p className="font-heading text-2xl">New pieces arriving soon</p>
            <p className="mt-2 text-ink-soft">
              We&apos;re still curating this collection. Explore what&apos;s
              ready to ship today.
            </p>
            <Link
              href="/collections/new-arrivals"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-cream"
            >
              Shop new arrivals
            </Link>
          </div>
        ) : shown.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-heading text-2xl">
              No products match these filters
            </p>
            <p className="mt-2 text-ink-soft">
              Try removing a filter or widening the price range.
            </p>
            <Link
              href={basePath}
              className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-cream"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
              {shown.map((p, i) => (
                <li key={p.id}>
                  <ProductCard p={p} priority={i < 4} />
                </li>
              ))}
            </ul>
            <div className="mt-12 text-center">
              <p className="text-sm text-ink-soft">
                Showing {shown.length} of {total}
              </p>
              <div className="mx-auto mt-3 h-1 w-48 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full bg-ink"
                  style={{
                    width: `${(shown.length / Math.max(total, 1)) * 100}%`,
                  }}
                />
              </div>
              {shown.length < total && (
                <Link
                  href={nextHref}
                  scroll={false}
                  className="mt-6 inline-flex h-12 items-center rounded-full border border-ink px-10 text-sm font-medium hover:bg-ink hover:text-cream"
                >
                  Load more
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
