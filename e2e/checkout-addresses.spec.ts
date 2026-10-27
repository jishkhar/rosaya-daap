import { expect, test } from "@playwright/test";
import { unique } from "./helpers";
import type { Quote } from "../src/lib/cart";

test("checkout shows profile addresses first and accepts a new destination without overwriting them", async ({
  page,
}) => {
  const registration = await page.request.post("/api/auth/register", {
    data: {
      name: "Asha Rao",
      email: `${unique("address")}@example.com`,
      password: "correct horse battery",
    },
  });
  expect(registration.ok()).toBe(true);
  const home = {
    label: "Home",
    name: "Asha Rao",
    phone: "9876543210",
    line1: "12 MG Road",
    line2: "",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380009",
  };
  const work = {
    ...home,
    label: "Work",
    name: "Bina Rao",
    phone: "9876543211",
    line1: "42 Office Road",
  };
  for (const address of [home, work]) {
    const saved = await page.request.post("/api/me/addresses", {
      data: address,
    });
    expect(saved.ok()).toBe(true);
  }
  const original = await (await page.request.get("/api/me/addresses")).json();
  const item = {
    key: "address-test",
    variantId: "address-test",
    slug: "test-product",
    title: "Cotton Saree",
    image: "/placeholder.svg",
    price: 1600,
    mrp: null,
    qty: 1,
  };
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [item], coupon_code: null } }),
  );
  const quote: Quote = {
    lines: [],
    issues: [],
    can_checkout: true,
    coupon: null,
    tax_minor: 0,
    tax_inclusive: true,
    items_minor: 160000,
    coupon_discount_minor: 0,
    shipping_minor: 0,
    grand_total_minor: 160000,
    free_shipping_above_minor: null,
    available_coupons: [],
    loyalty: {
      balance_points: 0,
      conversion_points: 100,
      conversion_value_minor: 100,
      max_points: 0,
      points: 0,
      amount_minor: 0,
      ok: true,
      reason: null,
    },
  };
  await page.route("**/api/basket/quote", (route) =>
    route.fulfill({ json: quote }),
  );
  await page.route("**/api/pincodes/*", (route) =>
    route.fulfill({
      json: {
        pincode: "380009",
        district: "Ahmedabad",
        state: "Gujarat",
        state_code: "GJ",
        states: [{ code: "GJ", name: "Gujarat" }],
        localities: [],
      },
    }),
  );
  await page.route("**/api/serviceability/*", (route) =>
    route.fulfill({ json: { serviceable: true } }),
  );
  await page.goto("/checkout");
  const saved = page.getByRole("region", { name: "Saved delivery addresses" });
  await expect(saved).toBeVisible();
  expect(
    (await saved.boundingBox())!.y + (await saved.boundingBox())!.height,
  ).toBeLessThan((await page.getByLabel("Mobile number").boundingBox())!.y);
  await expect(page.getByLabel("Address", { exact: true })).toHaveValue(
    home.line1,
  );
  await saved.getByRole("button", { name: /^Work ·/ }).click();
  await expect(page.getByLabel("Address", { exact: true })).toHaveValue(
    work.line1,
  );
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    work.name,
  );
  await expect(page.getByLabel("Mobile number")).toHaveValue(work.phone);
  await expect(saved.getByRole("button", { name: /^Work ·/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await saved.getByRole("button", { name: "Add new address" }).click();
  await expect(page.getByLabel("Address", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Pincode", { exact: true })).toHaveValue("");
  await expect(saved.getByRole("button", { name: /^Work ·/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByLabel("Mobile number").fill("9876543212");
  await page.getByLabel("Full name", { exact: true }).fill("Asha Rao");
  await page.getByLabel("Address", { exact: true }).fill("81 New Road");
  await page.getByLabel("Pincode", { exact: true }).fill("380009");
  await page.getByLabel("City", { exact: true }).fill("Ahmedabad");
  await expect(page.getByLabel("State", { exact: true })).toHaveValue(
    "Gujarat",
  );
  await expect(
    page.getByText(
      "New delivery addresses are saved to your account when you place an order.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.route("**/api/checkout", async (route) => {
    expect(route.request().postDataJSON().address).toMatchObject({
      name: "Asha Rao",
      phone: "9876543212",
      line1: "81 New Road",
      pincode: "380009",
    });
    await route.fulfill({
      status: 422,
      json: { error: { message: "Order stopped for UI test." } },
    });
  });
  await page.getByRole("button", { name: "Continue to payment" }).click();
  const payment = page.getByRole("tabpanel", { name: "Payment", exact: true });
  await payment.getByRole("radio", { name: /Cash on delivery/ }).check();
  await page.getByRole("button", { name: /^Place order/ }).click();
  await expect(page.locator("#main").getByRole("alert")).toContainText(
    "Order stopped for UI test.",
  );
  expect(await (await page.request.get("/api/me/addresses")).json()).toEqual(
    original,
  );
});
