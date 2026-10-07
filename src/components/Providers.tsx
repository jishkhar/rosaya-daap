"use client";

import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <CartDrawer />
      </CartProvider>
    </AuthProvider>
  );
}
