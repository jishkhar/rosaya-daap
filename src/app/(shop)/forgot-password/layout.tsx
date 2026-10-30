import { FeatureUnavailable } from "@/components/FeatureUnavailable";
import { getStorefront } from "@/themes/registry";

/** Signing in and up only while the shop has customer accounts on. */
export default async function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { features } = await getStorefront();
  if (features.accounts) return children;
  return (
    <FeatureUnavailable
      title="Accounts aren't available"
      message="This shop doesn't offer customer accounts at the moment."
    />
  );
}
