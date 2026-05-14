"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/shared";

interface ConnectedAccounts {
  hasPassword: boolean;
  hasGoogle: boolean;
  hasLine: boolean;
}

interface Props {
  /** true = account_type != "member" (operator); false = member */
  isOperator: boolean;
}

export function ConnectedAccountsSection({ isOperator }: Props) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<ConnectedAccounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<"google" | "line" | null>(null);

  useEffect(() => {
    // Both operators and members use the unified /admin/me endpoint now
    api.get<ConnectedAccounts>("/admin/me/connected-accounts")
      .then(setAccounts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOperator]);

  async function handleConnect(provider: "google" | "line") {
    try {
      const redirectUri = `${window.location.origin}/${provider}-link-callback`;
      const linkUrlPath = `/admin/me/${provider}/link-url?redirectUri=${encodeURIComponent(redirectUri)}`;
      const res = await api.get<{ url: string; state: string }>(linkUrlPath);
      sessionStorage.setItem(`${provider}_link_state`, res.state);
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  async function handleUnlink(provider: "google" | "line") {
    setUnlinking(provider);
    try {
      await api.delete(`/admin/me/${provider}/unlink`);
      const key = `has${provider.charAt(0).toUpperCase() + provider.slice(1)}` as keyof ConnectedAccounts;
      setAccounts((prev) => prev ? { ...prev, [key]: false } : prev);
      toast.success(`ยกเลิกการเชื่อมต่อ ${provider === "google" ? "Google" : "LINE"} แล้ว`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setUnlinking(null);
    }
  }

  if (loading) return (
    <div className="animate-pulse space-y-3">
      {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
    </div>
  );

  if (!accounts) return null;

  const providers = [
    {
      id: "google" as const,
      label: "Google",
      connected: accounts.hasGoogle,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ),
    },
    {
      id: "line" as const,
      label: "LINE",
      connected: accounts.hasLine,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#06C755">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.631-.63.345 0 .629.285.629.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {providers.map(({ id, label, connected, icon }) => (
        <div key={id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {connected ? "เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อมต่อ"}
              </p>
            </div>
          </div>

          {connected ? (
            <button
              type="button"
              onClick={() => handleUnlink(id)}
              disabled={unlinking === id}
              className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              {unlinking === id ? "กำลังยกเลิก..." : "ยกเลิกเชื่อมต่อ"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleConnect(id)}
              className="text-xs font-semibold text-(--primary) hover:opacity-80 transition-opacity px-3 py-1.5 rounded-lg hover:bg-(--primary-container)/30"
            >
              เชื่อมต่อ
            </button>
          )}
        </div>
      ))}

      {!accounts.hasPassword && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          บัญชีนี้ใช้ Social Login เท่านั้น — ตั้งรหัสผ่านเพื่อเพิ่มช่องทาง login อีกช่องทางหนึ่ง
        </p>
      )}
    </div>
  );
}
