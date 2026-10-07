"use client";

import { useEffect, useState } from "react";
import { announcements } from "@/content/site";

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % announcements.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bg-ink text-cream" role="region" aria-label="Announcements">
      <p key={i} className="animate-fade-up px-4 py-2 text-center text-[11px] font-medium tracking-[0.14em] uppercase sm:text-xs">
        {announcements[i]}
      </p>
    </div>
  );
}
