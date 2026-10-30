"use client";

import { AuthProvider } from "@/lib/auth";
import { BrandProvider, type Brand } from "@/lib/brand";
import { CartProvider } from "@/lib/cart";
import { DeliverToProvider } from "@/lib/deliverTo";
import { FeaturesProvider, type StoreFeatures } from "@/lib/features";
import type { Shipping } from "@/lib/shipping";
import { ShippingProvider } from "@/lib/shippingContext";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Providers({
  brand,
  shipping,
  features,
  children,
}: {
  brand: Brand;
  shipping: Shipping | null;
  features: StoreFeatures;
  children: React.ReactNode;
}) {
  return (
    <FeaturesProvider features={features}>
      <BrandProvider brand={brand}>
        <ShippingProvider shipping={shipping}>
          <AuthProvider>
            <CartProvider>
              <DeliverToProvider>
                {children}
                {features.cart && <CartDrawer />}
              </DeliverToProvider>
            </CartProvider>
          </AuthProvider>
        </ShippingProvider>
      </BrandProvider>
    </FeaturesProvider>
  );
}
