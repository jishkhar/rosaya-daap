import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { getStorefront } from "@/themes/registry";

/** Text the shop wrote in the theme editor: a blank line starts a new paragraph. */
export function Paragraphs({ text }: { text: string }) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>);
}

/** A content page: the shop's own text, or until it writes some, a short note pointing at its contact details. */
export async function InfoPage({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  const email = (await getStorefront()).config.settings.footer.email as string;
  const body = children ?? (text?.trim() ? <Paragraphs text={text} /> : (
    <p>This page is coming soon. In the meantime, {email ? <>reach us at <a href={`mailto:${email}`} className="text-ink underline underline-offset-4">{email}</a>.</> : "reach us using the details at the bottom of this page."}</p>
  ));
  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
      <div className="py-6"><Breadcrumb trail={[{ label: "Home", href: "/" }, { label: title }]} /></div>
      <h1 className="font-heading text-4xl font-medium">{title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">{body}</div>
      <ButtonLink href="/shop" className="mt-8">Continue shopping</ButtonLink>
    </div>
  );
}
