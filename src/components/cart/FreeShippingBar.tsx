"use client";

import { Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";

/** Progress to a free-shipping threshold when the store has one; otherwise a plain note that shipping is free. */
export function FreeShippingBar() {
  const { toFreeShipping, subtotal, discount, freeShippingAbove } = useCart();
  if (freeShippingAbove == null)
    return (
      <p className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-success" /> <span className="font-medium text-success">Free shipping on your order</span>
      </p>
    );
  const pct = Math.min(100, Math.round(((subtotal - discount) / freeShippingAbove) * 100));
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-success" />
        {toFreeShipping > 0 ? (
          <span>Add <b>{formatINR(toFreeShipping)}</b> more for <b>free shipping</b></span>
        ) : (
          <span className="font-medium text-success">You&apos;ve unlocked free shipping!</span>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
