import { InfoPage } from "@/components/ui/InfoPage";
import { getPolicies } from "@/lib/store";

export const metadata = { title: "Terms of Service" };

/** Written in the portal: Settings > Policies. */
export default async function Page() {
  return (
    <InfoPage title="Terms of Service" html={(await getPolicies()).terms} />
  );
}
