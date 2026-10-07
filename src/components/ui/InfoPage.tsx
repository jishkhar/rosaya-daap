import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";

/** Placeholder content page until real copy / CMS exists. */
export function InfoPage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
      <div className="py-6"><Breadcrumb trail={[{ label: "Home", href: "/" }, { label: title }]} /></div>
      <h1 className="font-heading text-4xl font-medium">{title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">
        {children ?? <p>This page is coming soon. In the meantime, reach us on WhatsApp or at care@rosaya.in.</p>}
      </div>
      <ButtonLink href="/shop" className="mt-8">Continue shopping</ButtonLink>
    </div>
  );
}
