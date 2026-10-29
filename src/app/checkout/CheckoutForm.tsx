"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  MapPin,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { CouponBox } from "@/components/cart/CouponBox";
import { Totals } from "@/components/cart/Totals";
import { OrderConfirmationModal } from "@/components/checkout/OrderConfirmationModal";
import { type Address as SavedAddress } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useDeliverTo } from "@/lib/deliverTo";
import { call, goTo } from "@/lib/http";
import {
  lookupPincode,
  PINCODE_RE,
  stateFor,
  UNKNOWN_PINCODE,
  type Place,
} from "@/lib/pincode";
import { formatINR } from "@/lib/money";
import { daysText } from "@/lib/shipping";
import { useShipping } from "@/lib/shippingContext";
import { formatPhone, mobileError, nationalDigits, toE164 } from "@/lib/phone";

type Address = {
  name: string;
  line1: string;
  line2: string;
  pincode: string;
  city: string;
  state: string;
};

const Err = ({ errors, k }: { errors: Record<string, string>; k: string }) =>
  errors[k] ? (
    <p role="alert" className="mt-1 text-xs text-danger">
      {errors[k]}
    </p>
  ) : null;

function Card({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_-24px_rgba(45,28,25,0.3)] sm:p-6">
      <h2 className="flex items-center gap-3 font-heading text-xl">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#43262b] text-xs text-cream">
          {n + 1}
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const field =
  "h-11 w-full min-w-0 rounded-lg border border-line bg-[#fcfaf7] px-3 text-sm outline-none transition focus:border-[#75414b] focus:bg-white focus:ring-2 focus:ring-[#75414b]/10";

type Placed = {
  order: { id: string };
  payment: { mode: "cod" | "gateway" | "mock" | null; url: string | null };
};

export default function CheckoutForm({
  confirmationOrderId,
  initialUser,
  initialAddresses,
}: {
  confirmationOrderId?: string;
  initialUser: User;
  initialAddresses: SavedAddress[];
}) {
  const {
    items,
    ready,
    total,
    clear,
    quote,
    canCheckout,
    quoting,
    issues,
    loyaltyPoints,
    setDeliveryPincode,
  } = useCart();
  const shipping = useShipping();
  const router = useRouter();
  const { user: sessionUser, ready: authReady, refreshUser } = useAuth();
  const user = authReady ? sessionUser : initialUser;
  const [step, setStep] = useState(0);
  const [typedPhone, setTypedPhone] = useState<string | null>(null);
  const saved = user?.id === initialUser.id ? initialAddresses : [];
  const defaultAddress =
    saved.find((address) => address.is_default) ?? saved[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const selectedAddress =
    selectedAddressId === "new"
      ? undefined
      : (saved.find((address) => address.id === selectedAddressId) ??
        defaultAddress);
  const phone =
    typedPhone ?? nationalDigits(selectedAddress?.phone || user?.phone);
  const setContactPhone = (v: string) => setTypedPhone(v);
  const deliverTo = useDeliverTo();
  const [typed, setTyped] = useState<Partial<Address>>({});
  // Derive defaults as saved data arrives; only fields edited by the shopper override them.
  const addr: Address = {
    name: selectedAddress?.name || user?.name || "",
    line1: selectedAddress?.line1 ?? "",
    line2: selectedAddress?.line2 ?? "",
    pincode: selectedAddress?.pincode ?? deliverTo.pin ?? "", // the header's "Deliver to" pincode when nothing is saved
    city: selectedAddress?.city ?? "",
    state: selectedAddress?.state ?? "",
    ...typed,
  };
  const setAddr = (patch: Partial<Address>) =>
    setTyped((current) => ({ ...current, ...patch }));
  // The pincode decides the state (the GST place of supply) and suggests the city; only border pincodes offer a choice of state.
  const [pinPlace, setPinPlace] = useState<{
    pin: string;
    place: Place | null;
  }>();
  const latestPin = useRef("");
  const here =
    pinPlace && pinPlace.pin === addr.pincode ? pinPlace.place : undefined;
  // The quote charges the delivery zone of this pincode (the server works it out); a half-typed one keeps the shop's default zone.
  const quotedPin = PINCODE_RE.test(addr.pincode) ? addr.pincode : null;
  useEffect(() => {
    setDeliveryPincode(quotedPin);
  }, [quotedPin, setDeliveryPincode]);
  useEffect(() => () => setDeliveryPincode(null), [setDeliveryPincode]);
  const onPincode = (pin: string) => {
    latestPin.current = pin;
    setAddr({ pincode: pin });
    if (!PINCODE_RE.test(pin)) return;
    void lookupPincode(pin).then((found) => {
      if (found === undefined || latestPin.current !== pin) return;
      setPinPlace({ pin, place: found });
      if (found)
        setAddr({
          state: stateFor(found, addr.state),
          city: addr.city.trim() ? addr.city : found.district,
        });
      setErrors((current) => {
        const rest = { ...current };
        delete rest.pincode;
        return found ? rest : { ...rest, pincode: UNKNOWN_PINCODE };
      });
    });
  };
  const [pay, setPay] = useState<"online" | "cod">("online");
  // The delivery time of the address's zone (from the quote), else the shop's default one.
  const zoneDays = quote?.delivery
    ? {
        ...(shipping ?? { fee_minor: 0, free_above_minor: null }),
        delivery_min_days: quote.delivery.min_days,
        delivery_max_days: quote.delivery.max_days,
      }
    : shipping;
  // The address's delivery zone may not offer cash on delivery, or not for this much (the server refuses it too).
  const codOff =
    quote?.delivery && !quote.delivery.cod_available
      ? (quote.delivery.cod_reason ?? "Not available for this address.")
      : null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [checking, setChecking] = useState(false);
  const deliveryTab = useRef<HTMLButtonElement>(null);
  const paymentTab = useRef<HTMLButtonElement>(null);
  const deliveryPanel = useRef<HTMLDivElement>(null);
  const paymentPanel = useRef<HTMLDivElement>(null);
  const previousStep = useRef(0);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const panel = step === 0 ? deliveryPanel.current : paymentPanel.current;
    panel?.focus({ preventScroll: true });
    panel?.scrollIntoView({ block: "start" });
  }, [step]);
  const [placed, setPlaced] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const confirmationId = completedOrderId ?? confirmationOrderId;
  const loginUrl = confirmationId
    ? `/login?next=${encodeURIComponent(`/checkout?order=${encodeURIComponent(confirmationId)}`)}`
    : "/login?next=/checkout";
  const [placeError, setPlaceError] = useState<string | null>(null);
  const attempt = useRef<{ sig: string; key: string } | null>(null);

  useEffect(() => {
    if (authReady && !user) router.replace(loginUrl);
  }, [authReady, user, router, loginUrl]);

  const validate = async () => {
    const e: Record<string, string> = {};
    const phoneProblem = mobileError(phone);
    if (phoneProblem) e.phone = phoneProblem;
    if (addr.name.trim().length < 2)
      e.name = "Enter the recipient's full name.";
    if (addr.line1.trim().length < 5) e.line1 = "Enter your address.";
    if (!/^[1-9]\d{5}$/.test(addr.pincode))
      e.pincode = "Enter a valid 6-digit pincode.";
    if (!addr.city.trim()) e.city = "Enter your city.";
    if (!Object.keys(e).length) {
      const r = await call<{ serviceable: boolean; reason?: string }>(
        `/api/serviceability/${addr.pincode}`,
      );
      if (r.ok && r.data.reason === "unknown_pincode")
        e.pincode = UNKNOWN_PINCODE;
      else if (r.ok && !r.data.serviceable)
        e.pincode = "Sorry, we don't deliver to this pincode yet.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const choosePayment = async () => {
    if (checking || placing || !canCheckout) return;
    setChecking(true);
    setPlaceError(null);
    try {
      if (!authReady || !user) {
        router.replace("/login?next=/checkout");
        return;
      }
      if (!(await validate())) {
        setStep(0);
        deliveryPanel.current?.focus({ preventScroll: true });
        deliveryPanel.current?.scrollIntoView({ block: "start" });
        return;
      }
      setStep(1);
    } finally {
      setChecking(false);
    }
  };

  const place = async () => {
    if (placing || !canCheckout) return;
    if (!authReady || !user) {
      router.replace("/login?next=/checkout");
      return;
    }
    setPlaceError(null);
    setPlacing(true);
    if (!(await validate())) {
      setStep(0);
      setPlacing(false);
      return;
    }
    setStep(1);
    const body = {
      items: items.map((i) => ({ variant_id: i.variantId, quantity: i.qty })),
      coupon_code: quote?.coupon?.ok ? quote.coupon.code : null,
      loyalty_points: loyaltyPoints,
      contact: { name: addr.name.trim(), email: user.email?.trim() || null },
      address: {
        name: addr.name.trim(),
        phone: toE164(phone),
        line1: addr.line1.trim(),
        line2: addr.line2.trim() || null,
        city: addr.city.trim(),
        state: addr.state.trim(),
        pincode: addr.pincode,
      },
      payment_method: codOff ? "online" : pay,
      expected_total_minor: quote?.grand_total_minor,
    };
    // One Idempotency-Key per distinct order attempt: a double click or a retry after a timeout replays the same order.
    const sig = JSON.stringify(body);
    if (attempt.current?.sig !== sig)
      attempt.current = { sig, key: crypto.randomUUID() };
    const r = await call<Placed>("/api/checkout", {
      method: "POST",
      body,
      headers: { "Idempotency-Key": attempt.current.key },
    });
    if (!r.ok) {
      setPlacing(false);
      if (r.status === 401) {
        router.replace("/login?next=/checkout");
        return;
      }
      setPlaceError(
        r.status === 409 ? `${r.error} Please review your bag.` : r.error,
      );
      return;
    }
    const { order, payment } = r.data;
    setPlaced(true);
    clear();
    void refreshUser();
    if (payment.mode === "gateway" && payment.url) goTo(payment.url);
    else if (payment.mode === "mock") router.push(`/pay/${order.id}`);
    else {
      setCompletedOrderId(order.id);
      router.replace(`/checkout?order=${encodeURIComponent(order.id)}`, {
        scroll: false,
      });
    }
  };

  if (!user)
    return (
      <p role="status" className="px-4 py-24 text-center text-ink-soft">
        Checking your session…
      </p>
    );

  if (ready && items.length === 0 && !placing && !placed && !confirmationId)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-heading text-2xl">Nothing to check out yet</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-cream"
        >
          Browse the collection
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f7f3ed] pb-8">
      <div className="mx-auto max-w-[1160px] px-4 py-5 sm:px-6 sm:py-7">
        <Link
          href="/cart"
          prefetch={true}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to bag
        </Link>
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#885663]">
              The final details
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl">Checkout</h1>
            <p className="mt-1 text-xs text-ink-soft">
              Your next favourites are almost yours.
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Checkout progress"
            className="flex items-center gap-3 text-xs"
            onKeyDown={(event) => {
              if (
                ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              ) {
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? deliveryTab.current
                    : event.key === "End"
                      ? paymentTab.current
                      : document.activeElement === deliveryTab.current
                        ? paymentTab.current
                        : deliveryTab.current;
                next?.focus();
              }
            }}
          >
            <button
              ref={deliveryTab}
              id="delivery-tab"
              type="button"
              role="tab"
              aria-selected={step === 0}
              aria-controls="delivery-panel"
              tabIndex={step === 0 ? 0 : -1}
              disabled={placing || !!confirmationId}
              onClick={() => {
                setPlaceError(null);
                setStep(0);
              }}
              className="flex cursor-pointer items-center gap-1.5 py-2 font-medium text-[#43262b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#43262b] text-white">
                {step > 0 ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
              </span>
              Delivery
            </button>
            <span aria-hidden="true" className="h-px w-8 bg-[#c9b3ab]" />
            <button
              ref={paymentTab}
              id="payment-tab"
              type="button"
              role="tab"
              aria-selected={step === 1}
              aria-controls="payment-panel"
              tabIndex={step === 1 ? 0 : -1}
              disabled={checking || placing || !canCheckout || !!confirmationId}
              onClick={choosePayment}
              className={`flex cursor-pointer items-center gap-1.5 py-2 disabled:cursor-not-allowed disabled:opacity-60 ${step === 1 ? "font-medium text-[#43262b]" : "text-ink-soft"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${step === 1 ? "bg-[#43262b] text-white" : "border border-line bg-white"}`}
              >
                <CreditCard className="h-3 w-3" />
              </span>
              Payment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-7">
          <div className="min-w-0 space-y-4">
            <div
              ref={deliveryPanel}
              id="delivery-panel"
              role="tabpanel"
              aria-labelledby="delivery-tab"
              tabIndex={-1}
              hidden={step !== 0}
              className="scroll-mt-[calc(var(--store-header-height)+1rem)] outline-none"
            >
              <Card n={0} title="Shipping address">
                {saved.length > 0 && (
                  <section
                    aria-label="Saved delivery addresses"
                    className="mb-5 rounded-xl bg-[#f7f3ed] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Saved addresses</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAddressId("new");
                          setTyped({ pincode: "" });
                          setTypedPhone(null);
                          setPinPlace(undefined);
                          latestPin.current = "";
                          setErrors({});
                          setPlaceError(null);
                        }}
                        aria-pressed={selectedAddressId === "new"}
                        className="cursor-pointer text-xs font-medium underline underline-offset-4"
                      >
                        Add new address
                      </button>
                    </div>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {saved.map((address) => {
                        const selected =
                          selectedAddress?.id === address.id &&
                          Object.keys(typed).length === 0 &&
                          typedPhone === null;
                        return (
                          <li key={address.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAddressId(address.id);
                                setTyped({});
                                setTypedPhone(null);
                                setPinPlace(undefined);
                                latestPin.current = "";
                                setErrors({});
                                setPlaceError(null);
                              }}
                              aria-pressed={selected}
                              className={`flex h-full w-full items-start gap-2 rounded-lg border p-3 text-left text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#75414b] ${selected ? "border-[#75414b] bg-white text-[#43262b] shadow-sm" : "border-line bg-white/60 hover:border-[#75414b]"}`}
                            >
                              <span
                                aria-hidden="true"
                                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${selected ? "border-[#75414b] bg-[#43262b] text-white" : "border-line"}`}
                              >
                                {selected && <Check className="h-3 w-3" />}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-medium">
                                  {address.label || "Saved"} ·{" "}
                                  {address.line1.slice(0, 22)}
                                  {address.line1.length > 22 ? "…" : ""}
                                </span>
                                <span className="mt-1 block break-words text-ink-soft">
                                  {address.name || user?.name}
                                </span>
                                <span className="mt-1 block break-words text-ink-soft">
                                  {[
                                    address.line1,
                                    address.line2,
                                    address.city,
                                    address.state,
                                    address.pincode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                                {address.phone && (
                                  <span className="mt-1 block text-ink-soft">
                                    {formatPhone(address.phone)}
                                  </span>
                                )}
                                {selected && (
                                  <span className="mt-1.5 block font-medium">
                                    Selected for delivery
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
                {saved.length > 0 && (
                  <div
                    role="separator"
                    aria-label="OR"
                    className="mb-5 flex items-center gap-3 text-xs font-medium text-ink-soft"
                  >
                    <span className="flex-1 border-t border-line" />
                    <span>OR</span>
                    <span className="flex-1 border-t border-line" />
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Mobile number
                    </label>
                    <div className="flex gap-2">
                      <span className="flex h-11 items-center rounded-lg border border-line bg-[#f7f3ed] px-3 text-sm">
                        +91
                      </span>
                      <input
                        id="phone"
                        inputMode="numeric"
                        maxLength={10}
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) =>
                          setContactPhone(e.target.value.replace(/\D/g, ""))
                        }
                        className={field}
                        placeholder="98765 43210"
                      />
                    </div>
                    <Err errors={errors} k="phone" />
                  </div>
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      autoComplete="name"
                      value={addr.name}
                      onChange={(e) => setAddr({ name: e.target.value })}
                      className={field}
                    />
                    <Err errors={errors} k="name" />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="l1"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Address
                    </label>
                    <input
                      id="l1"
                      autoComplete="address-line1"
                      value={addr.line1}
                      onChange={(e) => setAddr({ line1: e.target.value })}
                      className={field}
                      placeholder="House no., building, street"
                    />
                    <Err errors={errors} k="line1" />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="l2"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Landmark{" "}
                      <span className="font-normal text-ink-soft">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="l2"
                      value={addr.line2}
                      onChange={(e) => setAddr({ line2: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pin"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Pincode
                    </label>
                    <input
                      id="pin"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="postal-code"
                      value={addr.pincode}
                      onChange={(e) =>
                        onPincode(e.target.value.replace(/\D/g, ""))
                      }
                      className={field}
                    />
                    <Err errors={errors} k="pincode" />
                  </div>
                  <div>
                    <label
                      htmlFor="city"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      City
                    </label>
                    <input
                      id="city"
                      autoComplete="address-level2"
                      value={addr.city}
                      onChange={(e) => setAddr({ city: e.target.value })}
                      className={field}
                    />
                    <Err errors={errors} k="city" />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="state"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      State
                    </label>
                    {here && here.states.length > 1 ? (
                      <select
                        id="state"
                        autoComplete="address-level1"
                        value={addr.state}
                        onChange={(e) => setAddr({ state: e.target.value })}
                        className={field}
                      >
                        {here.states.map((s) => (
                          <option key={s.code} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="state"
                        autoComplete="address-level1"
                        value={addr.state}
                        readOnly
                        placeholder="Filled in from your pincode"
                        aria-describedby="state-note"
                        className={`${field} cursor-default bg-transparent`}
                      />
                    )}
                    <p id="state-note" className="mt-1 text-xs text-ink-soft">
                      {here && here.states.length > 1
                        ? "This pincode is on a state border: choose your state."
                        : "Set by your pincode."}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-[#e6d9c4] bg-[#fbf5e9] p-3 text-xs sm:col-span-2">
                    <Truck
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#916b36]"
                    />
                    <div>
                      <p className="font-medium">
                        {quote?.delivery?.zone
                          ? `Delivery: ${quote.delivery.zone}`
                          : "Standard delivery"}
                      </p>
                      <p className="mt-1 text-ink-soft">
                        {daysText(zoneDays)
                          ? `Estimated arrival in ${daysText(zoneDays)}. `
                          : ""}
                        The delivery charge is shown in your order summary.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-ink-soft">
                  New delivery addresses are saved to your account when you
                  place an order.
                </p>
              </Card>
            </div>
            <div
              ref={paymentPanel}
              id="payment-panel"
              role="tabpanel"
              aria-labelledby="payment-tab"
              tabIndex={-1}
              hidden={step !== 1}
              className="scroll-mt-[calc(var(--store-header-height)+1rem)] outline-none"
            >
              <Card n={1} title="Choose payment method">
                <div className="mb-5 rounded-xl bg-[#f7f3ed] p-3 text-sm">
                  <p className="font-medium">Delivering to {addr.name}</p>
                  <p className="mt-1 break-words text-xs text-ink-soft">
                    {[
                      addr.line1,
                      addr.line2,
                      addr.city,
                      addr.state,
                      addr.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <button
                    type="button"
                    disabled={placing}
                    onClick={() => {
                      setPlaceError(null);
                      setStep(0);
                    }}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium underline underline-offset-4 disabled:opacity-60"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to delivery
                  </button>
                </div>
                <div
                  className="space-y-3"
                  role="radiogroup"
                  aria-label="Payment method"
                >
                  {(
                    [
                      [
                        "online",
                        "Pay online",
                        "UPI, cards, netbanking, wallets via Razorpay",
                      ],
                      [
                        "cod",
                        "Cash on delivery",
                        codOff ?? "Pay when your order arrives",
                      ],
                    ] as const
                  ).map(([v, t, d]) => (
                    <label
                      key={v}
                      className={`flex items-start gap-4 rounded-xl border p-4 ${v === "cod" && codOff ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${(codOff ? "online" : pay) === v ? "border-[#75414b] bg-[#fbf4f1]" : "border-line"}`}
                    >
                      <input
                        type="radio"
                        name="pay"
                        disabled={placing || (v === "cod" && !!codOff)}
                        checked={(codOff ? "online" : pay) === v}
                        onChange={() => setPay(v)}
                        className="mt-1 h-4 w-4 accent-[#43262b]"
                      />
                      <span>
                        <span className="block font-medium">{t}</span>
                        <span className="text-sm text-ink-soft">{d}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <aside
            className="h-fit min-w-0 space-y-4 lg:sticky lg:top-[calc(var(--store-header-height)+1rem)]"
            aria-label="Order summary and payment"
          >
            <section className="overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_-24px_rgba(45,28,25,0.3)] sm:p-6">
              <fieldset
                disabled={placing || !!confirmationId}
                className="min-w-0"
              >
                <legend className="sr-only">Order summary details</legend>
                <Summary />
              </fieldset>
              <div className="mt-4 border-t border-line pt-4">
                {placeError && (
                  <p
                    role="alert"
                    className="mt-5 rounded-xl bg-danger/10 p-3 text-sm text-danger"
                  >
                    {placeError}{" "}
                    <Link href="/cart" prefetch={true} className="underline">
                      Back to bag
                    </Link>
                  </p>
                )}
                {issues.length > 0 && (
                  <p
                    role="alert"
                    className="mt-5 rounded-xl bg-danger/10 p-3 text-sm text-danger"
                  >
                    {issues[0].message}{" "}
                    <Link href="/cart" prefetch={true} className="underline">
                      Review your bag
                    </Link>
                  </p>
                )}
                <button
                  onClick={step === 0 ? choosePayment : place}
                  disabled={
                    !!confirmationId || checking || placing || !canCheckout
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#43262b] text-sm font-medium text-cream transition hover:bg-[#61353e] disabled:opacity-60"
                >
                  <Lock className="h-4 w-4" />{" "}
                  {checking
                    ? "Checking details…"
                    : placing
                      ? "Placing order…"
                      : quoting
                        ? "Updating total…"
                        : step === 0
                          ? "Continue to payment"
                          : `${pay === "cod" && !codOff ? "Place order" : "Pay online"} · ${formatINR(total)}`}
                </button>
                <p className="mt-3 text-center text-xs text-ink-soft">
                  By placing your order you agree to our{" "}
                  <Link href="/terms" className="underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {confirmationId && (
        <OrderConfirmationModal key={confirmationId} orderId={confirmationId} />
      )}
    </div>
  );
}

function Summary() {
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-xl">Order summary</h2>
        <span className="flex items-center gap-1.5 rounded-full bg-[#f3ede5] px-2.5 py-1 text-[10px] text-ink-soft">
          <ShoppingBag className="h-3 w-3" />
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>
      <ul className="max-h-64 space-y-3 overflow-y-auto py-2 pr-2">
        {items.map((i) => (
          <li key={i.key} className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Image
                src={i.image || "/placeholder.svg"}
                alt=""
                width={52}
                height={68}
                className="h-[68px] w-[52px] rounded-lg border border-line object-cover"
              />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] text-cream">
                {i.qty}
              </span>
            </div>
            <p className="min-w-0 line-clamp-2 flex-1 text-sm">{i.title}</p>
            <p className="text-sm font-medium">{formatINR(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>
      <CouponBox showAvailable />
      <LoyaltyRedemption />
      <Totals />
    </div>
  );
}

function LoyaltyRedemption() {
  const { quote, loyaltyPoints, setLoyaltyPoints, quoting } = useCart();
  const loyalty = quote?.loyalty;
  // Coupons or bag changes can change how many points this order accepts.
  // Keep an enabled redemption at the server's maximum rather than a partial amount.
  useEffect(() => {
    if (
      !quoting &&
      loyalty &&
      loyaltyPoints > 0 &&
      loyaltyPoints !== loyalty.max_points
    ) {
      setLoyaltyPoints(loyalty.max_points);
    }
  }, [loyalty, loyaltyPoints, quoting, setLoyaltyPoints]);
  if (!loyalty) return null;
  if (loyalty.eligible === false)
    return (
      <section
        aria-label="Loyalty membership"
        className="rounded-xl border border-line px-4 py-3"
      >
        <h3 className="text-sm font-medium">Become a member</h3>
        <p className="mt-1 text-xs text-ink-soft">
          Complete your profile membership details to earn and redeem loyalty
          points.
        </p>
        <Link
          href="/account/profile"
          className="mt-2 inline-block text-sm font-medium underline underline-offset-4"
        >
          Join from Profile
        </Link>
      </section>
    );
  const enabled = loyaltyPoints > 0;
  const note = quoting
    ? "Updating deduction…"
    : enabled
      ? `Using all ${loyaltyPoints.toLocaleString("en-IN")} eligible points`
      : loyalty.max_points > 0
        ? `Use all ${loyalty.max_points.toLocaleString("en-IN")} eligible points on this order.`
        : "No points available to redeem on this order.";
  return (
    <section
      className="rounded-xl border border-line px-4 py-2.5"
      aria-label="Redeem loyalty points"
      title={note}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3
            id="loyalty-toggle-label"
            className="truncate text-sm font-medium leading-tight min-[360px]:text-base"
          >
            Redeem loyalty points
          </h3>
          <p
            className="text-[11px] leading-tight text-ink-soft"
            aria-live="polite"
          >
            Redeemable points ={" "}
            <span className="font-medium tabular-nums text-ink">
              {loyalty.max_points.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="loyalty-toggle-label"
          aria-describedby="loyalty-toggle-note"
          disabled={quoting || (!enabled && loyalty.max_points === 0)}
          onClick={() => setLoyaltyPoints(enabled ? 0 : loyalty.max_points)}
          className={`touch-target inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${enabled ? "border-[#43262b] bg-[#43262b]" : "border-line bg-sand"}`}
        >
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-[18px]" : "translate-x-0"}`}
          />
        </button>
      </div>
      <p id="loyalty-toggle-note" aria-live="polite" className="sr-only">
        Available: {loyalty.balance_points.toLocaleString("en-IN")} points.{" "}
        {loyalty.conversion_points.toLocaleString("en-IN")} points ={" "}
        {formatINR(loyalty.conversion_value_minor / 100)} off. {note}
      </p>
      {loyalty.reason && (
        <p role="alert" className="mt-3 text-xs text-danger">
          {loyalty.reason}
        </p>
      )}
    </section>
  );
}
