"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  clearDraft,
  draftValue,
  useExchangeDraft,
  type ExchangeQuote,
} from "@/lib/exchange";
import { useBrand } from "@/lib/brand";
import { call } from "@/lib/http";
import { payStarted, type PayStart } from "@/lib/payOrder";
import { formatINR } from "@/lib/money";

const money = (minor: number) => formatINR(minor / 100);

/** The last step of an exchange: what goes back, what comes instead, and the difference, before the request is sent to the shop. */
export default function ExchangePage() {
  const draft = useExchangeDraft();
  const router = useRouter();
  const brand = useBrand();
  const [result, setResult] = useState<{
    key: string;
    quote?: ExchangeQuote;
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const orderId = draft?.orderId;
  const replacement = draft?.replacement;
  const itemsKey = JSON.stringify(draft?.items ?? []);
  const replacementKey = JSON.stringify(replacement ?? null);
  // A quote belongs to the exact exchange it was asked for; a changed draft shows the loading state until its own quote arrives.
  const key = `${orderId}|${itemsKey}|${replacementKey}`;
  const quote = result?.key === key ? (result.quote ?? null) : null;
  const quoteError = result?.key === key ? (result.error ?? null) : null;

  useEffect(() => {
    if (!orderId || !replacement) return;
    let live = true;
    void call<ExchangeQuote>(`/api/me/orders/${orderId}/exchange-quote`, {
      method: "POST",
      body: {
        items: (
          JSON.parse(itemsKey) as { order_item_id: string; quantity: number }[]
        ).map((i) => ({
          order_item_id: i.order_item_id,
          quantity: i.quantity,
        })),
        replacement: [
          {
            variant_id: replacement.variant_id,
            quantity: replacement.quantity,
          },
        ],
      },
    }).then((res) => {
      if (!live) return;
      setResult(res.ok ? { key, quote: res.data } : { key, error: res.error });
    });
    return () => {
      live = false;
    };
    // the keys stand for the draft's contents
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const back = (
    <Link
      href="/account/orders"
      className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" /> Back to orders
    </Link>
  );

  if (!draft)
    return (
      <div className="space-y-4">
        {back}
        <h1 className="font-heading text-3xl font-medium">Exchange</h1>
        <p className="rounded-xl bg-sand p-4 text-sm">
          You haven&apos;t started an exchange. Open an order and choose
          &ldquo;Exchange&rdquo;.
        </p>
      </div>
    );

  const send = async () => {
    if (!replacement) return;
    setBusy(true);
    setError(null);
    const res = await call<{
      exchange_order_id: string | null;
      payment: PayStart | null;
    }>(`/api/me/orders/${draft.orderId}/exchange-requests`, {
      method: "POST",
      body: {
        items: draft.items.map((i) => ({
          order_item_id: i.order_item_id,
          quantity: i.quantity,
        })),
        reason_code: draft.reason,
        reason_note: draft.note || null,
        replacement: [
          {
            variant_id: replacement.variant_id,
            quantity: replacement.quantity,
          },
        ],
      },
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    clearDraft();
    // a dearer exchange on a prepaid order is paid now, in Razorpay's window. A payment left unfinished is picked up on the Returns page
    // ("Pay now"), where the request waits.
    if (res.data.payment && res.data.exchange_order_id) {
      setBusy(true);
      const problem = await payStarted(
        res.data.exchange_order_id,
        res.data.payment,
        brand,
      );
      if (problem) {
        setBusy(false);
        setError(
          `${problem} Your exchange is saved: pay the difference from Returns.`,
        );
        return router.push("/account/returns?sent=1");
      }
    }
    router.push("/account/returns?sent=1");
  };

  const blocked = quote?.outcome === "points" && !quote.points_possible;

  return (
    <div className="space-y-6">
      {back}
      <div>
        <h1 className="font-heading text-3xl font-medium">Exchange</h1>
        <p className="mt-1 text-sm text-ink-soft">Order #{draft.orderNumber}</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-medium">Going back</h2>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {draft.items.map((i) => (
            <li
              key={i.order_item_id}
              className="flex items-center justify-between gap-4 p-4 text-sm"
            >
              <span>
                {i.name} <span className="text-ink-soft">× {i.quantity}</span>
              </span>
              <span className="text-ink-soft">
                {money(i.unit_refund_minor * i.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Coming instead</h2>
        {replacement ? (
          <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 text-sm">
            {replacement.image && (
              <Image
                src={replacement.image}
                alt=""
                width={56}
                height={72}
                className="h-[72px] w-14 rounded-lg object-cover"
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="block">{replacement.title}</span>
              <span className="text-ink-soft">
                {replacement.size ? `${replacement.size} · ` : ""}×{" "}
                {replacement.quantity}
              </span>
            </span>
            <ButtonLink href="/shop" variant="outline">
              Change
            </ButtonLink>
          </div>
        ) : (
          <div className="rounded-2xl bg-sand p-4 text-sm">
            <p>You haven&apos;t chosen a replacement yet.</p>
            <ButtonLink href="/shop" className="mt-3">
              Browse the shop
            </ButtonLink>
          </div>
        )}
      </section>

      {replacement && (
        <section className="space-y-3 rounded-2xl border border-line bg-white p-5 text-sm">
          {!quote && !error && !quoteError && (
            <div
              className="h-24 animate-pulse rounded-xl bg-sand"
              aria-label="Working out the difference"
            />
          )}
          {quote && (
            <>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">
                    Value of the items going back
                  </dt>
                  <dd>{money(quote.credit_minor)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Price of the replacement</dt>
                  <dd>{money(quote.replacement_total_minor)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 font-semibold">
                  <dt>
                    {quote.outcome === "pay"
                      ? "You pay"
                      : quote.outcome === "points"
                        ? "You get back"
                        : "Difference"}
                  </dt>
                  <dd>
                    {quote.outcome === "pay"
                      ? money(quote.due_minor)
                      : quote.outcome === "points"
                        ? `${quote.surplus_points.toLocaleString("en-IN")} loyalty points`
                        : "Nothing to pay"}
                  </dd>
                </div>
              </dl>
              <p className="rounded-xl bg-sand p-3 text-ink-soft">
                {quote.outcome === "even" &&
                  "Same value: no payment and no refund. Your replacement is sent once the shop receives your items."}
                {quote.outcome === "pay" &&
                  (quote.pay_by === "cod"
                    ? `The replacement costs ${money(quote.due_minor)} more. Your order was cash on delivery, so you pay this in cash when the replacement is delivered.`
                    : `The replacement costs ${money(quote.due_minor)} more. You pay this ${money(quote.due_minor)} online now, when you confirm; the value of your returned items covers the rest, and the replacement is sent once the shop receives them.`)}
                {quote.outcome === "points" &&
                  (quote.points_possible
                    ? `The replacement costs ${money(quote.surplus_minor)} less. The difference comes back as ${quote.surplus_points.toLocaleString("en-IN")} loyalty points once the shop receives your items.`
                    : "A cheaper replacement gives the difference back as loyalty points, which this shop can't give you right now. Choose something of equal or higher price, or ask for a return instead.")}
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-danger/10 p-3 text-danger">
              {error}
            </p>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <button
          type="button"
          onClick={() => {
            clearDraft();
            router.push("/account/orders");
          }}
          className="text-sm font-medium underline underline-offset-4"
        >
          Cancel exchange
        </button>
        <Button
          size="lg"
          disabled={!replacement || !quote || blocked || busy}
          onClick={send}
        >
          {busy
            ? "Sending…"
            : quote?.outcome === "pay" && quote.pay_by === "online"
              ? `Pay ${money(quote.due_minor)} and confirm`
              : "Confirm exchange request"}
        </Button>
      </div>
      <p className="text-xs text-ink-soft">
        Items worth {money(draftValue(draft))} go back. Nothing is changed until
        the shop receives them.
      </p>
    </div>
  );
}
