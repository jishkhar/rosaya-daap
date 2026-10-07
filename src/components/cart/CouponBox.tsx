"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";

export function CouponBox() {
  const { coupon, applyCoupon, removeCoupon, discount } = useCart();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (coupon)
    return (
      <div className="flex items-center justify-between rounded-xl border border-success/40 bg-success/5 px-4 py-3 text-sm">
        <span className="flex items-center gap-2"><Tag className="h-4 w-4 text-success" /><b>{coupon.code}</b> applied — {coupon.label}{discount > 0 && ` (−${formatINR(discount)})`}</span>
        <button onClick={removeCoupon} aria-label="Remove coupon" className="rounded-full p-1 hover:bg-success/10"><X className="h-4 w-4" /></button>
      </div>
    );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await applyCoupon(code); // the server decides whether the code applies
        setBusy(false);
        setErr(r.ok ? null : r.reason);
        if (r.ok) setCode("");
      }}
    >
      <label htmlFor="coupon" className="sr-only">Coupon code</label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm uppercase placeholder:normal-case" />
        <button disabled={busy} className="h-11 rounded-full bg-taupe px-6 text-sm font-medium text-ink hover:bg-gold disabled:opacity-60">{busy ? "…" : "Apply"}</button>
      </div>
      {err && <p role="alert" className="mt-2 text-sm text-danger">{err}</p>}
    </form>
  );
}
