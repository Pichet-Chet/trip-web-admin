import { api } from "./api";

// === Types ===

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  accountType: string;
  companies: CompanyInfo[];
}

export interface CompanyInfo {
  id: string;
  name: string;
  role: string;
  logoUrl: string | null;
  accountType: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  password: string;
  accountType: string;
  termsReadAt: string;
  privacyReadAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
  captchaToken?: string;
}

export interface RegisterResponse {
  email: string;
  message: string;
}

// === In-memory token store ===

let accessToken: string | null = null;
let currentUser: UserInfo | null = null;
let tokenExpiresAt: number = 0;
let refreshPromise: Promise<void> | null = null;

// === Public API ===

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return api.post<RegisterResponse>("/admin/auth/register", payload);
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>("/admin/auth/login", payload);
  setMemory(data);
  return data;
}

export async function switchCompany(companyId: string): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>("/admin/auth/switch-company", { companyId });
  setMemory(data);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch { /* ignore */ }
  clearMemory();
  window.location.href = "/login";
}

export function getUser(): UserInfo | null {
  return currentUser;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function isLoggedIn(): boolean {
  return !!accessToken;
}

export function getCompanies(): CompanyInfo[] {
  return currentUser?.companies ?? [];
}

export function getActiveCompany(): CompanyInfo | null {
  if (!currentUser) return null;
  return currentUser.companies.find(c => c.id === currentUser!.companyId) ?? null;
}

/**
 * เรียก /refresh เพื่อ renew access token
 */
export async function refreshAuth(): Promise<boolean> {
  if (refreshPromise) {
    await refreshPromise;
    return !!accessToken;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        clearMemory();
        return;
      }

      const json = await res.json();
      if (json.success && json.data) {
        setMemory(json.data);
      } else {
        clearMemory();
      }
    } catch {
      clearMemory();
    }
  })();

  await refreshPromise;
  refreshPromise = null;
  return !!accessToken;
}

/**
 * ดึง access token ที่ valid
 */
export async function getValidToken(): Promise<string | null> {
  if (accessToken && Date.now() < tokenExpiresAt - 60_000) {
    return accessToken;
  }

  const ok = await refreshAuth();
  return ok ? accessToken : null;
}

// === Internal ===

function setMemory(data: AuthResponse) {
  accessToken = data.accessToken;
  currentUser = data.user;
  tokenExpiresAt = new Date(data.expiresAt).getTime();
}

/**
 * Phase N2.1 — accept a staff-issued impersonation token. Decodes JWT
 * client-side (no signature verify; server validates on every request)
 * to extract user info + expiry, then sets it as the active session.
 * Subsequent requests via api.ts will use this token until it expires.
 */
export function setAccessToken(token: string): void {
  const payload = decodeJwt(token);
  if (!payload) throw new Error("Invalid JWT");

  accessToken = token;
  tokenExpiresAt = (payload.exp ?? 0) * 1000;
  currentUser = {
    id: payload.sub ?? "",
    firstName: payload.first_name ?? "",
    lastName: payload.last_name ?? "",
    email: payload.email ?? "",
    role: payload.role ?? "",
    companyId: payload.company_id ?? "",
    companyName: "",
    accountType: payload.account_type ?? "",
    companies: [],
  };
}

interface JwtPayload {
  sub?: string;
  exp?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  account_type?: string;
  impersonating?: string;
  impersonated_by?: string;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(payload.length + (4 - payload.length % 4) % 4, "=");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

/** Phase N2.1 — current session is an impersonation if "impersonating" claim is set. */
export function getImpersonationContext(): { active: boolean; impersonatedBy: string | null } {
  if (!accessToken) return { active: false, impersonatedBy: null };
  const payload = decodeJwt(accessToken);
  return {
    active: !!payload?.impersonating,
    impersonatedBy: payload?.impersonated_by ?? null,
  };
}

function clearMemory() {
  accessToken = null;
  currentUser = null;
  tokenExpiresAt = 0;
}
