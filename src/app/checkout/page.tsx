"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { CouponBox } from "@/components/cart/CouponBox";
import { Totals } from "@/components/cart/Totals";
import { Logo } from "@/components/ui/Logo";
import { type Address as SavedAddress } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { call, goTo } from "@/lib/http";
import { formatINR } from "@/lib/money";

type Contact = { phone: string; email: string };
type Address = { name: string; line1: string; line2: string; pincode: string; city: string; state: string };

const Err = ({ errors, k }: { errors: Record<string, string>; k: string }) =>
  errors[k] ? <p role="alert" className="mt-1 text-xs text-danger">{errors[k]}</p> : null;

function Card({ n, title, step, setStep, contact, addr, children }: {
  n: number; title: string; step: number; setStep: (n: number) => void; contact: Contact; addr: Address; children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border bg-white ${step === n ? "border-ink p-6" : "border-line px-6 py-4"}`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-3 font-heading text-xl">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${step > n ? "bg-success text-white" : step === n ? "bg-ink text-cream" : "bg-sand text-ink-soft"}`}>{step > n ? <Check className="h-4 w-4" /> : n + 1}</span>
          {title}
        </h2>
        {step > n && <button onClick={() => setStep(n)} className="text-sm underline underline-offset-4">Edit</button>}
      </div>
      {step === n && <div className="mt-5">{children}</div>}
      {step > n && n === 0 && <p className="mt-2 pl-10 text-sm text-ink-soft">+91 {contact.phone}{contact.email && ` · ${contact.email}`}</p>}
      {step > n && n === 1 && <p className="mt-2 pl-10 text-sm text-ink-soft">{addr.name}, {addr.line1}{addr.line2 && `, ${addr.line2}`}, {addr.city}, {addr.state} {addr.pincode}</p>}
    </section>
  );
}

const field = "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink";

type Placed = { order: { id: string }; payment: { mode: "cod" | "gateway" | "mock" | null; url: string | null } };

