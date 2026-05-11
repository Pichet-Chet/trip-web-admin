"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { FormInput, AuthHero } from "@/components/shared";
import { useToast } from "@/components/shared";
import { AgreementModal } from "@/components/shared";
import { register } from "@/lib/auth";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { ApiError } from "@/lib/api";
import { RemoteLegalContent } from "@/components/legal/remote-legal-content";

type Errors = Record<string, string>;

function validate(form: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsRead: boolean;
  privacyRead: boolean;
}): Errors {
  const errors: Errors = {};
  if (!form.firstName.trim()) errors.firstName = "กรุณากรอกชื่อ";
  if (!form.lastName.trim()) errors.lastName = "กรุณากรอกนามสกุล";
  if (!form.email.trim()) errors.email = "กรุณากรอกอีเมล";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
  if (!form.password) errors.password = "กรุณากรอกรหัสผ่าน";
  else {
    const pw = form.password;
    const pwErrors: string[] = [];
    if (pw.length < 8) pwErrors.push("อย่างน้อย 8 ตัวอักษร");
    if (!/[A-Z]/.test(pw)) pwErrors.push("ตัวพิมพ์ใหญ่");
    if (!/[a-z]/.test(pw)) pwErrors.push("ตัวพิมพ์เล็ก");
    if (!/[0-9]/.test(pw)) pwErrors.push("ตัวเลข");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) pwErrors.push("อักขระพิเศษ (!@#$%^&*)");
    if (pwErrors.length > 0) errors.password = `ต้องมี: ${pwErrors.join(", ")}`;
  }
  if (!form.confirmPassword) errors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
  else if (form.password !== form.confirmPassword) errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
  if (!form.termsRead || !form.privacyRead) errors.terms = "กรุณาอ่านและยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว";
  return errors;
}

