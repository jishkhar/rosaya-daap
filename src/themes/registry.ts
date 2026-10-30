import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { api, ApiError } from "@/lib/api";
import { heritage } from "@/themes/heritage";
import { rosaya } from "@/themes/rosaya";
import { LIVE_PREVIEW_COOKIE, PREVIEW_COOKIE } from "@/themes/preview";
import {
  resolveConfig,
  withIdentity,
  type StoreIdentity,
  type ThemeConfig,
} from "@/themes/schema";
import {
  ALL_FEATURES,
  toFeatures,
  type StoreFeatures,
} from "@/lib/featureFlags";
import type { Shipping } from "@/lib/shipping";
import type { Theme } from "@/themes/types";

export const themes: Record<string, Theme> = { heritage, rosaya };

const LIVE_REVALIDATE = 30; // seconds a publish takes to reach shoppers

type StoreTheme = {
  theme_key: string | null;
  config: unknown;
  version: number | null;
  preview: boolean;
  store?: StoreIdentity & {
    primary_host?: string | null;
    shipping?: Shipping;
  };
};

/**
 * The theme and validated config this request renders with: the tenant's live (published) theme, or with a preview cookie, the draft
 * being edited. Nothing published, an unknown theme or the store API unreachable -> Heritage as shipped, so the site always renders.
 */
/** "missing": no shop at this address; "closed": the shop exists but its website is off (plan ended, switched off, tenant inactive). */
export type ShopStatus = "open" | "missing" | "closed";

export const getStorefront = cache(
  async (): Promise<{
    theme: Theme;
    config: ThemeConfig;
    preview: boolean;
    status: ShopStatus;
    /** The shop's primary address (its connected custom domain, else its platform address); null when unknown. */
    primaryHost: string | null;
    /** The shop's delivery fee and time; null when unknown. */
    shipping: Shipping | null;
    /** Which parts of the website the shop has on (the platform's Online options). */
    features: StoreFeatures;
  }> => {
    const jar = await cookies();
    const livePreview = jar.get(LIVE_PREVIEW_COOKIE)?.value === "1";
    const token = livePreview ? undefined : jar.get(PREVIEW_COOKIE)?.value;
    let data: StoreTheme | null = null;
    let status: ShopStatus = "open";
    if (token)
      data = await api<StoreTheme>("/theme", { preview: token }).catch(
        () => null,
      ); // expired -> the live theme
    data ??= await api<StoreTheme>(
      "/theme",
      livePreview
        ? {}
        : {
            revalidate: LIVE_REVALIDATE,
          },
    ).catch((e) => {
      if (e instanceof ApiError && e.status === 404) status = "missing";
      else if (e instanceof ApiError && e.status === 403) status = "closed";
      return null; // anything else (API down): render the default theme; pages show their own "unavailable" notices
    });
    const features =
      status === "open"
        ? await api<{ options: Record<string, boolean> }>("/features", {
            revalidate: LIVE_REVALIDATE,
          })
            .then((r) => toFeatures(r.options))
            .catch(() => ALL_FEATURES)
        : ALL_FEATURES;
    const known = data?.theme_key ? themes[data.theme_key] : undefined;
    const theme = known ?? heritage;
    const config = resolveConfig(
      theme.schema,
      known ? data?.config : null,
      theme.defaults,
    );
    return {
      theme,
      config: withIdentity(config, data?.store),
      preview: !!(known && data?.preview),
      status,
      primaryHost: data?.store?.primary_host ?? null,
      shipping: data?.store?.shipping ?? null,
      features,
    };
  },
);
