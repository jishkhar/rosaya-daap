import { expect, test, type Page } from "@playwright/test";
import { registerShopper } from "./helpers";
import type { Quote } from "../src/lib/cart";

async function checkout(page: Page, balance = 250) {
  await page.goto("/register");
  await registerShopper(page);
  await expect(page).toHaveURL(/\/account$/);
  const item = {
    key: "loyalty-layout",
    variantId: "loyalty-layout",
    slug: "test-product",
    title: "Cotton Ajrakh Printed Lehenga Set",
    image: "/placeholder.svg",
    price: 1600,
    mrp: null,
    qty: 1,
  };
  const requests: number[] = [];
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [item], coupon_code: null } }),
  );
  await page.route("**/api/basket/quote", async (route) => {
    const body = route.request().postDataJSON();
    const points = body.loyalty_points ?? 0;
    requests.push(points);
    const limited = body.coupon_code === "LIMIT";
    const maximum = Math.min(
      Math.floor(balance / 100) * 100,
      limited ? 100 : 200,
    );
    const valid = points <= maximum;
    const amount = valid ? points : 0;
    const quote: Quote = {
      lines: [],
      issues: [],
      can_checkout: valid,
      coupon: limited
        ? {
            ok: true,
            code: "LIMIT",
            label: "Order offer",
            amount_minor: 100,
            free_delivery: false,
          }
        : null,
      tax_minor: 0,
      tax_inclusive: true,
      items_minor: 160000,
      coupon_discount_minor: limited ? 100 : 0,
      shipping_minor: 0,
      grand_total_minor: 160000 - amount - (limited ? 100 : 0),
      free_shipping_above_minor: null,
      available_coupons: [],
      loyalty: {
        balance_points: balance,
        conversion_points: 100,
        conversion_value_minor: 100,
        max_points: maximum,
        points,
        amount_minor: amount,
        ok: valid,
        reason: valid
          ? null
          : `You can redeem up to ${maximum} points on this order.`,
      },
    };
    await route.fulfill({ json: quote });
  });
  await page.goto("/checkout");
  const toggle = page.getByRole("switch", { name: "Redeem loyalty points" });
  await expect(toggle).toBeVisible();
  await expect(
    page.getByLabel("Points to redeem", { exact: true }),
  ).toHaveCount(0);
  return { toggle, requests };
}

test("checkout headings stay centered and loyalty toggles all eligible points or none", async ({
  page,
}) => {
  const { toggle, requests } = await checkout(page);
  await expect(toggle).not.toBeChecked();
  await expect(toggle).toBeEnabled();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const main = await page.locator("#main").boundingBox();
    for (const element of [
      page.getByRole("heading", { name: "Checkout", exact: true }),
      page.getByRole("tablist", { name: "Checkout progress" }),
    ]) {
      const box = await element.boundingBox();
      expect(
        Math.abs(box!.x + box!.width / 2 - (main!.x + main!.width / 2)),
      ).toBeLessThanOrEqual(1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  const loyalty = page.getByRole("region", {
    name: "Redeem loyalty points",
    exact: true,
  });
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(loyalty).toContainText("Using all 200 eligible points");
  await expect(
    page.getByText("Loyalty (200 points)", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => requests.at(-1)).toBe(200);
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(
    page.getByText("Loyalty (200 points)", { exact: true }),
  ).toHaveCount(0);
  await expect.poll(() => requests.at(-1)).toBe(0);
  expect(requests.every((points) => points === 0 || points === 200)).toBe(true);
});

test("enabled loyalty follows a reduced order limit after applying a coupon", async ({
  page,
}) => {
  const { toggle, requests } = await checkout(page);
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(
    page.getByText("Loyalty (200 points)", { exact: true }),
  ).toBeVisible();
  await expect(toggle).toBeEnabled();
  await page.getByLabel("Coupon code", { exact: true }).fill("LIMIT");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByText("Loyalty (100 points)", { exact: true }),
  ).toBeVisible();
  await expect(toggle).toBeChecked();
  await expect(toggle).toBeEnabled();
  await expect.poll(() => requests.at(-1)).toBe(100);
});

for (const balance of [0, 50]) {
  test(`loyalty toggle is disabled when ${balance} points cannot be redeemed`, async ({
    page,
  }) => {
    const { toggle, requests } = await checkout(page, balance);
    await expect(toggle).toBeDisabled();
    await expect(toggle).not.toBeChecked();
    await expect(toggle).toHaveAccessibleDescription(
      /No points available to redeem on this order\./,
    );
    expect(requests.every((points) => points === 0)).toBe(true);
  });
}
