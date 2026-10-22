import { expect, test } from "@playwright/test";

test("profile membership card shows upgrade progress and refreshes the CRM segment", async ({
  page,
}) => {
  let segment = "new";
  const customer = () => ({
    id: "profile-customer",
    name: "Asha Rao",
    email: "asha@example.com",
    phone: null,
    segment,
    loyalty: {
      points: segment === "vip" ? 100 : 25,
      vip_min_points: 100,
      points_per_100: 1,
      points_to_vip: segment === "vip" ? 0 : 75,
      spend_to_vip_minor: segment === "vip" ? 0 : 750000,
    },
  });
  await page.route("**/api/me", (route) =>
    route.fulfill({ json: { customer: customer() } }),
  );
  await page.route("**/api/basket", (route) =>
    route.fulfill({ json: { items: [], coupon_code: null } }),
  );
  await page.goto("/account/profile");
  const details = page.getByRole("heading", {
    name: "Personal details",
    exact: true,
  });
  for (const [key, label] of [
    ["new", "New"],
    ["regular", "Regular"],
    ["vip", "VIP"],
    ["inactive", "Inactive"],
  ]) {
    segment = key;
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    const badge = page.getByLabel(`Customer segment: ${label}`, {
      exact: true,
    });
    await expect(badge).toHaveText(label);
    const headingBox = await details.boundingBox();
    const card = page.getByRole("complementary", { name: "Your membership" });
    const cardBox = await card.boundingBox();
    expect(cardBox!.y + cardBox!.height).toBeLessThan(headingBox!.y);
    expect(cardBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expect(card).toContainText("Rosaya Rewards Club");
    if (key === "vip") {
      await expect(card).toContainText("our highest tier");
      await expect(card.getByRole("progressbar")).toHaveCount(0);
    } else {
      await expect(card).toContainText("75 more points");
      await expect(card).toContainText("₹7,500");
      await expect(card.getByRole("progressbar")).toHaveAttribute(
        "value",
        "25",
      );
    }
  }
  await expect(page.getByLabel("Full name")).toHaveValue("Asha Rao");
});
