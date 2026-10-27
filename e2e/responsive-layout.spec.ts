import { expect, test, type Page, type Locator } from "@playwright/test";
import type { CartItem, Quote } from "../src/lib/cart";
import type { User } from "../src/lib/auth";

const widths = [320, 360, 390, 640, 768, 820, 1024, 1280, 1440];

async function insideViewport(locator: Locator, page: Page) {
  await expect(locator).toBeVisible();
  // The streamed header can be replaced while its live navigation finishes loading.
  await expect(async () => {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width + 1,
    );
  }).toPass({ timeout: 10_000 });
}

async function fits(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(page.viewportSize()!.width);
}

const customer: User = {
  id: "responsive-customer",
  name: "Asha Rao",
  email: "asha.rao@example.com",
  phone: "9876543210",
  birthday: "1990-03-14",
  membership: { eligible: true, joined_at: "2026-01-01T00:00:00Z" },
  segment: "regular",
  loyalty: {
    points: 100,
    next_tier: "silver",
    next_tier_points: 500,
    points_per_100: 1,
    points_to_next_tier: 400,
    spend_to_next_tier_minor: 4000000,
  },
};
const item: CartItem = {
  key: "responsive-variant",
  variantId: "responsive-variant",
  slug: "responsive-product",
  title: "Cotton Ajrakh Printed Lehenga Set",
  image: "/placeholder.svg",
  price: 2199,
  mrp: null,
  qty: 2,
};
const quote: Quote = {
  lines: [
    {
      variant_id: item.variantId,
      slug: item.slug,
      title: item.title,
      image: item.image,
      unit_price_minor: 219900,
      quantity: 2,
      max_qty: 10,
      available: true,
    },
  ],
  issues: [],
  can_checkout: true,
  coupon: null,
  tax_minor: 0,
  tax_inclusive: true,
  items_minor: 439800,
  coupon_discount_minor: 0,
  shipping_minor: 0,
  grand_total_minor: 439800,
  free_shipping_above_minor: null,
  available_coupons: [],
  loyalty: {
    balance_points: 100,
    conversion_points: 10,
    conversion_value_minor: 1000,
    max_points: 100,
    points: 0,
    amount_minor: 0,
    ok: true,
    reason: null,
  },
};

// Keep customer data and all basket writes inside the browser's test fixtures.
async function mockCustomer(page: Page) {
  await page.route("**/api/me", (route) =>
    route.fulfill({ json: { customer } }),
  );
  await page.route("**/api/me/*", (route) =>
    route.fulfill({ json: { items: [] } }),
  );
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [item], coupon_code: null } }),
  );
  await page.route("**/api/basket/quote", (route) =>
    route.fulfill({ json: quote }),
  );
}

test.use({ reducedMotion: "reduce" });

for (const path of [
  "/",
  "/shop",
  "/collections",
  "/search?q=silk",
  "/login",
  "/register",
]) {
  test(`${path} fits phone, tablet and desktop widths`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("#main")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await fits(page);
      await insideViewport(page.getByRole("banner"), page);
    }
  });
}

test("narrow header controls and delivery popover remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/login");
  const pin = page.getByRole("button", { name: "Set your delivery pincode" });
  // Rosaya has a different header without the delivery picker.
  test.skip(
    !(await pin.count()),
    "The active theme has no header delivery picker",
  );
  const logo = page.getByRole("banner").getByRole("link", { name: /home$/ });
  await expect(async () => {
    const logoBox = await logo.boundingBox();
    const pinBox = await pin.boundingBox();
    expect(logoBox).not.toBeNull();
    expect(pinBox).not.toBeNull();
    expect(logoBox!.x + logoBox!.width).toBeLessThanOrEqual(pinBox!.x);
  }).toPass({ timeout: 10_000 });
  await pin.click();
  const input = page.getByLabel("Pincode", { exact: true });
  for (const width of [320, 360, 390, 640, 768]) {
    await page.setViewportSize({ width, height: 568 });
    await insideViewport(input.locator("..").locator(".."), page);
    await expect(input).toBeEditable();
  }
  await page.keyboard.press("Escape");
  await expect(input).toHaveCount(0);
});

test("populated bag keeps quantity, price and checkout inside the viewport", async ({
  page,
}) => {
  await mockCustomer(page);
  await page.goto("/cart");
  await expect(
    page.getByRole("link", { name: "Proceed to checkout" }),
  ).toBeVisible();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await fits(page);
    for (const locator of [
      page.locator("#main li").filter({ hasText: item.title }),
      page.getByRole("button", { name: "Increase quantity" }),
      page.getByRole("button", { name: "Decrease quantity" }),
      page.locator("#main aside"),
      page.getByRole("link", { name: "Proceed to checkout" }),
    ])
      await insideViewport(locator, page);
  }
});

test("account tabs, membership and address editor fit tablet and phone widths", async ({
  page,
}) => {
  await mockCustomer(page);
  for (const path of ["/account", "/account/profile", "/account/addresses"]) {
    await page.goto(path);
    await expect(
      page.getByRole("navigation", { name: "Account", exact: true }),
    ).toBeVisible();
    if (path.endsWith("addresses"))
      await page.getByRole("button", { name: "Add address" }).click();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await fits(page);
      if (path.endsWith("profile"))
        await insideViewport(
          page
            .getByRole("heading", { name: "Personal details", exact: true })
            .locator(".."),
          page,
        );
      if (path.endsWith("addresses"))
        await insideViewport(
          page.getByLabel("Full name", { exact: true }),
          page,
        );
    }
  }
});

test("mobile filters and cart stay within a short screen and release scroll locks", async ({
  page,
}) => {
  await mockCustomer(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/shop");
  await page.getByRole("button", { name: /^Filter/ }).click();
  const filters = page.getByRole("dialog", { name: "Filters", exact: true });
  await expect(filters).toBeVisible();
  await insideViewport(filters, page);
  await expect(
    filters.getByRole("button", { name: /^Show .* products$/ }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(filters).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole("button", { name: /^Cart,/ }).click();
  const cart = page.getByRole("dialog", { name: "Shopping cart" });
  await expect(cart).toBeVisible();
  await insideViewport(cart, page);
  await expect(cart.getByRole("link", { name: /checkout/i })).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(cart).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
});
