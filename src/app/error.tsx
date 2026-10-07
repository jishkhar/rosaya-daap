"use client";

import { useEffect } from "react";

/** Something threw while rendering a page (most often the ERP being unreachable). */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto max-w-md px-4 py-28 text-center">
      <h1 className="font-heading text-3xl">We hit a snag</h1>
      <p className="mt-2 text-ink-soft">The store couldn&apos;t load this page just now. Your bag is safe — please try again.</p>
      <button onClick={reset} className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-cream hover:bg-taupe-dark">Try again</button>
    </div>
  );
}
