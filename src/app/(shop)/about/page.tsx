import type { Metadata } from "next";
import { InfoPage } from "@/components/ui/InfoPage";
import { getStorefront } from "@/themes/registry";

const title = async () => {
  const name = (await getStorefront()).config.settings.brand.name as string;
  return name ? `About ${name}` : "About us";
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: await title() };
}

export default async function Page() {
  const { pages } = (await getStorefront()).config.settings;
  return <InfoPage title={await title()} text={pages.about as string} />;
}
