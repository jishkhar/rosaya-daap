"use client";

/**
 * Razorpay Checkout on our own payment page (docs/storefront_payments.md). The shopper picks how to pay on our page; Razorpay's secure
 * window then opens at exactly that choice (card details are typed into Razorpay's frame, never ours). Its signed answer goes to the
 * store API, which checks it with Razorpay before the order is marked paid.
 */

export type PaymentChoice =
  | { method: "upi" }
  | { method: "card" }
  | { method: "netbanking"; bank?: string }
  | { method: "wallet" }
  | { method: "emi" };

/** What the store API returns to open Checkout (POST /orders/{id}/pay, or the checkout's own answer). */
export type CheckoutStart = {
  key_id: string;
  razorpay_order_id: string;
  amount_minor: number;
  currency: string;
  description: string;
  notes: Record<string, string>;
  prefill: {
    name?: string | null;
    email?: string | null;
    contact?: string | null;
  };
};

export type CheckoutPaid = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/** What the shop's Razorpay account takes (GET /payment-options). */
export type PaymentOptions = {
  available: boolean;
  upi?: boolean;
  card?: boolean;
  wallet?: boolean;
  emi?: boolean;
  popular_banks?: [string, string][];
  banks?: [string, string][];
};

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (e: unknown) => void) => void;
};
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

let loading: Promise<RazorpayCtor> | null = null;

/** Loads Razorpay's Checkout script once. */
export function loadCheckout(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  loading ??= new Promise<RazorpayCtor>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () =>
      w.Razorpay
        ? resolve(w.Razorpay)
        : reject(new Error("Razorpay did not load."));
    s.onerror = () => {
      loading = null;
      reject(
        new Error(
          "Couldn't reach Razorpay. Check your connection and try again.",
        ),
      );
    };
    document.body.appendChild(s);
  });
  return loading;
}

/** Only the chosen way, so the window opens straight at it (Razorpay's display blocks). No choice = Razorpay's full list. */
function display(choice?: PaymentChoice) {
  if (!choice) return undefined;
  const instrument =
    choice.method === "netbanking" && choice.bank
      ? { method: "netbanking", banks: [choice.bank] }
      : { method: choice.method };
  return {
    display: {
      blocks: { chosen: { name: "Pay with", instruments: [instrument] } },
      sequence: ["block.chosen"],
      preferences: { show_default_blocks: false },
    },
  };
}

/**
 * Opens Checkout. Resolves with Razorpay's signed answer once the shopper has paid, or null if they closed the window. A failed attempt
 * keeps the window open (Razorpay lets them try again there).
 */
export async function openCheckout(opts: {
  start: CheckoutStart;
  shopName: string;
  logo?: string;
  choice?: PaymentChoice;
  colour?: string;
}): Promise<CheckoutPaid | null> {
  const Razorpay = await loadCheckout();
  const { start, choice } = opts;
  return new Promise((resolve) => {
    const rz = new Razorpay({
      key: start.key_id,
      order_id: start.razorpay_order_id,
      amount: start.amount_minor,
      currency: start.currency,
      name: opts.shopName,
      description: start.description,
      image: opts.logo || undefined,
      notes: start.notes,
      prefill: {
        name: start.prefill.name ?? undefined,
        email: start.prefill.email ?? undefined,
        contact: start.prefill.contact ?? undefined,
        ...(choice ? { method: choice.method } : {}),
        ...(choice?.method === "netbanking" && choice.bank
          ? { bank: choice.bank }
          : {}),
      },
      config: display(choice),
      theme: { color: opts.colour ?? "#43262b" },
      handler: (paid: CheckoutPaid) => resolve(paid),
      modal: { ondismiss: () => resolve(null), confirm_close: true },
      retry: { enabled: true },
    });
    rz.open();
  });
}
