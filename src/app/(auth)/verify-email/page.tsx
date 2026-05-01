"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/shared/toast";
import { AuthHero } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";

function VerifyEmailContent(): React.ReactNode {
  usePageTitle("ยืนยันอีเมล");
  const params = useSearchParams();
  const { toast } = useToast();
  const token = params.get("token");
  const email = params.get("email");

  const [status, setStatus] = useState<"pending" | "verifying" | "success" | "error">(token ? "verifying" : "pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(token ? 0 : 60);

  useEffect(() => {
    if (!token) return;
    api.get<string>(`/admin/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
      });
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
      const res = await fetch(`${API_URL}/admin/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        toast("ส่งอีเมลยืนยันใหม่แล้ว");
        setCooldown(60);
      } else {
        toast(json.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      toast("เกิดข้อผิดพลาด", "error");
    } finally {
      setResending(false);
    }
  }

  // ═══ Pending ═══
  if (status === "pending") {
    return (
      <>
        <div className="mb-10">
          <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">ตรวจสอบอีเมล</h2>
          <p className="text-(--on-surface-variant)">เราส่งลิงก์ยืนยันไปที่ <strong className="text-(--on-surface)">{email || "อีเมลของคุณ"}</strong></p>
        </div>

        <div className="space-y-5 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-(--primary-container) flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-(--on-primary-container) text-lg">inbox</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-(--on-surface)">เปิดอีเมลจาก Trip Platform</p>
              <p className="text-xs text-(--on-surface-variant) mt-0.5">ตรวจสอบ Inbox หรือโฟลเดอร์ Spam</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-(--primary-container) flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-(--on-primary-container) text-lg">touch_app</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-(--on-surface)">กดปุ่มยืนยันอีเมล</p>
              <p className="text-xs text-(--on-surface-variant) mt-0.5">ลิงก์มีอายุ 24 ชั่วโมง</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-(--primary-container) flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-(--on-primary-container) text-lg">login</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-(--on-surface)">เข้าสู่ระบบ</p>
              <p className="text-xs text-(--on-surface-variant) mt-0.5">บัญชีพร้อมใช้งานทันที</p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center mb-8">
          <div className="grow border-t border-(--outline-variant) opacity-30" />
          <span className="shrink mx-4 text-(--outline) text-xs uppercase tracking-widest">ไม่ได้รับอีเมล?</span>
          <div className="grow border-t border-(--outline-variant) opacity-30" />
        </div>

        {email && (
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="block w-full bg-(--surface-container-low) border border-(--outline-variant)/30 text-(--on-surface) py-4 px-6 rounded-xl font-bold text-center hover:bg-(--surface-container-high) transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? "กำลังส่ง..." : cooldown > 0 ? `ส่งอีกครั้งได้ใน ${cooldown} วินาที` : "ส่งอีเมลยืนยันอีกครั้ง"}
          </button>
        )}

        <div className="mt-12 text-center">
          <Link href={ROUTES.login} className="text-(--on-surface-variant) hover:text-(--primary) text-sm transition-colors">
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </>
    );
  }

  // ═══ Verifying ═══
  if (status === "verifying") {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-(--primary)/20 border-t-(--primary) rounded-full animate-spin mx-auto mb-6" />
        <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">กำลังยืนยัน</h2>
        <p className="text-(--on-surface-variant)">กรุณารอสักครู่</p>
      </div>
    );
  }

  // ═══ Success ═══
  if (status === "success") {
    return (
      <>
        <div className="mb-10">
          <div className="w-12 h-12 rounded-xl bg-(--primary-container) flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-(--on-primary-container) text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">ยืนยันสำเร็จ</h2>
          <p className="text-(--on-surface-variant)">บัญชีพร้อมใช้งานแล้ว เข้าสู่ระบบเพื่อเริ่มสร้างทริปแรก</p>
        </div>

        <Link
          href={ROUTES.login}
          className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg text-center hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98]"
        >
          เข้าสู่ระบบ
        </Link>
      </>
    );
  }

  // ═══ Error ═══
  return (
    <>
      <div className="mb-10">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-red-500 text-2xl">error</span>
        </div>
        <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-2">ไม่สามารถยืนยันได้</h2>
        <p className="text-(--on-surface-variant)">{errorMsg || "ลิงก์อาจหมดอายุหรือถูกใช้งานแล้ว"}</p>
      </div>

      <div className="space-y-3">
        <Link href={ROUTES.login} className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-center hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98]">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
        <div className="text-center">
          <Link href={ROUTES.register} className="text-sm text-(--on-surface-variant) hover:text-(--primary) transition-colors">
            สมัครสมาชิกใหม่
          </Link>
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage(): React.ReactNode {
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

      {/* Right */}
      <section className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-(--surface)">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-(--primary) flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>landscape</span>
            </div>
            <span className="font-(--font-jakarta) font-black text-xl tracking-tighter text-(--primary)">Admin</span>
          </div>

          <Suspense fallback={<div className="text-center text-(--outline)">กำลังโหลด...</div>}>
            <VerifyEmailContent />
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
