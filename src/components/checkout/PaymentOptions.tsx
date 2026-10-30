"use client";

import type { ReactNode } from "react";
import {
  Banknote,
  CalendarClock,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { PaymentChoice, PaymentOptions as Options } from "@/lib/razorpay";

/** What the shopper picked on the payment step: one of the online ways (paid in Razorpay's window), or cash on delivery. */
export type PayWay = PaymentChoice["method"] | "cod";

type Row = { way: PayWay; title: string; note: string; icon: ReactNode };

/**
 * The payment step, Flipkart/Amazon style: every way to pay listed on our own page. Online ways open Razorpay's secure window at that
 * choice when the shopper presses Pay; net banking shows the popular banks and a list of the rest. Only what the shop's Razorpay
 * account takes is listed.
 */
export function PaymentOptions({
  options,
  onlinePay,
  value,
  bank,
  codOff,
  disabled,
  onChange,
}: {
  options: Options | null;
  onlinePay: boolean;
  value: PayWay;
  bank: string | null;
  codOff: string | null;
  disabled?: boolean;
  onChange: (way: PayWay, bank: string | null) => void;
}) {
  const online = onlinePay && options?.available !== false;
  const o = options ?? { available: true, upi: true, card: true };
  const rows: Row[] = [
    ...(online
      ? ([
          o.upi && {
            way: "upi",
            title: "UPI",
            note: "Google Pay, PhonePe, Paytm or any UPI app",
            icon: <Smartphone className="h-5 w-5" />,
          },
          o.card && {
            way: "card",
            title: "Credit / Debit / ATM card",
            note: "Card details are entered securely with Razorpay",
            icon: <CreditCard className="h-5 w-5" />,
          },
          {
            way: "netbanking",
            title: "Net banking",
            note: "Pay from your bank account",
            icon: <Landmark className="h-5 w-5" />,
          },
          o.wallet && {
            way: "wallet",
            title: "Wallets",
            note: "Paytm, PhonePe, Amazon Pay and more",
            icon: <Wallet className="h-5 w-5" />,
          },
          o.emi && {
            way: "emi",
            title: "EMI (easy instalments)",
            note: "On eligible cards",
            icon: <CalendarClock className="h-5 w-5" />,
          },
        ].filter(Boolean) as Row[])
      : []),
    {
      way: "cod",
      title: "Cash on delivery",
      note: codOff ?? "Pay when your order arrives",
      icon: <Banknote className="h-5 w-5" />,
    },
  ];
  const popular = o.popular_banks ?? [];
  const others = (o.banks ?? []).filter(
    ([code]) => !popular.some(([p]) => p === code),
  );

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Payment method">
      {rows.map((r) => {
        const off = r.way === "cod" && !!codOff;
        const chosen = value === r.way;
        return (
          <div
            key={r.way}
            className={`rounded-xl border ${chosen ? "border-[#75414b] bg-[#fbf4f1]" : "border-line"} ${off ? "opacity-60" : ""}`}
          >
            <label
              className={`flex items-start gap-4 p-4 ${off ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="pay"
                disabled={disabled || off}
                checked={chosen}
                onChange={() =>
                  onChange(r.way, r.way === "netbanking" ? bank : null)
                }
                className="mt-1 h-4 w-4 accent-[#43262b]"
              />
              <span className="mt-0.5 text-[#916b36]" aria-hidden="true">
                {r.icon}
              </span>
              <span>
                <span className="block font-medium">{r.title}</span>
                <span className="text-sm text-ink-soft">{r.note}</span>
              </span>
            </label>
            {chosen && r.way === "netbanking" && (
              <div className="border-t border-line px-4 pb-4 pt-3">
                {popular.length > 0 && (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                      Popular banks
                    </p>
                    <div
                      className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                      role="radiogroup"
                      aria-label="Popular banks"
                    >
                      {popular.map(([code, name]) => (
                        <label
                          key={code}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${bank === code ? "border-[#75414b]" : "border-line"}`}
                        >
                          <input
                            type="radio"
                            name="bank"
                            disabled={disabled}
                            checked={bank === code}
                            onChange={() => onChange("netbanking", code)}
                            className="h-4 w-4 accent-[#43262b]"
                          />
                          {name}
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {others.length > 0 && (
                  <label className="mt-3 block text-sm">
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                      Other banks
                    </span>
                    <select
                      disabled={disabled}
                      value={
                        others.some(([c]) => c === bank) ? (bank ?? "") : ""
                      }
                      onChange={(e) =>
                        onChange("netbanking", e.target.value || null)
                      }
                      className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm"
                    >
                      <option value="">Select a bank</option>
                      {others.map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {popular.length === 0 && others.length === 0 && (
                  <p className="text-sm text-ink-soft">
                    You&apos;ll choose your bank in the next step.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {online && (
        <p className="pt-1 text-xs text-ink-soft">
          Payments are processed securely by Razorpay. We never see or store
          your card details.
        </p>
      )}
    </div>
  );
}
