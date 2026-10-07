"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { addressLine, type ApiOrder } from "@/lib/account";
import { call, goTo } from "@/lib/http";
import { formatINR } from "@/lib/money";

/** Order confirmation. An online payment is confirmed by the gateway's webhook, so this page checks the order itself rather than trusting the redirect. */
export default function OrderSuccess({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [o, setO] = useState<ApiOrder | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await call<ApiOrder>(`/api/orders/${id}`);
    if (r.ok) setO(r.data);
    else if (r.status === 404 || r.status === 422) setMissing(true);
    return r.ok ? r.data : null;
  }, [id]);

  const waiting = !!o && o.payment_method === "online" && o.payment_status !== "paid" && o.status === "pending";

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  // Right after paying, the webhook may not have landed yet: look again for a short while.
  useEffect(() => {
    if (!waiting) return;
    let n = 0;
    const t = setInterval(() => (++n > 12 ? clearInterval(t) : void load()), 2500);
    return () => clearInterval(t);
  }, [waiting, load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const payNow = async () => {
    setError(null);
    const r = await call<{ mode: string; url: string | null }>(`/api/orders/${id}/pay`, { method: "POST", body: {} });
    if (!r.ok) return setError(r.error);
    if (r.data.url) goTo(r.data.url);
    else if (r.data.mode === "mock") goTo(`/pay/${id}`);
    else void load();
  };

  if (missing)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-heading text-2xl">We couldn&apos;t find that order</p>
        <ButtonLink href="/shop" size="lg" className="mt-6">Continue shopping</ButtonLink>
      </div>
    );
  if (!o) return <div className="mx-auto h-96 max-w-xl animate-pulse rounded-2xl bg-sand" aria-label="Loading your order" />;

  const first = o.delivery_address?.name?.split(" ")[0];
  const cancelled = ["cancelled", "failed", "refunded"].includes(o.status);
  const count = o.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
      {cancelled ? (
        <>
          <h1 className="font-heading text-4xl font-medium">Order cancelled</h1>
          <p className="mt-3 text-ink-soft">Order <b className="text-ink">#{o.order_number}</b> was cancelled{o.payment_method === "online" && o.paid_minor > 0 ? " — any payment will be refunded." : "."}</p>
        </>
      ) : waiting ? (
        <>
          <Clock className="mx-auto h-16 w-16 text-accent" strokeWidth={1.3} />
          <h1 className="mt-6 font-heading text-4xl font-medium">Waiting for payment</h1>
          <p className="mt-3 text-ink-soft">Order <b className="text-ink">#{o.order_number}</b> is reserved for you. It&apos;s confirmed as soon as your payment goes through.</p>
          <button onClick={payNow} className="mt-6 h-12 rounded-full bg-ink px-8 text-sm font-medium text-cream hover:bg-taupe-dark">Complete payment · {formatINR(o.total_minor / 100)}</button>
          {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        </>
      ) : (
        <>
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" strokeWidth={1.3} />
          <h1 className="mt-6 font-heading text-4xl font-medium">Thank you{first ? `, ${first}` : ""}!</h1>
          <p className="mt-3 text-ink-soft">Your order <b className="text-ink">#{o.order_number}</b> is confirmed. We&apos;ll keep you posted as it ships.</p>
        </>
      )}

      <dl className="mt-8 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-white py-5 text-sm">
        <div><dt className="text-ink-soft">Items</dt><dd className="mt-1 font-semibold">{count}</dd></div>
        <div><dt className="text-ink-soft">Total</dt><dd className="mt-1 font-semibold">{formatINR(o.total_minor / 100)}</dd></div>
        <div><dt className="text-ink-soft">Payment</dt><dd className="mt-1 font-semibold">{o.payment_method === "cod" ? "Cash on delivery" : o.payment_status === "paid" ? "Paid online" : "Pending"}</dd></div>
      </dl>

      {!cancelled && !waiting && (
        <ol className="mt-8 space-y-3 rounded-2xl bg-sand/70 p-6 text-left text-sm">
          <li className="flex gap-3"><Package className="h-5 w-5 shrink-0 text-taupe-dark" /> We&apos;re packing your order — it ships within 24 hours.</li>
          <li className="flex gap-3"><Truck className="h-5 w-5 shrink-0 text-taupe-dark" /> Estimated delivery in 5–6 business days{o.delivery_address ? ` to ${addressLine(o.delivery_address)}` : ""}.</li>
        </ol>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" size="lg">Continue shopping</ButtonLink>
        <Link href="/account/orders" className="inline-flex h-12 items-center rounded-full border border-ink px-8 text-sm font-medium hover:bg-ink hover:text-cream">Track order</Link>
      </div>
    </div>
  );
}
