import { expect, test, type Page } from "@playwright/test";
import { unique } from "./helpers";
import type { Quote } from "../src/lib/cart";

async function openCheckout(page: Page, empty = false) {
  const registration = await page.request.post("/api/auth/register", {
    data: {
      name: "Asha Rao",
      email: `${unique("coupon")}@example.com`,
      password: "correct horse battery",
    },
  });
  expect(registration.ok()).toBe(true);
  const item = {
    key: "coupon-test",
    variantId: "coupon-test",
    slug: "test-product",
    title: "Cotton Ajrakh Printed Lehenga Set",
    image: "/placeholder.svg",
    price: 1600,
    mrp: null,
    qty: 1,
  };
  const offers = empty
    ? []
    : ["SAVE10", "BIGBAG", "EXPIRED", "FESTIVE", "WELCOME", "LASTOFFER"].map(
        (code) => ({
          code,
          name: `${code} customer offer`,
          label: "₹100 off",
          amount_minor: 10000,
          min_order_minor: code === "BIGBAG" ? 500000 : 0,
          applicable: code !== "BIGBAG",
          reason:
            code === "BIGBAG"
              ? "Add more items to meet the minimum order."
              : null,
        }),
      );
  const submitted: string[] = [];
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [item], coupon_code: null } }),
  );
  await page.route("**/api/basket/quote", (route) => {
    const code = route.request().postDataJSON().coupon_code;
    if (code) submitted.push(code);
    const selected = code && code !== "EXPIRED";
    const quote: Quote = {
      lines: [],
      issues: [],
      can_checkout: true,
      coupon:
        code === "EXPIRED"
          ? { ok: false, code, reason: "This offer has expired." }
          : selected
            ? {
                ok: true,
                code,
                label: "₹100 off",
                amount_minor: 10000,
                free_delivery: false,
              }
            : null,
      tax_minor: 0,
      tax_inclusive: true,
      items_minor: 160000,
      coupon_discount_minor: selected ? 10000 : 0,
      shipping_minor: 0,
      grand_total_minor: selected ? 150000 : 160000,
      free_shipping_above_minor: null,
      available_coupons: offers,
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
    return route.fulfill({ json: quote });
  });
  await page.goto("/checkout");
  const section = page.getByRole("region", {
    name: "Available coupons",
    exact: true,
  });
  await expect(section).toBeVisible();
  return { section, submitted };
}

test.use({ reducedMotion: "reduce" });

test("coupon cards scroll horizontally; View more opens a bounded modal with every offer", async ({
  page,
}, testInfo) => {
  const { section, submitted } = await openCheckout(page);
  const rail = section.getByRole("list", { name: "Coupon offers" });
  await expect(rail.getByRole("listitem")).toHaveCount(4);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 568 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(
      await rail.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBe(true);
    await rail.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    expect(
      await rail.evaluate((element) => element.scrollLeft),
    ).toBeGreaterThan(0);
    await rail.evaluate((element) => {
      element.scrollLeft = 0;
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await section.screenshot({ path: testInfo.outputPath("coupon-rail.png") });
  const more = section.getByRole("button", { name: "View more", exact: true });
  await more.click();
  const modal = page.getByRole("dialog", { name: "All coupons", exact: true });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("listitem")).toHaveCount(6);
  await expect(
    modal.getByRole("button", { name: "Apply coupon BIGBAG" }),
  ).toBeDisabled();
  await expect(modal).toContainText(
    "Add more items to meet the minimum order.",
  );
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 568 });
    await expect(async () => {
      const box = await modal.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(568);
      expect(
        await modal.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
    }).toPass({ timeout: 5_000 });
  }
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(more).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
  await more.click();
  await modal.getByRole("button", { name: "Close coupons" }).click();
  await expect(modal).toHaveCount(0);
  await more.click();
  await modal.getByRole("button", { name: "Apply coupon LASTOFFER" }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByText(/LASTOFFER applied/)).toBeVisible();
  await expect(
    page.getByText("Discount (LASTOFFER)", { exact: true }),
  ).toBeVisible();
  expect(submitted).toContain("LASTOFFER");
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
});

test("coupon application works from the rail and failed modal applications remain visible", async ({
  page,
}) => {
  const { section } = await openCheckout(page);
  await section.getByRole("button", { name: "Apply coupon SAVE10" }).click();
  await expect(page.getByText(/SAVE10 applied/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove coupon" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Remove coupon" }).click();
  await expect(page.getByLabel("Coupon code", { exact: true })).toBeVisible();
  await section.getByRole("button", { name: "View more" }).click();
  const modal = page.getByRole("dialog", { name: "All coupons", exact: true });
  await modal.getByRole("button", { name: "Apply coupon EXPIRED" }).click();
  await expect(modal.getByRole("alert")).toHaveText("This offer has expired.");
  await expect(modal).toBeVisible();
  await modal.getByRole("button", { name: "Close coupons" }).click();
  await expect(modal).toHaveCount(0);
});

test("empty offers show an explanation without a View more button", async ({
  page,
}) => {
  const { section } = await openCheckout(page, true);
  await expect(section).toContainText(
    "No coupons available for your account right now.",
  );
  await expect(section.getByRole("button", { name: "View more" })).toHaveCount(
    0,
  );
  await expect(section.getByRole("list")).toHaveCount(0);
});

test("offer details appear on hover or focus without changing the strip height", async ({
  page,
  isMobile,
}) => {
  const { section } = await openCheckout(page);
  const more = section.getByRole("button", { name: "View more", exact: true });
  await expect(more).toHaveCSS("cursor", "pointer");
  const rail = section.getByRole("list", { name: "Coupon offers" });
  const initialHeight = (await rail.boundingBox())!.height;
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    if (!isMobile) await page.mouse.move(0, 0);
    const card = rail.getByRole("group", {
      name: "BIGBAG coupon",
      exact: true,
    });
    await card.scrollIntoViewIfNeeded();
    if (isMobile) await card.focus();
    else await card.hover();
    const details = page.getByRole("tooltip");
    await expect(details).toBeVisible();
    await expect(details).toContainText("BIGBAG customer offer");
    await expect(details).toContainText("Minimum order: ₹5,000");
    await expect(details).toContainText(
      "Add more items to meet the minimum order.",
    );
    const box = await details.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    expect((await rail.boundingBox())!.height).toBe(initialHeight);
    await page.keyboard.press("Escape");
    await expect(details).toHaveCount(0);
    await more.focus();
  }
});
