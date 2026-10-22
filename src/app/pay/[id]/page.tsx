"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { ApiOrder } from "@/lib/account";
import { call } from "@/lib/http";
import { formatINR } from "@/lib/money";

/**
 * Stand-in for the gateway's hosted payment page, used only in development when the ERP has STORE_MOCK_PAYMENTS on
 * and the tenant has no Razorpay account. In production the shopper is sent to Razorpay instead and never lands here.
 */
export default function MockPay({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [o, setO] = useState<ApiOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    call<ApiOrder>(`/api/orders/${id}`).then((r) =>
      r.ok ? setO(r.data) : setError(r.error),
    );
  }, [id]);

  const pay = async () => {
    setBusy(true);
    setError(null);
    const r = await call(`/api/orders/${id}/mock-pay`, {
      method: "POST",
      body: {},
    });
    if (!r.ok) {
      setBusy(false);
      return setError(
        r.status === 404
          ? "Test payments are switched off on this server."
          : r.error,
      );
    }
    router.replace(`/checkout?order=${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Lock className="h-3.5 w-3.5" /> Test payment
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 text-center">
          <p className="rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">
            Development mode — no real money moves. Connect Razorpay in the ERP
            to take real payments.
          </p>
          {o ? (
            <>
              <p className="mt-6 text-sm text-ink-soft">
                Order #{o.order_number}
              </p>
              <p className="mt-1 font-heading text-4xl">
                {formatINR(o.total_minor / 100)}
              </p>
              <button
                onClick={pay}
                disabled={busy}
                className="mt-6 h-12 w-full rounded-full bg-ink text-sm font-medium text-cream hover:bg-taupe-dark disabled:opacity-60"
              >
                {busy ? "Processing…" : "Pay now (test)"}
              </button>
            </>
          ) : !error ? (
            <div className="mt-6 h-32 animate-pulse rounded-xl bg-sand" />
          ) : null}
          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}
          <Link
            href="/account/orders"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            Pay later
          </Link>
        </div>
      </div>
    </div>
  );
}
