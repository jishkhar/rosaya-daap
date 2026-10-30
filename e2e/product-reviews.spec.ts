import { expect, test, type Page } from "@playwright/test";

const customer = {
  id: "review-customer",
  name: "Asha Rao",
  email: "asha@example.com",
  phone: null,
};
const empty = {
  items: [],
  total: 0,
  average_rating: null,
  can_review: true,
  review: null,
  reason: "eligible",
};

async function openProduct(page: Page) {
  await page.goto("/collections/sarees", { waitUntil: "domcontentloaded" });
  const card = page.locator("#main article").first();
  await expect(card).toBeVisible();
  await card.locator("a").first().click();
  await expect(
    page.getByRole("heading", { name: "Customer reviews", exact: true }),
  ).toBeVisible({ timeout: 30_000 });
}

test("verified buyer rates with five stars, recovers from failure and submits once", async ({
  page,
}) => {
  await page.route("**/api/me", (route) =>
    route.fulfill({ json: { customer } }),
  );
  let fail = true;
  let submissions = 0;
  let payload: unknown;
  await page.route("**/api/products/*/reviews*", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: empty });
    submissions++;
    payload = route.request().postDataJSON();
    if (fail)
      return route.fulfill({
        status: 503,
        json: { error: { message: "Please try again." } },
      });
    return route.fulfill({
      status: 201,
      json: {
        id: "review-1",
        rating: 5,
        comment: "Lovely fabric and fit.",
        created_at: "2026-10-11T10:00:00Z",
        total: 1,
        average_rating: 5,
      },
    });
  });
  await openProduct(page);
  const reviews = page.getByRole("region", {
    name: "Customer reviews",
    exact: true,
  });
  await expect(
    reviews.locator("xpath=preceding-sibling::*[1]").locator("summary").last(),
  ).toContainText("Shipping & returns");
  const writeReview = page.getByRole("button", {
    name: "Write customer review",
    exact: true,
  });
  const dialog = page.getByRole("dialog", {
    name: "Write customer review",
    exact: true,
  });
  await expect(dialog).not.toBeVisible();
  await writeReview.click();
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Close review form" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(writeReview).toBeFocused();
  await writeReview.click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(writeReview).toBeFocused();
  await writeReview.click();
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
  await expect(page.getByRole("radio")).toHaveCount(5);
  await page.getByRole("radio", { name: "5 stars", exact: true }).check();
  await page
    .getByLabel("Your review", { exact: true })
    .fill("Lovely fabric and fit.");
  await page
    .getByRole("button", { name: "Submit review", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Customer reviews", exact: true })
      .getByRole("alert"),
  ).toHaveText("Please try again.");
  await expect(page.getByLabel("Your review", { exact: true })).toHaveValue(
    "Lovely fabric and fit.",
  );
  fail = false;
  await page
    .getByRole("button", { name: "Submit review", exact: true })
    .click();
  await expect(
    page.getByText("Thank you! Your review has been submitted."),
  ).toBeVisible();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByText("Lovely fabric and fit.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit review", exact: true }),
  ).toHaveCount(0);
  expect(payload).toEqual({ rating: 5, comment: "Lovely fabric and fit." });
  expect(submissions).toBe(2);
});

test("guest sees sign-in guidance and cannot access the review form", async ({
  page,
}) => {
  await page.route("**/api/me", (route) =>
    route.fulfill({ json: { customer: null } }),
  );
  await page.route("**/api/products/*/reviews*", (route) =>
    route.fulfill({ json: { ...empty, can_review: false, reason: "sign_in" } }),
  );
  await openProduct(page);
  const reviews = page.getByRole("region", {
    name: "Customer reviews",
    exact: true,
  });
  await expect(
    reviews.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(reviews.getByLabel("Your review", { exact: true })).toHaveCount(
    0,
  );
  const slug = new URL(page.url()).pathname.split("/").at(-1);
  const path = `/api/products/${slug}/reviews`;
  const rejected = await page.request.post(path, {
    data: { rating: 5, comment: "Guest cannot submit" },
  });
  expect(rejected.status()).toBe(401);
  const crossSite = await page.request.post(path, {
    headers: { origin: "https://other-site.invalid" },
    data: { rating: 5, comment: "Blocked cross-site request" },
  });
  expect(crossSite.status()).toBe(403);
});

test("non-buyer sees order requirement and can read reviews as plain text", async ({
  page,
}) => {
  await page.route("**/api/me", (route) =>
    route.fulfill({ json: { customer } }),
  );
  await page.route("**/api/products/*/reviews*", (route) =>
    route.fulfill({
      json: {
        ...empty,
        can_review: false,
        reason: "purchase_required",
        total: 1,
        average_rating: 4,
        items: [
          {
            id: "review-1",
            rating: 4,
            comment: "<script>alert('review')</script>",
            reviewer_name: "Maya",
            created_at: "2026-10-11T10:00:00Z",
          },
        ],
      },
    }),
  );
  await openProduct(page);
  await expect(
    page.getByText(
      "Reviews are available after placing an order containing this product.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(
    page.getByText("<script>alert('review')</script>", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Customer reviews" }).locator("script"),
  ).toHaveCount(0);
});