export default function CheckoutPage() {
  const { items, ready, total, clear, quote, canCheckout, quoting, issues } = useCart();
  const router = useRouter();
  const { user, ready: authReady } = useAuth();
  const [step, setStep] = useState(0);
  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const [typedPhone, setTypedPhone] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  // Logged-in customers get their account details pre-filled; typing overrides them.
  const savedPhone = (saved.find((a) => a.is_default) ?? saved[0])?.phone;
  const contact: Contact = { phone: typedPhone ?? (user?.phone || savedPhone || "").replace(/^\+91/, ""), email: typedEmail ?? user?.email ?? "" };
  const setContactPhone = (v: string) => setTypedPhone(v);
  const [typed, setTyped] = useState<Partial<Address>>({});
  const addr: Address = { name: typed.name ?? user?.name ?? "", line1: "", line2: "", pincode: "", city: "", state: "", ...typed };
  const setAddr = (a: Address) => setTyped(a);
  const [pay, setPay] = useState<"online" | "cod">("online");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const attempt = useRef<{ sig: string; key: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    call<{ items: SavedAddress[] }>("/api/me/addresses").then((r) => r.ok && setSaved(r.data.items));
  }, [user]);

  const validate = async (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!/^[6-9]\d{9}$/.test(contact.phone)) e.phone = "Enter a valid 10-digit mobile number.";
      if (contact.email && !/^\S+@\S+\.\S+$/.test(contact.email)) e.email = "Enter a valid email.";
    }
    if (s === 1) {
      if (addr.name.trim().length < 2) e.name = "Enter the recipient's full name.";
      if (addr.line1.trim().length < 5) e.line1 = "Enter your address.";
      if (!/^[1-9]\d{5}$/.test(addr.pincode)) e.pincode = "Enter a valid 6-digit pincode.";
      if (!addr.city.trim()) e.city = "Enter your city.";
      if (!addr.state.trim()) e.state = "Enter your state.";
      if (!Object.keys(e).length) {
        const r = await call<{ serviceable: boolean }>(`/api/serviceability/${addr.pincode}`);
        if (r.ok && !r.data.serviceable) e.pincode = "Sorry, we don't deliver to this pincode yet.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = async () => (await validate(step)) && setStep(step + 1);

  const place = async () => {
    if (placing) return;
    setPlaceError(null);
    setPlacing(true);
    const body = {
      items: items.map((i) => ({ variant_id: i.variantId, quantity: i.qty })),
      coupon_code: quote?.coupon?.ok ? quote.coupon.code : null,
      contact: { name: addr.name.trim(), email: contact.email.trim() || null },
      address: { name: addr.name.trim(), phone: contact.phone, line1: addr.line1.trim(), line2: addr.line2.trim() || null, city: addr.city.trim(), state: addr.state.trim(), pincode: addr.pincode },
      payment_method: pay,
      expected_total_minor: quote?.grand_total_minor,
    };
    // One Idempotency-Key per distinct order attempt: a double click or a retry after a timeout replays the same order.
    const sig = JSON.stringify(body);
    if (attempt.current?.sig !== sig) attempt.current = { sig, key: crypto.randomUUID() };
    const r = await call<Placed>("/api/checkout", { method: "POST", body, headers: { "Idempotency-Key": attempt.current.key } });
    if (!r.ok) {
      setPlacing(false);
      setPlaceError(r.status === 409 ? `${r.error} Please review your bag.` : r.error);
      return;
    }
    const { order, payment } = r.data;
    setPlaced(true);
    clear();
    if (payment.mode === "gateway" && payment.url) goTo(payment.url);
    else if (payment.mode === "mock") router.push(`/pay/${order.id}`);
    else router.push(`/order/${order.id}/success`);
  };

  if (ready && items.length === 0 && !placing && !placed)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-heading text-2xl">Nothing to check out yet</p>
        <Link href="/shop" className="mt-6 inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-cream">Browse the collection</Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
        <div className="mb-8 flex items-center justify-between"><Logo /><p className="flex items-center gap-1.5 text-xs text-ink-soft"><Lock className="h-3.5 w-3.5" /> Secure checkout</p></div>

        {/* Mobile collapsible summary */}
        <button onClick={() => setSummary(!summary)} className="mb-4 flex w-full items-center justify-between rounded-2xl border border-line bg-white px-5 py-4 text-sm font-medium lg:hidden" aria-expanded={summary}>
          <span className="flex items-center gap-2">Order summary <ChevronDown className={`h-4 w-4 transition-transform ${summary ? "rotate-180" : ""}`} /></span>
          <span className="text-base font-semibold">{formatINR(total)}</span>
        </button>
        {summary && <div className="mb-4 rounded-2xl border border-line bg-white p-5 lg:hidden"><Summary /></div>}

        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
          <div className="space-y-4">
            <Card step={step} setStep={setStep} contact={contact} addr={addr} n={0} title="Contact">
              <div className="space-y-4">
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">Mobile number</label>
                  <div className="flex gap-2"><span className="flex h-12 items-center rounded-xl border border-line bg-sand px-4 text-sm">+91</span>
                    <input id="phone" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={contact.phone} onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ""))} className={field} placeholder="98765 43210" /></div>
                  <Err errors={errors} k="phone" />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email <span className="font-normal text-ink-soft">(optional, for order updates)</span></label>
                  <input id="email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setTypedEmail(e.target.value)} className={field} placeholder="you@example.com" />
                  <Err errors={errors} k="email" />
                </div>
                <button onClick={next} className="h-12 w-full rounded-full bg-ink text-sm font-medium text-cream hover:bg-taupe-dark sm:w-auto sm:px-10">Continue to address</button>
                {authReady && !user && <p className="text-xs text-ink-soft">Checking out as guest. <Link href="/login?next=/checkout" className="underline">Have an account? Log in</Link></p>}
              </div>
            </Card>

            <Card step={step} setStep={setStep} contact={contact} addr={addr} n={1} title="Shipping address">
              {saved.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-sm font-medium">Saved addresses</p>
                  <ul className="flex flex-wrap gap-2">
                    {saved.map((a) => (
                      <li key={a.id}>
                        <button type="button" onClick={() => { setAddr({ name: a.name ?? "", line1: a.line1, line2: a.line2 ?? "", pincode: a.pincode ?? "", city: a.city ?? "", state: a.state ?? "" }); if (!typedPhone && a.phone) setContactPhone(a.phone.replace(/^\+91/, "")); }} className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">
                          {a.label ?? "Saved"} · {a.line1.slice(0, 22)}{a.line1.length > 22 ? "…" : ""}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label htmlFor="name" className="mb-1.5 block text-sm font-medium">Full name</label><input id="name" autoComplete="name" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} className={field} /><Err errors={errors} k="name" /></div>
                <div className="sm:col-span-2"><label htmlFor="l1" className="mb-1.5 block text-sm font-medium">Address</label><input id="l1" autoComplete="address-line1" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} className={field} placeholder="House no., building, street" /><Err errors={errors} k="line1" /></div>
                <div className="sm:col-span-2"><label htmlFor="l2" className="mb-1.5 block text-sm font-medium">Landmark <span className="font-normal text-ink-soft">(optional)</span></label><input id="l2" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} className={field} /></div>
                <div><label htmlFor="pin" className="mb-1.5 block text-sm font-medium">Pincode</label><input id="pin" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, "") })} className={field} /><Err errors={errors} k="pincode" /></div>
                <div><label htmlFor="city" className="mb-1.5 block text-sm font-medium">City</label><input id="city" autoComplete="address-level2" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className={field} /><Err errors={errors} k="city" /></div>
                <div className="sm:col-span-2"><label htmlFor="state" className="mb-1.5 block text-sm font-medium">State</label><input id="state" autoComplete="address-level1" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} className={field} /><Err errors={errors} k="state" /></div>
                <div className="rounded-xl bg-sand/70 p-4 text-sm sm:col-span-2">🚚 <b>Standard delivery</b> — 5–6 business days. Free shipping.</div>
                <button onClick={next} className="h-12 rounded-full bg-ink text-sm font-medium text-cream hover:bg-taupe-dark sm:col-span-2 sm:w-fit sm:px-10">Continue to payment</button>
              </div>
            </Card>

            <Card step={step} setStep={setStep} contact={contact} addr={addr} n={2} title="Payment">
              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                {([["online", "Pay online", "UPI, cards, netbanking, wallets via Razorpay"], ["cod", "Cash on delivery", "Pay when your order arrives"]] as const).map(([v, t, d]) => (
                  <label key={v} className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 ${pay === v ? "border-ink bg-sand/50" : "border-line"}`}>
                    <input type="radio" name="pay" checked={pay === v} onChange={() => setPay(v)} className="mt-1 h-4 w-4 accent-ink" />
                    <span><span className="block font-medium">{t}</span><span className="text-sm text-ink-soft">{d}</span></span>
                  </label>
                ))}
              </div>
              {placeError && <p role="alert" className="mt-5 rounded-xl bg-danger/10 p-3 text-sm text-danger">{placeError} <Link href="/cart" className="underline">Back to bag</Link></p>}
              {issues.length > 0 && <p role="alert" className="mt-5 rounded-xl bg-danger/10 p-3 text-sm text-danger">{issues[0].message} <Link href="/cart" className="underline">Review your bag</Link></p>}
              <button onClick={place} disabled={placing || !canCheckout} className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-base font-medium text-cream hover:bg-taupe-dark disabled:opacity-60">
                <Lock className="h-4 w-4" /> {placing ? "Placing order…" : quoting ? "Updating total…" : `${pay === "cod" ? "Place order" : "Pay"} · ${formatINR(total)}`}
              </button>
              <p className="mt-3 text-center text-xs text-ink-soft">By placing your order you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
            </Card>
          </div>

          <aside className="hidden h-fit rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-6 lg:block"><Summary /></aside>
        </div>
      </div>
    </div>
  );
}

function Summary() {
  const { items } = useCart();
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl">Order summary</h2>
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.key} className="flex items-center gap-4">
            <div className="relative shrink-0"><Image src={i.image || "/placeholder.svg"} alt="" width={64} height={84} className="h-[84px] w-16 rounded-lg object-cover" /><span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[11px] text-cream">{i.qty}</span></div>
            <p className="line-clamp-2 flex-1 text-sm">{i.title}</p>
            <p className="text-sm font-medium">{formatINR(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>
      <CouponBox />
      <Totals />
    </div>
  );
}
