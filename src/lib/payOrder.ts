"use client";

import type { Brand } from "@/lib/brand";
import { call, goTo } from "@/lib/http";
import { openCheckout, type CheckoutStart } from "@/lib/razorpay";

type PayStart = {
  mode: "checkout" | "gateway" | "mock" | "paid";
  url: string | null;
  checkout?: CheckoutStart;
};

/** What the store API answers when a payment is started (orders/{id}/pay, or an exchange's difference). */
export type { PayStart };

/**
 * Carries a started payment through: opens Razorpay's window for Checkout (its signed answer is checked by the store API before anything
 * is marked paid), or sends the shopper to the hosted / mock page. Resolves with an error to show, or null (paid, or the window was
 * closed: the caller reloads either way).
 */
export async function payStarted(
  orderId: string,
  start: PayStart,
  brand: Brand,
): Promise<string | null> {
  if (start.mode === "checkout" && start.checkout) {
    try {
      const paid = await openCheckout({
        start: start.checkout,
        shopName: brand.name,
        logo: brand.logo,
      });
      if (!paid) return null;
      const c = await call(`/api/orders/${orderId}/pay/confirm`, {
        method: "POST",
        body: paid,
      });
      return c.ok ? null : c.error;
    } catch (e) {
      return e instanceof Error
        ? e.message
        : "Couldn't open the payment window.";
    }
  }
  if (start.url) goTo(start.url);
  else if (start.mode === "mock") goTo(`/pay/${orderId}`);
  return null;
}

/**
 * Pays an order that is still unpaid: an online order whose payment didn't go through, or a cash-on-delivery order before it ships.
 * Opens Razorpay's window with every way the shop takes; its signed answer is checked by the store API before the order is marked paid.
 * Resolves with an error to show, or null (paid, or the window was closed: the caller reloads the order either way).
 */
export async function payOrder(
  orderId: string,
  brand: Brand,
): Promise<string | null> {
  const r = await call<PayStart>(`/api/orders/${orderId}/pay`, {
    method: "POST",
    body: {},
  });
  if (!r.ok) return r.error;
  return payStarted(orderId, r.data, brand);
}
