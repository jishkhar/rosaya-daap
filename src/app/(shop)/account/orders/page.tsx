"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronDown, Package } from "lucide-react";
import {
  addressLine,
  STATUS_STEPS,
  stageOf,
  useRemoteList,
  type ApiOrder,
  type OrderStage,
} from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { call, goTo } from "@/lib/http";
import { formatINR } from "@/lib/money";
import { longDate, type Returnable } from "@/lib/returns";
import { ButtonLink } from "@/components/ui/Button";

const badge: Record<OrderStage, string> = {
  Placed: "bg-sand text-ink",
  Confirmed: "bg-sand text-ink",
  Packed: "bg-sand text-ink",
  Shipped: "bg-accent/10 text-accent",
  Delivered: "bg-success/10 text-success",
  Cancelled: "bg-danger/10 text-danger",
};

/** How a parcel's status reads to the shopper (services/shipments.py statuses). */
const SHIPMENT_WORDS: Record<string, string> = {
  ready_to_ship: "Packed, leaving soon",
  in_transit: "On its way",
  out_for_delivery: "Out for delivery today",
  failed_attempt: "We couldn't deliver it; we'll try again",
  rto_in_transit: "Coming back to the shop",
  rto_delivered: "Returned to the shop",
  lost: "Delayed, the shop will contact you",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const {
    items: orders,
    ready,
    error,
  } = useRemoteList<ApiOrder>("/api/me/orders", !!user);
  const { add } = useCart();
  const [open, setOpen] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  if (!ready)
    return (
      <div
        className="h-64 animate-pulse rounded-2xl bg-sand"
        aria-label="Loading orders"
      />
    );

  const payNow = async (o: ApiOrder) => {
    setPayError(null);
    const r = await call<{ mode: string; url: string | null }>(
      `/api/orders/${o.id}/pay`,
      { method: "POST", body: {} },
    );
    if (!r.ok) return setPayError(r.error);
    goTo(
      r.data.url ??
        (r.data.mode === "mock"
          ? `/pay/${o.id}`
          : `/checkout?order=${encodeURIComponent(o.id)}`),
    );
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-medium">Your Orders</h1>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {payError && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger"
        >
          {payError}
        </p>
      )}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Package className="h-12 w-12 text-taupe" strokeWidth={1.2} />
          <p className="font-heading text-xl">No orders yet</p>
          <p className="text-sm text-ink-soft">
            When you place an order, it will show up here.
          </p>
          <ButtonLink href="/shop" size="lg" className="mt-2">
            Start shopping
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => {
            const isOpen = open === o.id;
            const stage = stageOf(o.status);
            const step = STATUS_STEPS.indexOf(stage);
            const count = o.items.reduce((s, i) => s + i.quantity, 0);
            const unpaid =
              o.payment_method === "online" &&
              o.payment_status !== "paid" &&
              o.status === "pending";
            return (
              <li
                key={o.id}
                className="rounded-2xl border border-line bg-white"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : o.id)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 p-5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      Order #{o.order_number}
                    </span>
                    <span className="text-sm text-ink-soft">
                      {new Date(o.placed_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {count === 1 ? "1 item" : `${count} items`}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${badge[stage]}`}
                  >
                    {unpaid ? "Awaiting payment" : stage}
                  </span>
                  <span className="font-semibold">
                    {formatINR(o.total_minor / 100)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="space-y-6 border-t border-line p-5">
                    {stage !== "Cancelled" && stage !== "Placed" && (
                      <ol
                        className="flex items-center"
                        aria-label="Order progress"
                      >
                        {STATUS_STEPS.map((s, i) => (
                          <li
                            key={s}
                            className="flex flex-1 items-center last:flex-none"
                          >
                            <span className="flex flex-col items-center gap-1.5">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${i <= step ? "bg-ink text-cream" : "bg-sand text-ink-soft"}`}
                              >
                                {i <= step ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  i + 1
                                )}
                              </span>
                              <span
                                className={`text-[11px] ${i <= step ? "font-medium" : "text-ink-soft"}`}
                              >
                                {s}
                              </span>
                            </span>
                            {i < STATUS_STEPS.length - 1 && (
                              <span
                                className={`mx-2 mb-5 h-0.5 flex-1 ${i < step ? "bg-ink" : "bg-line"}`}
                              />
                            )}
                          </li>
                        ))}
                      </ol>
                    )}

                    <ul className="divide-y divide-line">
                      {o.items.map((i) => (
                        <li
                          key={i.variant_id}
                          className="flex items-center gap-4 py-3"
                        >
                          <Link href={i.slug ? `/p/${i.slug}` : "#"}>
                            <Image
                              src={i.image ?? "/placeholder.svg"}
                              alt=""
                              width={56}
                              height={72}
                              className="h-[72px] w-14 rounded-md object-cover"
                            />
                          </Link>
                          <Link
                            href={i.slug ? `/p/${i.slug}` : "#"}
                            className="line-clamp-2 flex-1 text-sm hover:underline"
                          >
                            {i.title}
                          </Link>
                          <span className="text-sm text-ink-soft">
                            ×{i.quantity}
                          </span>
                          <span className="text-sm font-medium">
                            {formatINR((i.unit_price_minor * i.quantity) / 100)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {stage === "Delivered" && <OrderReturns orderId={o.id} />}

                    <div className="flex flex-wrap items-end justify-between gap-4 text-sm">
                      <div className="space-y-1 text-ink-soft">
                        {o.shipment && o.shipment.status !== "delivered" && (
                          <p>
                            <span className="text-ink">Shipment:</span>{" "}
                            {SHIPMENT_WORDS[o.shipment.status] ?? "On its way"}
                            {o.shipment.carrier_name &&
                              ` · ${o.shipment.carrier_name}`}
                            {o.shipment.rider_name &&
                              ` · ${o.shipment.rider_name}`}
                            {o.shipment.tracking_number &&
                              (o.shipment.tracking_url ? (
                                <>
                                  {" · "}
                                  <a
                                    href={o.shipment.tracking_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-ink underline"
                                  >
                                    Track {o.shipment.tracking_number}
                                  </a>
                                </>
                              ) : (
                                ` · Tracking ${o.shipment.tracking_number}`
                              ))}
                          </p>
                        )}
                        {o.delivery_address && (
                          <p>
                            <span className="text-ink">Deliver to:</span>{" "}
                            {o.delivery_address.name
                              ? `${o.delivery_address.name}, `
                              : ""}
                            {addressLine(o.delivery_address)}
                          </p>
                        )}
                        <p>
                          <span className="text-ink">Payment:</span>{" "}
                          {o.payment_method === "cod"
                            ? "Cash on delivery"
                            : o.payment_status === "paid"
                              ? "Paid online"
                              : "Online — not paid yet"}
                        </p>
                        {o.discount_minor > 0 && (
                          <p>
                            <span className="text-ink">You saved:</span>{" "}
                            {formatINR(o.discount_minor / 100)}
                          </p>
                        )}
                        {(o.delivery_fee_minor ?? 0) > 0 && (
                          <p>
                            <span className="text-ink">Delivery:</span>{" "}
                            {formatINR((o.delivery_fee_minor ?? 0) / 100)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {unpaid && (
                          <button
                            onClick={() => payNow(o)}
                            className="h-11 rounded-full bg-ink px-6 font-medium text-cream hover:bg-taupe-dark"
                          >
                            Pay now
                          </button>
                        )}
                        <button
                          onClick={() =>
                            o.items.forEach(
                              (i) =>
                                i.slug &&
                                add(
                                  {
                                    variantId: i.variant_id,
                                    slug: i.slug,
                                    title: i.title,
                                    image: i.image ?? "/placeholder.svg",
                                    price: i.unit_price_minor / 100,
                                    mrp: null,
                                    size: i.size ?? undefined,
                                  },
                                  i.quantity,
                                ),
                            )
                          }
                          className="h-11 rounded-full border border-ink px-6 font-medium hover:bg-ink hover:text-cream"
                        >
                          Reorder
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** A delivered order's return window, and the way in to a return request while it is open. */
function OrderReturns({ orderId }: { orderId: string }) {
  const [r, setR] = useState<Returnable | null>(null);
  useEffect(() => {
    let live = true;
    void call<Returnable>(`/api/me/orders/${orderId}/returnable`).then(
      (res) => live && res.ok && setR(res.data),
    );
    return () => {
      live = false;
    };
  }, [orderId]);
  if (!r) return null;
  const left = r.lines.some((l) => l.returnable_quantity > 0);
  const { open, closes_on, days } = r.window;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand/60 px-4 py-3 text-sm">
      <p className="text-ink-soft">
        {days <= 0
          ? "Returns aren't accepted on website orders."
          : open && left
            ? `Returns accepted until ${longDate(closes_on!)}.`
            : open
              ? "Everything on this order has already been returned."
              : closes_on
                ? `The return window closed on ${longDate(closes_on)}.`
                : "Returns open once the order is delivered."}
      </p>
      {open && left && (
        <ButtonLink href={`/account/orders/${orderId}/return`}>
          Return items
        </ButtonLink>
      )}
    </div>
  );
}
