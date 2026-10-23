"use client";

import { Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { useShipping } from "@/lib/shippingContext";

/** Progress to the shop's free-delivery amount when it has one; otherwise what delivery costs on this basket (the server's quote). */
export function FreeShippingBar() {
  const { toFreeShipping, subtotal, discount, freeShippingAbove, quote } =
    useCart();
  const rules = useShipping();
  if (freeShippingAbove == null) {
    const fee = quote ? quote.shipping_minor : rules?.fee_minor;
    if (fee == null) return null; // not known yet
    return (
      <p className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-success" />{" "}
        {fee === 0 ? (
          <span className="font-medium text-success">
            Free delivery on your order
          </span>
        ) : (
          <span>
            Delivery <b>{formatINR(fee / 100)}</b> on this order
          </span>
        )}
      </p>
    );
  }
  const pct = Math.min(
    100,
    Math.round(((subtotal - discount) / freeShippingAbove) * 100),
  );
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-success" />
        {toFreeShipping > 0 ? (
          <span>
            Add <b>{formatINR(toFreeShipping)}</b> more for <b>free delivery</b>
          </span>
        ) : (
          <span className="font-medium text-success">
            You&apos;ve unlocked free delivery!
          </span>
        )}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-success transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
