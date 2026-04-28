"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/auth";

/**
 * Phase N2.1 — token receiver for staff-issued impersonation tokens.
 * Staff console opens `/impersonate-token#<token>` in a new tab; this page
 * extracts the JWT from the URL fragment (not query, so it doesn't end up
 * in server logs / referrers), stores it as the active session, and
 * redirects to the dashboard.
 */
export default function ImpersonateTokenPage(): React.ReactNode {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fragment = window.location.hash.replace(/^#/, "");
    if (!fragment) {
      setError("ไม่พบ token ใน URL — กลับไปกดปุ่ม impersonate ใหม่");
      return;
    }

    let token: string;
    try {
      token = decodeURIComponent(fragment);
    } catch {
      setError("Token รูปแบบไม่ถูกต้อง");
      return;
    }

    // Sanity check: a JWT has 3 base64url segments separated by dots
    if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
      setError("Token ที่ได้รับไม่ใช่ JWT");
      return;
    }

    setAccessToken(token);
    // Clear the fragment from history so a back-button doesn't replay
    window.history.replaceState({}, "", "/impersonate-token");
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <span className="material-symbols-outlined text-5xl text-red-400 block mb-3">error</span>
            <h1 className="text-lg font-bold text-slate-900 mb-2">เริ่มโหมดดูแทน operator ไม่สำเร็จ</h1>
            <p className="text-sm text-slate-500">{error}</p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined animate-spin text-4xl text-blue-500 block mb-3">progress_activity</span>
            <p className="text-sm text-slate-500">กำลังเริ่มโหมดดูแทน operator...</p>
          </>
        )}
      </div>
    </main>
  );
}
