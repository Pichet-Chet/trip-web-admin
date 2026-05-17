import { describe, it, expect, vi, beforeEach } from "vitest";

// auth.ts uses module-level mutable state (accessToken, currentUser, etc.).
// We reset modules before every test so each test gets a clean slate and
// tests that mutate state don't bleed into each other.

async function freshModule() {
  vi.resetModules();
  return import("./auth");
}

// ── subscribe ─────────────────────────────────────────────────────────────

describe("subscribe", () => {
  it("fires immediately with null when no user is logged in", async () => {
    const { subscribe } = await freshModule();
    const received: unknown[] = [];
    const unsub = subscribe((u) => received.push(u));
    expect(received).toEqual([null]);
    unsub();
  });

  it("returns an unsubscribe function that stops future notifications", async () => {
    const { subscribe } = await freshModule();
    const received: unknown[] = [];
    const unsub = subscribe((u) => received.push(u));
    unsub();
    // No further calls should happen after unsub
    expect(received).toHaveLength(1); // only the initial fire
  });
});

// ── login — 2FA gate ──────────────────────────────────────────────────────

describe("login", () => {
  it("sets access token when server does NOT require 2FA", async () => {
    const auth = await freshModule();
    vi.doMock("./api", () => ({
      api: {
        post: vi.fn().mockResolvedValue({
          accessToken: "tok-valid",
          expiresAt: new Date(Date.now() + 900_000).toISOString(),
          requires2Fa: false,
          user: {
            id: "u1", firstName: "Test", lastName: "User",
            email: "t@t.com", role: "operator",
            companyId: "co1", companyName: "TestCo",
            accountType: "company", isOperator: true,
            companies: [],
          },
        }),
      },
      ApiError: class extends Error {},
    }));

    // Re-import after mock is registered
    const { login, isAuthenticated } = await freshModule();
    await login({ email: "t@t.com", password: "pw" });
    expect(isAuthenticated()).toBe(true);
  });

  it("does NOT set access token when server requires 2FA", async () => {
    vi.doMock("./api", () => ({
      api: {
        post: vi.fn().mockResolvedValue({
          accessToken: "tok-challenge",
          expiresAt: new Date(Date.now() + 300_000).toISOString(),
          requires2Fa: true,
          challengeToken: "ch-xxx",
          user: null,
        }),
      },
      ApiError: class extends Error {},
    }));

    const { login, isAuthenticated } = await freshModule();
    const res = await login({ email: "t@t.com", password: "pw" });
    expect(res.requires2Fa).toBe(true);
    expect(isAuthenticated()).toBe(false);
  });

  it("notifies subscribers after successful login", async () => {
    vi.doMock("./api", () => ({
      api: {
        post: vi.fn().mockResolvedValue({
          accessToken: "tok-notify",
          expiresAt: new Date(Date.now() + 900_000).toISOString(),
          requires2Fa: false,
          user: {
            id: "u2", firstName: "Alice", lastName: "B",
            email: "a@b.com", role: "operator",
            companyId: "co2", companyName: "AliceCo",
            accountType: "company", isOperator: true,
            companies: [],
          },
        }),
      },
      ApiError: class extends Error {},
    }));

    const { login, subscribe } = await freshModule();
    const received: unknown[] = [];
    const unsub = subscribe((u) => received.push(u));

    await login({ email: "a@b.com", password: "pw" });

    // Initial fire (null) + post-login notification (user)
    expect(received).toHaveLength(2);
    expect((received[1] as { firstName: string } | null)?.firstName).toBe("Alice");
    unsub();
  });
});

// ── getUser / getAccessToken ───────────────────────────────────────────────

describe("getUser / getAccessToken", () => {
  it("returns null before login", async () => {
    const { getUser, getAccessToken } = await freshModule();
    expect(getUser()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});

// ── refreshAuth ───────────────────────────────────────────────────────────

describe("refreshAuth", () => {
  it("sets token on successful refresh", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          accessToken: "refreshed-tok",
          expiresAt: new Date(Date.now() + 900_000).toISOString(),
          user: {
            id: "u3", firstName: "Bob", lastName: "C",
            email: "b@c.com", role: "operator",
            companyId: "co3", companyName: "BobCo",
            accountType: "company", isOperator: true,
            companies: [],
          },
        },
      }),
    }));

    const { refreshAuth, isAuthenticated } = await freshModule();
    const ok = await refreshAuth();

    expect(ok).toBe(true);
    expect(isAuthenticated()).toBe(true);
    vi.unstubAllGlobals();
  });

  it("clears token when refresh returns non-ok status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const { refreshAuth, isAuthenticated } = await freshModule();
    const ok = await refreshAuth();

    expect(ok).toBe(false);
    expect(isAuthenticated()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("clears token when refresh response has success:false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, data: null }),
    }));

    const { refreshAuth, isAuthenticated } = await freshModule();
    const ok = await refreshAuth();

    expect(ok).toBe(false);
    expect(isAuthenticated()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("clears token when fetch throws (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { refreshAuth, isAuthenticated } = await freshModule();
    const ok = await refreshAuth();

    expect(ok).toBe(false);
    expect(isAuthenticated()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("deduplicates concurrent refresh calls — fetch called exactly once", async () => {
    let resolveRefresh!: () => void;
    const refreshDone = new Promise<void>((r) => { resolveRefresh = r; });

    const mockFetch = vi.fn().mockImplementation(async () => {
      await refreshDone;
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accessToken: "dedup-tok",
            expiresAt: new Date(Date.now() + 900_000).toISOString(),
            user: {
              id: "u4", firstName: "Carol", lastName: "D",
              email: "c@d.com", role: "operator",
              companyId: "co4", companyName: "CarolCo",
              accountType: "company", isOperator: true, companies: [],
            },
          },
        }),
      };
    });
    vi.stubGlobal("fetch", mockFetch);

    const { refreshAuth } = await freshModule();

    // Launch 3 concurrent refreshes
    const p1 = refreshAuth();
    const p2 = refreshAuth();
    const p3 = refreshAuth();

    resolveRefresh();
    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(r3).toBe(true);
    // fetch should have been called only once despite 3 concurrent callers
    expect(mockFetch).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});

