import type { Page, Route } from "@playwright/test";

const API = "http://localhost:5100/api";

/** Intercept any admin API call and return a 200 JSON envelope. */
export function mockGet(page: Page, path: string, data: unknown) {
  return page.route(`${API}${path}`, (route: Route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, data }) })
  );
}

export function mockPost(page: Page, path: string, data: unknown) {
  return page.route(
    `${API}${path}`,
    (route: Route) => {
      if (route.request().method() !== "POST") { route.continue(); return; }
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, data }) });
    }
  );
}

export function mockPut(page: Page, path: string, data: unknown) {
  return page.route(
    `${API}${path}`,
    (route: Route) => {
      if (route.request().method() !== "PUT") { route.continue(); return; }
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, data }) });
    }
  );
}

/** Simulate a 401 Unauthorized for a path. */
export function mockUnauthorized(page: Page, path: string) {
  return page.route(`${API}${path}`, (route: Route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false, message: "Unauthorized" }) })
  );
}

/** Intercept Next.js auth token API (used by the app to restore session). */
export async function injectFakeSession(page: Page) {
  const fakeUser = {
    id: "user-e2e", email: "e2e@example.com",
    firstName: "E2E", lastName: "Tester",
    companyId: "company-e2e", role: "owner",
  };
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, data: fakeUser }) })
  );
  await page.route(`${API}/admin/me`, (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, data: fakeUser }) })
  );
  // Fake access token stored in memory — inject via localStorage
  await page.addInitScript(() => {
    (window as { __e2e_token?: string }).__e2e_token = "e2e-fake-token";
  });
}
