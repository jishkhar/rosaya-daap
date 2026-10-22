"use client";

import { useState } from "react";
import { ChevronDown, Tag, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";

export function CouponBox({
  showAvailable = false,
}: {
  showAvailable?: boolean;
}) {
  const { coupon, applyCoupon, removeCoupon, discount, quote, quoting } =
    useCart();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = async (value: string) => {
    setBusy(true);
    const r = await applyCoupon(value);
    setBusy(false);
    setErr(r.ok ? null : r.reason);
    if (r.ok) setCode("");
  };

  return (
    <div className="space-y-3">
      {coupon ? (
        <div className="flex items-center justify-between rounded-xl border border-success/40 bg-success/5 px-4 py-3 text-sm">
          <span className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-success" />
            <b>{coupon.code}</b> applied — {coupon.label}
            {discount > 0 && ` (−${formatINR(discount)})`}
          </span>
          <button
            onClick={removeCoupon}
            aria-label="Remove coupon"
            className="rounded-full p-1 hover:bg-success/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await apply(code); // the server decides whether the code applies
          }}
        >
          <label htmlFor="coupon" className="sr-only">
            Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm uppercase placeholder:normal-case"
            />
            <button
              disabled={busy || quoting}
              className="h-11 rounded-full bg-taupe px-6 text-sm font-medium text-ink hover:bg-gold disabled:opacity-60"
            >
              {busy ? "…" : "Apply"}
            </button>
          </div>
        </form>
      )}
      {err && (
        <p role="alert" className="text-sm text-danger">
          {err}
        </p>
      )}
      {showAvailable && (
        <details
          aria-label="Available coupons"
          className="group rounded-xl border border-line bg-white"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-sand/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Available coupons
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-3 pb-3">
            {quoting || !quote ? (
              <p role="status" className="text-xs text-ink-soft">
                Checking offers for your bag…
              </p>
            ) : quote.available_coupons?.length ? (
              <ul className="space-y-2">
                {quote.available_coupons.map((offer) => (
                  <li
                    key={offer.code}
                    className="rounded-xl border border-dashed border-line bg-sand/30 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-semibold tracking-wide">
                          {offer.code}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {offer.name} · {offer.label}
                        </p>
                        {offer.amount_minor != null &&
                          offer.amount_minor > 0 && (
                            <p className="mt-1 text-xs text-success">
                              Save {formatINR(offer.amount_minor / 100)}
                            </p>
                          )}
                      </div>
                      <button
                        type="button"
                        aria-label={`Apply coupon ${offer.code}`}
                        onClick={() => apply(offer.code)}
                        disabled={
                          busy ||
                          !offer.applicable ||
                          coupon?.code === offer.code
                        }
                        className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
                      >
                        {coupon?.code === offer.code ? "Applied" : "Apply"}
                      </button>
                    </div>
                    {offer.reason && (
                      <p className="mt-2 text-xs text-ink-soft">
                        {offer.reason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-soft">
                No coupons available for your account right now.
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