export default function RegisterPage(): React.ReactNode {
  usePageTitle("สมัครสมาชิก");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [termsReadAt, setTermsReadAt] = useState<string | null>(null);
  const [privacyReadAt, setPrivacyReadAt] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsRead: false,
    privacyRead: false,
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const bothRead = form.termsRead && form.privacyRead;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        termsReadAt: termsReadAt!,
        privacyReadAt: privacyReadAt!,
      });
      router.push(`${ROUTES.verifyEmail}?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  const pw = form.password;
  const passwordStrength = pw.length === 0 ? 0 :
    [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /[0-9]/.test(pw), /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)]
      .filter(Boolean).length;
  const strengthLabel = ["", "อ่อน", "อ่อน", "ปานกลาง", "แข็งแรง", "แข็งแรงมาก"];
  const strengthColor = ["", "bg-red-500", "bg-red-500", "bg-amber-500", "bg-(--primary)", "bg-green-600"];

  return (
    <>
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Hero */}
      <section className="relative hidden md:flex md:w-1/2 min-h-screen overflow-hidden">
        <AuthHero />
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-20 w-full h-full">
          <div className="max-w-md">
            <span className="inline-block px-4 py-1.5 rounded-full bg-(--secondary-container)/30 backdrop-blur-md text-white text-xs tracking-wider mb-6 border border-white/10 uppercase font-medium">
              ระบบจัดการ
            </span>
            <h1 className="font-(--font-jakarta) text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-none mb-8">
              จัดการ <br /><span className="text-(--secondary-container)">ประสบการณ์การเดินทาง</span>
            </h1>
            <p className="text-white/80 text-lg font-light leading-relaxed">
              สร้าง แชร์ และแจ้งเตือนลูกทริปอัตโนมัติ ผ่าน LINE และ Web Push
            </p>
          </div>
        </div>
        <div className="absolute top-12 left-12 z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl">
              <span className="material-symbols-outlined text-(--primary) text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-3xl tracking-tighter text-white">TripApp</span>
          </div>
        </div>
      </section>

      {/* Right: Form */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-(--surface) overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="md:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-(--primary) flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-2xl tracking-tighter text-(--primary)">TripApp</span>
          </div>

          <div className="mb-10">
            <h2 className="font-(--font-jakarta) text-4xl font-bold text-(--on-surface) mb-3 tracking-tight">สร้างบัญชีใหม่</h2>
            <p className="text-(--on-surface-variant) text-lg">ติดตามทริป สร้างทริป หรือทั้งสองอย่างด้วยบัญชีเดียว</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput label="ชื่อ" placeholder="สมชาย" icon="person" value={form.firstName} onChange={set("firstName")} error={errors.firstName} required />
              <FormInput label="นามสกุล" placeholder="ใจดี" icon="person" value={form.lastName} onChange={set("lastName")} error={errors.lastName} required />
            </div>

            <FormInput label="อีเมล" placeholder="you@example.com" type="email" icon="mail" value={form.email} onChange={set("email")} error={errors.email} required />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FormInput label="รหัสผ่าน" placeholder="••••••••" type="password" icon="lock" value={form.password} onChange={set("password")} error={errors.password} required />
                {form.password.length > 0 && !errors.password && (
                  <div className="mt-2 flex gap-1 px-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= passwordStrength ? strengthColor[passwordStrength] : "bg-(--outline-variant)/30"}`} />
                    ))}
                    <span className="text-[10px] text-(--primary) ml-1 font-semibold uppercase tracking-wider">{strengthLabel[passwordStrength]}</span>
                  </div>
                )}
              </div>
              <FormInput label="ยืนยันรหัสผ่าน" placeholder="••••••••" type="password" icon="lock" value={form.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} required />
            </div>

            {/* Agreement Section */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">
                เงื่อนไขและข้อตกลง <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-(--surface-container-low) rounded-xl">
                  <div className="flex items-center gap-3">
                    {form.termsRead
                      ? <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      : <span className="material-symbols-outlined text-(--outline-variant)">circle</span>}
                    <span className="text-sm text-(--on-surface)">เงื่อนไขการใช้งาน</span>
                    {termsReadAt && <span className="text-[10px] text-green-600 hidden sm:inline">อ่านแล้ว</span>}
                  </div>
                  <button type="button" onClick={() => setShowTerms(true)} className="text-sm text-(--primary) font-semibold hover:underline flex items-center gap-1">
                    อ่าน <span className="material-symbols-outlined text-base">open_in_new</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-(--surface-container-low) rounded-xl">
                  <div className="flex items-center gap-3">
                    {form.privacyRead
                      ? <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      : <span className="material-symbols-outlined text-(--outline-variant)">circle</span>}
                    <span className="text-sm text-(--on-surface)">นโยบายความเป็นส่วนตัว</span>
                    {privacyReadAt && <span className="text-[10px] text-green-600 hidden sm:inline">อ่านแล้ว</span>}
                  </div>
                  <button type="button" onClick={() => setShowPrivacy(true)} className="text-sm text-(--primary) font-semibold hover:underline flex items-center gap-1">
                    อ่าน <span className="material-symbols-outlined text-base">open_in_new</span>
                  </button>
                </div>
              </div>

              {bothRead && (
                <p className="text-xs text-green-600 px-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  คุณได้อ่านเงื่อนไขและนโยบายครบแล้ว
                </p>
              )}
              {errors.terms && (
                <p className="text-xs text-red-500 px-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.terms}
                </p>
              )}
            </div>

            {apiError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">error</span>
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !bothRead}
              className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-full font-bold text-lg hover:brightness-110 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] duration-200 text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังสมัคร..." : "สร้างบัญชี"}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-(--on-surface-variant)">
              มีบัญชีอยู่แล้ว?{" "}
              <Link className="text-(--primary) font-bold hover:underline ml-1" href={ROUTES.login}>เข้าสู่ระบบ</Link>
            </p>
          </div>

          <div className="mt-16 flex justify-center items-center gap-6 opacity-30 text-[10px] uppercase tracking-widest text-(--outline) font-bold">
            <a className="hover:text-(--primary) transition-colors" href="/dashboard/privacy">นโยบายความเป็นส่วนตัว</a>
            <span className="w-1 h-1 bg-(--outline) rounded-full" />
            <a className="hover:text-(--primary) transition-colors" href="/dashboard/terms">เงื่อนไขการใช้งาน</a>
          </div>
        </div>
      </section>
    </main>

    <AgreementModal open={showTerms} onClose={() => setShowTerms(false)}
      onAccept={() => {
        const now = new Date().toISOString();
        setTermsReadAt(now);
        setForm((prev) => ({ ...prev, termsRead: true }));
        setShowTerms(false);
        if (errors.terms) setErrors((prev) => { const n = { ...prev }; delete n.terms; return n; });
      }}
      title="เงื่อนไขการใช้งาน">
      <RemoteLegalContent slug="terms" />
    </AgreementModal>

    <AgreementModal open={showPrivacy} onClose={() => setShowPrivacy(false)}
      onAccept={() => {
        const now = new Date().toISOString();
        setPrivacyReadAt(now);
        setForm((prev) => ({ ...prev, privacyRead: true }));
        setShowPrivacy(false);
        if (errors.terms) setErrors((prev) => { const n = { ...prev }; delete n.terms; return n; });
      }}
      title="นโยบายความเป็นส่วนตัว">
      <RemoteLegalContent slug="privacy" />
    </AgreementModal>
    </>
  );
}
