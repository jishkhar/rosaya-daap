import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPage } from "@/components/ui/InfoPage";
import { getStorefront } from "@/themes/registry";

/** Help pages; their text is the shop's own (theme editor > Store pages). */
const TOPICS: Record<string, { title: string; key: string }> = {
  shipping: { title: "Shipping & Delivery", key: "shipping" },
  returns: { title: "Returns & Exchange", key: "returns" },
  faq: { title: "FAQs", key: "faq" },
};

type Props = { params: Promise<{ topic: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = TOPICS[(await params).topic];
  return t ? { title: t.title } : {};
}

export default async function HelpPage({ params }: Props) {
  const t = TOPICS[(await params).topic];
  if (!t) notFound();
  return <InfoPage title={t.title} text={(await getStorefront()).config.settings.pages[t.key] as string} />;
}
