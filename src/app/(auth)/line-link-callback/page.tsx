"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export default function LineLinkCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const errorParam = params.get("error");

    if (errorParam) {
      setError("ยกเลิกการเชื่อมต่อ LINE");
      setTimeout(() => router.push("/dashboard/settings"), 2000);
      return;
    }

    if (!code || !state) {
      setError("ข้อมูล callback ไม่ครบถ้วน");
      setTimeout(() => router.push("/dashboard/settings"), 2000);
      return;
    }

    const savedState = sessionStorage.getItem("line_link_state");
    if (savedState && savedState !== state) {
      setError("คำขอไม่ถูกต้อง กรุณาลองใหม่");
      setTimeout(() => router.push("/dashboard/settings"), 2500);
      return;
    }
    sessionStorage.removeItem("line_link_state");

    const redirectUri = `${window.location.origin}/line-link-callback`;
    api
      .post("/admin/me/line/link", { code, redirectUri })
      .then(() => router.replace("/dashboard/settings?linked=line"))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "เชื่อมต่อ LINE ไม่สำเร็จ");
        setTimeout(() => router.push("/dashboard/settings"), 3000);
      });
  }, [params, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-(--surface)">
      <div className="text-center max-w-sm px-6">
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
            </div>
            <p className="text-(--on-surface) font-semibold mb-2">เกิดข้อผิดพลาด</p>
            <p className="text-(--on-surface-variant) text-sm">{error}</p>
            <p className="text-(--outline) text-xs mt-3">กำลังกลับไปหน้าตั้งค่า...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#06C755">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.631-.63.345 0 .629.285.629.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
            </div>
            <p className="text-(--on-surface) font-semibold mb-1">กำลังเชื่อมต่อ LINE</p>
            <p className="text-(--on-surface-variant) text-sm">กรุณารอสักครู่...</p>
          </>
        )}
      </div>
    </main>
  );
}
