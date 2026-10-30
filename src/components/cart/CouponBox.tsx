"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Tag, X } from "lucide-react";
import { useCart, type Quote } from "@/lib/cart";
import { useStoreFeatures } from "@/lib/features";
import { formatINR } from "@/lib/money";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Offer = Quote["available_coupons"][number];

function OfferFacts({ offer }: { offer: Offer }) {
  return (
    <div className="space-y-2 break-words text-xs text-ink-soft">
      <p>{offer.name}</p>
      <p>{offer.label}</p>
      {offer.amount_minor != null && offer.amount_minor > 0 && (
        <p className="text-success">
          Save {formatINR(offer.amount_minor / 100)}
        </p>
      )}
      {offer.min_order_minor > 0 && (
        <p>Minimum order: {formatINR(offer.min_order_minor / 100)}</p>
      )}
      {offer.reason && <p>{offer.reason}</p>}
    </div>
  );
}

function OfferTooltip({
  offer,
  anchor,
  id,
  close,
}: {
  offer: Offer;
  anchor: RefObject<HTMLDivElement | null>;
  id: string;
  close: () => void;
}) {
  const tooltip = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = tooltip.current;
    const card = anchor.current;
    if (!element || !card) return;
    // The top layer keeps details clear of the horizontal strip's clipped edges.
    element.showPopover();
    const position = () => {
      const cardBox = card.getBoundingClientRect();
      const railBox = card.closest("ul")?.getBoundingClientRect();
      if (
        cardBox.bottom <= 0 ||
        cardBox.top >= window.innerHeight ||
        (railBox &&
          (cardBox.right <= railBox.left || cardBox.left >= railBox.right))
      ) {
        close();
        return;
      }
      const box = element.getBoundingClientRect();
      const left = Math.max(
        16,
        Math.min(cardBox.left, window.innerWidth - box.width - 16),
      );
      const above = cardBox.top - box.height - 8;
      const top =
        above >= 16
          ? above
          : Math.max(
              16,
              Math.min(
                cardBox.bottom + 8,
                window.innerHeight - box.height - 16,
              ),
            );
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
    };
    position();
    // Follow scrolling caused by keyboard focus; dismiss when the card leaves view.
    const onScroll = (event: Event) => {
      if (!(event.target instanceof Node) || !element.contains(event.target))
        position();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", position);
    window.addEventListener("keydown", onKey);
    return () => {
      element.hidePopover();
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", position);
      window.removeEventListener("keydown", onKey);
    };
  }, [anchor, close]);
  return (
    <div
      ref={tooltip}
      id={id}
      role="tooltip"
      popover="manual"
      className="fixed inset-auto m-0 max-h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-line bg-cream p-4 text-ink shadow-xl"
    >
      <p className="mb-2 break-all text-sm font-semibold tracking-wide">
        {offer.code}
      </p>
      <OfferFacts offer={offer} />
    </div>
  );
}

