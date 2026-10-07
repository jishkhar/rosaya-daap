"use client";

import Link from "next/link";
import { MapPin, Package, User } from "lucide-react";
import { stageOf, useRemoteList, type Address, type ApiOrder } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/money";

export default function AccountOverview() {
  const { user } = useAuth();
  const orders = useRemoteList<ApiOrder>("/api/me/orders", !!user);
  const addresses = useRemoteList<Address>("/api/me/addresses", !!user);
  if (!user) return null;
  const latest = orders.items[0];

  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink font-heading text-2xl text-cream">{user.name[0]}</span>
        <div>
          <h1 className="font-heading text-3xl font-medium">Hello, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-ink-soft">{user.email}</p>
        </div>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/account/orders", icon: Package, title: "Orders", text: `${orders.items.length} placed` },
          { href: "/account/addresses", icon: MapPin, title: "Addresses", text: `${addresses.items.length} saved` },
          { href: "/account/profile", icon: User, title: "Profile", text: "Name and password" },
        ].map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="block rounded-2xl border border-line bg-white p-5 transition-colors hover:border-ink">
              <Icon className="mb-3 h-6 w-6 text-taupe-dark" strokeWidth={1.4} />
              <p className="font-heading text-lg">{title}</p>
              <p className="text-sm text-ink-soft">{text}</p>
            </Link>
          </li>
        ))}
      </ul>

      {latest && (
        <section className="mt-8 rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-taupe-dark">Latest order</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium">#{latest.order_number} · <span className="text-ink-soft">{stageOf(latest.status)}</span></p>
            <p className="font-semibold">{formatINR(latest.total_minor / 100)}</p>
            <Link href="/account/orders" className="text-sm underline underline-offset-4">View details</Link>
          </div>
        </section>
      )}
    </div>
  );
}
