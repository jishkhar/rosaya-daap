import type { Metadata, Viewport } from "next";
import { permanentRedirect } from "next/navigation";
import "@fontsource-variable/josefin-sans";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "./globals.css";
import { NoShop } from "@/components/NoShop";
import { Providers } from "@/components/Providers";
import type { Brand } from "@/lib/brand";
import { primaryRedirect } from "@/lib/primary";
import { siteUrl } from "@/lib/site";
import { getStorefront } from "@/themes/registry";

/** Page titles, description and icon follow the store's brand settings (theme config, or the business's own name). */
export async function generateMetadata(): Promise<Metadata> {
  const { brand, footer } = (await getStorefront()).config.settings;
  const name =
    [brand.name, brand.tagline].filter(Boolean).join(" ") || "Online store";
  return {
    metadataBase: new URL(await siteUrl()),
    title: { default: name, template: `%s | ${name}` },
    description: (footer.tagline as string) || `Shop online at ${name}.`,
    ...(brand.logo ? { icons: { icon: brand.logo as string } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#faf6f0",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { config, status, primaryHost, shipping } = await getStorefront();
  // A shop's other addresses (platform address, non-primary domains) answer 308 to the primary one, same path.
  const target = await primaryRedirect(primaryHost);
  if (target) permanentRedirect(target);
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-clip">
        {status === "open" ? (
          <Providers brand={config.settings.brand as Brand} shipping={shipping}>
            {children}
          </Providers>
        ) : (
          <NoShop status={status} />
        )}
      </body>
    </html>
  );
}
