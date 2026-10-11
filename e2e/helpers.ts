import { expect, type Page } from "@playwright/test";

export const unique = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export async function registerShopper(page: Page) {
  const email = `${unique("shopper")}@example.com`;
  const password = "correct horse battery";
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  return { email, password };
}

/** Open a product that is in stock and put it in the bag; returns its title. */
export async function addFirstProductToBag(page: Page, path = "/c/sarees?stock=1") {
  await page.goto(path);
  const card = page.locator("#main article").first();
  await expect(card).toBeVisible();
  const title = (await card.locator("h3").innerText()).trim();
  await card.locator("a").first().click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /add to bag/i }).first().click();
  await expect(page.getByRole("dialog", { name: /shopping cart/i })).toBeVisible();
  return title;
}

export async function fillAddress(page: Page, v: { phone: string; email?: string; name?: string } & Partial<Record<"line1" | "pincode" | "city" | "state", string>>) {
  await page.getByLabel("Mobile number").fill(v.phone);
  if (v.email) await page.getByLabel(/^Email/, { exact: false }).first().fill(v.email);
  await page.getByRole("button", { name: /continue to address/i }).click();
  await page.getByLabel("Full name").fill(v.name ?? "Asha Rao");
  await page.getByLabel("Address", { exact: true }).fill(v.line1 ?? "12 MG Road, Navrangpura");
  await page.getByLabel("Pincode").fill(v.pincode ?? "380009");
  await page.getByLabel("City").fill(v.city ?? "Ahmedabad");
  await page.getByLabel("State").fill(v.state ?? "Gujarat");
  await page.getByRole("button", { name: /continue to payment/i }).click();
}
