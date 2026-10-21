import type { ComponentType, ReactNode } from "react";
import type { StoreCollection } from "@/lib/store";
import type { ThemeSchema, Values } from "@/themes/schema";

/**
 * A storefront theme. Every theme is a folder under src/themes with the same shape; the shared engine (cart, checkout, account,
 * the store API client in src/lib) is the same for all of them. Tenants never write code: they only change the settings the
 * theme's schema allows. Every component gets settings already run through resolveConfig, so each schema key is present and typed.
 */

/**
 * A section type a theme offers. `load` runs on the server before render (data calls are de-duplicated per render by lib/api);
 * if it throws, the section still renders with `data` undefined and the page shows its "temporarily unavailable" notice.
 */
export type SectionDef<D = unknown> = {
  load?: (settings: Values) => Promise<D>;
  Component: (props: { settings: Values; data: D | undefined }) => ReactNode;
};

export type Theme = {
  key: string;
  name: string;
  schema: ThemeSchema;
  /** Starting config for a new install; also fills any group or template missing from a saved config. */
  defaults: unknown;
  AnnouncementBar: ComponentType<{ settings: Values }>;
  Header: ComponentType<{ collections: StoreCollection[]; settings: Values }>;
  Footer: ComponentType<{ collections: StoreCollection[]; settings: Values }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each section type has its own data shape
  sections: Record<string, SectionDef<any>>;
};
