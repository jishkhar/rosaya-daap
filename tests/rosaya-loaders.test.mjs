import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

function load(relative, overrides = {}) {
  const filename = fileURLToPath(new URL(relative, import.meta.url));
  const unit = new Module(filename);
  unit.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = unit.require.bind(unit);
  unit.require = (name) =>
    name in overrides ? overrides[name] : original(name);
  unit._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
  return unit.exports;
}

function fixture() {
  const requests = [];
  const store = {
    getCatalogue: async () => [
      { slug: "silks", name: "Silks", kind: "category" },
    ],
    getStoreCollections: async () => [
      {
        id: "tenant-choice",
        slug: "collection-tenant-choice",
        name: "My selection",
        image_url: "https://media.example/cover.webp",
      },
    ],
    collectionCovers: async () => ({
      silks: "https://media.example/silk.webp",
    }),
    NEW_ARRIVALS: { sort: "new" },
    scopeOf: (c) => ({ category: c.slug }),
    listProducts: async (request) => {
      requests.push(request);
      return { items: [{ images: ["https://media.example/product.webp"] }] };
    },
  };
  const loaded = load("../src/themes/rosaya/loaders.ts", {
    "server-only": {},
    react: { cache: (fn) => fn },
    "@/lib/store": store,
    "./data": load("../src/themes/rosaya/data.ts"),
  });
  return { ...loaded, store, requests };
}

const slide = {
  collection: "",
  image: "",
  label: "Shop",
  href: "/shop",
  alt: "Collection",
};

test("Rosaya slideshow uses newest products or the selected standard/custom collection", async () => {
  const f = fixture();
  const slides = await f.loadSlides({
    slides: [
      slide,
      { ...slide, collection: "silks" },
      { ...slide, collection: "collection-tenant-choice" },
    ],
  });
  assert.deepEqual(
    f.requests.map((r) => r.scope),
    [{ sort: "new" }, { category: "silks" }, { collectionId: "tenant-choice" }],
  );
  assert(slides.every((s) => s.image === "https://media.example/product.webp"));
  assert(f.requests.every((r) => r.searchParams.stock === "1"));
});

test("custom uploaded banners need no product request; missing products/collections stay safe", async () => {
  const f = fixture();
  const banner = { ...slide, image: "https://media.example/banner.webp" };
  assert.deepEqual(await f.loadSlides({ slides: [banner] }), [banner]);
  assert.deepEqual(f.requests, []);
  f.store.listProducts = async () => ({ items: [] });
  const out = await f.loadSlides({
    slides: [slide, { ...slide, collection: "removed" }],
  });
  assert(out.every((s) => s.image === "/placeholder.svg"));
});

test("tile loaders use live ERP metadata and omit removed selections", async () => {
  const f = fixture();
  const item = { collection: "silks", image: "", label: "", href: "" };
  assert.deepEqual(
    await f.loadTiles({
      source: "selected",
      items: [
        item,
        { ...item, collection: "collection-tenant-choice" },
        { ...item, collection: "removed" },
      ],
    }),
    [
      {
        label: "Silks",
        image: "https://media.example/silk.webp",
        href: "/collections/silks",
      },
      {
        label: "My selection",
        image: "https://media.example/cover.webp",
        href: "/collections/collection-tenant-choice",
      },
    ],
  );
  assert.deepEqual(await f.loadTiles({ source: "selected", items: [] }), []);
});

test("automatic Rosaya sections reflect added, renamed and removed catalogue entries without saved tile overrides", async () => {
  const f = fixture();
  let standard = [{ slug: "silks", name: "Silks", kind: "category" }];
  const freshness = [];
  f.store.getCatalogue = async (fresh) => {
    freshness.push(fresh);
    return standard;
  };
  f.store.collectionCovers = async (fresh) => {
    freshness.push(fresh);
    return { silks: "https://media.example/new-cover.webp" };
  };
  const config = {
    source: "all",
    limit: 12,
    items: [
      {
        collection: "silks",
        label: "Old name",
        image: "https://old.example/photo.jpg",
        href: "/old",
      },
    ],
  };
  assert.equal(
    (await f.loadTiles(config, "category"))[0].image,
    "https://media.example/new-cover.webp",
  );
  standard = [
    { ...standard[0], name: "New name" },
    { slug: "added", name: "Added category", kind: "category" },
  ];
  assert.deepEqual(
    (await f.loadTiles(config, "category")).map((t) => t.label),
    ["New name", "Added category"],
  );
  standard = [];
  assert.deepEqual(await f.loadTiles(config, "category"), []);
  assert(
    freshness.every(Boolean),
    "Rosaya should request fresh catalogue and cover data",
  );
  assert.equal(
    (await f.loadTiles(config, "collection"))[0].label,
    "My selection",
  );
});
