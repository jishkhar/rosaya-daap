"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LayoutDashboard, LogOut, MapPin, Package, User } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useAuth } from "@/lib/auth";

const TABS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: User },
];

/** Auth guard + tab navigation shared by every /account page. */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const leaving = useRef(false); // logging out sends you home, not to /login

  useEffect(() => {
    if (ready && !user && !leaving.current) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-2xl bg-sand" aria-label="Loading account" />;

  const here = TABS.find((t) => t.href === pathname) ?? TABS[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="py-6"><Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "My Account", href: here.href === "/account" ? undefined : "/account" }, ...(here.href === "/account" ? [] : [{ label: here.label }])]} /></div>
      <div className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-12">
        <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0">
          {TABS.map(({ href, label, icon: Icon }) => {
            const on = pathname === href;
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium md:rounded-xl ${on ? "bg-ink text-cream" : "hover:bg-sand"}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
          <button onClick={() => { leaving.current = true; router.push("/"); logout(); }} className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-sand md:mt-4 md:rounded-xl">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
