"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { call } from "@/lib/http";
import { useAuth } from "@/lib/auth";

export type CartItem = {
  key: string;
  /** the ERP sells variants: this is what an order line is made of */
  variantId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  mrp: number | null;
  qty: number;
  size?: string;
};

export type QuoteLine = {
  variant_id: string; slug: string | null; title: string; image?: string | null; size?: string | null;
  unit_price_minor?: number; mrp_minor?: number | null; quantity: number; max_qty: number; available: boolean;
};
export type Quote = {
  loyalty: { balance_points: number; conversion_points: number; conversion_value_minor: number; max_points: number; points: number; amount_minor: number; ok: boolean; reason: string | null };
  available_coupons: { code: string; name: string; label: string; amount_minor: number | null; min_order_minor: number; applicable: boolean; reason: string | null }[];
  lines: QuoteLine[];
  issues: { variant_id: string; kind: "unavailable" | "out_of_stock" | "reduced"; message: string; max_qty?: number }[];
  can_checkout: boolean;
  coupon: ({ ok: true; code: string; label: string; amount_minor: number; free_delivery: boolean } | { ok: false; code: string; reason: string }) | null;
  tax_minor: number;
  tax_inclusive: boolean;
  items_minor: number;
  coupon_discount_minor: number;
  shipping_minor: number;
  grand_total_minor: number;
  free_shipping_above_minor: number | null;
};

