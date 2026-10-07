import { notFound } from "next/navigation";
import { InfoPage } from "@/components/ui/InfoPage";

const TOPICS: Record<string, { title: string; body: string }> = {
  shipping: { title: "Shipping & Delivery", body: "Ready-to-ship styles are dispatched within 24 hours and delivered in 5–6 business days. Shipping is free on every order." },
  returns: { title: "Returns & Exchange", body: "Exchange within 7 days of delivery on unused items with tags intact. Handcrafted variations in weave and colour are not defects." },
  faq: { title: "FAQs", body: "Questions about sizing, care or custom orders? Message us on WhatsApp and we'll help." },
};

export function generateStaticParams() {
  return Object.keys(TOPICS).map((topic) => ({ topic }));
}

export default async function HelpPage({ params }: { params: Promise<{ topic: string }> }) {
  const t = TOPICS[(await params).topic];
  if (!t) notFound();
  return <InfoPage title={t.title}><p>{t.body}</p></InfoPage>;
}
