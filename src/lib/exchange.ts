"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ReasonCode } from "@/lib/returns";

/** An exchange in progress. The shopper picks what goes back, is sent to the shop to choose the replacement, and confirms on /account/exchange.
 * Kept in this browser only (nothing is asked of the shop until they confirm). */
export type ExchangeDraft = {
  orderId: string;
  orderNumber: string;
  items: {
    order_item_id: string;
    quantity: number;
    name: string;
    unit_refund_minor: number;
  }[];
  reason: ReasonCode;
  note: string;
  replacement: {
    variant_id: string;
    quantity: number;
    title: string;
    size?: string;
    image?: string;
    /** rupees, as the catalogue shows it; the shop's quote has the real figures */
    price: number;
  } | null;
};

const KEY = "exchange-draft";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const read = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function saveDraft(draft: ExchangeDraft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* private mode: the exchange just can't be started */
  }
  emit();
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

/** The exchange in progress, or null. Null on the server and on the first paint, so pages render the same HTML either way. */
export function useExchangeDraft(): ExchangeDraft | null {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ExchangeDraft;
    } catch {
      return null;
    }
  }, [raw]);
}

export const draftValue = (d: ExchangeDraft) =>
  d.items.reduce((s, i) => s + i.unit_refund_minor * i.quantity, 0);

/** What the shop's quote says (all money in paise). */
export type ExchangeQuote = {
  returned_value_minor: number;
  credit_minor: number;
  replacement_total_minor: number;
  due_minor: number;
  pay_by: "cod" | "online" | null;
  surplus_minor: number;
  surplus_points: number;
  points_possible: boolean;
  outcome: "even" | "pay" | "points";
};
