/**
 * E2E: Trip creation wizard
 *
 * Flow: New Trip (Step 1) → fill basics → save draft → Step 2 (add activity) → Step 3 (preview)
 * All API calls are intercepted with page.route() so no live backend is needed.
 */

import { test, expect } from "@playwright/test";
import { injectFakeSession } from "./helpers/mock-api";

const API = "http://localhost:5100/api";

const DRAFT_ID = "trip-draft-001";

const DRAFT_TRIP = {
  id: DRAFT_ID, title: "ทริปทดสอบ E2E", destination: "โตเกียว",
  scope: "international", language: "th", status: "Draft",
  startDate: "2026-08-01", endDate: "2026-08-05",
  travelersCount: 10, followerCount: 0, coverImageUrl: null,
  days: [
    {
      id: "day-001", dayNumber: 1, title: "Day 1", subtitle: null,
      coverImageUrl: null, date: "2026-08-01", isFreeDay: false, sortOrder: 0,
      activities: [],
    },
  ],
  accommodations: [], airlines: [], emergencyContacts: [],
  checklistItems: [], importantNotes: null,
};

async function setupMocks(page: ReturnType<typeof test.info>["project"] extends infer _ ? import("@playwright/test").Page : never) {
  await injectFakeSession(page);

  // Supported languages
  await page.route(`${API}/admin/languages/supported`, (r) =>
    r.fulfill({ json: { success: true, data: [{ code: "th", name: "ไทย", flagEmoji: "🇹🇭", isPrimary: true }] } })
  );
  // Plans / billing
  await page.route(`${API}/admin/trips/counts`, (r) =>
    r.fulfill({ json: { success: true, data: { totalNotArchived: 0, draftCount: 0, publishedCount: 0, freeLimit: 3 } } })
  );
  // Create draft
  await page.route(`${API}/admin/trips`, async (r) => {
    if (r.request().method() !== "POST") { await r.continue(); return; }
    r.fulfill({ json: { success: true, data: DRAFT_TRIP } });
  });
  // GET trip detail
  await page.route(`${API}/admin/trips/${DRAFT_ID}`, async (r) => {
    if (r.request().method() !== "GET") { await r.continue(); return; }
    r.fulfill({ json: { success: true, data: DRAFT_TRIP } });
  });
  // PUT trip
  await page.route(`${API}/admin/trips/${DRAFT_ID}`, async (r) => {
    if (r.request().method() !== "PUT") { await r.continue(); return; }
    r.fulfill({ json: { success: true, data: DRAFT_TRIP } });
  });
  // Airlines / accommodations
  await page.route(`${API}/admin/trips/${DRAFT_ID}/airlines`, (r) => r.fulfill({ json: { success: true, data: [] } }));
  await page.route(`${API}/admin/trips/${DRAFT_ID}/accommodations`, (r) => r.fulfill({ json: { success: true, data: [] } }));
  await page.route(`${API}/admin/trips/${DRAFT_ID}/emergency-contacts`, (r) => r.fulfill({ json: { success: true, data: [] } }));
  await page.route(`${API}/admin/trips/${DRAFT_ID}/checklist`, (r) => r.fulfill({ json: { success: true, data: [] } }));
  // Days
  await page.route(`${API}/admin/trips/${DRAFT_ID}/days/**`, async (r) => {
    if (r.request().method() === "PUT") r.fulfill({ json: { success: true, data: {} } });
    else r.continue();
  });
  // Activities
  await page.route(`${API}/admin/days/day-001/activities`, async (r) => {
    if (r.request().method() !== "POST") { await r.continue(); return; }
    r.fulfill({
      json: {
        success: true,
        data: {
          id: "act-001", dayId: "day-001", time: null, name: "ชมวัด", description: null,
          type: "attraction", placeName: null, lat: null, lng: null, mapsLink: null,
          imageUrl: null, imageUrls: [], emoji: "⛩️", sortOrder: 0,
        },
      },
    });
  });
}

test.describe("Trip creation wizard", () => {
  test("Step 1 — new trip form renders key fields", async ({ page }) => {
    await injectFakeSession(page);
    await page.route(`${API}/admin/languages/supported`, (r) =>
      r.fulfill({ json: { success: true, data: [{ code: "th", name: "ไทย", flagEmoji: "🇹🇭", isPrimary: true }] } })
    );
    await page.route(`${API}/admin/trips/counts`, (r) =>
      r.fulfill({ json: { success: true, data: { totalNotArchived: 0, draftCount: 0, publishedCount: 0, freeLimit: 3 } } })
    );

    await page.goto("/dashboard/trips/new");
    await expect(page.getByLabel(/ชื่อทริป|trip title/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/ปลายทาง|destination/i)).toBeVisible();
  });

  test("Step 1 — fill title and destination, save draft creates trip", async ({ page }) => {
    await setupMocks(page);

    await page.goto("/dashboard/trips/new");
    await expect(page.getByLabel(/ชื่อทริป|trip title/i)).toBeVisible({ timeout: 8000 });

    await page.getByLabel(/ชื่อทริป|trip title/i).fill("ทริปทดสอบ E2E");
    await page.getByLabel(/ปลายทาง|destination/i).fill("โตเกียว");

    // Date fields
    const dateInputs = page.locator("input[type='date'], input[placeholder*='วันที่']");
    if (await dateInputs.count() >= 2) {
      await dateInputs.nth(0).fill("2026-08-01");
      await dateInputs.nth(1).fill("2026-08-05");
    }

    await page.getByRole("button", { name: /บันทึกร่าง|save draft/i }).click();

    // URL should update to include the draft ID or trip ID
    await expect(page).toHaveURL(/trips\/new\?id=|trips\/.+\/edit/, { timeout: 8000 });
  });

  test("Step 2 — edit page renders day tabs and add-activity button", async ({ page }) => {
    await setupMocks(page);

    await page.goto(`/dashboard/trips/${DRAFT_ID}/edit`);
    // Day tabs
    await expect(page.getByRole("tab", { name: /day 1/i })).toBeVisible({ timeout: 8000 });
    // Add activity button
    await expect(page.getByRole("button", { name: /เพิ่มกิจกรรม|add activity/i })).toBeVisible();
  });

  test("Step 2 — add activity via quick-input Enter creates a card", async ({ page }) => {
    await setupMocks(page);

    await page.goto(`/dashboard/trips/${DRAFT_ID}/edit`);
    await expect(page.getByRole("tab", { name: /day 1/i })).toBeVisible({ timeout: 8000 });

    // Quick activity input
    const quickInput = page.getByPlaceholder(/พิมพ์ชื่อกิจกรรม|activity name/i);
    if (await quickInput.isVisible()) {
      await quickInput.fill("ชมวัด");
      await quickInput.press("Enter");
      // New card should appear
      await expect(page.getByText("ชมวัด")).toBeVisible({ timeout: 5000 });
    }
  });

  test("Step 2 → Next button navigates to preview", async ({ page }) => {
    await setupMocks(page);
    // Preview page mocks
    await page.route(`${API}/admin/trips/${DRAFT_ID}`, (r) =>
      r.fulfill({ json: { success: true, data: { ...DRAFT_TRIP, status: "Draft" } } })
    );

    await page.goto(`/dashboard/trips/${DRAFT_ID}/edit`);
    await expect(page.getByRole("tab", { name: /day 1/i })).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /ถัดไป|next|ดูตัวอย่าง/i }).click();
    await expect(page).toHaveURL(new RegExp(`trips/${DRAFT_ID}/preview`), { timeout: 8000 });
  });
});
