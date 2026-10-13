import { expect, test } from "@playwright/test";

const item = { key: "saved-variant", variantId: "saved-variant", slug: "saved-saree", title: "Saved Saree", image: "/placeholder.svg", price: 1000, mrp: null, qty: 2 };
const user = { id: "customer-a", name: "Asha", email: "asha@example.com", phone: null };

for (const authenticated of [false, true]) {
  test(`${authenticated ? "account database" : "guest browser"} cart restores, updates and clears`, async ({ page }) => {
    let stored = { items: authenticated ? [item] : [], coupon_code: null };
    let writes = 0;
    await page.addInitScript(({ authenticated, item }) => {
      if (!authenticated && !localStorage.getItem("cart-test-seeded")) {
        localStorage.setItem("rosaya.cart.v2", JSON.stringify([item]));
        localStorage.setItem("cart-test-seeded", "yes");
      }
    }, { authenticated, item });
    await page.route("**/api/me", (route) => route.fulfill({ json: { customer: authenticated ? user : null } }));
    await page.route("**/api/basket", async (route) => {
      if (route.request().method() === "PUT") {
        const body = route.request().postDataJSON();
        stored = { items: body.items.map((line: { quantity: number }) => ({ ...item, qty: line.quantity })), coupon_code: body.coupon_code };
        writes++;
        await route.fulfill({ json: { ok: true } });
      } else await route.fulfill({ json: stored });
    });
    await page.route("**/api/basket/quote", (route) => route.fulfill({ status: 503, json: { error: { message: "Quote offline for storage test" } } }));
    await page.goto("/cart");
    await expect(page.locator("#main").getByText(item.title, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Increase quantity" }).click();
    if (authenticated) {
      await expect.poll(() => stored.items[0]?.qty).toBe(3);
      expect(await page.evaluate(() => localStorage.getItem("rosaya.cart.v2"))).toBeNull();
    } else {
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("rosaya.cart.v2") || "[]")[0]?.qty)).toBe(3);
      expect(writes).toBe(0);
    }
    await page.reload();
    await expect(page.locator("#main").getByText(item.title, { exact: true })).toBeVisible();
    await expect(page.locator("#main").getByText("3", { exact: true })).toBeVisible();
    await page.locator("#main").getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByText("Your bag is empty", { exact: true })).toBeVisible();
    if (authenticated) await expect.poll(() => stored.items.length).toBe(0);
    else await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("rosaya.cart.v2") || "[]").length)).toBe(0);
  });
}

test("guest cart merges into account only after a successful database save", async ({ page }) => {
  let stored = { items: [{ ...item, qty: 1 }], coupon_code: null };
  let writes = 0;
  await page.addInitScript((item) => localStorage.setItem("rosaya.cart.v2", JSON.stringify([item])), item);
  await page.route("**/api/me", (route) => route.fulfill({ json: { customer: user } }));
  await page.route("**/api/basket", async (route) => {
    if (route.request().method() === "PUT") {
      writes++;
      if (writes === 1) return route.fulfill({ status: 503, json: { error: { message: "Temporary failure" } } });
      const body = route.request().postDataJSON();
      stored = { items: body.items.map((line: { quantity: number }) => ({ ...item, qty: line.quantity })), coupon_code: body.coupon_code };
      await route.fulfill({ json: { ok: true } });
    } else await route.fulfill({ json: stored });
  });
  await page.route("**/api/basket/quote", (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto("/cart");
  await expect(page.locator("#main").getByRole("alert")).toContainText("Couldn't save your bag");
  expect(await page.evaluate(() => localStorage.getItem("rosaya.cart.v2"))).not.toBeNull();
  await expect(page.locator("#main").getByText(item.title, { exact: true })).toBeVisible();
  await expect.poll(() => stored.items[0]?.qty).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem("rosaya.cart.v2"))).toBeNull();
});
