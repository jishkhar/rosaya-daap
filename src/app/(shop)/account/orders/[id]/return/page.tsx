"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { call } from "@/lib/http";
import { formatINR } from "@/lib/money";
import {
  longDate,
  PREFERENCES,
  REASONS,
  type Preference,
  type ReasonCode,
  type Returnable,
} from "@/lib/returns";

/** Ask the shop to take items of a delivered order back. Nothing is refunded until the shop receives them. */
export default function ReturnRequestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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

  const back = (
    <Link
      href="/account/orders"
      className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" /> Back to orders
    </Link>
  );
  if (loadError)
    return (
      <div className="space-y-4">
        {back}
        <p
          role="alert"
          className="rounded-xl bg-danger/10 p-3 text-sm text-danger"
        >
          {loadError}
        </p>
      </div>
    );
  if (!r)
    return (
      <div
        className="h-64 animate-pulse rounded-2xl bg-sand"
        aria-label="Loading"
      />
    );

  const lines = r.lines.filter((l) => l.returnable_quantity > 0);
  const chosen = lines.filter((l) => (qty[l.order_item_id] ?? 0) > 0);
  const value = chosen.reduce(
    (s, l) => s + l.unit_refund_minor * qty[l.order_item_id],
    0,
  );
  const options = (Object.keys(PREFERENCES) as Preference[]).filter(
    (p) =>
      p === "refund" ||
      (p === "exchange" && r.exchanges_enabled) ||
      (p === "store_credit" && r.store_credit_enabled),
  );
  const canSend =
    r.window.open &&
    chosen.length > 0 &&
    !!reason &&
    (reason !== "other" || !!note.trim());

  const submit = async () => {
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
    router.push("/account/returns?sent=1");
  };

  const step = (itemId: string, max: number, by: number) =>
    setQty((q) => ({
      ...q,
      [itemId]: Math.min(max, Math.max(0, (q[itemId] ?? 0) + by)),
    }));

  return (
    <div className="space-y-6">
      {back}
      <div>
        <h1 className="font-heading text-3xl font-medium">Return items</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Order #{r.order_number}
          {r.window.closes_on && r.window.open
            ? ` · returns accepted until ${longDate(r.window.closes_on)}`
            : ""}
        </p>
      </div>

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
            <label htmlFor="ret-note" className="block text-sm text-ink-soft">
              Anything the shop should know?
              {reason === "other" ? " (required)" : " (optional)"}
            </label>
            <textarea
              id="ret-note"
              value={note}
              maxLength={500}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-line bg-white p-4 text-sm outline-none focus:border-ink"
            />
          </section>

          {options.length > 1 && (
            <fieldset className="space-y-2">
              <legend className="mb-2 font-medium">
                What would you like instead?
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
                      {PREFERENCES[p].hint}
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
                  . The shop confirms the final amount once it receives them.
                </>
              ) : (
                "Choose at least one item."
              )}
            </p>
            <Button size="lg" disabled={!canSend || busy} onClick={submit}>
              {busy ? "Sending…" : "Send return request"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
