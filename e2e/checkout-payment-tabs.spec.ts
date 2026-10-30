import { expect, test, type Page } from "@playwright/test";
import { unique, fillAddress } from "./helpers";
import type { Quote } from "../src/lib/cart";

async function checkout(page: Page, cod = true) {
  const registered = await page.request.post("/api/auth/register", {
    data: {
      name: "Asha Rao",
      email: `${unique("payment")}@example.com`,
      password: "correct horse battery",
    },
  });
  expect(registered.ok()).toBe(true);
  const item = {
    key: "payment-test",
    variantId: "payment-test",
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
    delivery: {
      zone: "Local",
      min_days: 3,
      max_days: 5,
      cod_available: cod,
      cod_reason: cod ? null : "Cash on delivery is unavailable in this area.",
      cod_max_minor: null,
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
  await expect(
    page.getByRole("button", { name: "Continue to payment", exact: true }),
  ).toBeEnabled();
}

test.use({ reducedMotion: "reduce" });

test("Delivery and Payment switch in-page, validate before advancing, and retain entered details", async ({
  page,
}, testInfo) => {
  await checkout(page);
  let submissions = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/checkout") && request.method() === "POST")
      submissions++;
  });
  const delivery = page.getByRole("tabpanel", {
    name: "Delivery",
    exact: true,
  });
  const payment = page.getByRole("tabpanel", { name: "Payment", exact: true });
  await page.getByRole("tab", { name: "Payment", exact: true }).click();
  await expect(delivery).toBeVisible();
  await expect(
    page.getByText("Enter your address.", { exact: true }),
  ).toBeVisible();
  await expect(payment).not.toBeVisible();
  expect(submissions).toBe(0);
  await fillAddress(page, { phone: "9876543210" });
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(payment).toBeVisible();
  await expect(delivery).not.toBeVisible();
  await expect(payment).toBeFocused();
  await expect(
    page.getByRole("tab", { name: "Payment", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("dialog", { name: "Choose payment method" }),
  ).toHaveCount(0);
  await payment.getByRole("radio", { name: /Cash on delivery/ }).check();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(async () => {
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      const box = await payment.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }).toPass({ timeout: 5_000 });
  }
  await payment.screenshot({ path: testInfo.outputPath("payment-tab.png") });
  await payment.getByRole("button", { name: "Back to delivery" }).click();
  await expect(delivery).toBeVisible();
  await expect(page.getByLabel("Address", { exact: true })).toHaveValue(
    "12 MG Road, Navrangpura",
  );
  await expect(page.getByLabel("Mobile number")).toHaveValue("9876543210");
  await page.getByRole("tab", { name: "Delivery", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Payment", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(payment).toBeVisible();
  await expect(
    payment.getByRole("radio", { name: /Cash on delivery/ }),
  ).toBeChecked();
  await expect(
    page.getByRole("button", { name: /^Place order ·/ }),
  ).toBeEnabled();
  expect(submissions).toBe(0);
});

test("payment submits only on confirmation, locks controls while placing, and retries the same order", async ({
  page,
}) => {
  await checkout(page);
  await fillAddress(page, { phone: "9876543210" });
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("radio", { name: /Cash on delivery/ }).check();
  let release: (() => void) | undefined;
  const keys: (string | undefined)[] = [];
  const orderId = "d124dc30-c7fb-4ce9-bd73-90d6c9f588b9";
  await page.route("**/api/orders/*", (route) =>
    route.fulfill({
      json: {
        id: orderId,
        order_number: "ORD1001",
        status: "confirmed",
        payment_status: "pending",
        payment_method: "cod",
        total_minor: 160000,
        paid_minor: 0,
        placed_at: "2026-10-27T00:00:00Z",
        discount_minor: 0,
        can_cancel: true,
        delivery_address: {
          name: "Asha Rao",
          line1: "12 MG Road, Navrangpura",
          city: "Ahmedabad",
          state: "Gujarat",
          pincode: "380009",
        },
        items: [
          {
            variant_id: "payment-test",
            title: "Cotton Saree",
            quantity: 1,
            line_total_minor: 160000,
            unit_price_minor: 160000,
            discount_minor: 0,
            image: "/placeholder.svg",
            slug: "test-product",
            size: null,
          },
        ],
      },
    }),
  );
  await page.route("**/api/checkout", async (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    expect(route.request().postDataJSON().payment_method).toBe("cod");
    if (keys.length === 1) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await route.fulfill({
        status: 422,
        json: { error: { message: "Please retry your order." } },
      });
    } else
      await route.fulfill({
        status: 201,
        json: { order: { id: orderId }, payment: { mode: "cod", url: null } },
      });
  });
  await page.getByRole("button", { name: /^Place order ·/ }).click();
  await expect.poll(() => !!release).toBe(true);
  await expect(
    page.getByRole("button", { name: "Placing order…" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("tab", { name: "Delivery", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Back to delivery" }),
  ).toBeDisabled();
  await expect(page.getByLabel("Coupon code", { exact: true })).toBeDisabled();
  await expect(page.getByRole("radio", { name: /^UPI/ })).toBeDisabled();
  release!();
  await expect(page.locator("#main").getByRole("alert")).toContainText(
    "Please retry your order.",
  );
  await expect(
    page.getByRole("tabpanel", { name: "Payment", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Place order ·/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Order confirmation" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Thank you/ })).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
});

test("the Payment tab respects unavailable COD and hands online payment to the gateway", async ({
  page,
}) => {
  await checkout(page, false);
  await fillAddress(page, { phone: "9876543210" });
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(
    page.getByRole("radio", { name: /Cash on delivery/ }),
  ).toBeDisabled();
  await expect(page.getByRole("radio", { name: /^UPI/ })).toBeChecked();
  await expect(
    page.getByText("Cash on delivery is unavailable in this area.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.route("**/test-gateway", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Secure payment fixture</h1>",
    }),
  );
  await page.route("**/api/checkout", (route) => {
    expect(route.request().postDataJSON().payment_method).toBe("online");
    return route.fulfill({
      status: 201,
      json: {
        order: { id: "online-order" },
        payment: {
          mode: "gateway",
          url: new URL("/test-gateway", page.url()).href,
        },
      },
    });
  });
  await page.getByRole("button", { name: /^Pay ·/ }).click();
  await expect(page).toHaveURL(/\/test-gateway$/);
  await expect(
    page.getByRole("heading", { name: "Secure payment fixture" }),
  ).toBeVisible();
});

test("each way to pay is listed on our page and Razorpay opens at the one chosen", async ({
  page,
}) => {
  await page.route("**/api/payment-options", (route) =>
    route.fulfill({
      json: {
        available: true,
        upi: true,
        card: true,
        wallet: true,
        emi: false,
        popular_banks: [
          ["HDFC", "HDFC Bank"],
          ["SBIN", "State Bank of India"],
        ],
        banks: [
          ["HDFC", "HDFC Bank"],
          ["SBIN", "State Bank of India"],
          ["YESB", "Yes Bank"],
        ],
      },
    }),
  );
  // Razorpay's Checkout script, faked: records what it was opened with and "pays" at once
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.Razorpay = function (o) {
        window.__rzp = o;
        this.on = function () {};
        this.open = function () {
          setTimeout(function () {
            o.handler({ razorpay_order_id: o.order_id, razorpay_payment_id: "pay_TEST1", razorpay_signature: "sig" });
          }, 50);
        };
      };`,
    }),
  );
  await checkout(page, false);
  await fillAddress(page, { phone: "9876543210" });
  await page.getByRole("button", { name: "Continue to payment" }).click();
  const payment = page.getByRole("tabpanel", { name: "Payment", exact: true });
  for (const name of [/^UPI/, /^Credit \/ Debit/, /^Net banking/, /^Wallets/])
    await expect(payment.getByRole("radio", { name })).toBeVisible();
  await expect(payment.getByRole("radio", { name: /^EMI/ })).toHaveCount(0);
  await payment.getByRole("radio", { name: /^Net banking/ }).check();
  await payment.getByRole("radio", { name: "HDFC Bank" }).check();
  await expect(payment.getByLabel("Other banks")).toContainText("Yes Bank");

  let confirmed: unknown = null;
  await page.route("**/api/checkout", (route) =>
    route.fulfill({
      status: 201,
      json: {
        order: { id: "online-order" },
        payment: {
          mode: "checkout",
          url: null,
          checkout: {
            key_id: "rzp_test_x",
            razorpay_order_id: "order_TEST1",
            amount_minor: 100000,
            currency: "INR",
            description: "Order ORD1",
            notes: {},
            prefill: { name: "Asha", email: null, contact: "+919876543210" },
          },
        },
      },
    }),
  );
  await page.route("**/api/orders/online-order/pay/confirm", (route) => {
    confirmed = route.request().postDataJSON();
    return route.fulfill({ json: { id: "online-order" } });
  });
  await page.getByRole("button", { name: /^Pay ·/ }).click();
  await expect
    .poll(() => confirmed)
    .toEqual({
      razorpay_order_id: "order_TEST1",
      razorpay_payment_id: "pay_TEST1",
      razorpay_signature: "sig",
    });
  const opened = await page.evaluate(
    () => (window as unknown as { __rzp: Record<string, unknown> }).__rzp,
  );
  expect(opened.order_id).toBe("order_TEST1");
  expect(opened.config).toEqual({
    display: {
      blocks: {
        chosen: {
          name: "Pay with",
          instruments: [{ method: "netbanking", banks: ["HDFC"] }],
        },
      },
      sequence: ["block.chosen"],
      preferences: { show_default_blocks: false },
    },
  });
});
