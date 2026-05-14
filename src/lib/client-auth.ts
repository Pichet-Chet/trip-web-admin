/**
 * Unified auth shim — re-exports from auth.ts.
 * All former guest-only auth functions now route through the unified
 * account model where every user (member or operator) uses the same
 * "user" aud JWT and in-memory token store.
 */
export { isAuthenticated, isLoggedIn, logout, subscribe } from "./auth";
export type { UserInfo as GuestUser } from "./auth";

// fetchMe: returns current user from in-memory store (no extra API call needed)
import { getUser } from "./auth";
export async function fetchMe() {
  return getUser() ?? null;
}
