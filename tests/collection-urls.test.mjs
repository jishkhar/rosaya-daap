import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const id = "1bcc52d1-3a9d-4a0c-914e-9012b962bcf3";
const collection = {
  id,
  slug: "sarees",
  name: "Sarees",
  blurb: "Our selection",
};
function fixture() {
  const filename = fileURLToPath(
    new URL("../src/app/(shop)/collections/[slug]/page.tsx", import.meta.url),
  );
  const unit = new Module(filename);
  unit.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = unit.require.bind(unit);
  const overrides = {
    "next/image": { default: "Image" },
    "next/navigation": {
      notFound: () => {
        throw new Error("NOT_FOUND");
      },
      permanentRedirect: (url) => {
        throw new Error(`REDIRECT:${url}`);
      },
    },
    "@/components/ui/Breadcrumb": { Breadcrumb: "Breadcrumb" },
    "@/components/product/Listing": { Listing: "Listing" },
    "@/lib/store": {
      NEW_ARRIVALS: { sort: "new" },
      scopeOf: (c) => ({ category: c.slug }),
      getCollection: async () => undefined,
      getStoreCollection: async (value) => (value === id ? collection : null),
      getStoreCollections: async () => [collection],
    },
  };
  unit.require = (name) =>
    name in overrides ? overrides[name] : original(name);
  unit._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    filename,
  );
  return unit.exports;
}
const props = (slug, searchParams = {}) => ({
  params: Promise.resolve({ slug }),
  searchParams: Promise.resolve(searchParams),
});

test("title URLs render the collection and filter products using its internal ID", async () => {
  const route = fixture();
  assert.equal((await route.generateMetadata(props("sarees"))).title, "Sarees");
  const page = await route.default(props("sarees", { sort: "price-asc" }));
  const listing = page.props.children.find(
    (child) => child?.type === "Listing",
  );
  assert.deepEqual(listing.props.scope, { collectionId: id });
  assert.equal(listing.props.basePath, "/collections/sarees");
  assert.deepEqual(listing.props.searchParams, { sort: "price-asc" });
});

test("legacy ID links redirect to the title URL while preserving filters", async () => {
  const route = fixture();
  await assert.rejects(
    route.default(
      props(`collection-${id}`, { sort: "price-asc", colour: ["red", "blue"] }),
    ),
    {
      message:
        "REDIRECT:/collections/sarees?sort=price-asc&colour=red&colour=blue",
    },
  );
});

test("unknown collections return not found", async () => {
  const route = fixture();
  await assert.rejects(route.default(props("missing")), {
    message: "NOT_FOUND",
  });
});

test("new arrivals retains its built-in listing", async () => {
  const page = await fixture().default(props("new-arrivals"));
  const listing = page.props.children.find(
    (child) => child?.type === "Listing",
  );
  assert.deepEqual(listing.props.scope, { sort: "new" });
});
