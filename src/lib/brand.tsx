"use client";

import { createContext, useContext } from "react";

/** Store identity from the active theme config (brand group), for client components such as the logo. */
export type Brand = { name: string; tagline: string; logo: string };

const BrandContext = createContext<Brand>({ name: "", tagline: "", logo: "" });

export function BrandProvider({
  brand,
  children,
}: {
  brand: Brand;
  children: React.ReactNode;
}) {
  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);
