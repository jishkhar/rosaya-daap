import { formatINR } from "@/lib/money";

/** The shop's delivery fee and time (portal Settings > Shipping and delivery), money in paise. Checkout charges what the ERP quotes;
 * this is only for the words on the pages. */
export type Shipping = {
  fee_minor: number;
  free_above_minor: number | null;
  delivery_min_days: number | null;
  delivery_max_days: number | null;
};

/** "Free delivery on every order", "Free delivery on orders of ₹1,999 or more", "Delivery ₹99"; null when unknown. */
export function feeText(s: Shipping | null): string | null {
  if (!s) return null;
  if (s.fee_minor === 0) return "Free delivery on every order";
  if (s.free_above_minor != null)
    return `Free delivery on orders of ${formatINR(s.free_above_minor / 100)} or more`;
  return `Delivery ${formatINR(s.fee_minor / 100)}`;
}

/** "5–6 business days" (or "3 business days"); null when the shop shows no delivery time. */
export function daysText(s: Shipping | null): string | null {
  if (!s || s.delivery_min_days == null || s.delivery_max_days == null)
    return null;
  const days =
    s.delivery_min_days === s.delivery_max_days
      ? `${s.delivery_min_days}`
      : `${s.delivery_min_days}–${s.delivery_max_days}`;
  return `${days} business ${s.delivery_max_days === 1 ? "day" : "days"}`;
}
