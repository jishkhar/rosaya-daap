import { InfoPage } from "@/components/ui/InfoPage";
import { getStorefront } from "@/themes/registry";

export const metadata = { title: "Privacy Policy" };
export default async function Page() {
  return <InfoPage title="Privacy Policy" text={(await getStorefront()).config.settings.pages.privacy as string} />;
}
