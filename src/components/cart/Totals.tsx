"use client";

import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";

const Row = ({ k, v, cls = "" }: { k: string; v: string; cls?: string }) => (
  <div className={`flex justify-between ${cls}`}><dt>{k}</dt><dd>{v}</dd></div>
);

/** Every figure here is the server's: see CartProvider (POST /api/basket/quote). */
export function Totals() {
  const { subtotal, discount, shipping, total, tax, gstIncluded, coupon, quoting, quote } = useCart();
  return (
    <dl className={`space-y-3 text-sm transition-opacity ${quoting ? "opacity-60" : ""}`} aria-busy={quoting}>
      <Row k="Subtotal" v={formatINR(subtotal)} />
      {discount > 0 && coupon && <Row k={`Discount (${coupon.code})`} v={`−${formatINR(discount)}`} cls="text-success" />}
      {!!quote?.loyalty?.amount_minor && <Row k={`Loyalty (${quote.loyalty.points.toLocaleString("en-IN")} points)`} v={`−${formatINR(quote.loyalty.amount_minor / 100)}`} cls="text-success" />}
      <Row k="Shipping" v={shipping === 0 ? "Free" : formatINR(shipping)} cls={shipping === 0 ? "text-success" : ""} />
      {tax > 0 && <Row k="GST" v={formatINR(tax)} />}
      <div className="flex justify-between border-t border-line pt-4 text-base font-semibold"><dt>Total</dt><dd className="text-xl">{formatINR(total)}</dd></div>
      {gstIncluded > 0 && <p className="text-xs text-ink-soft">Includes {formatINR(gstIncluded)} GST</p>}
    </dl>
  );
}
