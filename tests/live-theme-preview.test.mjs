import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

function load(relative, stubs) {
  const filename = fileURLToPath(new URL(relative, import.meta.url));
  const unit = new Module(filename);
  unit.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = unit.require.bind(unit);
  unit.require = (name) => (name in stubs ? stubs[name] : original(name));
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
const preview = {
  PREVIEW_COOKIE: "theme_preview",
  LIVE_PREVIEW_COOKIE: "theme_live_preview",
};

function registry(cookies) {
  const calls = [];
  const { getStorefront } = load("../src/themes/registry.ts", {
    "server-only": {},
    react: { cache: (fn) => fn },
    "next/headers": {
      cookies: async () =>
        new Map(Object.entries(cookies).map(([k, value]) => [k, { value }])),
    },
    "@/themes/heritage": { heritage: { key: "heritage" } },
    "@/themes/rosaya": { rosaya: { key: "rosaya" } },
    "@/themes/preview": preview,
    "@/themes/schema": {
      resolveConfig: (_, value) => value,
      withIdentity: (value) => value,
    },
    "@/lib/api": {
      ApiError: class extends Error {},
      api: async (path, opts) => {
        calls.push({ path, opts });
        return {
          theme_key: "rosaya",
          config: { mode: opts.preview ? "draft" : "published" },
          preview: !!opts.preview,
        };
      },
    },
  });
  return { getStorefront, calls };
}

test("live card ignores an old draft token and fetches published settings without cache", async () => {
  const f = registry({ theme_preview: "old-draft", theme_live_preview: "1" });
  const out = await f.getStorefront();
  assert.equal(out.theme.key, "rosaya");
  assert.deepEqual(out.config, { mode: "published" });
  assert.equal(out.preview, false);
  assert.deepEqual(f.calls, [{ path: "/theme", opts: {} }]);
});

test("regular shoppers keep the cache and signed draft previews keep draft behavior", async () => {
  const live = registry({});
  await live.getStorefront();
  assert.deepEqual(live.calls[0].opts, { revalidate: 30 });
  const draft = registry({ theme_preview: "signed-draft" });
  assert.equal((await draft.getStorefront()).preview, true);
  assert.deepEqual(draft.calls[0].opts, { preview: "signed-draft" });
});

function previewRoute() {
  class Response {
    constructor(_, options) {
      this.headers = new Headers(options.headers);
      this.values = new Map();
    }
    cookies = {
      set: (key, value, options) => this.values.set(key, { value, ...options }),
    };
  }
  return load("../src/app/preview/route.ts", {
    "next/server": { NextResponse: Response },
    "@/themes/preview": preview,
  }).GET;
}

test("live preview clears the draft cookie and marks only this browser context as fresh live", async () => {
  const get = previewRoute();
  const res = await get({
    nextUrl: new URL(
      "https://shop.example/preview?live=1&revision=rosaya%3A2&path=/",
    ),
  });
  assert.equal(res.headers.get("Location"), "/");
  assert.equal(res.headers.get("Cache-Control"), "no-store");
  assert.equal(res.values.get("theme_preview").maxAge, 0);
  assert.deepEqual(res.values.get("theme_live_preview"), {
    value: "1",
    httpOnly: true,
    sameSite: "none",
    secure: true,
    partitioned: true,
    path: "/",
    maxAge: 7200,
  });
});

test("exiting preview or opening a draft clears fresh-live mode", async () => {
  const get = previewRoute();
  for (const query of ["exit=1", "live=1&exit=1", "token=signed-draft"]) {
    const res = await get({
      nextUrl: new URL(`https://shop.example/preview?${query}`),
    });
    assert.equal(res.values.get("theme_live_preview").maxAge, 0);
    assert.equal(
      res.values.get("theme_preview").value,
      query.startsWith("token=") ? "signed-draft" : "",
    );
  }
});
