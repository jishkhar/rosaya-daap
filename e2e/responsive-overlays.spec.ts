import { expect, test } from "@playwright/test";

// With hosted authentication, set E2E_BASE_URL to the shop hostname (e.g. rosaya.localhost:3001).
test("mobile menu covers the viewport and releases scrolling when switching to desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Menu", exact: true });
  await expect(menu).toBeVisible();
  await expect.poll(async () => (await menu.boundingBox())?.height).toBe(844);
  expect((await menu.boundingBox())?.y).toBe(0);
  await expect(
    menu.getByRole("link", { name: "Shop All", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe("hidden");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(menu).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
});

test("search backdrop covers the viewport after scrolling and Escape dismisses it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const search = page.getByRole("dialog", { name: "Search", exact: true });
  await expect(search).toBeVisible();
  const box = await search.boundingBox();
  expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
  await expect(
    search.getByRole("textbox", { name: "Search products" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(search).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
});
