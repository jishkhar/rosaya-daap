"use client";

import { createContext, useContext } from "react";
import type { Shipping } from "@/lib/shipping";

// null: unknown (store API unreachable), so no fee is promised either way and no delivery time is shown
const ShippingContext = createContext<Shipping | null>(null);

export function ShippingProvider({
  shipping,
  children,
}: {
  shipping: Shipping | null;
  children: React.ReactNode;
}) {
  return (
    <ShippingContext.Provider value={shipping}>
      {children}
    </ShippingContext.Provider>
  );
}

export const useShipping = () => useContext(ShippingContext);
