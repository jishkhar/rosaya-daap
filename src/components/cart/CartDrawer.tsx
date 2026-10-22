"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { FreeShippingBar } from "@/components/cart/FreeShippingBar";
import { ButtonLink } from "@/components/ui/Button";

export function CartDrawer() {
  const {
    open,
    setOpen,
    items,
    subtotal,
    setQty,
    remove,
    issues,
    storageError,
  } = useCart();
  const pathname = usePathname();

  // Safety net: any navigation (e.g. the buy-it-now redirect) dismisses the drawer.
  useEffect(() => setOpen(false), [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div
      className="fixed inset-0 z-[55]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      <button
        aria-label="Close cart"
        className="absolute inset-0 bg-ink/50"
        onClick={close}
      />
      <aside className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="font-heading text-xl">
            Your Bag ({items.reduce((s, i) => s + i.qty, 0)})
          </h2>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-full p-2 hover:bg-sand"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {storageError && (
          <p role="alert" className="px-5 py-3 text-sm text-ink-soft">
            {storageError}
          </p>
        )}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-taupe" strokeWidth={1.2} />
            <p className="font-heading text-xl">Your bag is empty</p>
            <p className="text-sm text-ink-soft">
              Free shipping on every order.
            </p>
            <ButtonLink
              href="/c/new-arrivals"
              size="lg"
              className="mt-2"
              onClick={close}
            >
              Start shopping
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-4">
              <FreeShippingBar />
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-4">
                  <Link
                    href={`/p/${i.slug}`}
                    onClick={close}
                    className="shrink-0"
                  >
                    <Image
                      src={i.image}
                      alt=""
                      width={80}
                      height={104}
                      className="h-[104px] w-20 rounded-md object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/p/${i.slug}`}
                      onClick={close}
                      className="line-clamp-2 text-sm hover:underline"
                    >
                      {i.title}
                    </Link>
                    {i.size && (
                      <p className="mt-0.5 text-xs text-ink-soft">
                        Size: {i.size}
                      </p>
                    )}
                    <LineIssue variantId={i.variantId} issues={issues} />
                    <p className="mt-1 text-sm font-semibold">
                      {formatINR(i.price)}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <Qty qty={i.qty} onChange={(q) => setQty(i.key, q)} />
                      <button
                        onClick={() => remove(i.key)}
                        aria-label={`Remove ${i.title}`}
                        className="rounded-full p-2 text-ink-soft hover:bg-sand hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line bg-white/50 p-5">
              <div className="flex items-center justify-between font-medium">
                <span>Subtotal</span>
                <span className="text-lg font-semibold">
                  {formatINR(subtotal)}
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                Coupons are applied in your bag and at checkout.
              </p>
              <ButtonLink
                href="/checkout"
                size="lg"
                className="w-full"
                onClick={close}
              >
                Checkout
              </ButtonLink>
              <ButtonLink
                href="/cart"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={close}
              >
                View bag
              </ButtonLink>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function Qty({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (q: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white">
      <button
        aria-label="Decrease quantity"
        className="p-2 hover:text-accent"
        onClick={() => onChange(qty - 1)}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm" aria-live="polite">
        {qty}
      </span>
      <button
        aria-label="Increase quantity"
        className="p-2 hover:text-accent"
        onClick={() => onChange(qty + 1)}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** A stock / availability problem the server found with one line. */
export function LineIssue({
  variantId,
  issues,
}: {
  variantId: string;
  issues: { variant_id: string; message: string }[];
}) {
  const hit = issues.find((x) => x.variant_id === variantId);
  return hit ? (
    <p role="alert" className="mt-1 text-xs font-medium text-danger">
      {hit.message}
    </p>
  ) : null;
}
