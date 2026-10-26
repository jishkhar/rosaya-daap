import { Suspense } from "react";
import { getStoreCollections } from "@/lib/store";
import { getStorefront } from "@/themes/registry";
import type { Values } from "@/themes/schema";
import type { Theme } from "@/themes/types";

async function StoreHeader({
  theme,
  settings,
}: {
  theme: Theme;
  settings: Values;
}) {
  const collections = await getStoreCollections().catch(() => []);
  return <theme.Header collections={collections} settings={settings} />;
}

/** The active shop's announcement and navigation, shared with checkout. */
export async function StorefrontHeader() {
  const { theme, config, preview } = await getStorefront();
  const { announcement, header } = config.settings;
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] bg-ink px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
      >
        Skip to content
      </a>
      {preview && (
        <div
          role="status"
          className="bg-accent px-4 py-2 text-center text-xs font-medium text-white"
        >
          Previewing unpublished theme changes.{" "}
          <a href="/preview?exit=1" className="underline">
            Exit preview
          </a>
        </div>
      )}
      <theme.AnnouncementBar settings={announcement} />
      <Suspense fallback={<theme.Header collections={[]} settings={header} />}>
        <StoreHeader theme={theme} settings={header} />
      </Suspense>
    </>
  );
}
