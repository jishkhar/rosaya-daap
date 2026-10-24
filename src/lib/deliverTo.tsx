"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { call } from "@/lib/http";
import { PINCODE_RE } from "@/lib/pincode";

/** The ERP's answer for a pincode (GET /api/serviceability): the same check checkout and the order make. */
export type DeliveryAnswer = {
  pincode: string;
  serviceable: boolean;
  reason: string | null;
  message: string | null;
  place: { district: string; state: string } | null;
  zone: string | null;
  fee_minor: number;
  free_above_minor: number | null;
  min_days: number | null;
  max_days: number | null;
  cod_allowed: boolean;
  cod_max_minor: number | null;
};

type Ctx = {
  /** The shopper's remembered pincode ("Deliver to" in the header), or null. */
  pin: string | null;
  answer: DeliveryAnswer | null;
  /** Ask about a pincode (optionally for one item) and remember it as the shopper's. */
  check: (
    pin: string,
    item?: { variantId: string; quantity: number },
  ) => Promise<DeliveryAnswer | { error: string }>;
  forget: () => void;
};

const KEY = "deliver_to"; // per browser: { pin, answer, at }
const FRESH_MS = 60 * 60 * 1000; // re-ask after an hour (zones or stock may change)
const DeliverToContext = createContext<Ctx | null>(null);

function read(): {
  pin: string;
  answer: DeliveryAnswer | null;
  at: number;
} | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.pin === "string" && PINCODE_RE.test(v.pin) ? v : null;
  } catch {
    return null; // private mode, blocked storage
  }
}

function write(v: { pin: string; answer: DeliveryAnswer | null } | null) {
  try {
    if (v)
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ ...v, at: Date.now() }),
      );
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: the pincode is simply not remembered */
  }
}

async function ask(
  pin: string,
  item?: { variantId: string; quantity: number },
) {
  const q = item
    ? `?variant_id=${item.variantId}&quantity=${item.quantity}`
    : "";
  const r = await call<Omit<DeliveryAnswer, "pincode">>(
    `/api/serviceability/${pin}${q}`,
  );
  return r.ok ? { ...r.data, pincode: pin } : { error: r.error };
}

export function DeliverToProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    pin: string | null;
    answer: DeliveryAnswer | null;
  }>({ pin: null, answer: null });

  useEffect(() => {
    const saved = read();
    if (!saved) return;
    if (saved.answer && Date.now() - saved.at < FRESH_MS) {
      setState({ pin: saved.pin, answer: saved.answer }); // eslint-disable-line react-hooks/set-state-in-effect -- browser storage is only readable after mount
      return;
    }
    void ask(saved.pin).then((a) => {
      const answer = "error" in a ? null : a;
      setState({ pin: saved.pin, answer });
      write({ pin: saved.pin, answer });
    });
  }, []);

  const check = useCallback<Ctx["check"]>(async (pin, item) => {
    const a = await ask(pin, item);
    if ("error" in a) return a;
    if (a.reason !== "unknown_pincode") {
      const general = item ? null : a; // an item's answer (stock) is not the pincode's general answer
      setState((cur) => ({
        pin,
        answer: general ?? (cur.pin === pin ? cur.answer : null),
      }));
      write({ pin, answer: general });
    }
    return a;
  }, []);

  const forget = useCallback(() => {
    setState({ pin: null, answer: null });
    write(null);
  }, []);

  const value = useMemo(
    () => ({ ...state, check, forget }),
    [state, check, forget],
  );
  return (
    <DeliverToContext.Provider value={value}>
      {children}
    </DeliverToContext.Provider>
  );
}

export function useDeliverTo() {
  const ctx = useContext(DeliverToContext);
  if (!ctx) throw new Error("useDeliverTo outside DeliverToProvider");
  return ctx;
}

/** "Delivery in 1–2 days", "Free delivery", "Cash on delivery up to ₹5,000" … for an answer, as short parts to join. */
export function answerParts(
  a: DeliveryAnswer,
  rupees: (n: number) => string,
): string[] {
  const days =
    a.min_days == null || a.max_days == null
      ? null
      : `Delivery in ${a.min_days === a.max_days ? a.min_days : `${a.min_days}–${a.max_days}`} business ${a.max_days === 1 ? "day" : "days"}`;
  const fee =
    a.fee_minor === 0
      ? "Free delivery"
      : a.free_above_minor != null
        ? `${rupees(a.fee_minor / 100)} delivery, free from ${rupees(a.free_above_minor / 100)}`
        : `${rupees(a.fee_minor / 100)} delivery`;
  const cod = a.cod_allowed
    ? a.cod_max_minor != null
      ? `Cash on delivery up to ${rupees(a.cod_max_minor / 100)}`
      : "Cash on delivery available"
    : "Pay online (no cash on delivery)";
  return [days, fee, cod].filter((x): x is string => !!x);
}
