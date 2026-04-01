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

function clearMemory() {
  accessToken = null;
  currentUser = null;
  tokenExpiresAt = 0;
}
