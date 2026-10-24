import { InfoPage } from "@/components/ui/InfoPage";
import { getPolicies } from "@/lib/store";

export const metadata = { title: "Legal notice" };

/** Written in the portal: Settings > Policies. */
export default async function Page() {
  return <InfoPage title="Legal notice" html={(await getPolicies()).legal} />;
}
