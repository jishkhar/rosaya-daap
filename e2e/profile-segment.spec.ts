import { expect, test } from "@playwright/test";

const loyalty = {
  points: 25,
  next_tier: "gold",
  next_tier_points: 50,
  points_per_100: 1,
  points_to_next_tier: 25,
  spend_to_next_tier_minor: 250000,
};

test("Profile shows the membership card and has no become-a-member flow", async ({
  page,
}) => {
  const customer = {
    id: "profile-customer",
    name: "Asha Rao",
    email: "asha@example.test",
    phone: "+919876543210",
    birthday: "1990-03-14",
    membership: { eligible: true, joined_at: "2026-10-27T12:00:00Z" },
    segment: "silver",
    loyalty,
  };
  await page.route("**/api/me", (route) =>
    route.fulfill({ json: { customer } }),
  );
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [], coupon_code: null } }),
  );
  await page.goto("/account/profile");
  const card = page.getByRole("complementary", { name: "Your membership" });
  await expect(
    card.getByLabel("Customer membership: Silver", { exact: true }),
  ).toBeVisible();
  await expect(
    card.getByLabel("Loyalty balance", { exact: true }),
  ).toContainText("25");
  await expect(page.getByText(/become a member/i)).toHaveCount(0);
});

test("An account without birthday or phone is asked to complete its profile", async ({
  page,
}) => {
  const customer = {
    id: "legacy-customer",
    name: "Asha Rao",
    email: "asha@example.test",
    phone: null,
    birthday: null,
    membership: { eligible: false, joined_at: null },
    segment: "not_member",
    loyalty,
  };
  await page.route("**/api/me", (route) =>
    route.fulfill({ json: { customer } }),
  );
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [], coupon_code: null } }),
  );
  await page.goto("/account/profile");
  await expect(page.getByText(/to activate your membership/i)).toBeVisible();
  await expect(page.getByText(/become a member/i)).toHaveCount(0);
  await expect(
    page.getByLabel("Date of birth", { exact: true }),
  ).toHaveAttribute("required", "");
  await expect(
    page.getByLabel("Mobile number", { exact: true }),
  ).toHaveAttribute("required", "");
});
