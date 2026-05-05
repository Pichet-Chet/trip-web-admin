import { test, expect } from "@playwright/test";

const API = "http://localhost:5100/api";

test.describe("Register flow", () => {
  test("register page renders all required fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /สมัครสมาชิก|register/i })).toBeVisible();
    await expect(page.getByLabel(/อีเมล|email/i)).toBeVisible();
    await expect(page.getByLabel(/รหัสผ่าน|password/i).first()).toBeVisible();
  });

  test("register success → redirects to verify-email page", async ({ page }) => {
    await page.route(`${API}/auth/register`, (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { message: "Please verify your email" } }),
      })
    );

    await page.goto("/register");

    // Fill form fields — use broad selectors tolerant of label wording
    await page.getByLabel(/อีเมล|email/i).fill("newuser@example.com");
    const passwordFields = page.getByLabel(/รหัสผ่าน|password/i);
    await passwordFields.first().fill("StrongPass123!");
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill("StrongPass123!");
    }
    // Name fields
    const firstNameField = page.getByLabel(/ชื่อ|first.?name/i).first();
    const lastNameField = page.getByLabel(/นามสกุล|last.?name/i).first();
    if (await firstNameField.count() > 0) await firstNameField.fill("Test");
    if (await lastNameField.count() > 0) await lastNameField.fill("User");

    await page.getByRole("button", { name: /สมัคร|register|submit/i }).click();

    // After successful register, app should navigate to verify-email
    await expect(page).toHaveURL(/verify-email/, { timeout: 8000 });
  });

  test("register with duplicate email shows inline error", async ({ page }) => {
    await page.route(`${API}/auth/register`, (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" }),
      })
    );

    await page.goto("/register");
    await page.getByLabel(/อีเมล|email/i).fill("existing@example.com");
    await page.getByLabel(/รหัสผ่าน|password/i).first().fill("StrongPass123!");

    const firstNameField = page.getByLabel(/ชื่อ|first.?name/i).first();
    if (await firstNameField.count() > 0) await firstNameField.fill("Test");
    const lastNameField = page.getByLabel(/นามสกุล|last.?name/i).first();
    if (await lastNameField.count() > 0) await lastNameField.fill("User");

    await page.getByRole("button", { name: /สมัคร|register|submit/i }).click();

    await expect(page.getByText(/อีเมลนี้ถูกใช้งานแล้ว/i)).toBeVisible({ timeout: 5000 });
  });

  test("login page renders and shows validation on empty submit", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /เข้าสู่ระบบ|login/i })).toBeVisible();
    const submitBtn = page.getByRole("button", { name: /เข้าสู่ระบบ|login|submit/i });
    await submitBtn.click();
    // Browser or custom validation should prevent empty submit
    await expect(page).toHaveURL(/login/);
  });
});
