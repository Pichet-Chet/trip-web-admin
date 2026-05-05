import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { injectFakeSession, mockGet } from "./helpers/mock-api";

const TRIPS_LIST = [
  { id: "t1", name: "ทัวร์ญี่ปุ่น", status: "draft", startDate: "2026-06-01", endDate: "2026-06-07", destination: "โตเกียว" },
];

test.describe("Accessibility — critical paths", () => {
  test("login page has no critical a11y violations", async ({ page }) => {
    await page.goto("/login");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical" || v.impact === "serious")).toEqual([]);
  });

  test("dashboard homepage has no critical a11y violations", async ({ page }) => {
    await injectFakeSession(page);
    await mockGet(page, "/admin/trips", { items: TRIPS_LIST, total: 1, page: 1, pageSize: 20 });
    await mockGet(page, "/admin/notifications/unread-count", 0);
    await mockGet(page, "/admin/quota", { used: 2, limit: 10 });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude(".material-symbols-outlined") // icon fonts intentionally decorative
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical" || v.impact === "serious")).toEqual([]);
  });

  test("trip list page has no critical a11y violations", async ({ page }) => {
    await injectFakeSession(page);
    await mockGet(page, "/admin/trips", { items: TRIPS_LIST, total: 1, page: 1, pageSize: 20 });
    await mockGet(page, "/admin/notifications/unread-count", 0);
    await page.goto("/dashboard/my-trips");
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude(".material-symbols-outlined")
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical" || v.impact === "serious")).toEqual([]);
  });

  test("register page has no critical a11y violations", async ({ page }) => {
    await page.goto("/register");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical" || v.impact === "serious")).toEqual([]);
  });
});
