import type { Metadata, Viewport } from "next";
import "@fontsource-variable/josefin-sans";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Rosaya Fashions — Handcrafted Ethnic & Fusion Wear", template: "%s | Rosaya Fashions" },
  description: "Where fabric carries legacy. Handcrafted sarees, lehengas, kurtis and more — made by real hands, meant for real stories.",
  icons: { icon: "/logo-mark.png" },
};

export const viewport: Viewport = { themeColor: "#faf6f0" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-clip">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
