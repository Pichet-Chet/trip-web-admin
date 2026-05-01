"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { FormInput, AuthHero } from "@/components/shared";
import { useToast } from "@/components/shared/toast";
import { login, verifyTwoFactor } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type Errors = Record<string, string>;

export default function LoginPage(): React.ReactNode {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [apiError, setApiError] = useState("");
  const [email, setEmail] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("last_email") || "" : ""
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("remember_me") === "true" : false
  );
  const [blocked, setBlocked] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState(0);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Block countdown timer
  useEffect(() => {
    if (blockCountdown <= 0) { setBlocked(false); return; }
    const t = setTimeout(() => setBlockCountdown(blockCountdown - 1), 1000);
    return () => clearTimeout(t);
  }, [blockCountdown]);

  async function handleTwoFa(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    if (!challengeToken) return;
    if (!twoFaCode.trim()) {
      setApiError("กรุณาป้อนรหัส");
      return;
    }
    setLoading(true);
    try {
      await verifyTwoFactor({
        challengeToken,
        code: twoFaCode.trim(),
        isBackupCode: useBackupCode,
      });
      router.push(ROUTES.dashboard);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "รหัสไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  }

  function cancelTwoFa() {
    setChallengeToken(null);
    setTwoFaCode("");
    setUseBackupCode(false);
    setApiError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const errs: Errors = {};
    if (!email.trim()) errs.email = "กรุณากรอกอีเมล";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!password) errs.password = "กรุณากรอกรหัสผ่าน";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await login({ email, password, rememberMe });
      localStorage.setItem("last_email", email);
      localStorage.setItem("remember_me", String(rememberMe));
      if (res.requires2Fa && res.challengeToken) {
        setChallengeToken(res.challengeToken);
        return;
      }
      router.push(ROUTES.dashboard);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";

      if (msg === "captcha_required") {
        setCaptchaRequired(true);
        setApiError("กรุณายืนยันว่าคุณไม่ใช่บอท");
      } else if (msg.startsWith("account_suspended:")) {
        const reason = msg.slice("account_suspended:".length);
        router.push(`/suspended?reason=${encodeURIComponent(reason)}`);
      } else if (msg.includes("พยายามเข้าสู่ระบบมากเกินไป")) {
        setBlocked(true);
        // Parse seconds from error message
        const match = msg.match(/(\d+)\s*วินาที/);
        setBlockCountdown(match ? parseInt(match[1]) : 1800);
        setApiError(msg);
      } else {
        setApiError(msg);
      }
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
            <span className="inline-block px-4 py-1.5 rounded-full bg-(--primary-container) text-(--on-primary-container) text-xs tracking-wider mb-6 uppercase font-medium">
              ระบบจัดการ
            </span>
            <h1 className="font-(--font-jakarta) text-5xl lg:text-7xl font-extrabold text-white tracking-tighter leading-tight mb-6">
              จัดการ <span className="text-white/90">ประสบการณ์การเดินทาง</span>
            </h1>
            <p className="text-white/80 text-lg lg:text-xl font-light leading-relaxed">
              สร้าง แชร์ และแจ้งเตือนลูกทริปอัตโนมัติ
            </p>
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

      {/* Right: Login Form */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-(--surface)">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-(--primary) flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-xl tracking-tighter text-(--primary)">Admin</span>
          </div>

          <div className="mb-10">
            <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">ยินดีต้อนรับ</h2>
            <p className="text-(--on-surface-variant)">เข้าสู่ระบบจัดการทริป</p>
          </div>

          <div className="mb-8">
            <button className="w-full flex items-center justify-center gap-3 bg-white border border-(--outline-variant)/30 hover:bg-(--surface-container-low) transition-all text-(--on-surface) py-3.5 px-6 rounded-xl font-semibold shadow-sm active:scale-[0.98] duration-200">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              เข้าสู่ระบบด้วย Google
            </button>
          </div>

          <div className="relative flex items-center mb-8">
            <div className="grow border-t border-(--outline-variant) opacity-30" />
            <span className="shrink mx-4 text-(--outline) text-xs uppercase tracking-widest">หรือใช้อีเมล</span>
            <div className="grow border-t border-(--outline-variant) opacity-30" />
          </div>

          {challengeToken ? (
            <form className="space-y-6" onSubmit={handleTwoFa} noValidate>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="material-symbols-outlined text-blue-600 mt-0.5 shrink-0">verified_user</span>
                <div>
                  <p className="text-sm font-bold text-blue-900">ยืนยันตัวตน 2 ขั้นตอน</p>
                  <p className="text-xs text-blue-800 mt-0.5">
                    {useBackupCode
                      ? "ป้อนรหัสสำรอง 1 ใน 8 รหัสที่บันทึกไว้"
                      : "ป้อนรหัส 6 หลักจากแอป Authenticator"}
                  </p>
                </div>
              </div>
              <FormInput
                label={useBackupCode ? "รหัสสำรอง (XXXX-XXXX)" : "รหัส 6 หลัก"}
                placeholder={useBackupCode ? "ABCD-1234" : "123456"}
                type="text"
                icon="key"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(useBackupCode
                  ? e.target.value.toUpperCase()
                  : e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
              {apiError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">error</span>
                  <p className="text-sm text-red-700">{apiError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !twoFaCode}
                className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 transition-all active:scale-[0.98] duration-200 text-center disabled:opacity-50"
              >
                {loading ? "กำลังตรวจสอบ..." : "ยืนยัน"}
              </button>
              <div className="flex items-center justify-between text-xs text-(--on-surface-variant)">
                <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTwoFaCode(""); setApiError(""); }} className="text-(--primary) hover:underline font-semibold">
                  {useBackupCode ? "← ใช้รหัสจากแอป Authenticator" : "ใช้รหัสสำรองแทน"}
                </button>
                <button type="button" onClick={cancelTwoFa} className="hover:underline">
                  ยกเลิก
                </button>
              </div>
            </form>
          ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormInput label="อีเมล" placeholder="admin@example.com" type="email" icon="mail" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => { const n = {...p}; delete n.email; return n; }); }} error={errors.email} required />
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest">รหัสผ่าน <span className="text-red-500">*</span></label>
                <Link href={ROUTES.forgotPassword} className="text-sm text-(--primary) hover:underline">ลืมรหัสผ่าน?</Link>
              </div>
              <FormInput placeholder="••••••••" type="password" icon="lock" value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => { const n = {...p}; delete n.password; return n; }); }} error={errors.password} />
            </div>
            <div className="flex items-center">
              <input className="w-5 h-5 rounded border-(--outline-variant) text-(--primary) focus:ring-(--primary) bg-(--surface-container-low)" id="remember" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <label className="ml-3 text-sm text-(--on-surface-variant)" htmlFor="remember">จดจำฉัน 30 วัน</label>
            </div>
            {apiError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">error</span>
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}
            {/* Blocked state */}
            {blocked && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="material-symbols-outlined text-amber-500 mt-0.5 shrink-0">timer</span>
                <div>
                  <p className="text-sm font-bold text-amber-800">พยายามเข้าสู่ระบบมากเกินไป</p>
                  <p className="text-xs text-amber-700 mt-1">ลองใหม่ได้ใน {Math.floor(blockCountdown / 60)}:{String(blockCountdown % 60).padStart(2, "0")} นาที</p>
                </div>
              </div>
            )}

            {/* CAPTCHA notice */}
            {captchaRequired && !blocked && (
              <div className="flex items-start gap-3 p-4 bg-(--surface-container-low) border border-(--outline-variant)/30 rounded-xl">
                <span className="material-symbols-outlined text-(--primary) mt-0.5 shrink-0">verified_user</span>
                <p className="text-sm text-(--on-surface-variant)">ระบบตรวจพบการเข้าสู่ระบบหลายครั้ง กรุณายืนยันตัวตน</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || blocked}
              className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] duration-200 text-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : blocked ? "กรุณารอ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
          )}

          <div className="mt-12 text-center">
            <p className="text-(--on-surface-variant)">
              ยังไม่มีบัญชี?{" "}
              <Link className="text-(--primary) font-semibold hover:underline ml-1" href={ROUTES.register}>
                สมัครสมาชิก
              </Link>
            </p>
          </div>

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