function OfferCard({
  offer,
  applied,
  disabled,
  compact = false,
  apply,
}: {
  offer: Offer;
  applied: boolean;
  disabled: boolean;
  compact?: boolean;
  apply: (code: string) => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const [details, setDetails] = useState(false);
  return (
    <div
      ref={card}
      role="group"
      aria-label={`${offer.code} coupon`}
      aria-describedby={details ? tooltipId : undefined}
      tabIndex={compact ? 0 : undefined}
      onMouseEnter={() => {
        if (compact && window.matchMedia("(hover: hover)").matches)
          setDetails(true);
      }}
      onMouseLeave={() => {
        if (!card.current?.contains(document.activeElement)) setDetails(false);
      }}
      onFocus={() => {
        if (compact) setDetails(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setDetails(false);
      }}
      className={`flex h-full min-w-0 flex-col rounded-xl border border-dashed border-line bg-sand/30 ${compact ? "gap-0.5 overflow-hidden p-2" : "gap-2 p-3"}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <p
          className={`min-w-0 text-sm font-semibold tracking-wide ${compact ? "truncate" : "break-all"}`}
        >
          {offer.code}
        </p>
        <button
          type="button"
          aria-label={`Apply coupon ${offer.code}`}
          aria-describedby={details ? tooltipId : undefined}
          onClick={() => {
            setDetails(false);
            apply(offer.code);
          }}
          disabled={disabled || !offer.applicable || applied}
          className="touch-target shrink-0 cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {applied ? "Applied" : "Apply"}
        </button>
      </div>
      {compact ? (
        <p className="truncate text-xs leading-4 text-ink-soft">
          {offer.label}
        </p>
      ) : (
        <OfferFacts offer={offer} />
      )}
      {compact && details && (
        <OfferTooltip
          offer={offer}
          anchor={card}
          id={tooltipId}
          close={() => setDetails(false)}
        />
      )}
    </div>
  );
}

function CouponsModal({
  offers,
  appliedCode,
  disabled,
  error,
  apply,
  close,
  returnFocus,
}: {
  offers: Offer[];
  appliedCode?: string;
  disabled: boolean;
  error: string | null;
  apply: (code: string) => void;
  close: () => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useBodyScrollLock(true);
  useLayoutEffect(() => {
    const element = dialog.current;
    const previousFocus = returnFocus.current;
    element?.showModal();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [returnFocus]);

  return (
    <dialog
      ref={dialog}
      aria-label="All coupons"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          close();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-cream p-4 text-ink backdrop:bg-ink/40 sm:p-6"
    >
      <div className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-3 bg-cream">
        <h2 className="font-heading text-xl">All coupons ({offers.length})</h2>
        <button
          type="button"
          autoFocus
          aria-label="Close coupons"
          onClick={close}
          className="touch-target shrink-0 rounded-full p-2 hover:bg-sand"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}
      {offers.length ? (
        <ul aria-label="All available coupons" className="space-y-3">
          {offers.map((offer) => (
            <li key={offer.code}>
              <OfferCard
                offer={offer}
                applied={appliedCode === offer.code}
                disabled={disabled}
                apply={apply}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-soft">
          No coupons available for your account right now.
        </p>
      )}
    </dialog>
  );
}

/** The discount-code box; nothing while the shop has discount codes off (the server ignores a code then anyway). */
export function CouponBox({
  showAvailable = false,
}: {
  showAvailable?: boolean;
}) {
  const { coupons } = useStoreFeatures();
  return coupons ? <CouponForm showAvailable={showAvailable} /> : null;
}

function CouponForm({ showAvailable }: { showAvailable: boolean }) {
  const { coupon, applyCoupon, removeCoupon, quote, quoting } = useCart();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [allCoupons, setAllCoupons] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const offers = quote?.available_coupons ?? [];

  const apply = async (value: string) => {
    if (busy || quoting) return;
    setBusy(true);
    const r = await applyCoupon(value);
    setBusy(false);
    setErr(r.ok ? null : r.reason);
    if (r.ok) {
      setCode("");
      setAllCoupons(false);
    }
  };

  return (
    <div className="min-w-0 space-y-3">
      {coupon ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-success/40 bg-success/5 px-4 py-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <Tag className="h-4 w-4 shrink-0 text-success" />
            <span className="min-w-0 break-words">
              <b className="break-all">{coupon.code}</b> applied
            </span>
          </span>
          <button
            onClick={removeCoupon}
            disabled={busy || quoting}
            aria-label="Remove coupon"
            className="shrink-0 rounded-full p-1 hover:bg-success/10 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await apply(code);
          }}
        >
          <label htmlFor="coupon" className="sr-only">
            Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm uppercase placeholder:normal-case"
            />
            <button
              disabled={busy || quoting}
              className="h-11 rounded-full bg-taupe px-6 text-sm font-medium text-ink hover:bg-gold disabled:opacity-60"
            >
              {busy ? "…" : "Apply"}
            </button>
          </div>
        </form>
      )}
      {err && !allCoupons && (
        <p role="alert" className="text-sm text-danger">
          {err}
        </p>
      )}
      {showAvailable && (
        <section
          aria-label="Available coupons"
          className="min-w-0 rounded-xl border border-line bg-white p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex min-w-0 items-center gap-1.5 text-xs font-medium sm:text-sm">
              <Tag className="h-4 w-4 shrink-0" />
              Available coupons
            </h3>
            {offers.length > 0 && (
              <button
                ref={moreButton}
                type="button"
                onClick={() => setAllCoupons(true)}
                className="touch-target shrink-0 cursor-pointer py-1.5 text-xs font-medium underline underline-offset-4"
              >
                View more
              </button>
            )}
          </div>
          {!quote || (quoting && !offers.length) ? (
            <p role="status" className="mt-3 text-xs text-ink-soft">
              Checking offers for your bag…
            </p>
          ) : offers.length ? (
            <ul
              aria-label="Coupon offers"
              tabIndex={0}
              aria-busy={quoting || busy}
              className="mt-3 flex h-20 snap-x snap-proximity gap-3 overflow-x-auto overflow-y-hidden pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-taupe [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-sand"
            >
              {offers.slice(0, 4).map((offer) => (
                <li
                  key={offer.code}
                  className="w-56 max-w-[85%] shrink-0 snap-start"
                >
                  <OfferCard
                    offer={offer}
                    compact
                    applied={coupon?.code === offer.code}
                    disabled={busy || quoting}
                    apply={apply}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-ink-soft">
              No coupons available for your account right now.
            </p>
          )}
        </section>
      )}
      {showAvailable && allCoupons && (
        <CouponsModal
          offers={offers}
          appliedCode={coupon?.code}
          disabled={busy || quoting}
          error={err}
          apply={apply}
          close={() => setAllCoupons(false)}
          returnFocus={moreButton}
        />
      )}
    </div>
  );
}
