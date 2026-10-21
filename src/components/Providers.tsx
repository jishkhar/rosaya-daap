"use client";

import { AuthProvider } from "@/lib/auth";
import { BrandProvider, type Brand } from "@/lib/brand";
import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Providers({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  return (
    <BrandProvider brand={brand}>
      <AuthProvider>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </AuthProvider>
    </BrandProvider>
  );
}
