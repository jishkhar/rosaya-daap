"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, MapPin, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { call } from "@/lib/http";
import { formatINR } from "@/lib/money";
import { Qty } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/Button";

export function PurchasePanel({ p }: { p: Product }) {
  const { add, setOpen } = useCart();
  const router = useRouter();
  const multi = p.variants.length > 1;
  // One variant needs no choosing; several (sizes) must be picked before the bag.
  const [vid, setVid] = useState<string | undefined>(multi ? undefined : p.variants[0]?.id ?? p.variantId);
  const variant = p.variants.find((v) => v.id === vid);
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [needSize, setNeedSize] = useState(false);
  const [added, setAdded] = useState(false);

  const inStock = variant ? variant.inStock : p.inStock;
  const maxQty = Math.max(1, Math.min(10, variant?.maxQty ?? 10));
  const label = (v: Product["variants"][number]) => v.size ?? ([v.name, v.colour].filter((x) => x && x !== "Default").join(" · ") || "Standard");

  const submit = (buyNow = false) => {
    if (!vid) return setNeedSize(true);
    add({ variantId: vid, slug: p.slug, title: p.title, image: p.images[0], price: variant?.price ?? p.price, mrp: variant?.mrp ?? p.mrp, size: variant?.size }, Math.min(qty, maxQty));
    if (buyNow) {
      setOpen(false);
      router.push("/checkout");
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  const checkPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin)) return setPinMsg({ ok: false, text: "Enter a valid 6-digit pincode." });
    setChecking(true);
    const r = await call<{ serviceable: boolean }>(`/api/serviceability/${pin}`);
    setChecking(false);
    if (!r.ok) return setPinMsg({ ok: false, text: r.error });
    setPinMsg(r.data.serviceable ? { ok: true, text: "Delivery in 5–6 business days · Free shipping" } : { ok: false, text: "Sorry, we don't deliver to this pincode yet." });
  };

  return (
    <div>
      {multi && (
        <fieldset className="mb-6">
          <legend className="mb-3 flex w-full items-center justify-between text-sm font-medium">
            <span>{p.variants.every((v) => v.size) ? "Size" : "Option"} {variant && <span className="font-normal text-ink-soft">— {label(variant)}</span>}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {p.variants.map((v) => (
              <button key={v.id} type="button" disabled={!v.inStock} onClick={() => { setVid(v.id); setNeedSize(false); setQty(1); }} aria-pressed={vid === v.id}
                className={`h-11 min-w-11 rounded-full border px-4 text-sm disabled:cursor-not-allowed disabled:text-ink-soft/50 disabled:line-through ${vid === v.id ? "border-ink bg-ink text-cream" : "border-line bg-white hover:border-ink"}`}>{label(v)}</button>
            ))}
          </div>
          {needSize && <p role="alert" className="mt-2 text-sm text-danger">Please choose an option.</p>}
          {variant?.lowStock && <p className="mt-2 text-sm text-accent">Only {variant.maxQty} left</p>}
        </fieldset>
      )}

      {inStock ? (
        <>
          <div className="flex items-center gap-4">
            <Qty qty={qty} onChange={(q) => setQty(Math.max(1, Math.min(maxQty, q)))} />
            <Button size="lg" className="flex-1" onClick={() => submit(false)}>{added ? <><Check className="h-4 w-4" /> Added to bag</> : "Add to Bag"}</Button>
          </div>
          <Button variant="outline" size="lg" className="mt-3 w-full" onClick={() => submit(true)}>Buy it now</Button>
        </>
      ) : (
        <Button size="lg" className="w-full" disabled>Sold out</Button>
      )}

      <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-ink-soft">
        <li className="rounded-xl bg-sand/70 px-2 py-3"><Truck className="mx-auto mb-1 h-5 w-5 text-taupe-dark" />Ships in 24h</li>
        <li className="rounded-xl bg-sand/70 px-2 py-3"><RotateCcw className="mx-auto mb-1 h-5 w-5 text-taupe-dark" />Easy exchange</li>
        <li className="rounded-xl bg-sand/70 px-2 py-3"><ShieldCheck className="mx-auto mb-1 h-5 w-5 text-taupe-dark" />100% original</li>
      </ul>

      <form onSubmit={checkPin} className="mt-6 rounded-xl border border-line bg-white p-4">
        <label htmlFor="pin" className="mb-2 flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4" /> Check delivery</label>
        <div className="flex gap-2">
          <input id="pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="Enter pincode" className="h-11 min-w-0 flex-1 rounded-full border border-line bg-cream px-4 text-sm" />
          <Button variant="soft" type="submit" disabled={checking}>{checking ? "…" : "Check"}</Button>
        </div>
        {pinMsg && <p className={`mt-2 text-sm ${pinMsg.ok ? "text-success" : "text-danger"}`} role="status">{pinMsg.text}</p>}
      </form>

      {/* Sticky mobile bar */}
      {inStock && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-cream/95 p-3 backdrop-blur lg:hidden">
          <div className="min-w-0 flex-1"><p className="truncate text-xs text-ink-soft">{p.title}</p><p className="text-base font-semibold">{formatINR(variant?.price ?? p.price)}</p></div>
          <Button size="lg" onClick={() => submit(false)}>{added ? "Added ✓" : "Add to Bag"}</Button>
        </div>
      )}
    </div>
  );
}
