import Link from "next/link";

export function Section({ eyebrow, title, href, linkLabel = "View all", children, className = "", center = false }: {
  eyebrow?: string; title: string; href?: string; linkLabel?: string; children: React.ReactNode; className?: string; center?: boolean;
}) {
  return (
    <section className={`mx-auto max-w-[1400px] px-4 pt-16 sm:px-6 sm:pt-24 ${className}`}>
      <div className={`mb-8 flex items-end gap-4 sm:mb-10 ${center ? "justify-center text-center" : "justify-between"}`}>
        <div>
          {eyebrow && <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">{eyebrow}</p>}
          <h2 className="font-heading text-3xl font-medium sm:text-4xl">{title}</h2>
          <span className="mt-3 block h-px w-12 bg-gold" aria-hidden />
        </div>
        {href && <Link href={href} className="shrink-0 border-b border-ink pb-0.5 text-sm font-medium hover:text-taupe-dark">{linkLabel} →</Link>}
      </div>
      {children}
    </section>
  );
}
