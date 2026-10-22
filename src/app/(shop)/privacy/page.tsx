import { InfoPage } from "@/components/ui/InfoPage";
import { getPolicies } from "@/lib/store";

export const metadata = { title: "Privacy Policy" };

/** Written in the portal: Settings > Policies. */
export default async function Page() {
  return (
    <InfoPage title="Privacy Policy" html={(await getPolicies()).privacy} />
  );
}
