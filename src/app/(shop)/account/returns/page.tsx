"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { useRemoteList } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { call } from "@/lib/http";
import { formatINR } from "@/lib/money";
import {
  longDate,
  PREFERENCES,
  REASONS,
  RETURN_STATUS,
  type CustomerReturn,
} from "@/lib/returns";

/** What each status means for the shopper, in a line. */
const NEXT: Record<CustomerReturn["status"], string> = {
  requested: "Waiting for the shop to review your request.",
  approved: "Approved. Send or bring the items back to the shop.",
  rejected: "The shop declined this request.",
  completed: "Done.",
  cancelled: "You cancelled this request.",
};

/** The shopper's return requests from the website, newest first, with their status. */
export default function ReturnsPage() {
  const { user } = useAuth();
  const sent = useSearchParams().get("sent") === "1";
  const { items, ready, error, reload } = useRemoteList<CustomerReturn>(
    "/api/me/returns",
    !!user,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!ready)
    return (
      <div
        className="h-64 animate-pulse rounded-2xl bg-sand"
        aria-label="Loading returns"
      />
    );

  const cancel = async (r: CustomerReturn) => {
    setBusy(r.id);
    setCancelError(null);
    const res = await call(`/api/me/returns/${r.id}/cancel`, {
      method: "POST",
      body: {},
    });
    setBusy(null);
    if (!res.ok) return setCancelError(res.error);
    await reload();
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-medium">Your Returns</h1>
      {sent && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-success/10 p-3 text-sm text-success"
        >
          Return request sent. The shop will review it and let you know.
        </p>
      )}
      {(error || cancelError) && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger"
        >
          {error || cancelError}
        </p>
      )}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <RotateCcw className="h-12 w-12 text-taupe" strokeWidth={1.2} />
          <p className="font-heading text-xl">No returns</p>
          <p className="text-sm text-ink-soft">
            To return something, open a delivered order in Orders and choose
            Return items.
          </p>
          <ButtonLink href="/account/orders" className="mt-2">
            Go to orders
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((r) => {
            const status = RETURN_STATUS[r.status];
            return (
              <li
                key={r.id}
                className="space-y-3 rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      Return #{r.return_number}
                    </span>
                    <span className="text-sm text-ink-soft">
                      Order #{r.order_number} · {longDate(r.created_at)}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${status.tone}`}
                  >
                    {status.label}
                  </span>
                </div>
                <ul className="text-sm">
                  {r.items.map((i) => (
                    <li key={i.sku} className="flex justify-between gap-4 py-1">
                      <span>
                        {i.name}{" "}
                        <span className="text-ink-soft">×{i.quantity}</span>
                      </span>
                      <span className="text-ink-soft">
                        {formatINR(i.amount_minor / 100)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-1 text-sm text-ink-soft">
                  <p>
                    <span className="text-ink">Reason:</span>{" "}
                    {REASONS.find((x) => x.value === r.reason_code)?.label ??
                      r.reason_code}
                    {r.reason_note ? ` — ${r.reason_note}` : ""}
                  </p>
                  {r.preference && (
                    <p>
                      <span className="text-ink">You asked for:</span>{" "}
                      {PREFERENCES[r.preference].label}
                    </p>
                  )}
                  {r.status === "completed" && r.refund_minor > 0 && (
                    <p>
                      <span className="text-ink">Refunded:</span>{" "}
                      {formatINR(r.refund_minor / 100)}
                      {r.refund_mode === "store_credit"
                        ? " as store credit"
                        : ""}
                    </p>
                  )}
                  {r.decision_note && (
                    <p>
                      <span className="text-ink">From the shop:</span>{" "}
                      {r.decision_note}
                    </p>
                  )}
                  <p>{NEXT[r.status]}</p>
                </div>
                {r.status === "requested" && (
                  <button
                    onClick={() => cancel(r)}
                    disabled={busy === r.id}
                    className="text-sm font-medium text-ink underline underline-offset-4 disabled:opacity-50"
                  >
                    {busy === r.id ? "Cancelling…" : "Cancel request"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
