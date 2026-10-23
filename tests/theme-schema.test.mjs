import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Load a dependency-free TS module (type-only imports are erased by transpiling).
function load(rel) {
  const filename = fileURLToPath(new URL(rel, import.meta.url));
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const unit = new Module(filename);
  unit.paths = Module._nodeModulePaths(path.dirname(filename));
  unit._compile(compiled, filename);
  return unit.exports;
}

const { resolveConfig, resolveFields, MAX_SECTIONS } = load(
  "../src/themes/schema.ts",
);
const { schema } = load("../src/themes/heritage/schema.ts");
const defaults = JSON.parse(
  fs.readFileSync(
    new URL("../src/themes/heritage/defaults.json", import.meta.url),
    "utf8",
  ),
);

test("heritage defaults match the schema exactly", () => {
  assert.deepEqual(resolveConfig(schema, defaults, defaults), defaults);
});

test("missing groups and templates come from the theme defaults", () => {
  const out = resolveConfig(
    schema,
    { settings: { header: { menu_limit: 3 } } },
    defaults,
  );
  assert.equal(out.settings.header.menu_limit, 3);
  assert.equal(out.settings.header.show_search, true); // field default inside a group the tenant saved
  assert.deepEqual(out.settings.footer, defaults.settings.footer);
  assert.deepEqual(out.templates.home, defaults.templates.home);
  assert.deepEqual(resolveConfig(schema, "garbage", defaults), defaults);
});

test("an empty home template stays empty (tenant removed every section)", () => {
  assert.deepEqual(
    resolveConfig(schema, { templates: { home: [] } }, defaults).templates.home,
    [],
  );
});

test("links and images only allow safe schemes", () => {
  const fields = [
    { key: "href", type: "url", label: "x", default: "/fallback" },
    { key: "img", type: "image", label: "x", default: "" },
  ];
  for (const bad of [
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,x",
    "//evil.example",
    "vbscript:x",
  ]) {
    assert.equal(resolveFields(fields, { href: bad }).href, "/fallback", bad);
  }
  for (const ok of [
    "/c/sarees",
    "#",
    "https://instagram.com/x",
    "mailto:a@b.in",
    "tel:+911234",
    "",
  ]) {
    assert.equal(resolveFields(fields, { href: ok }).href, ok, ok);
  }
  assert.equal(
    resolveFields(fields, { img: "http://plain.example/a.png" }).img,
    "",
  );
  assert.equal(
    resolveFields(fields, { img: "https://cdn.example/a.png" }).img,
    "https://cdn.example/a.png",
  );
});

test("wrong types fall back, numbers clamp, lists and slugs are filtered", () => {
  const header = resolveFields(schema.settings.header, {
    menu_limit: 99,
    show_search: "yes",
    extra: 1,
  });
  assert.deepEqual(header, { menu_limit: 8, show_search: true });
  const ann = resolveFields(schema.settings.announcement, {
    messages: [
      { text: "a" },
      "bad",
      { text: 5 },
      ...Array(10).fill({ text: "x" }),
    ],
  });
  assert.equal(ann.messages.length, 6);
  assert.deepEqual(ann.messages.slice(0, 2), [{ text: "a" }, { text: "" }]);
  const circles = schema.sections.find((s) => s.type === "category-circles");
  assert.deepEqual(
    resolveFields(circles.fields, {
      collections: ["sarees", "Bad Slug", 7, "../x", "kurtis"],
    }).collections,
    ["sarees", "kurtis"],
  );
  const rail = schema.sections.find((s) => s.type === "product-rail");
  assert.equal(
    resolveFields(rail.fields, { source: "everything" }).source,
    "new",
  );
});

