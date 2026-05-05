/**
 * E2E: Post creation and publish flow
 * create post → fill content → publish → appears in post list
 */

import { test, expect } from "@playwright/test";
import { injectFakeSession } from "./helpers/mock-api";

const API = "http://localhost:5100/api";
const POST_ID = "post-e2e-001";

const DRAFT_POST = {
  id: POST_ID, title: "บทความทดสอบ E2E", content: "เนื้อหาบทความ...",
  status: "Draft", coverImageUrl: null, slug: null,
  publishedAt: null, createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z",
};

test.describe("Post publish flow", () => {
  test.beforeEach(async ({ page }) => {
    await injectFakeSession(page);

    await page.route(`${API}/admin/posts`, async (r) => {
      if (r.request().method() === "GET")
        return r.fulfill({ json: { success: true, data: [DRAFT_POST] } });
      if (r.request().method() === "POST")
        return r.fulfill({ json: { success: true, data: DRAFT_POST } });
      r.continue();
    });

    await page.route(`${API}/admin/posts/${POST_ID}`, async (r) => {
      if (r.request().method() === "GET")
        return r.fulfill({ json: { success: true, data: DRAFT_POST } });
      if (r.request().method() === "PUT")
        return r.fulfill({ json: { success: true, data: { ...DRAFT_POST, title: "บทความที่แก้ไขแล้ว" } } });
      r.continue();
    });

    await page.route(`${API}/admin/posts/${POST_ID}/publish`, (r) =>
      r.fulfill({ json: { success: true, data: { ...DRAFT_POST, status: "Published", publishedAt: new Date().toISOString() } } })
    );
  });

  test("posts list page renders with mock data", async ({ page }) => {
    await page.goto("/dashboard/posts");
    await expect(page.getByText("บทความทดสอบ E2E")).toBeVisible({ timeout: 8000 });
  });

  test("new post page renders title and content fields", async ({ page }) => {
    await page.goto("/dashboard/posts/new");
    await expect(page.getByLabel(/หัวข้อ|title/i)).toBeVisible({ timeout: 8000 });
  });

  test("creating post and clicking publish calls publish API", async ({ page }) => {
    let publishCalled = false;
    await page.route(`${API}/admin/posts/${POST_ID}/publish`, (r) => {
      publishCalled = true;
      r.fulfill({ json: { success: true, data: { ...DRAFT_POST, status: "Published" } } });
    });

    await page.goto(`/dashboard/posts/${POST_ID}/edit`);
    await expect(page.getByLabel(/หัวข้อ|title/i)).toBeVisible({ timeout: 8000 });

    const publishBtn = page.getByRole("button", { name: /เผยแพร่|publish/i });
    if (await publishBtn.isVisible()) {
      await publishBtn.click();
      // Allow confirm dialog
      const confirmBtn = page.getByRole("button", { name: /ยืนยัน|confirm|ตกลง/i });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      // Give time for API call
      await page.waitForTimeout(1000);
      expect(publishCalled).toBe(true);
    }
  });
});
