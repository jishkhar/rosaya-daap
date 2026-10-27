import { test, expect } from "@playwright/test";

test("account orders expose returns and confirm cancellation with retry", async ({
  page,
}) => {
  const base = process.env.E2E_BASE_URL ?? "http://rosaya.localhost:3001";
  const item = {
    variant_id: "variant",
    title: "Saree",
    quantity: 1,
    unit_price_minor: 100000,
    discount_minor: 0,
    line_total_minor: 100000,
    slug: null,
    image: null,
    size: null,
  };
  const order = {
    id: "cancel-order",
    order_number: "WEB-1",
    status: "confirmed",
    can_cancel: true,
    payment_status: "pending",
    placed_at: "2026-10-26T00:00:00Z",
    total_minor: 100000,
    discount_minor: 0,
    paid_minor: 0,
    payment_method: "cod",
    payment_url: null,
    delivery_address: null,
    items: [item],
  };
  const orders = [
    order,
    {
      ...order,
      id: "delivered-order",
      order_number: "WEB-2",
      status: "completed",
      can_cancel: false,
    },
    {
      ...order,
      id: "packed-order",
      order_number: "WEB-3",
      status: "ready",
      can_cancel: false,
    },
  ];
  const cancels: unknown[] = [];
  const returns: unknown[] = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body =
      route.request().method() === "GET"
        ? undefined
        : route.request().postDataJSON();
    let data: unknown = {};
    let status = 200;
    if (path === "/api/me")
      data = {
        customer: {
          id: "fixture",
          name: "Test customer",
          email: "fixture@example.test",
          phone: null,
          segment: "regular",
          loyalty: {
            points: 0,
            next_tier: "silver",
            next_tier_points: 100,
            points_per_100: 1,
            points_to_next_tier: 100,
            spend_to_next_tier_minor: null,
          },
        },
      };
    else if (path === "/api/basket") data = { items: [], coupon_code: null };
    else if (path === "/api/me/orders") data = { items: orders };
    else if (path.endsWith("/returnable"))
      data = {
        order_id: "delivered-order",
        order_number: "WEB-2",
        window: { days: 7, closes_on: "2099-12-31", open: true },
        exchanges_enabled: false,
        store_credit_enabled: false,
        lines: [
          {
            order_item_id: "line",
            name: "Saree",
            sku: "SKU",
            quantity: 1,
            returned_quantity: 0,
            returnable_quantity: 1,
            unit_refund_minor: 100000,
          },
        ],
      };
    else if (path.endsWith("/cancel")) {
      cancels.push(body);
      if (cancels.length === 1) {
        status = 409;
        data = { error: { message: "Please try again" } };
      } else {
        order.status = "cancelled";
        order.can_cancel = false;
        data = { ...order, refund_due_minor: 0 };
      }
    } else if (path.endsWith("/return-requests")) {
      returns.push(body);
      status = 201;
      data = { id: "return" };
    } else if (path === "/api/me/returns") data = { items: [] };
    else {
      status = 503;
      data = { error: { message: "Fixture API unavailable" } };
    }
    await route.fulfill({ status, json: data });
  });
  await page.goto(`${base}/account/orders`);
  const cancel = page.getByRole("button", {
    name: "Cancel order",
    exact: true,
  });
  await expect(cancel).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Return items", exact: true }),
  ).toBeVisible();
  await cancel.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Confirm cancellation" }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Keep order" }).click();
  expect(cancels).toHaveLength(0);
  await cancel.click();
  await dialog.getByLabel("Reason for cancellation").fill("Changed my mind");
  await dialog.getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Please try again");
  await dialog.getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(cancel).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "WEB-1" }),
  ).toHaveText("Order #WEB-1 cancelled.");
  expect(cancels).toEqual([
    { reason: "Changed my mind" },
    { reason: "Changed my mind" },
  ]);
  await page.getByRole("link", { name: "Return items", exact: true }).click();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page
    .getByLabel("Why are you returning them?")
    .selectOption("changed_mind");
  await page.getByRole("button", { name: "Send return request" }).click();
  await expect(page).toHaveURL(/\/account\/returns\?sent=1$/);
  expect(returns).toHaveLength(1);
  expect(returns[0]).toMatchObject({
    items: [{ order_item_id: "line", quantity: 1 }],
    reason_code: "changed_mind",
    preference: "refund",
  });
});
