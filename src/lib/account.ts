"use client";

import { useCallback, useEffect, useState } from "react";
import { call } from "@/lib/http";

/** Account data as the ERP store API returns it (money in paise). */
export type OrderItem = {
  variant_id: string;
  title: string;
  quantity: number;
  unit_price_minor: number;
  discount_minor: number;
  line_total_minor: number;
  slug: string | null;
  image: string | null;
  size: string | null;
};
export type ApiOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  placed_at: string;
  total_minor: number;
  discount_minor: number;
  paid_minor: number;
  payment_method: "cod" | "online" | null;
  payment_url: string | null;
  delivery_address: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  items: OrderItem[];
};
export type Address = {
  id: string;
  label: string | null;
  name: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  pincode: string | null;
  city: string | null;
  state: string | null;
  is_default: boolean;
};

export type OrderStage =
  "Placed" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Cancelled";
export const STATUS_STEPS: OrderStage[] = [
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
];

/** The ERP's order status, in the words a shopper expects. */
export function stageOf(status: string): OrderStage {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "preparing":
    case "ready":
      return "Packed";
    case "out_for_delivery":
    case "shipped":
      return "Shipped";
    case "completed":
      return "Delivered";
    case "cancelled":
    case "refunded":
    case "failed":
      return "Cancelled";
    default:
      return "Placed";
  }
}

export const addressLine = (a: {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}) =>
  [a.line1, a.line2, a.city, [a.state, a.pincode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

/** Load a list from an /api route once the customer is known. */
export function useRemoteList<T>(path: string, enabled: boolean) {
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const r = await call<{ items: T[] }>(path);
    if (r.ok) setItems(r.data.items);
    setError(r.ok ? null : r.error);
    setReady(true);
  }, [path]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { items, ready, error, reload };
}
