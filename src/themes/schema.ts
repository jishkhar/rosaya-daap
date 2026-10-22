/**
 * Theme schema and config validation. Shared by every theme, no imports, plain data only: the portal builds its editor from the
 * same schema, and the storefront runs every config through `resolveConfig` before rendering, so a stale or hand-edited config
 * can never break the site. Unknown keys and section types are dropped; missing or wrong-typed values fall back to the default.
 */

export type Values = Record<string, unknown>;
export type Option = { value: string; label: string };

type Base = { key: string; label: string; help?: string };
export type Field =
  | (Base & { type: "text" | "textarea"; default?: string; max?: number })
  | (Base & { type: "url" | "image"; default?: string })
  | (Base & { type: "collection"; default?: string })
  | (Base & { type: "collections"; default?: string[]; max?: number })
  | (Base & { type: "toggle"; default?: boolean })
  | (Base & { type: "number"; default?: number; min?: number; max?: number })
  | (Base & { type: "select"; options: Option[]; default?: string })
  | (Base & {
      type: "list";
      fields: Field[];
      default?: Values[];
      max?: number;
      itemLabel?: string;
    });

export type SectionSchema = { type: string; name: string; fields: Field[] };

/** Fixed setting groups every theme has (shared by every page), plus the section types its page templates can use. */
export const GROUPS = [
  "brand",
  "announcement",
  "header",
  "footer",
  "pages",
] as const;
export type Group = (typeof GROUPS)[number];
export type ThemeSchema = {
  settings: Record<Group, Field[]>;
  sections: SectionSchema[];
};

export type SectionInstance = { id: string; type: string; settings: Values };
export type ThemeConfig = {
  settings: Record<Group, Values>;
  templates: { home: SectionInstance[] };
};

export const MAX_SECTIONS = 30;

const isObj = (v: unknown): v is Values =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const ID = /^[A-Za-z0-9_-]{1,40}$/;
// Tenant-controlled links: site paths, web, mail and phone only (never javascript: or data:).
export const URL_OK = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;
export const IMAGE_OK = /^(\/(?!\/)|https:\/\/)/i;

function resolveField(f: Field, v: unknown): unknown {
  switch (f.type) {
    case "text":
    case "textarea":
      return typeof v === "string"
        ? v.slice(0, f.max ?? (f.type === "text" ? 300 : 2000))
        : (f.default ?? "");
    case "url":
      return typeof v === "string" && (v === "" || URL_OK.test(v))
        ? v.slice(0, 500)
        : (f.default ?? "");
    case "image":
      return typeof v === "string" && (v === "" || IMAGE_OK.test(v))
        ? v.slice(0, 500)
        : (f.default ?? "");
    case "collection":
      return typeof v === "string" && (v === "" || SLUG.test(v))
        ? v
        : (f.default ?? "");
    case "collections":
      return Array.isArray(v)
        ? v
            .filter((s): s is string => typeof s === "string" && SLUG.test(s))
            .slice(0, f.max ?? 24)
        : (f.default ?? []);
    case "toggle":
      return typeof v === "boolean" ? v : (f.default ?? false);
    case "number": {
      const n =
        typeof v === "number" && Number.isFinite(v)
          ? v
          : (f.default ?? f.min ?? 0);
      return Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, n));
    }
    case "select":
      return f.options.some((o) => o.value === v)
        ? v
        : (f.default ?? f.options[0]?.value ?? "");
    case "list": {
      const items = Array.isArray(v) ? v : (f.default ?? []);
      return items
        .filter(isObj)
        .slice(0, f.max ?? 12)
        .map((item) => resolveFields(f.fields, item));
    }
  }
}

/** Exactly the schema's keys, each valid for its type. */
export function resolveFields(fields: Field[], raw: unknown): Values {
  const src = isObj(raw) ? raw : {};
  return Object.fromEntries(
    fields.map((f) => [f.key, resolveField(f, src[f.key])]),
  );
}

/** Validate a tenant's config against the theme schema; `fallback` (the theme defaults) fills a missing group or template. */
export function resolveConfig(
  schema: ThemeSchema,
  raw: unknown,
  fallback: unknown,
): ThemeConfig {
  const src = isObj(raw) ? raw : {};
  const def = isObj(fallback) ? fallback : {};
  const pick = (o: Values, k: string) => (isObj(o[k]) ? (o[k] as Values) : {});
  const rawSettings = pick(src, "settings");
  const defSettings = pick(def, "settings");
  const settings = Object.fromEntries(
    GROUPS.map((g) => [
      g,
      resolveFields(
        schema.settings[g],
        g in rawSettings ? rawSettings[g] : defSettings[g],
      ),
    ]),
  ) as Record<Group, Values>;

  const rawHome = pick(src, "templates").home;
  const home = Array.isArray(rawHome) ? rawHome : pick(def, "templates").home;
  const seen = new Set<string>();
  const sections: SectionInstance[] = [];
  (Array.isArray(home) ? home : []).forEach((s, i) => {
    if (!isObj(s) || sections.length >= MAX_SECTIONS) return;
    const type = schema.sections.find((t) => t.type === s.type);
    if (!type) return;
    let id =
      typeof s.id === "string" && ID.test(s.id) ? s.id : `${type.type}-${i}`;
    if (seen.has(id)) id = `${id}-${i}`;
    seen.add(id);
    sections.push({
      id,
      type: type.type,
      settings: resolveFields(type.fields, s.settings),
    });
  });
  return { settings, templates: { home: sections } };
}

/** The business's own details from the ERP; they fill the identity fields a theme config leaves empty. */
export type StoreIdentity = {
  name: string;
  logo_url: string | null;
  email: string | null;
};
/** Empty store name, logo, footer email or copyright -> the business's own name, logo and email, so a new shop shows itself from day one. */
export function withIdentity(
  config: ThemeConfig,
  store: StoreIdentity | undefined,
): ThemeConfig {
  if (!store) return config;
  const { brand, footer } = config.settings;
  const name = (brand.name as string) || store.name;
  const logo =
    (brand.logo as string) ||
    (store.logo_url && IMAGE_OK.test(store.logo_url) ? store.logo_url : "");
  return {
    ...config,
    settings: {
      ...config.settings,
      brand: { ...brand, name, logo },
      footer: {
        ...footer,
        email: (footer.email as string) || store.email || "",
        copyright:
          (footer.copyright as string) || `${name}. All rights reserved.`,
      },
    },
  };
}
