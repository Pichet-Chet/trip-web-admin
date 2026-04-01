"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { FormInput } from "@/components/shared";
import { api, ApiError } from "@/lib/api";

function AcceptInviteContent(): React.ReactNode {
  const params = useSearchParams();
  const token = params.get("token");
  const [form, setForm] = useState({ firstName: "", lastName: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "กรุณากรอกชื่อ";
    if (!form.lastName.trim()) errs.lastName = "กรุณากรอกนามสกุล";
    if (!form.password) errs.password = "กรุณากรอกรหัสผ่าน";
    else {
      const pw = form.password;
      const pwErrs: string[] = [];
      if (pw.length < 8) pwErrs.push("อย่างน้อย 8 ตัวอักษร");
      if (!/[A-Z]/.test(pw)) pwErrs.push("ตัวพิมพ์ใหญ่");
      if (!/[a-z]/.test(pw)) pwErrs.push("ตัวพิมพ์เล็ก");
      if (!/[0-9]/.test(pw)) pwErrs.push("ตัวเลข");
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) pwErrs.push("อักขระพิเศษ");
      if (pwErrs.length > 0) errs.password = `ต้องมี: ${pwErrs.join(", ")}`;
    }
    if (!form.confirmPassword) errs.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await api.post("/admin/company/team/accept", {
        token,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <>
        <div className="mb-10">
          <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">ลิงก์ไม่ถูกต้อง</h2>
          <p className="text-(--on-surface-variant)">ไม่พบ token สำหรับเข้าร่วมทีม</p>
        </div>
        <Link href={ROUTES.login} className="text-sm text-(--primary) font-semibold hover:underline">กลับไปหน้าเข้าสู่ระบบ</Link>
      </>
    );
  }

  if (success) {
    return (
      <>
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-3">เข้าร่วมทีมสำเร็จ!</h2>
          <p className="text-(--on-surface-variant)">สามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้</p>
        </div>
        <Link href={ROUTES.login} className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] text-center">
          เข้าสู่ระบบ
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="mb-10">
        <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">เข้าร่วมทีม</h2>
        <p className="text-(--on-surface-variant)">กรอกข้อมูลเพื่อสร้างบัญชีและเข้าร่วมทีม</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="ชื่อ" placeholder="สมชาย" icon="person" value={form.firstName} onChange={set("firstName")} error={errors.firstName} required />
          <FormInput label="นามสกุล" placeholder="ใจดี" icon="person" value={form.lastName} onChange={set("lastName")} error={errors.lastName} required />
        </div>
        <FormInput label="รหัสผ่าน" placeholder="••••••••" type="password" icon="lock" value={form.password} onChange={set("password")} error={errors.password} required />
        <FormInput label="ยืนยันรหัสผ่าน" placeholder="••••••••" type="password" icon="lock" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} required />

        {apiError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">error</span>
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        <button type="submit" disabled={loading} className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "กำลังสร้างบัญชี..." : "เข้าร่วมทีม"}
        </button>
      </form>

      <div className="mt-12 text-center">
        <Link className="text-(--primary) font-semibold hover:underline" href={ROUTES.login}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Link>
      </div>
    </>
  );
}

export default function AcceptInvitePage(): React.ReactNode {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <section className="relative hidden md:flex md:w-1/2 lg:w-3/5 min-h-screen">
        <div className="absolute inset-0 w-full h-full">
          <img alt="Serene Thai Landscape" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80" />
          <div className="absolute inset-0 bg-linear-to-tr from-(--primary)/70 via-(--primary)/20 to-transparent" />
        </div>
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

      <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-(--surface)">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-(--primary) flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-xl tracking-tighter text-(--primary)">Admin</span>
          </div>

          <Suspense fallback={<div className="text-center text-(--outline)">กำลังโหลด...</div>}>
            <AcceptInviteContent />
          </Suspense>

          <div className="mt-20 flex justify-center items-center gap-6 opacity-40">
            <span className="text-[10px] uppercase tracking-widest text-(--outline) cursor-pointer hover:text-(--primary) transition-colors">นโยบายความเป็นส่วนตัว</span>
            <span className="text-[10px] uppercase tracking-widest text-(--outline) cursor-pointer hover:text-(--primary) transition-colors">เงื่อนไขการใช้งาน</span>
          </div>
        </div>
      </section>
    </main>
  );
}
