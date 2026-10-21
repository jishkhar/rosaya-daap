"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function Newsletter({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return done ? (
    <p className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-gold" /> You&apos;re on the list — thank you!</p>
  ) : (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.includes("@")) setDone(true); // TODO(S7): POST to ERP marketing-consent endpoint
      }}
      className="flex w-full max-w-md gap-2"
    >
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <input
        id="nl-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className={`h-11 min-w-0 flex-1 rounded-full border px-5 text-sm outline-none focus:border-gold ${dark ? "border-cream/30 bg-transparent text-cream placeholder:text-cream/50" : "border-line bg-white"}`}
      />
      <button className="h-11 rounded-full bg-gold px-6 text-sm font-medium text-ink hover:bg-cream">Subscribe</button>
    </form>
  );
}