type Ctx = {
  loyaltyPoints: number;
  setLoyaltyPoints: (points: number) => void;
  items: CartItem[];
  count: number;
  /** server-priced figures in rupees (local estimates until the first quote arrives) */
  subtotal: number;
  ready: boolean;
  storageError: string | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  quote: Quote | null;
  quoting: boolean;
  issues: Quote["issues"];
  canCheckout: boolean;
  coupon: Extract<NonNullable<Quote["coupon"]>, { ok: true }> | null;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
  removeCoupon: () => void;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  /** GST contained in the total (tax-inclusive prices) */
  gstIncluded: number;
  freeShippingAbove: number | null;
  toFreeShipping: number;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "store.cart.v2";
const COUPON_KEY = "store.coupon.v2";
// Names before the storefront served many shops: a guest bag saved under them moves over once.
const LEGACY_KEYS: [string, string][] = [["rosaya.cart.v2", KEY], ["rosaya.coupon.v2", COUPON_KEY]];

function adoptLegacyStorage() {
  for (const [old, key] of LEGACY_KEYS) {
    const value = localStorage.getItem(old);
    if (value === null) continue;
    if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    localStorage.removeItem(old);
  }
}
const MAX_QTY = 10;

const payloadOf = (items: CartItem[], code: string | null) => ({
  items: items.map((i) => ({ variant_id: i.variantId, quantity: i.qty })),
  coupon_code: code || null,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const customerId = user?.id ?? null;
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState<string | null | undefined>(undefined);
  const [storageError, setStorageError] = useState<string | null>(null);
  const ready = authReady && owner === customerId;
  const writeQueue = useRef<Promise<unknown>>(Promise.resolve());
  const activeCustomer = useRef(customerId);
  useEffect(() => { activeCustomer.current = customerId; }, [customerId]);

  // Resolve authentication before choosing a storage location. Never copy an account cart to the guest basket.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout>;
    setOwner(undefined);
    setItems([]);
    setCouponCode(null);
    setLoyaltyPoints(0);
    setQuote(null);
    setStorageError(null);
    const hydrate = async () => {
      let guest: CartItem[] = [];
      let guestCoupon: string | null = null;
      try {
        adoptLegacyStorage();
        const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
        if (Array.isArray(parsed)) guest = parsed.filter((i) => i && typeof i.variantId === "string" && Number.isInteger(i.qty) && i.qty > 0);
        guestCoupon = localStorage.getItem(COUPON_KEY);
      } catch {}
      let next = guest;
      let code = guestCoupon;
      if (customerId) {
        // Wait for previous writes before restoring an account on this browser.
        await writeQueue.current;
        if (cancelled) return;
        const result = await call<{ items: CartItem[]; coupon_code: string | null }>("/api/basket");
        if (cancelled) return;
        if (!result.ok) {
          setStorageError("Couldn't load your saved bag. Retrying…");
          retry = setTimeout(hydrate, 3000);
          return;
        }
        const merged = new Map(result.data.items.map((i) => [i.variantId, i]));
        for (const item of guest) {
          const saved = merged.get(item.variantId);
          // Taking the larger quantity makes retrying a guest import safe.
          merged.set(item.variantId, { ...item, ...saved, qty: Math.min(MAX_QTY, Math.max(item.qty, saved?.qty ?? 0)) });
        }
        next = [...merged.values()];
        code = guestCoupon || result.data.coupon_code;
        if (guest.length || guestCoupon) {
          const saved = await call("/api/basket", { method: "PUT", body: payloadOf(next, code) });
          if (cancelled) return;
          if (!saved.ok) {
            setStorageError("Couldn't save your bag. Retrying…");
            retry = setTimeout(hydrate, 3000);
            return;
          }
          try { localStorage.removeItem(KEY); localStorage.removeItem(COUPON_KEY); } catch {}
        }
      }
      if (cancelled) return;
      setItems(next);
      setCouponCode(code);
      setStorageError(null);
      setOwner(customerId);
    };
    void hydrate();
    return () => { cancelled = true; clearTimeout(retry); };
  }, [authReady, customerId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    if (!customerId) {
      try {
        localStorage.setItem(KEY, JSON.stringify(items));
        if (couponCode) localStorage.setItem(COUPON_KEY, couponCode);
        else localStorage.removeItem(COUPON_KEY);
      } catch {}
      return;
    }
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout>;
    const body = payloadOf(items, couponCode);
    const persist = () => {
      // Serialize writes so an older response cannot overwrite a newer edit.
      writeQueue.current = writeQueue.current.then(async () => {
        if (cancelled || activeCustomer.current !== customerId) return;
        const result = await call("/api/basket", { method: "PUT", body });
        if (cancelled) return;
        setStorageError(result.ok ? null : "Couldn't save your bag. Retrying…");
        if (!result.ok) retry = setTimeout(persist, 3000);
      });
    };
    persist();
    return () => { cancelled = true; clearTimeout(retry); };
  }, [items, couponCode, ready, customerId]);

  // The server is the source of truth for prices, stock and discounts: re-quote whenever the basket or code changes.
  const sig = JSON.stringify({ ...payloadOf(items, couponCode), loyalty_points: loyaltyPoints });
  const latest = useRef(items);
  useEffect(() => {
    latest.current = items;
  }, [items]);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!ready || !authReady) return;
    if (JSON.parse(sig).items.length === 0) {
      setQuote(null);
      setQuoting(false);
      return;
    }
    const ctrl = new AbortController();
    setQuoting(true);
    const t = setTimeout(async () => {
      const r = await call<Quote>("/api/basket/quote", { method: "POST", body: JSON.parse(sig), signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      if (!r.ok) {
        if (r.code !== "aborted") { setQuote(null); setQuoting(false); }
        return;
      }
      setQuote(r.data);
      setQuoting(false);
      // Take the server's prices/titles/images; trim a quantity the shelf can no longer cover.
      setItems((prev) => {
        const byId = new Map(r.data.lines.map((l) => [l.variant_id, l]));
        const next = prev.map((i) => {
          const l = byId.get(i.variantId);
          if (!l || !l.available || l.unit_price_minor == null) return i;
          return {
            ...i, title: l.title, image: l.image ?? i.image, price: l.unit_price_minor / 100,
            mrp: l.mrp_minor && l.mrp_minor > l.unit_price_minor ? l.mrp_minor / 100 : null,
            qty: Math.max(1, Math.min(i.qty, l.max_qty || i.qty)),
          };
        });
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
      });
      // A code that no longer applies (e.g. basket dropped under its minimum) is released rather than silently kept.
      if (r.data.coupon && !r.data.coupon.ok) setCouponCode(null);
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [sig, ready, authReady, customerId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const add: Ctx["add"] = useCallback((item, qty = 1) => {
    if (!ready) return;
    const key = item.variantId;
    setItems((prev) => {
      const hit = prev.find((i) => i.key === key);
      if (hit) return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, i.qty + qty) } : i));
      return [...prev, { ...item, key, qty: Math.min(MAX_QTY, qty) }];
    });
    setOpen(true);
  }, [ready]);

  const setQty = useCallback(
    (key: string, qty: number) =>
      setItems((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty: Math.min(MAX_QTY, qty) } : i)))),
    [],
  );
  const remove = useCallback((key: string) => setItems((p) => p.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => {
    setItems([]);
    setCouponCode(null);
    setLoyaltyPoints(0);
    setQuote(null);
  }, []);

  const applyCoupon: Ctx["applyCoupon"] = useCallback(async (code) => {
    const c = code.trim();
    if (!c) return { ok: false, reason: "Enter a coupon code." };
    const r = await call<Quote>("/api/basket/quote", { method: "POST", body: { ...payloadOf(latest.current, c), loyalty_points: loyaltyPoints } });
    if (!r.ok) return { ok: false, reason: r.error };
    if (r.data.coupon?.ok) {
      setQuote(r.data);
      setCouponCode(r.data.coupon.code);
      return { ok: true };
    }
    return { ok: false, reason: r.data.coupon && !r.data.coupon.ok ? r.data.coupon.reason : "This code isn't valid or has expired." };
  }, [loyaltyPoints]);

  const value = useMemo<Ctx>(() => {
    const local = items.reduce((s, i) => s + i.price * i.qty, 0);
    const coupon = quote?.coupon?.ok ? quote.coupon : null;
    const subtotal = quote ? quote.items_minor / 100 : local;
    const discount = quote ? quote.coupon_discount_minor / 100 : 0;
    const shipping = quote ? quote.shipping_minor / 100 : 0;
    const total = quote ? quote.grand_total_minor / 100 : local;
    const above = quote?.free_shipping_above_minor != null ? quote.free_shipping_above_minor / 100 : null;
    return {
      items, count: items.reduce((s, i) => s + i.qty, 0), subtotal, ready, storageError, open, setOpen, add, setQty, remove, clear,
      loyaltyPoints, setLoyaltyPoints,
      quote, quoting, issues: quote?.issues ?? [], canCheckout: ready && !!quote?.can_checkout && !quoting && (quote?.loyalty?.points ?? 0) === loyaltyPoints,
      coupon, couponError: quote?.coupon && !quote.coupon.ok ? quote.coupon.reason : null, applyCoupon,
      removeCoupon: () => setCouponCode(null),
      discount, shipping, total,
      tax: quote && !quote.tax_inclusive ? quote.tax_minor / 100 : 0,
      gstIncluded: quote?.tax_inclusive ? quote.tax_minor / 100 : 0,
      freeShippingAbove: above,
      toFreeShipping: above == null ? 0 : Math.max(0, above - (subtotal - discount)),
    };
  }, [items, quote, quoting, ready, storageError, open, add, setQty, remove, clear, applyCoupon, loyaltyPoints]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