// ── getValidToken ─────────────────────────────────────────────────────────

describe("getValidToken", () => {
  it("returns null when no token is set", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const { getValidToken } = await freshModule();
    const tok = await getValidToken();
    expect(tok).toBeNull();
    vi.unstubAllGlobals();
  });
});

// ── setAccessToken — JWT decode ───────────────────────────────────────────

describe("setAccessToken", () => {
  function makeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.fakesig`;
  }

  it("decodes JWT and sets user info", async () => {
    const { setAccessToken, getUser, getAccessToken } = await freshModule();

    const exp = Math.floor(Date.now() / 1000) + 900;
    const token = makeJwt({
      sub: "user-abc",
      exp,
      email: "j@k.com",
      first_name: "John",
      last_name: "Doe",
      role: "operator",
      company_id: "co-x",
      account_type: "company",
      is_operator: "true",
    });

    setAccessToken(token);

    expect(getAccessToken()).toBe(token);
    const user = getUser();
    expect(user).not.toBeNull();
    expect(user!.id).toBe("user-abc");
    expect(user!.firstName).toBe("John");
    expect(user!.lastName).toBe("Doe");
    expect(user!.email).toBe("j@k.com");
    expect(user!.role).toBe("operator");
    expect(user!.companyId).toBe("co-x");
    expect(user!.accountType).toBe("company");
    expect(user!.isOperator).toBe(true);
  });

  it("sets isOperator=true when account_type is not 'member'", async () => {
    const { setAccessToken, getUser } = await freshModule();
    const token = makeJwt({
      sub: "u1", exp: Math.floor(Date.now() / 1000) + 900,
      account_type: "company",
    });
    setAccessToken(token);
    expect(getUser()!.isOperator).toBe(true);
  });

  it("sets isOperator=false when account_type is 'member'", async () => {
    const { setAccessToken, getUser } = await freshModule();
    const token = makeJwt({
      sub: "u1", exp: Math.floor(Date.now() / 1000) + 900,
      account_type: "member",
    });
    setAccessToken(token);
    expect(getUser()!.isOperator).toBe(false);
  });

  it("throws when token is not a valid JWT", async () => {
    const { setAccessToken } = await freshModule();
    expect(() => setAccessToken("not.a.valid.jwt.here")).toThrow("Invalid JWT");
  });

  it("notifies subscribers after setAccessToken", async () => {
    const { setAccessToken, subscribe } = await freshModule();
    const received: unknown[] = [];
    const unsub = subscribe((u) => received.push(u));

    const token = makeJwt({
      sub: "u2", exp: Math.floor(Date.now() / 1000) + 900,
      first_name: "Eve", last_name: "X", account_type: "company",
    });
    setAccessToken(token);

    expect(received).toHaveLength(2); // initial null + post-set user
    expect((received[1] as { firstName: string } | null)?.firstName).toBe("Eve");
    unsub();
  });
});

// ── getImpersonationContext ───────────────────────────────────────────────

describe("getImpersonationContext", () => {
  function makeJwt(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.fakesig`;
  }

  it("returns active:false when no token set", async () => {
    const { getImpersonationContext } = await freshModule();
    expect(getImpersonationContext()).toEqual({ active: false, impersonatedBy: null });
  });

  it("detects impersonation claim in token", async () => {
    const { setAccessToken, getImpersonationContext } = await freshModule();
    const token = makeJwt({
      sub: "op-1", exp: Math.floor(Date.now() / 1000) + 900,
      account_type: "company",
      impersonating: "true",
      impersonated_by: "staff-007",
    });
    setAccessToken(token);
    const ctx = getImpersonationContext();
    expect(ctx.active).toBe(true);
    expect(ctx.impersonatedBy).toBe("staff-007");
  });

  it("returns active:false for regular (non-impersonated) token", async () => {
    const { setAccessToken, getImpersonationContext } = await freshModule();
    const token = makeJwt({
      sub: "op-2", exp: Math.floor(Date.now() / 1000) + 900,
      account_type: "company",
    });
    setAccessToken(token);
    expect(getImpersonationContext().active).toBe(false);
  });
});
