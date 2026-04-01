"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/shared/toast";

function VerifyEmailContent(): React.ReactNode {
  const params = useSearchParams();
  const { toast } = useToast();
  const token = params.get("token");
  const email = params.get("email");

  const [status, setStatus] = useState<"pending" | "verifying" | "success" | "error">(token ? "verifying" : "pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<string>(`/admin/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
      });
  }, [token]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      await api.post("/admin/auth/resend-verification", { email });
      toast("ส่งอีเมลยืนยันใหม่แล้ว", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setResending(false);
    }
  }

  // Pending — รอ verify (มาจาก register)
  if (status === "pending") {
    return (
      <>
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-blue-600 text-3xl">mail</span>
          </div>
          <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-3">ตรวจสอบอีเมล</h2>
          <p className="text-(--on-surface-variant)">
            เราได้ส่งลิงก์ยืนยันไปที่ <strong className="text-(--on-surface)">{email || "อีเมลของคุณ"}</strong>
          </p>
        </div>
        <div className="bg-(--surface-container-low) rounded-xl p-5 space-y-3 mb-8">
          <p className="text-sm font-semibold text-(--on-surface-variant)">ไม่ได้รับอีเมล?</p>
          <ul className="text-xs text-(--outline) space-y-1.5">
            <li>ตรวจสอบโฟลเดอร์ Spam / Junk Mail</li>
            <li>รอสักครู่ อาจใช้เวลาไม่กี่นาที</li>
          </ul>
          {email && (
            <button onClick={handleResend} disabled={resending} className="text-sm text-(--primary) font-semibold hover:underline disabled:opacity-50">
              {resending ? "กำลังส่ง..." : "ส่งอีเมลยืนยันอีกครั้ง"}
            </button>
          )}
        </div>
        <div className="text-center">
          <Link href={ROUTES.login} className="text-sm text-(--primary) font-semibold hover:underline">กลับไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </>
    );
  }

  // Verifying
  if (status === "verifying") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="material-symbols-outlined text-blue-600 text-3xl">hourglass_top</span>
        </div>
        <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-3">กำลังยืนยัน...</h2>
        <p className="text-(--on-surface-variant)">กรุณารอสักครู่</p>
      </div>
    );
  }

  // Success
  if (status === "success") {
    return (
      <>
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-3">ยืนยันสำเร็จ!</h2>
          <p className="text-(--on-surface-variant)">บัญชีพร้อมใช้งานแล้ว</p>
        </div>
        <Link href={ROUTES.login} className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] text-center">
          เข้าสู่ระบบ
        </Link>
      </>
    );
  }

  // Error
  return (
    <>
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-red-600 text-3xl">error</span>
        </div>
        <h2 className="font-(--font-jakarta) text-3xl font-bold text-(--on-surface) mb-3">ไม่สามารถยืนยันได้</h2>
        <p className="text-(--on-surface-variant)">{errorMsg}</p>
      </div>
      <div className="text-center space-y-3">
        <Link href={ROUTES.login} className="text-sm text-(--primary) font-semibold hover:underline block">กลับไปหน้าเข้าสู่ระบบ</Link>
        <Link href={ROUTES.register} className="text-sm text-(--outline) hover:underline block">สมัครสมาชิกใหม่</Link>
      </div>
    </>
  );
}

export default function VerifyEmailPage(): React.ReactNode {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Hero Image */}
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
