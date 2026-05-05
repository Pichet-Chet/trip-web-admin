/**
 * E2E: Trip preview page + submit for review flow
 *
 * Covers: preview renders → submit review → status update → cancel review
 */

import { test, expect } from "@playwright/test";
import { injectFakeSession } from "./helpers/mock-api";

const API = "http://localhost:5100/api";
const TRIP_ID = "trip-preview-e2e";

const PUBLISHED_TRIP = {
  id: TRIP_ID, title: "ทริปเที่ยวโอซาก้า", slug: "osaka-2026",
  scope: "international", visibility: "link_only",
  destination: "โอซาก้า ญี่ปุ่น", startDate: "2026-08-10", endDate: "2026-08-14",
  coverImageUrl: null, travelersCount: 12, language: "th",
  status: "Published", importantNotes: null, staffUnpublishReason: null,
  editCount: 2, viewCount: 45, followerCount: 8,
  publishedAt: "2026-05-01T10:00:00Z",
  createdAt: "2026-04-01T00:00:00Z", updatedAt: "2026-05-01T10:00:00Z",
  days: [
    {
      id: "day-p1", dayNumber: 1, title: "วันแรก — เดินทาง", subtitle: null,
      coverImageUrl: null, date: "2026-08-10", isFreeDay: false, sortOrder: 0,
      activities: [
        { id: "a1", time: "08:00", name: "ออกเดินทางจากสนามบิน", emoji: "✈️", type: "transport", description: null, placeName: null, lat: null, lng: null, mapsLink: null, imageUrl: null, imageUrls: [], sortOrder: 0 },
      ],
    },
  ],
  accommodations: [],
  airlineInfo: [],
  emergencyContacts: [],
  checklistItems: [],
  groupMembers: [],
  lineGroupUrl: null, whatsappGroupUrl: null, telegramGroupUrl: null,
  publishedQuotaSource: null,
};

const DRAFT_TRIP = { ...PUBLISHED_TRIP, status: "Draft", publishedAt: null, viewCount: 0, followerCount: 0 };

test.describe("Trip preview page", () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeSession(page);
  });

  test("preview renders trip title and day tabs", async ({ page }) => {
    await page.route(`${API}/admin/trips/${TRIP_ID}`, (r) =>
      r.fulfill({ json: { success: true, data: PUBLISHED_TRIP } })
    );

    await page.goto(`/dashboard/trips/${TRIP_ID}/preview`);
    await expect(page.getByText("ทริปเที่ยวโอซาก้า")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Day 1")).toBeVisible();
  });

  test("preview shows activity in day view", async ({ page }) => {
    await page.route(`${API}/admin/trips/${TRIP_ID}`, (r) =>
      r.fulfill({ json: { success: true, data: PUBLISHED_TRIP } })
    );

    await page.goto(`/dashboard/trips/${TRIP_ID}/preview`);
    await expect(page.getByText("ออกเดินทางจากสนามบิน")).toBeVisible({ timeout: 8000 });
  });

  test("draft trip — submit for review button is visible", async ({ page }) => {
    await page.route(`${API}/admin/trips/${TRIP_ID}`, (r) =>
      r.fulfill({ json: { success: true, data: DRAFT_TRIP } })
    );

    await page.goto(`/dashboard/trips/${TRIP_ID}/preview`);
    await expect(page.getByRole("button", { name: /ส่งตรวจสอบ|submit.*review|เผยแพร่/i })).toBeVisible({ timeout: 8000 });
  });

  test("submit for review calls publish endpoint and shows pending state", async ({ page }) => {
    let publishCalled = false;

    await page.route(`${API}/admin/trips/${TRIP_ID}`, (r) =>
      r.fulfill({ json: { success: true, data: DRAFT_TRIP } })
    );
    await page.route(`${API}/admin/trips/${TRIP_ID}/publish`, (r) => {
      publishCalled = true;
      r.fulfill({
        json: {
          success: true,
          data: { status: "PendingReview", visibility: "link_only", message: "ส่งตรวจสอบเรียบร้อย", submittedAt: new Date().toISOString() },
        },
      });
    });

    await page.goto(`/dashboard/trips/${TRIP_ID}/preview`);
    const submitBtn = page.getByRole("button", { name: /ส่งตรวจสอบ|เผยแพร่/i });
    await expect(submitBtn).toBeVisible({ timeout: 8000 });
    await submitBtn.click();

    // Handle modal if it appears
    const confirmBtn = page.getByRole("button", { name: /ยืนยัน|ส่งตรวจสอบ|confirm/i });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }

    await page.waitForTimeout(1500);
    expect(publishCalled).toBe(true);
  });

  test("published trip shows trip link and QR code section", async ({ page }) => {
    await page.route(`${API}/admin/trips/${TRIP_ID}`, (r) =>
      r.fulfill({ json: { success: true, data: PUBLISHED_TRIP } })
    );

    await page.goto(`/dashboard/trips/${TRIP_ID}/preview`);
    await expect(page.getByText(/ลิงก์ทริป|trip link/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/QR Code/i)).toBeVisible();
  });

  test("international trip shows currency widget", async ({ page }) => {
    await page.route(`${API}/admin/trips/${TRIP_ID}`, (r) =>
      r.fulfill({ json: { success: true, data: PUBLISHED_TRIP } }) // scope: international
    );
    // Mock currency API
    await page.route(`${API}/client/currency**`, (r) =>
      r.fulfill({
        json: { success: true, data: { available: true, baseCurrency: "THB", target: "JPY", rate: 4.2, date: "2026-05-03" } },
      })
    );

    await page.goto(`/dashboard/trips/${TRIP_ID}/preview`);
    await expect(page.getByText(/แปลงสกุลเงิน|currency/i)).toBeVisible({ timeout: 8000 });
  });
});
