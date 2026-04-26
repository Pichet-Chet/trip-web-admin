"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { FormInput, AuthHero } from "@/components/shared";
import { useToast } from "@/components/shared/toast";
import { AgreementModal } from "@/components/shared/agreement-modal";
import { register } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { TermsContent } from "@/components/shared/terms-content";
import { PrivacyContent } from "@/components/shared/privacy-content";

type Errors = Record<string, string>;

function validate(form: {
  accountType: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsRead: boolean;
  privacyRead: boolean;
}): Errors {
  const errors: Errors = {};
  if (!form.firstName.trim()) errors.firstName = "กรุณากรอกชื่อ";
  if (!form.lastName.trim()) errors.lastName = "กรุณากรอกนามสกุล";
  if (form.accountType === "Company" && !form.companyName.trim()) errors.companyName = "กรุณากรอกชื่อบริษัท";
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
    accountType: "Company" as "Company" | "FreelanceGuide" | "Personal",
    firstName: "",
    lastName: "",
    companyName: "",
    tatLicense: "",
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
        companyName: form.companyName,
        email: form.email,
        password: form.password,
        accountType: form.accountType,
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
      {/* Left: Hero Image */}
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
              ระบบจัดการทริปสำหรับบริษัททัวร์และไกด์อิสระ สร้าง แชร์ และแจ้งเตือนลูกทริปอัตโนมัติ
            </p>
          </div>
        </div>
        <div className="absolute top-12 left-12 z-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl">
              <span className="material-symbols-outlined text-(--primary) text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-3xl tracking-tighter text-white">Admin</span>
          </div>
        </div>
      </section>

      {/* Right: Registration Form */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-(--surface) overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="md:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl bg-(--primary) flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-2xl tracking-tighter text-(--primary)">Admin</span>
          </div>

          <div className="mb-10">
            <h2 className="font-(--font-jakarta) text-4xl font-bold text-(--on-surface) mb-3 tracking-tight">สร้างบัญชีใหม่</h2>
            <p className="text-(--on-surface-variant) text-lg">สมัครเพื่อเริ่มต้นใช้งานระบบจัดการทริป</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Account Type Selector */}
            <div>
              <p className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-3">
                ประเภทบัญชี <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "Company" as const, label: "บริษัททัวร์", icon: "business" },
                  { value: "FreelanceGuide" as const, label: "ไกด์อิสระ", icon: "person_pin" },
                  { value: "Personal" as const, label: "ส่วนตัว", icon: "person" },
                ]).map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, accountType: t.value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      form.accountType === t.value ? "border-(--primary) bg-(--primary)/5" : "border-(--outline-variant)/30 hover:border-(--outline-variant)"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-xl ${form.accountType === t.value ? "text-(--primary)" : "text-(--outline)"}`}>{t.icon}</span>
                    <span className={`text-xs font-bold ${form.accountType === t.value ? "text-(--primary)" : "text-(--on-surface-variant)"}`}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput label="ชื่อ" placeholder="สมชาย" icon="person" value={form.firstName} onChange={set("firstName")} error={errors.firstName} required />
              <FormInput label="นามสกุล" placeholder="ใจดี" icon="person" value={form.lastName} onChange={set("lastName")} error={errors.lastName} required />
            </div>

            {form.accountType === "Company" && (
              <FormInput label="ชื่อบริษัท" placeholder="บริษัท ทัวร์สนุก จำกัด" icon="business" value={form.companyName} onChange={set("companyName")} error={errors.companyName} required />
            )}
            {form.accountType !== "Personal" && (
              <FormInput label="เลขใบอนุญาต ททท." placeholder="XX/XXXXX (ไม่บังคับ)" icon="verified" value={form.tatLicense} onChange={set("tatLicense")} />
            )}
            <FormInput label="อีเมล" placeholder="admin@example.com" type="email" icon="mail" value={form.email} onChange={set("email")} error={errors.email} required />

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
                {/* Terms */}
                <div className="flex items-center justify-between p-3 bg-(--surface-container-low) rounded-xl">
                  <div className="flex items-center gap-3">
                    {form.termsRead ? (
                      <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-300">circle</span>
                    )}
                    <span className="text-sm text-(--on-surface)">เงื่อนไขการใช้งาน</span>
                    {termsReadAt && <span className="text-[10px] text-green-600 hidden sm:inline">อ่านแล้ว</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-sm text-(--primary) font-semibold hover:underline flex items-center gap-1"
                  >
                    อ่าน
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                  </button>
                </div>

                {/* Privacy */}
                <div className="flex items-center justify-between p-3 bg-(--surface-container-low) rounded-xl">
                  <div className="flex items-center gap-3">
                    {form.privacyRead ? (
                      <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-300">circle</span>
                    )}
                    <span className="text-sm text-(--on-surface)">นโยบายความเป็นส่วนตัว</span>
                    {privacyReadAt && <span className="text-[10px] text-green-600 hidden sm:inline">อ่านแล้ว</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-sm text-(--primary) font-semibold hover:underline flex items-center gap-1"
                  >
                    อ่าน
                    <span className="material-symbols-outlined text-base">open_in_new</span>
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
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </form>

          <div className="relative flex items-center my-10">
            <div className="grow border-t border-(--outline-variant)/30" />
            <span className="shrink mx-4 text-(--outline) text-xs uppercase tracking-widest font-semibold">หรือสมัครด้วย</span>
            <div className="grow border-t border-(--outline-variant)/30" />
          </div>

          <div>
            <button className="w-full flex items-center justify-center gap-3 bg-white border border-(--outline-variant)/30 hover:bg-(--surface-container-low) transition-all text-(--on-surface) py-4 px-6 rounded-full font-semibold shadow-sm active:scale-[0.98] duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              สมัครด้วย Google
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-(--on-surface-variant)">
              มีบัญชีอยู่แล้ว?{" "}
              <Link className="text-(--primary) font-bold hover:underline ml-1" href={ROUTES.login}>เข้าสู่ระบบ</Link>
            </p>
          </div>

          <div className="mt-16 flex justify-center items-center gap-6 opacity-30 text-[10px] uppercase tracking-widest text-(--outline) font-bold">
            <a className="hover:text-(--primary) transition-colors" href="/dashboard/privacy">นโยบายความเป็นส่วนตัว</a>
            <span className="w-1 h-1 bg-(--outline) rounded-full" />
            <a className="hover:text-(--primary) transition-colors" href="/dashboard/terms">เงื่อนไขการใช้งาน</a>
            <span className="w-1 h-1 bg-(--outline) rounded-full" />
            <a className="hover:text-(--primary) transition-colors" href="#">ช่วยเหลือ</a>
          </div>
        </div>
      </section>
    </main>

    {/* Agreement Modals */}
    <AgreementModal
      open={showTerms}
      onClose={() => setShowTerms(false)}
      onAccept={() => {
        const now = new Date().toISOString();
        setTermsReadAt(now);
        setForm((prev) => ({ ...prev, termsRead: true }));
        setShowTerms(false);
        if (errors.terms) setErrors((prev) => { const n = { ...prev }; delete n.terms; return n; });
      }}
      title="เงื่อนไขการใช้งาน"
    >
      <TermsContent />
    </AgreementModal>

    <AgreementModal
      open={showPrivacy}
      onClose={() => setShowPrivacy(false)}
      onAccept={() => {
        const now = new Date().toISOString();
        setPrivacyReadAt(now);
        setForm((prev) => ({ ...prev, privacyRead: true }));
        setShowPrivacy(false);
        if (errors.terms) setErrors((prev) => { const n = { ...prev }; delete n.terms; return n; });
      }}
      title="นโยบายความเป็นส่วนตัว"
    >
      <PrivacyContent />
    </AgreementModal>
    </>
  );
}
