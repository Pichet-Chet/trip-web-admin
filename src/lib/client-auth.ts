import { api, setToken, clearToken, getToken } from "./client-api";

export interface GuestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isEmailVerified: boolean;
  isTwoFactorEnabled?: boolean;
  createdAt: string;
}

interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    accountType: string;
  };
}

export async function login(email: string, password: string, rememberMe: boolean): Promise<LoginResponse> {
  const result = await api.post<LoginResponse>("/client/auth/login", {
    email,
    password,
    rememberMe,
  });
  setToken(result.accessToken);
  return result;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  termsReadAt: string;
  privacyReadAt: string;
}

export async function register(payload: RegisterPayload): Promise<{ email: string; message: string }> {
  return api.post<{ email: string; message: string }>("/client/auth/register", payload);
}

export async function fetchMe(): Promise<GuestUser | null> {
  if (!getToken()) return null;
  try {
    return await api.authGet<GuestUser>("/client/auth/me");
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post("/client/auth/logout");
  } catch {
    // ignore — clear local state regardless
  }
  clearToken();
}

export async function verifyEmail(token: string): Promise<void> {
  await api.get(`/client/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/client/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/client/auth/reset-password", { token, newPassword });
}

export async function resendVerification(email: string): Promise<void> {
  await api.post("/client/auth/resend-verification", { email });
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
