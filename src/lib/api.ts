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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Lazy import เพื่อหลีกเลี่ยง circular dependency
  const { getValidToken } = await import("./auth");
  const token = await getValidToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // ส่ง httpOnly cookie อัตโนมัติ
  });

  if (res.status === 401) {
    // Token expired — try refresh
    const { refreshAuth } = await import("./auth");
    const refreshed = await refreshAuth();
    if (refreshed) {
      // Retry with new token
      const { getAccessToken } = await import("./auth");
      const newToken = getAccessToken();
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
      const retryJson: ApiResponse<T> = await retryRes.json();
      if (!retryJson.success || !retryRes.ok) {
        throw new ApiError(retryJson.error || "Something went wrong", retryRes.status);
      }
      return retryJson.data as T;
    }
    // Refresh failed — redirect to login
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError("Session expired", 401);
  }

  const json: ApiResponse<T> = await res.json();

  if (!json.success || !res.ok) {
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
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};

export { ApiError };
