"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { OrderConfirmation } from "./OrderConfirmation";

export function OrderConfirmationModal({ orderId }: { orderId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label="Order confirmation"
      onCancel={(event) => {
        event.preventDefault();
        router.replace("/account/orders");
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-line bg-white p-6 text-ink backdrop:bg-ink/40 sm:p-8"
    >
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          autoFocus
          onClick={() => router.replace("/account/orders")}
          aria-label="Close order confirmation"
          className="rounded-full p-2 hover:bg-sand"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <OrderConfirmation id={orderId} />
    </dialog>
  );
}
