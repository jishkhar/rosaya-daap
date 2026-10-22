import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPage } from "@/components/ui/InfoPage";
import { getPolicies } from "@/lib/store";
import { getStorefront } from "@/themes/registry";

/** Help pages, in the shop's own words: shipping and returns are policies (portal Settings > Policies), FAQs the theme's Store pages. */
const TOPICS: Record<
  string,
  { title: string; policy?: "shipping" | "returns" }
> = {
  shipping: { title: "Shipping & Delivery", policy: "shipping" },
  returns: { title: "Returns & Exchange", policy: "returns" },
  faq: { title: "FAQs" },
};

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = TOPICS[(await params).topic];
  return t ? { title: t.title } : {};
}

export default async function HelpPage({ params }: Props) {
  const t = TOPICS[(await params).topic];
  if (!t) notFound();
  return t.policy ? (
    <InfoPage title={t.title} html={(await getPolicies())[t.policy]} />
  ) : (
    <InfoPage
      title={t.title}
      text={(await getStorefront()).config.settings.pages.faq as string}
    />
  );
}
