import { InfoPage } from "@/components/ui/InfoPage";
import { getStorefront } from "@/themes/registry";

export const metadata = { title: "Terms of Service" };
export default async function Page() {
  return <InfoPage title="Terms of Service" text={(await getStorefront()).config.settings.pages.terms as string} />;
}
