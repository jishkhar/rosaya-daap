"use client";

import { createContext, useContext } from "react";
import { ALL_FEATURES, type StoreFeatures } from "@/lib/featureFlags";

export type { StoreFeatures };

const FeaturesContext = createContext<StoreFeatures>(ALL_FEATURES);

export function FeaturesProvider({
  features,
  children,
}: {
  features: StoreFeatures;
  children: React.ReactNode;
}) {
  return (
    <FeaturesContext.Provider value={features}>
      {children}
    </FeaturesContext.Provider>
  );
}

export const useStoreFeatures = () => useContext(FeaturesContext);