test("sections: unknown types dropped, ids fixed, capped", () => {
  const home = [
    { id: "a", type: "hero", settings: { slides: [] } },
    { id: "a", type: "promise" },
    { id: "<script>", type: "newsletter" },
    { type: "liquid-code", settings: { html: "<b>x</b>" } },
    "nope",
  ];
  const out = resolveConfig(schema, { templates: { home } }, defaults).templates
    .home;
  assert.deepEqual(
    out.map((s) => s.type),
    ["hero", "promise", "newsletter"],
  );
  assert.equal(new Set(out.map((s) => s.id)).size, 3);
  assert.match(out[2].id, /^newsletter-2$/);
  const many = Array.from({ length: 50 }, (_, i) => ({
    id: `s${i}`,
    type: "promise",
  }));
  assert.equal(
    resolveConfig(schema, { templates: { home: many } }, defaults).templates
      .home.length,
    MAX_SECTIONS,
  );
});

const { withIdentity } = load("../src/themes/schema.ts");
// Find either local checkout name; seed-dependent checks skip in standalone storefront CI.
const rosayaFixture = [
  "../../backend/db/seed/rosaya_theme.json",
  "../../erp-ecommerce-backend/db/seed/rosaya_theme.json",
]
  .map((relative) => new URL(relative, import.meta.url))
  .find((url) => fs.existsSync(url));
const rosaya = rosayaFixture
  ? JSON.parse(fs.readFileSync(rosayaFixture, "utf8"))
  : null;
const noSeed = rosaya ? false : "backend repo not checked out next to this one";
const store = {
  name: "Asha Electronics",
  logo_url: "https://cdn.example/asha.png",
  email: "hi@asha.in",
};

test(
  "Rosaya's seeded theme (backend) still matches the Heritage schema",
  { skip: noSeed },
  () => {
    assert.deepEqual(resolveConfig(schema, rosaya, defaults), rosaya);
  },
);

test("neutral defaults carry nothing of Rosaya", () => {
  assert.doesNotMatch(
    JSON.stringify(defaults),
    /rosaya|garba|saree|lehenga|kalamkari/i,
  );
});

test("empty identity fields come from the business", () => {
  const out = withIdentity(resolveConfig(schema, null, defaults), store);
  assert.equal(out.settings.brand.name, "Asha Electronics");
  assert.equal(out.settings.brand.logo, "https://cdn.example/asha.png");
  assert.equal(out.settings.footer.email, "hi@asha.in");
  assert.equal(
    out.settings.footer.copyright,
    "Asha Electronics. All rights reserved.",
  );
  const own = withIdentity(
    resolveConfig(
      schema,
      {
        settings: { brand: { name: "Mine" }, footer: { email: "me@mine.in" } },
      },
      defaults,
    ),
    store,
  );
  assert.equal(own.settings.brand.name, "Mine"); // a filled-in config keeps its own values
  assert.equal(own.settings.footer.email, "me@mine.in");
  const unsafe = withIdentity(resolveConfig(schema, null, defaults), {
    ...store,
    logo_url: "javascript:x",
  });
  assert.equal(unsafe.settings.brand.logo, "");
  assert.equal(
    withIdentity(resolveConfig(schema, null, defaults), undefined).settings
      .brand.name,
    "",
  );
});

test("storefront code shows no shop-specific text (every shop shares it)", () => {
  const offenders = [];
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return walk(p);
      if (!/\.(ts|tsx)$/.test(e.name)) return;
      fs.readFileSync(p, "utf8")
        .split("\n")
        .forEach((line, i) => {
          const code = line.replace(/\/\/.*$/, "").trim();
          if (
            code.startsWith("*") ||
            code.startsWith("/*") ||
            /LEGACY|"rosaya\.(cart|coupon)\.v2"|"rosaya_session"/.test(code)
          )
            return; // comments, old storage names
          if (
            /rosaya|saree|lehenga|garba|kalamkari|ajrakh|bandhani|handcraft/i.test(
              code,
            )
          )
            offenders.push(`${path.relative(process.cwd(), p)}:${i + 1}`);
        });
    });
  walk(fileURLToPath(new URL("../src", import.meta.url)));
  assert.deepEqual(offenders, []);
});
