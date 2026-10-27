"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { LineIssue, Qty } from "@/components/cart/CartDrawer";
import { CouponBox } from "@/components/cart/CouponBox";
import { FreeShippingBar } from "@/components/cart/FreeShippingBar";
import { Totals } from "@/components/cart/Totals";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";

export default function CartPage() {
  const {
    items,
    setQty,
    remove,
    ready,
    issues,
    canCheckout,
    quoting,
    storageError,
  } = useCart();

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-8 sm:px-6">
      <div className="py-6">
        <Breadcrumb
          trail={[{ label: "Home", href: "/" }, { label: "Your Bag" }]}
        />
      </div>
      <h1 className="mb-8 font-heading text-4xl font-medium">Your Bag</h1>

      {storageError && (
        <p role="alert" className="mb-4 text-sm text-ink-soft">
          {storageError}
        </p>
      )}
      {!ready ? (
        <div
          className="h-64 animate-pulse rounded-2xl bg-sand"
          aria-label="Loading bag"
        />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <ShoppingBag className="h-14 w-14 text-taupe" strokeWidth={1.2} />
          <p className="font-heading text-2xl">Your bag is empty</p>
          <p className="text-ink-soft">
            Looks like you haven&apos;t added anything yet.
          </p>
          <ButtonLink href="/c/new-arrivals" size="lg">
            Explore new arrivals
          </ButtonLink>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <div className="min-w-0">
            <div className="mb-6 rounded-2xl border border-line bg-white p-5">
              <FreeShippingBar />
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-5 sm:gap-6">
                  <Link href={`/p/${i.slug}`} className="shrink-0">
                    <Image
                      src={i.image}
                      alt=""
                      width={110}
                      height={146}
                      className="h-[104px] w-20 rounded-xl object-cover sm:h-[146px] sm:w-[110px]"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/p/${i.slug}`}
                          className="line-clamp-2 font-medium hover:underline"
                        >
                          {i.title}
                        </Link>
                        {i.size && (
                          <p className="mt-1 text-sm text-ink-soft">
                            Size: {i.size}
                          </p>
                        )}
                        <LineIssue variantId={i.variantId} issues={issues} />
                        <p className="mt-1 text-sm">{formatINR(i.price)}</p>
                      </div>
                      <p className="hidden font-semibold sm:block">
                        {formatINR(i.price * i.qty)}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                      <Qty qty={i.qty} onChange={(q) => setQty(i.key, q)} />
                      <div className="flex items-center gap-3">
                        <p className="font-semibold sm:hidden">
                          {formatINR(i.price * i.qty)}
                        </p>
                        <button
                          onClick={() => remove(i.key)}
                          className="flex items-center gap-1 text-sm text-ink-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />{" "}
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/shop"
              className="mt-6 inline-block text-sm underline underline-offset-4"
            >
              ← Continue shopping
            </Link>
          </div>

          <aside className="h-fit min-w-0 space-y-6 rounded-2xl border border-line bg-white p-4 sm:p-6 lg:sticky lg:top-[calc(var(--store-header-height)+1rem)]">
            <h2 className="font-heading text-xl">Order summary</h2>
            <CouponBox />
            <Totals />
            {canCheckout ? (
              <ButtonLink href="/checkout" size="lg" className="w-full">
                Proceed to checkout
              </ButtonLink>
            ) : (
              <button
                disabled
                className="inline-flex h-14 w-full items-center justify-center rounded-full bg-ink px-8 text-base font-medium text-cream opacity-50"
              >
                {quoting
                  ? "Updating your bag…"
                  : "Fix the items above to continue"}
              </button>
            )}
            <p className="text-center text-xs text-ink-soft">
              Secure checkout · UPI, cards, netbanking &amp; COD
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
