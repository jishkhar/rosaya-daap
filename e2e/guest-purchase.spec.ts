import { expect, test } from "@playwright/test";
import { addFirstProductToBag, fillAddress, registerShopper } from "./helpers";

test("browse, filter, add to bag, coupon, register and check out with cash on delivery", async ({
  page,
}) => {
  // landing page is built from the live catalogue
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "New Arrivals" }),
  ).toBeVisible();
  await expect(page.locator("#main article").first()).toBeVisible();

  // category + URL-driven filters
  await page.goto("/c/sarees");
  await expect(
    page.locator("#main").getByText(/Showing \d+ of \d+/),
  ).toBeVisible();
  await page.goto("/c/sarees?sort=price-asc&stock=1");
  await expect(page.locator("#main article").first()).toBeVisible();
  const prices = await page
    .locator("#main article")
    .evaluateAll((els) =>
      els.map((e) =>
        Number((e.textContent ?? "").match(/₹([\d,]+)/)?.[1].replace(/,/g, "")),
      ),
    );
  expect(prices.length).toBeGreaterThan(3);
  expect([...prices].sort((a, b) => a - b)).toEqual(prices);

  // product page -> bag
  const title = await addFirstProductToBag(page, "/c/sarees?stock=1");
  await page.getByRole("link", { name: /view bag/i }).click();
  await expect(page.getByRole("heading", { name: "Your Bag" })).toBeVisible();
  await expect(page.getByRole("link", { name: title }).first()).toBeVisible();

  // a bad code is explained, a good one is applied by the server
  await page.getByLabel("Coupon code").fill("NOPE");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator("#main [role=alert]")).toContainText(
    /isn't valid/i,
  );
  await page.getByLabel("Coupon code").fill("FREESHIP");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/FREESHIP applied/)).toBeVisible();

  // Checkout requires an account and preserves the bag through registration.
  await page.getByRole("link", { name: /proceed to checkout/i }).click();
  await expect(page).toHaveURL(/\/login\?next=\/checkout$/);
  await page.getByRole("link", { name: "Create an account" }).click();
  await registerShopper(page);
  await expect(page).toHaveURL(/\/checkout$/);
  await fillAddress(page, { phone: "9876543210" });
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page
    .getByRole("tabpanel", { name: "Payment", exact: true })
    .getByText("Cash on delivery")
    .click();
  await page.getByRole("button", { name: /place order/i }).click();

  await expect(page).toHaveURL(/\/checkout\?order=[0-9a-f-]+$/);
  await expect(
    page.getByRole("dialog", { name: "Order confirmation" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();
  await expect(page.getByText(/ORD\d+/).first()).toBeVisible();
  await expect(page.getByText("Cash on delivery").first()).toBeVisible();
  // Confirmation survives refresh even though placing the order emptied the bag.
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Order confirmation" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();

  // the bag was emptied
  await page.goto("/cart");
  await expect(page.getByText("Your bag is empty")).toBeVisible();
});

test("a pincode we don't serve is refused before payment is offered", async ({
  page,
}) => {
  await page.goto("/register");
  await registerShopper(page);
  await expect(page).toHaveURL(/\/account$/);
  await addFirstProductToBag(page);
  await page.goto("/checkout");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Pincode", { exact: true }).fill("12345");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(
    page.locator("[role=alert]:not(#__next-route-announcer__)").first(),
  ).toBeVisible();
});

test("search suggests products and the results page lists them", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /search/i })
    .first()
    .click();
  await page
    .getByRole("dialog", { name: "Search" })
    .getByRole("searchbox")
    .or(page.getByRole("dialog", { name: "Search" }).locator("input"))
    .first()
    .fill("lehenga");
  await expect(
    page.getByRole("dialog", { name: "Search" }).getByRole("link").first(),
  ).toBeVisible();
  await page.goto("/search?q=lehenga");
  await expect(
    page.locator("#main").getByText(/Showing \d+ of \d+/),
  ).toBeVisible();
});
