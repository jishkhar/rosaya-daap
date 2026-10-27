import { expect as baseExpect, test } from "@playwright/test";
import { addFirstProductToBag, registerShopper, fillAddress } from "./helpers";

const expect = baseExpect.configure({ timeout: 30_000 });

test("delivery advances to the payment tab after validation and customer offers can be applied", async ({
  page,
  isMobile,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.goto("/register");
  const shopper = await registerShopper(page);
  await expect(page).toHaveURL(/\/account$/);

  // Exercise rendering and selecting server-provided offers without changing live discount records.
  await page.route("**/api/basket/quote", async (route) => {
    const response = await route.fetch();
    const quote = await response.json();
    const selected = route.request().postDataJSON().coupon_code === "SAVE10";
    const amount = Math.round(quote.items_minor * 0.1);
    quote.available_coupons = [
      {
        code: "SAVE10",
        name: "Welcome offer",
        label: "10% off",
        amount_minor: amount,
        min_order_minor: 0,
        applicable: true,
        reason: null,
      },
      {
        code: "BIGBAG",
        name: "Bigger bag offer",
        label: "20% off",
        amount_minor: null,
        min_order_minor: 1000000,
        applicable: false,
        reason: "Add more items to meet the minimum order.",
      },
    ];
    if (selected) {
      quote.coupon = {
        ok: true,
        code: "SAVE10",
        label: "10% off",
        amount_minor: amount,
        free_delivery: false,
      };
      quote.coupon_discount_minor = amount;
      quote.grand_total_minor -= amount;
    }
    await route.fulfill({ response, json: quote });
  });

  await addFirstProductToBag(page);
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Checkout", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("tablist", { name: "Checkout progress" }),
  ).toBeVisible();
  const originalViewport = page.viewportSize()!;
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const summary = page.getByRole("complementary", {
      name: "Order summary and payment",
    });
    const summaryBox = await summary.boundingBox();
    expect(summaryBox!.x).toBeGreaterThanOrEqual(0);
    expect(summaryBox!.x + summaryBox!.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize(originalViewport);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole("heading", { name: /Contact$/ })).toHaveCount(0);
  await expect(page.getByLabel("Email", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /Shipping address$/ }),
  ).toBeVisible();
  const column = page.getByRole("complementary", {
    name: "Order summary and payment",
  });
  const summary = column.getByRole("heading", {
    name: "Order summary",
    exact: true,
  });
  const payment = column.getByRole("button", {
    name: /Continue to payment|Updating total/,
  });
  await expect(summary).toBeVisible();
  await expect(payment).toBeVisible();
  await expect(
    page.getByRole("radiogroup", { name: "Payment method" }),
  ).not.toBeVisible();
  await expect(
    column.getByRole("button", { name: /Continue to payment|Updating total/ }),
  ).toBeVisible();
  expect(
    await payment.evaluate(
      (button) => button.closest("section")?.querySelector("h2")?.textContent,
    ),
  ).toBe("Order summary");
  const summaryBox = await summary.boundingBox();
  const paymentBox = await payment.boundingBox();
  expect(paymentBox!.y).toBeGreaterThan(summaryBox!.y);
  const totalBox = await column
    .getByText("Total", { exact: true })
    .boundingBox();
  expect(paymentBox!.y).toBeGreaterThan(totalBox!.y);
  if (!isMobile) {
    const addressBox = await page
      .getByRole("heading", { name: /Shipping address$/ })
      .boundingBox();
    expect(paymentBox!.x).toBeGreaterThan(addressBox!.x);
  }

  await expect(
    column.getByRole("list", { name: "Coupon offers" }),
  ).toBeVisible();
  await expect(
    column.getByRole("button", { name: "Apply coupon SAVE10" }),
  ).toBeEnabled();
  await expect(
    column.getByRole("button", { name: "Apply coupon BIGBAG" }),
  ).toBeDisabled();
  await column.getByRole("button", { name: "Apply coupon SAVE10" }).click();
  await expect(column.getByText(/SAVE10 applied/)).toBeVisible();
  await expect(column.getByText("Discount (SAVE10)")).toBeVisible();
  await expect(
    column.getByRole("button", { name: "Continue to payment" }),
  ).toBeEnabled();
  let submitted = false;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/checkout") && request.method() === "POST")
      submitted = true;
  });
  await column.getByRole("button", { name: "Continue to payment" }).click();
  await expect(
    page.getByText("Enter a valid 10-digit mobile number."),
  ).toBeVisible();
  expect(submitted).toBe(false);
  await fillAddress(page, { phone: "9876543210" });
  await expect(
    column.getByRole("button", { name: "Continue to payment" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("tabpanel", { name: "Payment", exact: true }),
  ).not.toBeVisible();
  await column.getByRole("button", { name: "Continue to payment" }).click();
  const paymentPanel = page.getByRole("tabpanel", {
    name: "Payment",
    exact: true,
  });
  await expect(paymentPanel).toBeVisible();
  expect(submitted).toBe(false);
  await paymentPanel.getByRole("radio", { name: /Cash on delivery/ }).check();
  await page.route("**/api/checkout", async (route) => {
    const order = route.request().postDataJSON();
    expect(order.payment_method).toBe("cod");
    expect(order.contact.email).toBe(shopper.email);
    expect(order.address.phone).toBe("9876543210");
    await route.fulfill({
      status: 422,
      json: {
        error: { code: "validation_failed", message: "Test order stopped." },
      },
    });
  });
  await column.getByRole("button", { name: /^Place order/ }).click();
  await expect(column.getByRole("alert")).toContainText("Test order stopped.");
  expect(submitted).toBe(true);
  await paymentPanel.getByRole("button", { name: "Back to delivery" }).click();
  await expect(paymentPanel).not.toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("checkout.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Back to bag", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your Bag", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Proceed to checkout/i }),
  ).toBeVisible();
  await page.unrouteAll({ behavior: "wait" });
});
