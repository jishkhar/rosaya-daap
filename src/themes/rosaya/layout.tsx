/* eslint-disable @next/next/no-img-element -- Theme artwork accepts local files and arbitrary validated ERP upload URLs. */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/ui/Social";
import type { Values } from "@/themes/schema";
import { Newsletter } from "./interactions";
import styles from "./rosaya.module.css";

type FooterLink = { label: string; href: string };
type Column = {
  title: string;
  links: FooterLink[];
  store_collections: boolean;
};

export function AnnouncementBar({ settings }: { settings: Values }) {
  if (!settings.enabled || !settings.text) return null;
  const content = (
    <span>
      {settings.text as string}
      <ArrowRight size={14} aria-hidden="true" />
    </span>
  );
  return (
    <div className={styles.announcement}>
      {settings.href ? (
        <Link href={settings.href as string}>{content}</Link>
      ) : (
        <span>{content}</span>
      )}
    </div>
  );
}

export function Footer({
  settings,
  collections = [],
  policyLinks = [],
}: {
  settings: Values;
  collections?: { name: string; slug: string }[];
  policyLinks?: FooterLink[];
}) {
  const columns = (settings.columns as Column[]).map((column) => ({
    ...column,
    links: [
      ...(column.store_collections
        ? [
            ...collections
              .slice(0, 6)
              .map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
            { label: "All collections", href: "/collections" },
          ]
        : []),
      ...column.links.flatMap((link) => {
        const current = collections.find((c) => link.href === `/collections/${c.slug}`);
        if (current) return [{ ...link, label: current.name }];
        return link.href.startsWith("/collections/collection-") ? [] : [link];
      }),
    ],
  }));
  const linked = new Set(columns.flatMap((c) => c.links.map((l) => l.href)));
  const additionalPolicies = policyLinks.filter((l) => !linked.has(l.href));
  const socials = [
    { name: "Facebook", href: settings.facebook as string, Icon: FacebookIcon },
    {
      name: "Instagram",
      href: settings.instagram as string,
      Icon: InstagramIcon,
    },
    { name: "YouTube", href: settings.youtube as string, Icon: YoutubeIcon },
  ].filter((s) => s.href);
  const payments = settings.payments as { label: string; image: string }[];
  return (
    <>
      {settings.marquee ? (
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} aria-hidden={i > 0}>
                {settings.marquee as string}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          {columns.map((column, i) => (
            <div key={i}>
              <h3>{column.title}</h3>
              <ul>
                {column.links
                  .filter((l) => l.href && l.label)
                  .map((link, j) => (
                    <li key={j}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <div className={styles.footerSubscribe}>
            <h3>{settings.newsletter_title as string}</h3>
            <Newsletter
              url={settings.newsletter_url as string}
              email={settings.email as string}
            />
            {socials.length > 0 && (
              <div className={styles.socials}>
                <h3>{settings.social_title as string}</h3>
                <div>
                  {socials.map(({ name, href, Icon }) => (
                    <a
                      key={name}
                      href={href}
                      aria-label={name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {additionalPolicies.length > 0 && (
          <nav className={styles.policyLinks} aria-label="Store policies">
            {additionalPolicies.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className={styles.footerBottom}>
          <small>
            © {new Date().getFullYear()} {settings.copyright as string}
          </small>
          {payments.length > 0 && (
            <div className={styles.payments}>
              <span>{settings.payment_title as string}</span>
              <div>
                {payments
                  .filter((p) => p.image)
                  .map((p, i) => (
                    <img
                      key={i}
                      src={p.image}
                      alt={p.label}
                      width={38}
                      height={24}
                      loading="lazy"
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </footer>
    </>
  );
}
