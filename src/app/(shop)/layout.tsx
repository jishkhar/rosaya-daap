import { getStoreCollections } from "@/lib/store";
import { getStorefront } from "@/themes/registry";
import type { Values } from "@/themes/schema";
import type { Theme } from "@/themes/types";
import { Suspense } from "react";

// Every page in this group reads the live catalogue from the ERP, so none of them can be built ahead of time: a build (CI, Vercel)
// has no ERP to talk to, and baking one moment's stock and prices into static HTML would be wrong anyway. Data is cached per fetch
// (see lib/store.ts), so rendering on request is cheap.
export const dynamic = "force-dynamic";

async function StoreHeader({ theme, settings }: { theme: Theme; settings: Values }) {
  const collections = await getStoreCollections().catch(() => []);
  return <theme.Header collections={collections} settings={settings} />;
}

async function StoreFooter({ theme, settings }: { theme: Theme; settings: Values }) {
  const collections = await getStoreCollections().catch(() => []);
  return <theme.Footer collections={collections} settings={settings} />;
}

/** Render the page immediately; catalogue decoration must not block the bag or account pages. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const { theme, config, preview } = await getStorefront();
  const { announcement, header, footer } = config.settings;
  return (
    <>
      <a href="#main" className="sr-only z-[100] bg-ink px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-2 focus:top-2">Skip to content</a>
      {preview && (
        <div role="status" className="bg-accent px-4 py-2 text-center text-xs font-medium text-white">
          Previewing unpublished theme changes. <a href="/preview?exit=1" className="underline">Exit preview</a>
        </div>
      )}
      <theme.AnnouncementBar settings={announcement} />
      <Suspense fallback={<theme.Header collections={[]} settings={header} />}>
        <StoreHeader theme={theme} settings={header} />
      </Suspense>
      <main id="main">{children}</main>
      <Suspense fallback={<theme.Footer collections={[]} settings={footer} />}>
        <StoreFooter theme={theme} settings={footer} />
      </Suspense>
    </>
  );
}
