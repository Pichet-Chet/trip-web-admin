"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { FormInput, AuthHero } from "@/components/shared";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";

function ResetPasswordContent(): React.ReactNode {
  usePageTitle("ตั้งรหัสผ่านใหม่");
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const errs: Record<string, string> = {};
    if (!password) errs.password = "กรุณากรอกรหัสผ่านใหม่";
    else {
      const pwErrs: string[] = [];
      if (password.length < 8) pwErrs.push("อย่างน้อย 8 ตัวอักษร");
      if (!/[A-Z]/.test(password)) pwErrs.push("ตัวพิมพ์ใหญ่");
      if (!/[a-z]/.test(password)) pwErrs.push("ตัวพิมพ์เล็ก");
      if (!/[0-9]/.test(password)) pwErrs.push("ตัวเลข");
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) pwErrs.push("อักขระพิเศษ");
      if (pwErrs.length > 0) errs.password = `ต้องมี: ${pwErrs.join(", ")}`;
    }
    if (!confirmPassword) errs.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    else if (password !== confirmPassword) errs.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await api.post("/admin/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  // No token
  if (!token) {
    return (
      <>
        <div className="mb-10 text-center">
          <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">ลิงก์ไม่ถูกต้อง</h2>
          <p className="text-(--on-surface-variant)">ไม่พบ token สำหรับรีเซ็ตรหัสผ่าน</p>
        </div>
        <div className="text-center space-y-3">
          <Link href={ROUTES.forgotPassword} className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] text-center">
            ขอลิงก์รีเซ็ตใหม่
          </Link>
          <Link href={ROUTES.login} className="text-sm text-(--primary) font-semibold hover:underline block">กลับไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </>
    );
  }

  // Success
  if (success) {
    return (
      <>
        <div className="mb-10">
          <div className="w-12 h-12 rounded-xl bg-(--primary-container) flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-(--on-primary-container) text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">รีเซ็ตสำเร็จ</h2>
          <p className="text-(--on-surface-variant)">สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว</p>
        </div>
        <Link
          href={ROUTES.login}
          className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] text-center"
        >
          เข้าสู่ระบบ
        </Link>
      </>
    );
  }

  // Form
  return (
    <>
      <div className="mb-10">
        <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">ตั้งรหัสผ่านใหม่</h2>
        <p className="text-(--on-surface-variant)">กรอกรหัสผ่านใหม่ที่ต้องการใช้</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <FormInput label="รหัสผ่านใหม่" placeholder="••••••••" type="password" icon="lock" value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => { const n = {...p}; delete n.password; return n; }); }} error={errors.password} required />
          {password.length > 0 && !errors.password && (() => {
            const strength = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password), /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)].filter(Boolean).length;
            const labels = ["", "อ่อน", "อ่อน", "ปานกลาง", "แข็งแรง", "แข็งแรงมาก"];
            const colors = ["", "bg-red-500", "bg-red-500", "bg-amber-500", "bg-(--primary)", "bg-green-600"];
            return (
              <div className="mt-2 flex gap-1 px-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? colors[strength] : "bg-(--outline-variant)/30"}`} />
                ))}
                <span className="text-[10px] text-(--primary) ml-1 font-semibold uppercase tracking-wider">{labels[strength]}</span>
              </div>
            );
          })()}
        </div>
        <FormInput label="ยืนยันรหัสผ่านใหม่" placeholder="••••••••" type="password" icon="lock" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => { const n = {...p}; delete n.confirmPassword; return n; }); }} error={errors.confirmPassword} required />

        {apiError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">error</span>
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "กำลังรีเซ็ต..." : "รีเซ็ตรหัสผ่าน"}
        </button>
      </form>

      <div className="mt-12 text-center">
        <Link className="text-(--primary) font-semibold hover:underline" href={ROUTES.login}>กลับไปหน้าเข้าสู่ระบบ</Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage(): React.ReactNode {
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

          <Suspense fallback={<div className="text-center text-(--outline)">กำลังโหลด...</div>}>
            <ResetPasswordContent />
          </Suspense>

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
