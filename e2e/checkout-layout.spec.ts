import { expect as baseExpect, test } from "@playwright/test";
import { addFirstProductToBag, registerShopper, fillAddress } from "./helpers";

const expect = baseExpect.configure({ timeout: 30_000 });

test("pay opens payment options after validation and customer offers can be applied", async ({ page, isMobile }, testInfo) => {
  test.setTimeout(120_000);
  await page.goto("/register");
  await registerShopper(page);
  await expect(page).toHaveURL(/\/account$/);

  // Exercise rendering and selecting server-provided offers without changing live discount records.
  await page.route("**/api/basket/quote", async (route) => {
    const response = await route.fetch();
    const quote = await response.json();
    const selected = route.request().postDataJSON().coupon_code === "SAVE10";
    const amount = Math.round(quote.items_minor * 0.1);
    quote.available_coupons = [
      { code: "SAVE10", name: "Welcome offer", label: "10% off", amount_minor: amount, min_order_minor: 0, applicable: true, reason: null },
      { code: "BIGBAG", name: "Bigger bag offer", label: "20% off", amount_minor: null, min_order_minor: 1000000, applicable: false, reason: "Add more items to meet the minimum order." },
    ];
    if (selected) {
      quote.coupon = { ok: true, code: "SAVE10", label: "10% off", amount_minor: amount, free_delivery: false };
      quote.coupon_discount_minor = amount;
      quote.grand_total_minor -= amount;
    }
    await route.fulfill({ response, json: quote });
  });

  await addFirstProductToBag(page);
  await page.goto("/checkout");
  const column = page.getByRole("complementary", { name: "Order summary and payment" });
  const summary = column.getByRole("heading", { name: "Order summary", exact: true });
  const payment = column.getByRole("button", { name: /^Pay ·|Updating total/ });
  await expect(summary).toBeVisible();
  await expect(payment).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "Payment method" })).not.toBeVisible();
  await expect(column.getByRole("button", { name: /^Pay ·|Updating total/ })).toBeVisible();
  expect(await payment.evaluate((button) => button.closest("section")?.querySelector("h2")?.textContent)).toBe("Order summary");
  const summaryBox = await summary.boundingBox();
  const paymentBox = await payment.boundingBox();
  expect(paymentBox!.y).toBeGreaterThan(summaryBox!.y);
  const totalBox = await column.getByText("Total", { exact: true }).boundingBox();
  expect(paymentBox!.y).toBeGreaterThan(totalBox!.y);
  if (!isMobile) {
    const contactBox = await page.getByRole("heading", { name: /Contact$/ }).boundingBox();
    expect(paymentBox!.x).toBeGreaterThan(contactBox!.x);
  }

  await expect(column.getByRole("button", { name: "Apply coupon SAVE10" })).not.toBeVisible();
  await column.getByText("Available coupons", { exact: true }).click();
  await expect(column.getByRole("button", { name: "Apply coupon SAVE10" })).toBeEnabled();
  await expect(column.getByRole("button", { name: "Apply coupon BIGBAG" })).toBeDisabled();
  await column.getByRole("button", { name: "Apply coupon SAVE10" }).click();
  await expect(column.getByText(/SAVE10 applied/)).toBeVisible();
  await expect(column.getByText("Discount (SAVE10)")).toBeVisible();
  await expect(column.getByRole("button", { name: /^Pay ·/ })).toBeEnabled();
  let submitted = false;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/checkout") && request.method() === "POST") submitted = true;
  });
  await column.getByRole("button", { name: /^Pay ·/ }).click();
  await expect(page.getByText("Enter a valid 10-digit mobile number.")).toBeVisible();
  expect(submitted).toBe(false);
  await fillAddress(page, { phone: "9876543210" });
  await expect(column.getByRole("button", { name: /^Pay ·/ })).toBeEnabled();
  await expect(page.getByRole("dialog", { name: "Choose payment method" })).not.toBeVisible();
  await column.getByRole("button", { name: /^Pay ·/ }).click();
  const dialog = page.getByRole("dialog", { name: "Choose payment method" });
  await expect(dialog).toBeVisible();
  expect(submitted).toBe(false);
  await dialog.getByRole("radio", { name: /Cash on delivery/ }).check();
  await page.route("**/api/checkout", async (route) => {
    expect(route.request().postDataJSON().payment_method).toBe("cod");
    await route.fulfill({ status: 422, json: { error: { code: "validation_failed", message: "Test order stopped." } } });
  });
  await dialog.getByRole("button", { name: /^Place order/ }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Test order stopped.");
  expect(submitted).toBe(true);
  await dialog.getByRole("button", { name: "Close payment options" }).click();
  await expect(dialog).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("checkout.png"), fullPage: true });
  await page.unrouteAll({ behavior: "wait" });
});
