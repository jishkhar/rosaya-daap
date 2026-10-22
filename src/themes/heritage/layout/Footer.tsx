import { Mail, MapPin, Phone } from "lucide-react";
import { FooterColumn } from "@/themes/heritage/layout/FooterColumn";
import { Logo } from "@/components/ui/Logo";
import { Newsletter } from "@/themes/heritage/layout/Newsletter";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/ui/Social";
import type { Values } from "@/themes/schema";

type Link = { label: string; href: string };
type Column = { title: string; store_collections: boolean; links: Link[] };

export function Footer({
  collections = [],
  settings,
}: {
  collections?: { slug: string; name: string }[];
  settings: Values;
}) {
  const columns = (settings.columns as Column[]).map((column) => ({
    title: column.title,
    links: [
      ...(column.store_collections
        ? [
            ...collections
              .slice(0, 6)
              .map((c) => ({ label: c.name, href: `/c/${c.slug}` })),
            { label: "All collections", href: "/collections" },
          ]
        : []),
      ...column.links.filter((l) => l.label && l.href),
    ],
  }));
  const socials = [
    {
      l: "Instagram",
      href: settings.instagram as string,
      i: <InstagramIcon />,
    },
    { l: "Facebook", href: settings.facebook as string, i: <FacebookIcon /> },
    { l: "YouTube", href: settings.youtube as string, i: <YoutubeIcon /> },
  ].filter((s) => s.href);
  const contact = [
    {
      text: settings.address as string,
      icon: <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />,
      align: "items-start",
    },
    {
      text: settings.phone as string,
      icon: <Phone className="h-4 w-4 shrink-0 text-gold" />,
      align: "items-center",
    },
    {
      text: settings.email as string,
      icon: <Mail className="h-4 w-4 shrink-0 text-gold" />,
      align: "items-center",
    },
  ].filter((c) => c.text);
  const payments = (settings.payments as { label: string }[])
    .map((p) => p.label)
    .filter(Boolean);
  return (
    <footer className="mt-24 bg-ink text-cream">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo light />
            {settings.tagline ? (
              <p className="mt-5 max-w-sm font-heading text-xl leading-snug text-cream/90">
                {settings.tagline as string}
              </p>
            ) : null}
            <div className="mt-7">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-gold">
                {settings.newsletter_title as string}
              </p>
              <Newsletter dark />
              <p className="mt-2 text-xs text-cream/50">
                {settings.newsletter_note as string}
              </p>
            </div>
            {socials.length > 0 && (
              <div className="mt-7 flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.l}
                    href={s.href}
                    aria-label={s.l}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 hover:border-gold hover:text-gold"
                  >
                    {s.i}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns: accordion on mobile, grid on desktop */}
          <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((c) => (
              <FooterColumn key={c.title} title={c.title} links={c.links} />
            ))}
          </div>
        </div>

        {contact.length > 0 && (
          <div className="mt-12 grid gap-4 border-t border-cream/15 pt-8 text-sm text-cream/70 sm:grid-cols-3">
            {contact.map((c) => (
              <p key={c.text} className={`flex ${c.align} gap-2`}>
                {c.icon} {c.text}
              </p>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-cream/15 pt-6 text-xs text-cream/55 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.copyright as string}
          </p>
          {payments.length > 0 && (
            <ul
              className="flex flex-wrap items-center justify-center gap-2"
              aria-label="Accepted payments"
            >
              {payments.map((p) => (
                <li
                  key={p}
                  className="rounded border border-cream/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cream/80"
                >
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
