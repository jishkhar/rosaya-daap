"use client";

import { MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { answerParts, useDeliverTo } from "@/lib/deliverTo";
import { formatINR } from "@/lib/money";
import { PINCODE_RE, UNKNOWN_PINCODE } from "@/lib/pincode";

/** Header "Deliver to 682001": the shopper says their pincode once; product pages and checkout use it. Remembered in this browser. */
export function DeliverTo() {
  const { pin, answer, check, forget } = useDeliverTo();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node))
        setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PINCODE_RE.test(typed))
      return setNote("Enter a valid 6-digit pincode.");
    setBusy(true);
    const a = await check(typed);
    setBusy(false);
    if ("error" in a) return setNote(a.error);
    if (a.reason === "unknown_pincode") return setNote(UNKNOWN_PINCODE);
    setNote(null);
    setTyped("");
    setOpen(false);
  };

  const label = pin
    ? answer?.place
      ? `${pin} · ${answer.place.district}`
      : pin
    : "Enter pincode";

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        className="touch-target flex items-center gap-1.5 rounded-full p-2 text-sm hover:bg-sand"
        aria-expanded={open}
        aria-controls={id}
        aria-label={
          pin ? `Deliver to ${label}. Change` : "Set your delivery pincode"
        }
        onClick={() => setOpen((o) => !o)}
      >
        <MapPin className="h-5 w-5 shrink-0" />
        <span className="hidden max-w-[11rem] flex-col text-left leading-tight md:flex">
          <span className="text-[11px] text-ink-soft">Deliver to</span>
          <span className="truncate font-medium">{label}</span>
        </span>
      </button>
      {open && (
        <div
          id={id}
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-cream p-4 shadow-lg"
        >
          {pin && answer && (
            <div className="mb-3 text-sm" role="status">
              <p className="font-medium">
                {answer.serviceable
                  ? `We deliver to ${pin}`
                  : `We don't deliver to ${pin} yet`}
                {answer.place && (
                  <span className="font-normal text-ink-soft">
                    {" "}
                    · {answer.place.district}
                  </span>
                )}
              </p>
              {answer.serviceable && (
                <ul className="mt-1 space-y-0.5 text-ink-soft">
                  {answerParts(answer, formatINR).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <form onSubmit={submit} className="flex gap-2">
            <label htmlFor={`${id}-pin`} className="sr-only">
              Pincode
            </label>
            <input
              id={`${id}-pin`}
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value.replace(/\D/g, ""))}
              placeholder={pin ? "Another pincode" : "Your pincode"}
              className="h-10 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="h-10 rounded-full bg-ink px-4 text-sm font-medium text-cream disabled:opacity-60"
            >
              {busy ? "…" : "Check"}
            </button>
          </form>
          {note && (
            <p className="mt-2 text-sm text-danger" role="alert">
              {note}
            </p>
          )}
          {pin && (
            <button
              type="button"
              className="mt-3 text-xs text-ink-soft underline"
              onClick={forget}
            >
              Forget this pincode
            </button>
          )}
        </div>
      )}
    </div>
  );
}
