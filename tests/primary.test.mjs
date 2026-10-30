import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// src/lib/primary.ts with the request (address, path, cookies) stubbed in place of Next's request APIs.
function load({
  host,
  path: requested = "/",
  preview = false,
  livePreview = false,
  oneShop = false,
}) {
  process.env.STORE_CHANNEL_KEY = oneShop ? "key" : "";
  const filename = fileURLToPath(
    new URL("../src/lib/primary.ts", import.meta.url),
  );
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const unit = new Module(filename);
  unit.paths = Module._nodeModulePaths(path.dirname(filename));
  const stubs = {
    "server-only": {},
    "next/headers": {
      headers: async () => new Map([["x-store-path", requested]]),
      cookies: async () => ({
        get: (name) =>
          preview && name === "theme_preview"
            ? { value: "t" }
            : livePreview && name === "theme_live_preview"
              ? { value: "1" }
              : undefined,
      }),
    },
    "@/lib/api": { storeHost: async () => host },
    "@/proxy": { PATH_HEADER: "x-store-path" },
    "@/themes/preview": {
      PREVIEW_COOKIE: "theme_preview",
      LIVE_PREVIEW_COOKIE: "theme_live_preview",
    },
  };
  const requireModule = unit.require.bind(unit);
  unit.require = (name) => stubs[name] ?? requireModule(name);
  unit._compile(compiled, filename);
  return unit.exports;
}

test("other addresses of a shop go to its primary one, same path and query", async () => {
  const { primaryRedirect } = load({
    host: "rosaya.ecommerce.daaprimetech.com",
    path: "/collections/sarees?sort=new",
  });
  assert.equal(
    await primaryRedirect("rosaya.in"),
    "https://rosaya.in/collections/sarees?sort=new",
  );
  const custom = load({ host: "old-name.in", path: "/products/silk" });
  assert.equal(
    await custom.primaryRedirect("rosaya.ecommerce.daaprimetech.com"),
    "https://rosaya.ecommerce.daaprimetech.com/products/silk",
  );
});

test("the primary address itself is served, whatever the case, port or trailing dot", async () => {
  for (const host of [
    "rosaya.in",
    "Rosaya.IN",
    "rosaya.in:443",
    "rosaya.in.",
  ]) {
    assert.equal(await load({ host }).primaryRedirect("rosaya.in"), null, host);
  }
});

test("no redirect in one-shop mode, during a theme preview, or without a known primary", async () => {
  assert.equal(
    await load({
      host: "rosaya-daap-dun.vercel.app",
      oneShop: true,
    }).primaryRedirect("rosaya.in"),
    null,
  );
  assert.equal(
    await load({
      host: "rosaya.ecommerce.daaprimetech.com",
      preview: true,
    }).primaryRedirect("rosaya.in"),
    null,
  );
  assert.equal(
    await load({ host: "rosaya.ecommerce.daaprimetech.com" }).primaryRedirect(
      null,
    ),
    null,
  );
});

test("local development keeps http and the port", async () => {
  const { primaryRedirect, originOf } = load({
    host: "other.localhost:3001",
    path: "/shop",
  });
  assert.equal(
    await primaryRedirect("rosaya.localhost"),
    "http://rosaya.localhost:3001/shop",
  );
  assert.equal(await originOf("rosaya.in"), "https://rosaya.in");
});

test("a path that isn't a path never leaves the shop", async () => {
  const { primaryRedirect } = load({
    host: "rosaya.ecommerce.daaprimetech.com",
    path: "https://evil.example/x",
  });
  assert.equal(await primaryRedirect("rosaya.in"), "https://rosaya.in/");
});

test("live portal previews remain on the hostname holding the preview cookies", async () => {
  assert.equal(
    await load({
      host: "rosaya.ecommerce.daaprimetech.com",
      livePreview: true,
    }).primaryRedirect("rosaya.in"),
    null,
  );
});
