"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { call } from "@/lib/http";
import { formatINR } from "@/lib/money";
import type { ApiOrder } from "@/lib/account";

export function CancelOrder({
  order,
  onCancelled,
}: {
  order: ApiOrder;
  onCancelled: (message: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 rounded-full border border-danger px-5 text-sm font-medium text-danger hover:bg-danger/5"
      >
        Cancel order
      </button>
      {open && (
        <CancelOrderDialog
          order={order}
          onClose={() => setOpen(false)}
          onCancelled={onCancelled}
        />
      )}
    </>
  );
}

function CancelOrderDialog({
  order,
  onClose,
  onCancelled,
}: {
  order: ApiOrder;
  onClose: () => void;
  onCancelled: (message: string) => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const sending = useRef(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || !reason.trim()) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    const result = await call<{ refund_due_minor: number }>(
      `/api/me/orders/${order.id}/cancel`,
      {
        method: "POST",
        body: { reason: reason.trim() },
      },
    );
    if (!result.ok) {
      setError(result.error);
      sending.current = false;
      setBusy(false);
      return;
    }
    const refund = result.data.refund_due_minor;
    await onCancelled(
      `Order #${order.order_number} cancelled.${refund > 0 ? ` A refund of ${formatINR(refund / 100)} is due; the shop will arrange it.` : ""}`,
    );
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="cancel-order-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-white p-6 text-ink backdrop:bg-ink/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="cancel-order-title" className="font-heading text-2xl">
          Cancel order #{order.order_number}?
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close cancellation"
          className="rounded-full p-2 hover:bg-sand disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        This cancels the entire order. Any payment already collected will be
        refunded separately by the shop.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-sm font-medium" htmlFor="cancel-reason">
          Reason for cancellation
        </label>
        <textarea
          id="cancel-reason"
          required
          maxLength={500}
          rows={3}
          disabled={busy}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="w-full rounded-xl border border-line p-3 text-sm focus:border-ink focus:outline-none"
        />
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger/10 p-3 text-sm text-danger"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-11 rounded-full border border-line px-5 text-sm font-medium"
          >
            Keep order
          </button>
          <button
            type="submit"
            disabled={busy || !reason.trim()}
            className="h-11 rounded-full bg-danger px-5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Confirm cancellation"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
