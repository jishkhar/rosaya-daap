import { expect, test } from "@playwright/test";

test("Profile asks customers to become a member and preserves enrollment", async ({
  page,
}) => {
  let customer = {
    id: "profile-customer",
    name: "Asha Rao",
    email: "asha@example.test",
    phone: null as string | null,
    birthday: null as string | null,
    membership: { eligible: false, joined_at: null as string | null },
    segment: "not_member",
    loyalty: {
      points: 25,
      next_tier: "gold",
      next_tier_points: 50,
      points_per_100: 1,
      points_to_next_tier: 25,
      spend_to_next_tier_minor: 250000,
    },
  };
  let joins = 0;
  let fail = true;
  let release: (() => void) | undefined;
  await page.route("**/api/me", (route) =>
    route.fulfill({ json: { customer } }),
  );
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [], coupon_code: null } }),
  );
  await page.route("**/api/me/membership", async (route) => {
    joins++;
    const body = route.request().postDataJSON();
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    if (fail)
      return route.fulfill({
        status: 422,
        json: {
          error: { message: "That phone number belongs to another account." },
        },
      });
    customer = {
      ...customer,
      name: body.name,
      phone: `+91${body.phone}`,
      birthday: body.birthday,
      membership: { eligible: true, joined_at: "2026-10-27T12:00:00Z" },
      segment: "silver",
    };
    return route.fulfill({ json: customer });
  });
  await page.goto("/account/profile");
  await expect(
    page.getByRole("heading", { name: "Become a member", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Your membership" }),
  ).toHaveCount(0);
  const enrollment = page.getByRole("region", {
    name: "Become a member",
    exact: true,
  });
  const personal = page
    .getByRole("heading", { name: "Personal details", exact: true })
    .locator("..");
  const cardBox = await enrollment.boundingBox();
  const detailsBox = await personal.boundingBox();
  expect(cardBox!.y + cardBox!.height).toBeLessThan(detailsBox!.y);
  await expect(
    enrollment.getByLabel("Date of birth", { exact: true }),
  ).toHaveCount(0);
  await enrollment
    .getByRole("button", { name: "Become a member", exact: true })
    .click();

  await expect(enrollment.getByLabel("Email", { exact: true })).toHaveValue(
    "asha@example.test",
  );
  await expect(enrollment.getByLabel("Email", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await expect(page.getByText(/Your existing 25 points/)).toBeVisible();
  await page
    .getByRole("button", { name: "Become a member", exact: true })
    .click();
  expect(joins).toBe(0);
  await enrollment
    .getByLabel("Date of birth", { exact: true })
    .fill("1990-03-14");
  await enrollment
    .getByLabel("Mobile number", { exact: true })
    .fill("9876543210");
  await page
    .getByRole("button", { name: "Become a member", exact: true })
    .click();
  await expect.poll(() => joins).toBe(1);
  await expect(
    page.getByRole("button", { name: "Joining…", exact: true }),
  ).toBeDisabled();
  release?.();
  await expect(
    page.getByRole("alert").filter({ hasText: "That phone number" }),
  ).toBeVisible();
  fail = false;
  await page
    .getByRole("button", { name: "Become a member", exact: true })
    .click();
  await expect.poll(() => joins).toBe(2);
  release?.();
  await expect(
    page.getByRole("heading", { name: "Personal details", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("now a member");
  const card = page.getByRole("complementary", { name: "Your membership" });
  await expect(
    card.getByLabel("Customer membership: Silver", { exact: true }),
  ).toBeVisible();
  await expect(
    card.getByLabel("Loyalty balance", { exact: true }),
  ).toContainText("25");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Become a member", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Date of birth", { exact: true })).toHaveValue(
    "1990-03-14",
  );
  await expect(page.getByLabel("Mobile number", { exact: true })).toHaveValue(
    "9876543210",
  );
  expect(joins).toBe(2);
});
