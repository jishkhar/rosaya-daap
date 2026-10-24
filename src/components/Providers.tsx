"use client";

import { AuthProvider } from "@/lib/auth";
import { BrandProvider, type Brand } from "@/lib/brand";
import { CartProvider } from "@/lib/cart";
import { DeliverToProvider } from "@/lib/deliverTo";
import type { Shipping } from "@/lib/shipping";
import { ShippingProvider } from "@/lib/shippingContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Providers({
  brand,
  shipping,
  children,
}: {
  brand: Brand;
  shipping: Shipping | null;
  children: React.ReactNode;
}) {
  return (
    <BrandProvider brand={brand}>
      <ShippingProvider shipping={shipping}>
        <AuthProvider>
          <CartProvider>
            <DeliverToProvider>
              {children}
              <CartDrawer />
            </DeliverToProvider>
          </CartProvider>
        </AuthProvider>
      </ShippingProvider>
    </BrandProvider>
  );
}
