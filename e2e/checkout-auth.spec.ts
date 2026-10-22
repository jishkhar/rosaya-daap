import { expect, test } from "@playwright/test";
import { addFirstProductToBag, registerShopper } from "./helpers";

test("signed-out shoppers cannot open checkout or submit an order", async ({ page, request }) => {
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login\?next=\/checkout$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Mobile number")).toHaveCount(0);

  const response = await request.post("/api/checkout", { data: {} });
  expect(response.status()).toBe(401);
  expect((await response.json()).error.code).toBe("unauthorized");
});

test("an invalid session cookie cannot open checkout or submit an order", async ({ page, baseURL }) => {
  await page.context().addCookies([{ name: "store_session", value: "invalid-session", url: baseURL! }]);
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login\?next=\/checkout$/);
  // Restore the invalid cookie because /api/me may have cleared it during login-page hydration.
  await page.context().addCookies([{ name: "store_session", value: "invalid-session", url: baseURL! }]);
  const response = await page.request.post("/api/checkout", { data: {} });
  expect(response.status()).toBe(401);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "store_session")).toBe(false);
});

test("registration and login return to checkout with the guest bag intact", async ({ page }) => {
  test.setTimeout(120_000);
  const title = await addFirstProductToBag(page);
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login\?next=\/checkout$/);
  await page.getByRole("link", { name: "Create an account" }).click();
  const credentials = await registerShopper(page);
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByLabel("Mobile number")).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByRole("link", { name: title }).first()).toBeVisible();

  await page.request.post("/api/auth/logout", { data: {} });
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/login\?next=\/checkout$/);
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByLabel("Mobile number")).toBeVisible();
});
