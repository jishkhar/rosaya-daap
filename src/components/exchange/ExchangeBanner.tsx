"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Repeat } from "lucide-react";
import { clearDraft, draftValue, useExchangeDraft } from "@/lib/exchange";
import { formatINR } from "@/lib/money";

/** Shown across the shop while an exchange is in progress: the shopper is here to choose what they want instead. */
export function ExchangeBanner() {
  const draft = useExchangeDraft();
  const pathname = usePathname();
  if (!draft || pathname.startsWith("/account/exchange")) return null;
  const count = draft.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div
      role="status"
      className="border-b border-line bg-sand px-4 py-3 text-sm"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="flex items-center gap-2">
          <Repeat className="h-4 w-4 shrink-0" />
          <span>
            Exchanging {count} item{count === 1 ? "" : "s"} from order #
            {draft.orderNumber} (worth {formatINR(draftValue(draft) / 100)}).{" "}
            {draft.replacement
              ? `Replacement chosen: ${draft.replacement.title}.`
              : "Pick the product you want instead."}
          </span>
        </p>
        <span className="flex items-center gap-4">
          {draft.replacement && (
            <Link
              href="/account/exchange"
              className="font-medium underline underline-offset-4"
            >
              Review exchange
            </Link>
          )}
          <button
            type="button"
            onClick={clearDraft}
            className="font-medium underline underline-offset-4"
          >
            Cancel exchange
          </button>
        </span>
      </div>
    </div>
  );
}
