import { expect, test } from "@playwright/test";

test("profile save shows progress, persists values, and explains errors", async ({
  page,
}) => {
  let customer = {
    id: "profile-save-test",
    name: "Asha Rao",
    email: "asha@example.test",
    phone: "+919876543210",
    birthday: "1990-03-14",
    membership: { eligible: true, joined_at: "2026-01-01T00:00:00Z" },
    segment: "regular",
    loyalty: {
      points: 25,
      next_tier: "silver",
      next_tier_points: 100,
      points_per_100: 1,
      points_to_next_tier: 75,
      spend_to_next_tier_minor: 750000,
    },
  };
  let saves = 0;
  let fail = false;
  let releaseSave: (() => void) | undefined;
  await page.route("**/api/me", async (route) => {
    if (route.request().method() === "PATCH") {
      saves++;
      await new Promise<void>((resolve) => {
        releaseSave = resolve;
      });
      if (fail) {
        await route.fulfill({
          status: 409,
          json: {
            error: { message: "That phone number belongs to another account." },
          },
        });
        return;
      }
      const body = route.request().postDataJSON();
      customer = { ...customer, name: body.name, phone: `+91${body.phone}` };
      await route.fulfill({ json: customer });
      return;
    }
    await route.fulfill({ json: { customer } });
  });
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [], coupon_code: null } }),
  );
  await page.goto("/account/profile");
  await page.getByLabel("Full name").fill("Updated name");
  await page.getByLabel("Mobile number").fill("7099399737");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Full name")).toBeDisabled();
  await expect.poll(() => saves).toBe(1);
  releaseSave?.();
  await expect(page.getByRole("status")).toHaveText(
    "Profile updated successfully.",
  );
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue("Updated name");
  await expect(page.getByLabel("Mobile number")).toHaveValue("7099399737");

  fail = true;
  await page.getByLabel("Mobile number").fill("9888888888");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect.poll(() => saves).toBe(2);
  releaseSave?.();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "That phone number belongs to another account." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save changes", exact: true }),
  ).toBeEnabled();
});
