"use client";

import { useEffect, useState } from "react";
import type { Values } from "@/themes/schema";

export function AnnouncementBar({ settings }: { settings: Values }) {
  const messages = (settings.messages as { text: string }[])
    .map((m) => m.text)
    .filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % messages.length), 4500);
    return () => clearInterval(t);
  }, [messages.length]);
  if (!settings.enabled || !messages.length) return null;
  return (
    <div className="bg-ink text-cream" role="region" aria-label="Announcements">
      <p
        key={i}
        className="animate-fade-up px-4 py-2 text-center text-[11px] font-medium tracking-[0.14em] uppercase sm:text-xs"
      >
        {messages[i % messages.length]}
      </p>
    </div>
  );
}
