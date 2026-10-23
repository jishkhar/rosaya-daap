import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// src/lib/shipping.ts, with the money formatter it imports compiled alongside it.
function compile(rel, stubs = {}) {
  const filename = fileURLToPath(new URL(rel, import.meta.url));
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const unit = new Module(filename);
  unit.paths = Module._nodeModulePaths(path.dirname(filename));
  const requireModule = unit.require.bind(unit);
  unit.require = (name) => stubs[name] ?? requireModule(name);
  unit._compile(compiled, filename);
  return unit.exports;
}

const { feeText, daysText } = compile("../src/lib/shipping.ts", {
  "@/lib/money": compile("../src/lib/money.ts"),
});
const rules = (over = {}) => ({
  fee_minor: 0,
  free_above_minor: null,
  delivery_min_days: null,
  delivery_max_days: null,
  ...over,
});

test("the fee reads as the shop set it", () => {
  assert.equal(feeText(rules()), "Free delivery on every order");
  assert.equal(feeText(rules({ fee_minor: 9900 })), "Delivery ₹99");
  assert.equal(
    feeText(rules({ fee_minor: 9900, free_above_minor: 199900 })),
    "Free delivery on orders of ₹1,999 or more",
  );
  assert.equal(feeText(null), null); // unknown: promise nothing
});

test("the delivery time shows only when the shop gave one", () => {
  assert.equal(daysText(rules()), null);
  assert.equal(
    daysText(rules({ delivery_min_days: 5, delivery_max_days: 6 })),
    "5–6 business days",
  );
  assert.equal(
    daysText(rules({ delivery_min_days: 3, delivery_max_days: 3 })),
    "3 business days",
  );
  assert.equal(
    daysText(rules({ delivery_min_days: 1, delivery_max_days: 1 })),
    "1 business day",
  );
  assert.equal(daysText(null), null);
});
