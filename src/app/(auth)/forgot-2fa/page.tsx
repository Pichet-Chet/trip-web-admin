"use client";

import Link from "next/link";
import { useState } from "react";
import { FormInput } from "@/components/shared";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";

export default function Forgot2FaPage(): React.ReactNode {
  usePageTitle("กู้คืน 2FA");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/admin/auth/forgot-2fa", { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 md:p-10 max-w-lg w-full space-y-5">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-amber-600">help</span>
          <h1 className="text-2xl font-extrabold text-slate-900">กู้คืน 2FA</h1>
        </div>

        {submitted ? (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
              <p className="font-semibold mb-1">ส่งลิงก์เรียบร้อย</p>
              <p>หากอีเมลนี้มีอยู่ในระบบและเปิดใช้ 2FA จะได้รับลิงก์กู้คืนภายในไม่กี่นาที</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              เปิดอีเมล กดลิงก์ในข้อความ จากนั้นป้อนรหัสผ่านเพื่อปิด 2FA และล้างรหัสสำรองทั้งหมด
              session ในทุกอุปกรณ์จะถูก logout เพื่อความปลอดภัย
            </p>
            <Link
              href="/login"
              className="block w-full bg-(--primary) text-white text-center py-3 rounded-lg font-semibold hover:brightness-110"
            >
              กลับหน้าเข้าสู่ระบบ
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-700 leading-relaxed">
              ใช้สำหรับกรณีคุณ <strong>เสียมือถือและรหัสสำรองทั้งหมด</strong>
              ระบบจะส่งลิงก์ไปยังอีเมลที่ลงทะเบียนไว้ — เพียงคุณยังเข้าถึงอีเมลได้และจำรหัสผ่านได้
              ก็จะกู้คืนได้
            </p>
            <form onSubmit={submit} className="space-y-3">
              <FormInput
                label="อีเมลที่ลงทะเบียน"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="block w-full bg-(--primary) text-white text-center py-3 rounded-lg font-semibold hover:brightness-110 disabled:opacity-50"
              >
                {busy ? "กำลังส่ง..." : "ส่งลิงก์กู้คืน"}
              </button>
            </form>
            <div className="text-center">
              <Link href="/login" className="text-xs text-slate-500 hover:text-(--primary) hover:underline">
                ← กลับหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
