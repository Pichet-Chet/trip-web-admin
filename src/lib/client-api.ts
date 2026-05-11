const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  traceId: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = "guest_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
}

let refreshInFlight: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/client/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const json: ApiResponse<{ accessToken: string }> = await res.json();
      if (!json.success || !json.data?.accessToken) return null;
      setToken(json.data.accessToken);
      return json.data.accessToken;
    } catch {
      return null;
    } finally {
      setTimeout(() => { refreshInFlight = null; }, 0);
    }
  })();

  return refreshInFlight;
}

async function rawFetch<T>(path: string, options: RequestInit, token: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let json: ApiResponse<T> | null = null;
  try { json = await res.json(); } catch { /* empty */ }
  return { res, json };
}

async function request<T>(path: string, options: RequestInit = {}, requireAuth = false): Promise<T> {
  const token = getToken();
  let { res, json } = await rawFetch<T>(path, options, token);

  // Try refresh once on 401 before giving up
  if (res.status === 401 && (token || requireAuth)) {
    const newToken = await tryRefresh();
    if (newToken) {
      ({ res, json } = await rawFetch<T>(path, options, newToken));
    } else if (requireAuth) {
      clearToken();
      throw new ApiError("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่", 401);
    }
  }

  if (!json) throw new ApiError("เซิร์ฟเวอร์ไม่ตอบกลับ", res.status);
  if (!json.success || !res.ok) throw new ApiError(json.error ?? "เกิดข้อผิดพลาด", res.status);
  return json.data as T;
}

export const api = {
  // Public — no auth required (won't redirect on 401)
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  // Authenticated — sends Bearer token, refreshes on 401, throws on still-401
  authGet: <T>(path: string) => request<T>(path, {}, true),
  authPost: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, true),
  authPut: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, true),
  authDelete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }, true),
};
