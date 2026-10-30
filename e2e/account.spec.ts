import { expect, test } from "@playwright/test";
import { addFirstProductToBag, unique, uniquePhone } from "./helpers";

test("register, save an address, pay online, see the order, reorder, sign out and back in", async ({
  page,
}) => {
  const email = `${unique("shopper")}@example.com`;
  const password = "correct horse battery";

  // protected pages send you to log in
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/register");
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mobile number").fill(uniquePhone());
  await page.getByLabel("Date of birth").fill("1990-03-14");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(
    page.getByRole("heading", { name: /hello, asha/i }),
  ).toBeVisible();

  // addresses
  await page.goto("/account/addresses");
  await page.getByRole("button", { name: "Add address" }).click();
  await page.getByLabel("Mobile number").fill("9876543210");
  await page
    .getByLabel("Address", { exact: true })
    .fill("12 MG Road, Navrangpura");
  await page.getByLabel("Pincode", { exact: true }).fill("380009");
  await page.getByLabel("City").fill("Ahmedabad");
  await expect(page.getByLabel("State")).toHaveValue("Gujarat"); // from the pincode
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByText("12 MG Road, Navrangpura")).toBeVisible();
  await expect(page.getByText("Default")).toBeVisible();

  // online payment (the ERP's development gateway stand-in)
  await addFirstProductToBag(page);
  const browserAddressRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/me/addresses")
      browserAddressRequests.push(request.url());
  });
  await page.goto("/checkout");
  await expect(page.getByLabel("Mobile number")).toHaveValue("9876543210"); // prefilled from the saved address
  await expect(page.getByLabel("Address", { exact: true })).toHaveValue(
    "12 MG Road, Navrangpura",
  );
  await expect(page.getByLabel("Pincode", { exact: true })).toHaveValue(
    "380009",
  );
  await expect(page.getByLabel("City")).toHaveValue("Ahmedabad");
  await expect(page.getByLabel("State")).toHaveValue("Gujarat");
  expect(browserAddressRequests).toEqual([]);
  await page
    .getByLabel("Address", { exact: true })
    .fill("A temporary checkout edit");
  const savedHome = page.getByRole("button", { name: /^Home · 12 MG Road/ });
  await savedHome.click();
  await expect(savedHome).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Address", { exact: true })).toHaveValue(
    "12 MG Road, Navrangpura",
  );
  await expect(
    page.getByRole("button", { name: /continue to payment/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await page.getByRole("button", { name: /^Pay ·/ }).click();
  await expect(page).toHaveURL(/\/pay\//);
  await page.getByRole("button", { name: /pay now \(test\)/i }).click();
  await expect(page).toHaveURL(/\/checkout\?order=[0-9a-f-]+$/);
  await expect(
    page.getByRole("dialog", { name: "Order confirmation" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();
  await expect(page.getByText("Paid online").first()).toBeVisible();

  // history + reorder
  await page.goto("/account/orders");
  await page
    .getByRole("button", { name: /Order #ORD/ })
    .first()
    .click();
  await expect(page.getByText("Paid online")).toBeVisible();
  await page.getByRole("button", { name: "Reorder" }).click();
  await expect(
    page.getByRole("dialog", { name: /shopping cart/i }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  // sign out, then back in
  await page.goto("/account");
  await page.getByRole("button", { name: "Log out" }).click();
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.locator("#main [role=alert]")).toContainText(/incorrect/i);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/account/);
});

test("a duplicate email is refused and the password can be changed", async ({
  page,
}) => {
  const email = `${unique("dup")}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Dup Licate");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mobile number").fill(uniquePhone());
  await page.getByLabel("Date of birth").fill("1990-03-14");
  await page.getByLabel("Password", { exact: true }).fill("password one 1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/account$/);

  await page.goto("/account/profile");
  await page.getByLabel("Current password").fill("password one 1");
  await page.getByLabel("New password", { exact: true }).fill("password two 2");
  await page.getByLabel("Confirm new password").fill("password two 2");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText(/password updated/i)).toBeVisible();
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: /hello/i })).toBeVisible(); // this device stayed signed in

  await page.context().clearCookies();
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Someone Else");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mobile number").fill(uniquePhone());
  await page.getByLabel("Date of birth").fill("1990-03-14");
  await page.getByLabel("Password", { exact: true }).fill("whatever pass 3");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("#main [role=alert]")).toContainText(
    /already exists/i,
  );
});
