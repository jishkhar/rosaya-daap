import { Mail, MapPin, Phone } from "lucide-react";
import { FooterColumn } from "@/components/layout/FooterColumn";
import { Logo } from "@/components/ui/Logo";
import { Newsletter } from "@/components/layout/Newsletter";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/ui/Social";
import { byKind, getCollection, nav } from "@/content/site";

const col = (slugs: string[]) => slugs.map((s) => ({ label: getCollection(s)!.name, href: `/c/${s}` }));

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  { title: "Shop", links: [{ label: "New Arrivals", href: "/c/new-arrivals" }, ...col(nav.women.slice(0, 5)), { label: "Garba Collection", href: "/c/garba" }, ...col(nav.accessories)] },
  { title: "Collections", links: [...col(byKind("craft").map((c) => c.slug)), ...col(byKind("occasion").slice(0, 3).map((c) => c.slug))] },
  {
    title: "Help",
    links: [
      { label: "Shipping & Delivery", href: "/help/shipping" },
      { label: "Returns & Exchange", href: "/help/returns" },
      { label: "Track Your Order", href: "/account/orders" },
      { label: "FAQs", href: "/help/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Rosaya", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-sm font-heading text-xl leading-snug text-cream/90">
              Where fabric carries legacy. Made by real hands, meant for real stories.
            </p>
            <div className="mt-7">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-gold">Join the Rosaya family</p>
              <Newsletter dark />
              <p className="mt-2 text-xs text-cream/50">New drops, craft stories and early access. No spam.</p>
            </div>
            <div className="mt-7 flex gap-3">
              {[
                { l: "Instagram", i: <InstagramIcon /> },
                { l: "Facebook", i: <FacebookIcon /> },
                { l: "YouTube", i: <YoutubeIcon /> },
              ].map((s) => (
                <a key={s.l} href="#" aria-label={s.l} className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 hover:border-gold hover:text-gold">
                  {s.i}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns: accordion on mobile, grid on desktop */}
          <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((c) => (
              <FooterColumn key={c.title} title={c.title} links={c.links} />
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 border-t border-cream/15 pt-8 text-sm text-cream/70 sm:grid-cols-3">
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Rosaya Fashions, India — shipping worldwide soon</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-gold" /> WhatsApp support, 10am–7pm</p>
          <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-gold" /> care@rosaya.in</p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-cream/15 pt-6 text-xs text-cream/55 sm:flex-row">
          <p>© {new Date().getFullYear()} Rosaya Fashions. All rights reserved.</p>
          <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Accepted payments">
            {["UPI", "Visa", "Mastercard", "RuPay", "NetBanking", "COD"].map((p) => (
              <li key={p} className="rounded border border-cream/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cream/80">{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
