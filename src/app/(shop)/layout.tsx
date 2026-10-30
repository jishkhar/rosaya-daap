import { ExchangeBanner } from "@/components/exchange/ExchangeBanner";
import { StorefrontHeader } from "@/components/StorefrontHeader";
import { policyLinks } from "@/lib/policies";
import { getPolicies, getStoreCollections } from "@/lib/store";
import { getStorefront } from "@/themes/registry";
import type { Values } from "@/themes/schema";
import type { Theme } from "@/themes/types";
import { Suspense } from "react";

// Every page in this group reads the live catalogue from the ERP, so none of them can be built ahead of time: a build (CI, Vercel)
// has no ERP to talk to, and baking one moment's stock and prices into static HTML would be wrong anyway. Data is cached per fetch
// (see lib/store.ts), so rendering on request is cheap.
export const dynamic = "force-dynamic";

async function StoreFooter({
  theme,
  settings,
}: {
  theme: Theme;
  settings: Values;
}) {
  const [collections, policies] = await Promise.all([
    getStoreCollections().catch(() => []),
    getPolicies(),
  ]);
  return (
    <theme.Footer
      collections={collections}
      settings={settings}
      policyLinks={policyLinks(policies)}
    />
  );
}

/** Render the page immediately; catalogue decoration must not block the bag or account pages. */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, config } = await getStorefront();
  const { footer } = config.settings;
  return (
    <>
      <StorefrontHeader />
      <ExchangeBanner />
      <main id="main">{children}</main>
      <Suspense
        fallback={
          <theme.Footer collections={[]} settings={footer} policyLinks={[]} />
        }
      >
        <StoreFooter theme={theme} settings={footer} />
      </Suspense>
    </>
  );
}
