"use client";

import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/constants/routes";
import { FormInput, AuthHero } from "@/components/shared";
import { api, ApiError } from "@/lib/api";

export default function ForgotPasswordPage(): React.ReactNode {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("กรุณากรอกอีเมล"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("รูปแบบอีเมลไม่ถูกต้อง"); return; }

    setLoading(true);
    try {
      await api.post("/admin/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Hero Image */}
      <section className="relative hidden md:flex md:w-1/2 lg:w-3/5 min-h-screen">
        <AuthHero />
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-20 w-full h-full">
          <div className="max-w-xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-(--primary-container) text-(--on-primary-container) text-xs tracking-wider mb-6 uppercase font-medium">ระบบจัดการ</span>
            <h1 className="font-(--font-jakarta) text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-tight mb-6">
              จัดการ <span className="text-white/90">ประสบการณ์การเดินทาง</span>
            </h1>
            <p className="text-white/80 text-lg lg:text-xl font-light leading-relaxed">สร้าง แชร์ และแจ้งเตือนลูกทริปอัตโนมัติ</p>
          </div>
        </div>
        <div className="absolute top-12 left-12 z-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-2xl tracking-tighter text-white">Admin</span>
          </div>
        </div>
      </section>

      {/* Right: Form */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-(--surface)">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-(--primary) flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-xl tracking-tighter text-(--primary)">Admin</span>
          </div>

          {!sent ? (
            <>
              <div className="mb-10">
                <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">ลืมรหัสผ่าน</h2>
                <p className="text-(--on-surface-variant)">กรอกอีเมลที่ใช้สมัคร ระบบจะส่งลิงก์รีเซ็ตให้</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <FormInput label="อีเมล" placeholder="admin@example.com" type="email" icon="mail" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} error={error} required />

                <button
                  type="submit"
                  disabled={loading}
                  className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                </button>
              </form>

              <div className="mt-12 text-center">
                <p className="text-(--on-surface-variant)">
                  จำรหัสผ่านได้แล้ว?{" "}
                  <Link className="text-(--primary) font-semibold hover:underline ml-1" href={ROUTES.login}>เข้าสู่ระบบ</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-blue-600 text-3xl">mail</span>
                </div>
                <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-3">ตรวจสอบอีเมล</h2>
                <p className="text-(--on-surface-variant)">
                  หากอีเมล <strong className="text-(--on-surface)">{email}</strong> มีอยู่ในระบบ จะได้รับลิงก์รีเซ็ตรหัสผ่าน
                </p>
              </div>

              <div className="bg-(--surface-container-low) rounded-xl p-5 space-y-3 mb-8">
                <p className="text-sm font-semibold text-(--on-surface-variant)">ไม่ได้รับอีเมล?</p>
                <ul className="text-xs text-(--outline) space-y-1.5">
                  <li>ตรวจสอบโฟลเดอร์ Spam / Junk Mail</li>
                  <li>ลิงก์มีอายุ 1 ชั่วโมง</li>
                </ul>
                <button onClick={() => setSent(false)} className="text-sm text-(--primary) font-semibold hover:underline">
                  ส่งอีกครั้ง
                </button>
              </div>

              <div className="text-center">
                <Link className="text-(--primary) font-semibold hover:underline" href={ROUTES.login}>กลับไปหน้าเข้าสู่ระบบ</Link>
              </div>
            </>
          )}

          <div className="mt-20 flex justify-center items-center gap-6 opacity-40">
            <span className="text-[10px] uppercase tracking-widest text-(--outline) cursor-pointer hover:text-(--primary) transition-colors">นโยบายความเป็นส่วนตัว</span>
            <span className="text-[10px] uppercase tracking-widest text-(--outline) cursor-pointer hover:text-(--primary) transition-colors">เงื่อนไขการใช้งาน</span>
            <span className="text-[10px] uppercase tracking-widest text-(--outline) cursor-pointer hover:text-(--primary) transition-colors">ช่วยเหลือ</span>
          </div>
        </div>
      </section>
    </main>
  );
}
