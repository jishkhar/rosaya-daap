"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { call } from "@/lib/http";
import { saveDraft } from "@/lib/exchange";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { formatINR } from "@/lib/money";
import {
  longDate,
  pointsFor,
  PREFERENCES,
  REASONS,
  type Preference,
  type ReasonCode,
  type Returnable,
} from "@/lib/returns";

/** A dialog on the orders page. `return`: ask the shop to take items back, repaid as money or loyalty points. `exchange`: say what goes back, then
 * the shopper is sent to the shop to choose the replacement and confirms on /account/exchange. Nothing moves until the shop receives the goods. */
export function ReturnRequestModal({
  orderId: id,
  mode = "return",
  onClose,
}: {
  orderId: string;
  mode?: "return" | "exchange";
  onClose: () => void;
}) {
  const exchanging = mode === "exchange";
  const router = useRouter();
  useBodyScrollLock(true);
  const [r, setR] = useState<Returnable | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReasonCode | "">("");
  const [note, setNote] = useState("");
  const [preference, setPreference] = useState<Preference>("refund");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void call<Returnable>(`/api/me/orders/${id}/returnable`).then((res) => {
      if (!live) return;
      if (res.ok) setR(res.data);
      else setLoadError(res.error);
    });
    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const frame = (children: React.ReactNode) => (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ret-title"
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl bg-cream shadow-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h1 id="ret-title" className="font-heading text-2xl font-medium">
              {exchanging ? "Exchange items" : "Return items"}
            </h1>
            {r && (
              <p className="mt-1 text-sm text-ink-soft">
                Order #{r.order_number}
                {r.window.closes_on && r.window.open
                  ? ` · returns accepted until ${longDate(r.window.closes_on)}`
                  : ""}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="touch-target rounded-full p-2 hover:bg-sand"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );

  if (loadError)
    return frame(
      <p
        role="alert"
        className="rounded-xl bg-danger/10 p-3 text-sm text-danger"
      >
        {loadError}
      </p>,
    );
  if (!r)
    return frame(
      <div
        className="h-48 animate-pulse rounded-2xl bg-sand"
        aria-label="Loading"
      />,
    );

  const lines = r.lines.filter((l) => l.returnable_quantity > 0);
  const chosen = lines.filter((l) => (qty[l.order_item_id] ?? 0) > 0);
  const value = chosen.reduce(
    (s, l) => s + l.unit_refund_minor * qty[l.order_item_id],
    0,
  );
  // Money back or loyalty points. (Exchanges have their own flow; store credit stays a counter option for staff.)
  const options = (["refund", "loyalty_points"] as Preference[]).filter(
    (p) =>
      p === "refund" ||
      (p === "loyalty_points" && r.loyalty_enabled && r.loyalty.member),
  );
  const pointsHint = (p: Preference) =>
    p === "loyalty_points" && value > 0
      ? `You'd get about ${pointsFor(r, value).toLocaleString("en-IN")} points (worth ${formatINR(value / 100)}).`
      : PREFERENCES[p].hint;
  const canSend =
    r.window.open &&
    chosen.length > 0 &&
    !!reason &&
    (reason !== "other" || !!note.trim());

  const submit = async () => {
    if (exchanging) {
      saveDraft({
        orderId: id,
        orderNumber: r.order_number,
        items: chosen.map((l) => ({
          order_item_id: l.order_item_id,
          quantity: qty[l.order_item_id],
          name: l.name,
          unit_refund_minor: l.unit_refund_minor,
        })),
        reason: reason as ReasonCode,
        note: note.trim(),
        replacement: null,
      });
      onClose();
      router.push("/shop");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await call(`/api/me/orders/${id}/return-requests`, {
      method: "POST",
      body: {
        items: chosen.map((l) => ({
          order_item_id: l.order_item_id,
          quantity: qty[l.order_item_id],
        })),
        reason_code: reason,
        reason_note: note.trim() || null,
        preference,
      },
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onClose();
    router.push("/account/returns?sent=1");
  };

  const step = (itemId: string, max: number, by: number) =>
    setQty((q) => ({
      ...q,
      [itemId]: Math.min(max, Math.max(0, (q[itemId] ?? 0) + by)),
    }));

  return frame(
    <div className="space-y-6">
      {!r.window.open || lines.length === 0 ? (
        <p className="rounded-xl bg-sand p-4 text-sm">
          {lines.length === 0
            ? "Everything on this order has already been returned."
            : "This order can no longer be returned."}
        </p>
      ) : (
        <>
          <section aria-labelledby="ret-items">
            <h2 id="ret-items" className="mb-2 font-medium">
              What would you like to return?
            </h2>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
              {lines.map((l) => {
                const n = qty[l.order_item_id] ?? 0;
                return (
                  <li
                    key={l.order_item_id}
                    className="flex flex-wrap items-center gap-4 p-4"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{l.name}</span>
                      <span className="text-xs text-ink-soft">
                        {formatINR(l.unit_refund_minor / 100)} each ·{" "}
                        {l.returnable_quantity} can be returned
                      </span>
                    </span>
                    <span
                      className="flex items-center gap-2"
                      role="group"
                      aria-label={`Quantity of ${l.name} to return`}
                    >
                      <button
                        type="button"
                        aria-label="Fewer"
                        disabled={n === 0}
                        onClick={() =>
                          step(l.order_item_id, l.returnable_quantity, -1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-line disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span
                        className="w-6 text-center tabular-nums"
                        aria-live="polite"
                      >
                        {n}
                      </span>
                      <button
                        type="button"
                        aria-label="More"
                        disabled={n >= l.returnable_quantity}
                        onClick={() =>
                          step(l.order_item_id, l.returnable_quantity, 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-line disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-3">
            <label htmlFor="ret-reason" className="block font-medium">
              Why are you returning them?
            </label>
            <select
              id="ret-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReasonCode | "")}
              className="h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink"
            >
              <option value="">Choose a reason…</option>
              {REASONS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
            {reason === "other" ? (
              <>
                <label htmlFor="ret-note" className="block text-sm font-medium">
                  Please tell us the reason{" "}
                  <span className="font-normal text-ink-soft">(required)</span>
                </label>
                <input
                  id="ret-note"
                  type="text"
                  value={note}
                  maxLength={500}
                  required
                  placeholder="Type your reason here"
                  onChange={(e) => setNote(e.target.value)}
                  className="h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink"
                />
              </>
            ) : (
              <>
                <label
                  htmlFor="ret-note"
                  className="block text-sm text-ink-soft"
                >
                  Anything the shop should know? (optional)
                </label>
                <textarea
                  id="ret-note"
                  value={note}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white p-4 text-sm outline-none focus:border-ink"
                />
              </>
            )}
          </section>

          {!exchanging && options.length > 1 && (
            <fieldset className="space-y-2">
              <legend className="mb-2 font-medium">
                How would you like to be repaid?
              </legend>
              {options.map((p) => (
                <label
                  key={p}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${preference === p ? "border-ink" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="preference"
                    checked={preference === p}
                    onChange={() => setPreference(p)}
                    className="mt-1 accent-ink"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      {PREFERENCES[p].label}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {pointsHint(p)}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-danger/10 p-3 text-sm text-danger"
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <p className="text-sm text-ink-soft">
              {chosen.length > 0 ? (
                <>
                  Items value{" "}
                  <span className="font-semibold text-ink">
                    {formatINR(value / 100)}
                  </span>
                  .{" "}
                  {exchanging
                    ? "Next, choose the product you want instead."
                    : "The shop confirms the final amount once it receives them."}
                </>
              ) : (
                "Choose at least one item."
              )}
            </p>
            <Button size="lg" disabled={!canSend || busy} onClick={submit}>
              {exchanging
                ? "Choose replacement"
                : busy
                  ? "Sending…"
                  : "Send request"}
            </Button>
          </div>
        </>
      )}
    </div>,
  );
}
