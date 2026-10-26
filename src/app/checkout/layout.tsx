import { StorefrontHeader } from "@/components/StorefrontHeader";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StorefrontHeader />
      <main id="main">{children}</main>
    </>
  );
}
