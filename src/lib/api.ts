const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  traceId: string | null;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function tryParseJson<T>(text: string): T | null {
  try { return JSON.parse(text) as T; } catch { return null; }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { getValidToken } = await import("./auth");
  const token = await getValidToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": "th",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401) {
    const { refreshAuth } = await import("./auth");
    const refreshed = await refreshAuth();
    if (refreshed) {
      const { getAccessToken } = await import("./auth");
      const newToken = getAccessToken();
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
      if (!retryRes.ok) {
        const text = await retryRes.text();
        const parsed = text ? tryParseJson<ApiResponse<T>>(text) : null;
        throw new ApiError(parsed?.error || `HTTP ${retryRes.status}`, retryRes.status);
      }
      const retryJson: ApiResponse<T> = await retryRes.json();
      if (!retryJson.success) {
        throw new ApiError(retryJson.error || "Something went wrong", retryRes.status);
      }
      return retryJson.data as T;
    }
    // clearMemory() was already called inside refreshAuth(),
    // which fires notify() → dashboard layout subscriber handles the redirect.
    throw new ApiError("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่", 401);
  }

  if (!res.ok) {
    const text = await res.text();
    const parsed = text ? tryParseJson<ApiResponse<T>>(text) : null;
    throw new ApiError(parsed?.error || `HTTP ${res.status}`, res.status);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiError(json.error || "Something went wrong", res.status);
  }

  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
  // Aliases for backwards compat with old client-api import pattern
  authGet: <T>(path: string) => request<T>(path),
  authPost: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  authPut: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  authDelete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};

export { ApiError };
