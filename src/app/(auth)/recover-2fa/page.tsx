"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FormInput } from "@/components/shared";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";

function RecoverContent(): React.ReactNode {
  usePageTitle("กู้คืน 2FA");
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !password) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/admin/auth/recover-2fa", { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-xl p-8 max-w-lg w-full space-y-4">
        <h1 className="text-xl font-extrabold text-(--on-surface)">ลิงก์ไม่ถูกต้อง</h1>
        <p className="text-sm text-(--on-surface-variant)">ไม่พบโทเค็นในลิงก์ — กรุณากลับไปขอใหม่</p>
        <Link href="/forgot-2fa" className="block w-full bg-(--primary) text-white text-center py-3 rounded-lg font-semibold">
          ขอลิงก์ใหม่
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-xl p-8 md:p-10 max-w-lg w-full space-y-5">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <h1 className="text-2xl font-extrabold text-(--on-surface)">ปิด 2FA สำเร็จ</h1>
        </div>
        <p className="text-sm text-(--on-surface) leading-relaxed">
          ระบบปิดการใช้งาน 2FA และล้างรหัสสำรองทั้งหมดเรียบร้อย
          session ในทุกอุปกรณ์ถูก logout เพื่อความปลอดภัย
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
          <strong>แนะนำ:</strong> หลังเข้าสู่ระบบใหม่แล้ว เปิดใช้ 2FA อีกครั้งและเก็บรหัสสำรองชุดใหม่ไว้ในที่ปลอดภัย
        </div>
        <Link href="/login" className="block w-full bg-(--primary) text-white text-center py-3 rounded-lg font-semibold hover:brightness-110">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-xl p-8 md:p-10 max-w-lg w-full space-y-5">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-amber-600">verified_user</span>
        <h1 className="text-2xl font-extrabold text-(--on-surface)">ยืนยันตัวตน</h1>
      </div>
      <p className="text-sm text-(--on-surface)">
        เพื่อความปลอดภัย กรุณาป้อนรหัสผ่านบัญชีของคุณเพื่อปิด 2FA
      </p>
      <form onSubmit={submit} className="space-y-3">
        <FormInput
          label="รหัสผ่าน"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="block w-full bg-(--primary) text-white py-3 rounded-lg font-semibold hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "กำลังประมวลผล..." : "ปิด 2FA และล้างรหัสสำรอง"}
        </button>
      </form>
      <div className="text-center">
        <Link href="/login" className="text-xs text-(--on-surface-variant) hover:text-(--primary) hover:underline">
          ← ยกเลิก
        </Link>
      </div>
    </div>
  );
}

export default function Recover2FaPage(): React.ReactNode {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-(--surface-container-low)">
      <Suspense fallback={<div className="bg-white rounded-2xl p-8 max-w-lg w-full animate-pulse h-72" />}>
        <RecoverContent />
      </Suspense>
    </main>
  );
}
