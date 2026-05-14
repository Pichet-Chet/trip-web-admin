/**
 * Unified auth shim — all imports from @/lib/client-api now use the
 * single api.ts + auth.ts instead of a separate guest session.
 *
 * The `api` object exposes both plain (get/post) and auth-aware
 * (authGet/authPost/authPut/authDelete) methods via the unified api.ts,
 * which automatically attaches the in-memory access token to every request.
 */
export { api, ApiError } from "./api";

// isAuthenticated: true whenever the in-memory token is present
export { isAuthenticated, isLoggedIn as getToken } from "./auth";

// Thin function shim so callers that used setToken/clearToken compile without changes
export function setToken(_token: string): void {
  // No-op: unified auth.ts manages token in memory via setMemory()
}

export function clearToken(): void {
  // No-op: use logout() from auth.ts to clear
}
