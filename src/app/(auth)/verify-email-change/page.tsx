"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface VerifyResponse {
  oldEmail: string;
  newEmail: string;
  message: string;
}

function VerifyContent(): React.ReactNode {
  const params = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">(token ? "verifying" : "error");
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string>("ไม่พบโทเค็นในลิงก์");

  useEffect(() => {
    if (!token) return;
    api.get<VerifyResponse>(`/admin/auth/verify-email-change?token=${encodeURIComponent(token)}`)
      .then((res) => { setData(res); setStatus("success"); })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 md:p-10 max-w-lg w-full space-y-5">
      {status === "verifying" && (
        <>
          <h1 className="text-2xl font-extrabold text-slate-900">กำลังยืนยันการเปลี่ยนอีเมล...</h1>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-(--primary) animate-pulse" />
          </div>
        </>
      )}

      {status === "success" && data && (
        <>
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-3xl text-emerald-600"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">เปลี่ยนอีเมลสำเร็จ</h1>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{data.message}</p>
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">อีเมลเดิม</span>
              <span className="text-slate-700 font-mono line-through">{data.oldEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">อีเมลใหม่</span>
              <span className="text-slate-900 font-mono font-semibold">{data.newEmail}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            session ทุกเครื่องถูก logout เพื่อความปลอดภัย — กรุณาเข้าสู่ระบบใหม่ด้วยอีเมลใหม่
          </p>
          <Link
            href="/login"
            className="block w-full bg-(--primary) text-white text-center py-3 rounded-lg font-semibold hover:brightness-110"
          >
            เข้าสู่ระบบ
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-red-600">error</span>
            <h1 className="text-2xl font-extrabold text-slate-900">ยืนยันไม่สำเร็จ</h1>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{error}</p>
          <p className="text-xs text-slate-500">
            ลิงก์อาจหมดอายุ (24 ชั่วโมง) หรือถูกใช้ไปแล้ว — กรุณาขอเปลี่ยนอีเมลใหม่ในหน้าตั้งค่า
          </p>
          <Link
            href="/dashboard/settings"
            className="block w-full text-center py-3 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            ไปยังหน้าตั้งค่า
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailChangePage(): React.ReactNode {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <Suspense fallback={<div className="bg-white rounded-2xl p-8 max-w-lg w-full animate-pulse h-72" />}>
        <VerifyContent />
      </Suspense>
    </main>
  );
}
