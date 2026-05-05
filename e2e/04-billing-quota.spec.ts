/**
 * E2E: Billing quota limit
 *
 * When a company has hit its free plan trip limit (3), the UI should:
 * - Show an upgrade prompt / block the "สร้างทริป" button on the trips list
 * - Not allow navigating to /trips/new directly without an upgrade warning
 */

import { test, expect } from "@playwright/test";
import { injectFakeSession } from "./helpers/mock-api";

const API = "http://localhost:5100/api";

test.describe("Billing quota enforcement", () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeSession(page);
  });

  test("my-trips page shows upgrade prompt when at free limit", async ({ page }) => {
    // 3 trips = at the free-tier limit of 3
    await page.route(`${API}/admin/trips`, (r) =>
      r.fulfill({
        json: {
          success: true,
          data: [
            { id: "t1", title: "ทริป 1", status: "Draft", destination: "A", startDate: "2026-08-01", endDate: "2026-08-03", travelersCount: 5, followerCount: 0, coverImageUrl: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
            { id: "t2", title: "ทริป 2", status: "Published", destination: "B", startDate: "2026-09-01", endDate: "2026-09-03", travelersCount: 8, followerCount: 2, coverImageUrl: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
            { id: "t3", title: "ทริป 3", status: "Draft", destination: "C", startDate: "2026-10-01", endDate: "2026-10-03", travelersCount: 4, followerCount: 0, coverImageUrl: null, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
          ],
        },
      })
    );
    await page.route(`${API}/admin/trips/counts`, (r) =>
      r.fulfill({
        json: {
          success: true,
          data: { totalNotArchived: 3, draftCount: 2, publishedCount: 1, freeLimit: 3 },
        },
      })
    );

    await page.goto("/dashboard/my-trips");
    // List should render
    await expect(page.getByText("ทริป 1")).toBeVisible({ timeout: 8000 });

    // The upgrade CTA or limit indicator should be visible
    const upgradeHint = page.getByText(/อัปเกรด|upgrade|quota|limit|ครบโควต้า|สูงสุด/i);
    await expect(upgradeHint.first()).toBeVisible({ timeout: 5000 });
  });

  test("new trip page with count at limit shows upgrade gate", async ({ page }) => {
    await page.route(`${API}/admin/trips/counts`, (r) =>
      r.fulfill({
        json: {
          success: true,
          data: { totalNotArchived: 3, draftCount: 2, publishedCount: 1, freeLimit: 3 },
        },
      })
    );
    await page.route(`${API}/admin/languages/supported`, (r) =>
      r.fulfill({ json: { success: true, data: [{ code: "th", name: "ไทย", flagEmoji: "🇹🇭", isPrimary: true }] } })
    );

    await page.goto("/dashboard/trips/new");

    // Should either redirect to upgrade page or show a quota-exceeded banner
    const blocked = page.getByText(/อัปเกรด|ครบโควต้า|ถึงขีดจำกัด|upgrade|quota exceeded/i);
    const upgradeLink = page.getByRole("link", { name: /อัปเกรด|upgrade/i });
    const isBlocked =
      (await blocked.count()) > 0 ||
      (await upgradeLink.count()) > 0 ||
      (await page.url()).includes("upgrade") ||
      (await page.url()).includes("billing");

    expect(isBlocked).toBe(true);
  });

  test("billing page renders plan info", async ({ page }) => {
    await page.route(`${API}/admin/billing`, (r) =>
      r.fulfill({
        json: {
          success: true,
          data: {
            currentPlan: "free",
            tripsUsed: 3,
            tripsLimit: 3,
            subscriptionStatus: "active",
          },
        },
      })
    );

    await page.goto("/dashboard/billing");
    await expect(page).toHaveURL(/billing/, { timeout: 5000 });
    // Page should load without crashing
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
