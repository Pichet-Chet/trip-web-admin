import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { FormInput } from "@/components/shared";

export const metadata = { title: "Register" } satisfies Metadata;

export default function RegisterPage(): React.ReactNode {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Hero Image */}
      <section className="relative hidden md:flex md:w-1/2 min-h-screen overflow-hidden">
        <img
          alt="Serene Thai Landscape"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80"
        />
        <div className="absolute inset-0 bg-linear-to-t from-(--primary)/80 via-(--primary)/20 to-transparent" />
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
          {/* Mobile Logo */}
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

          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput label="ชื่อ-นามสกุล" placeholder="สมชาย ใจดี" icon="person" />
              <FormInput label="ชื่อบริษัท" placeholder="บริษัท ทัวร์สนุก จำกัด" icon="business" />
            </div>

            <FormInput label="เลขใบอนุญาต ททท." placeholder="XX/XXXXX (ไม่บังคับ)" icon="verified" />
            <FormInput label="อีเมล" placeholder="admin@example.com" type="email" icon="mail" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FormInput label="รหัสผ่าน" placeholder="••••••••" type="password" icon="lock" />
                <div className="mt-2 flex gap-1 px-1">
                  <div className="h-1 flex-1 bg-(--primary) rounded-full" />
                  <div className="h-1 flex-1 bg-(--primary) rounded-full" />
                  <div className="h-1 flex-1 bg-(--primary) rounded-full" />
                  <div className="h-1 flex-1 bg-(--outline-variant)/30 rounded-full" />
                  <span className="text-[10px] text-(--primary) ml-1 font-semibold uppercase tracking-wider">แข็งแรง</span>
                </div>
              </div>
              <FormInput label="ยืนยันรหัสผ่าน" placeholder="••••••••" type="password" icon="lock" />
            </div>

            <div className="flex items-start py-2">
              <input className="mt-1 w-5 h-5 rounded border-(--outline-variant) text-(--primary) focus:ring-(--primary) bg-(--surface-container-low)" id="terms" type="checkbox" />
              <label className="ml-3 text-sm text-(--on-surface-variant) leading-tight" htmlFor="terms">
                ฉันยอมรับ <a className="text-(--primary) font-medium hover:underline" href="#">เงื่อนไขการใช้งาน</a> และ <a className="text-(--primary) font-medium hover:underline" href="#">นโยบายความเป็นส่วนตัว</a>
              </label>
            </div>

            <Link
              href={ROUTES.dashboard}
              className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-full font-bold text-lg hover:brightness-110 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] duration-200 text-center"
            >
              สมัครสมาชิก
            </Link>
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
            <a className="hover:text-(--primary) transition-colors" href="#">นโยบายความเป็นส่วนตัว</a>
            <span className="w-1 h-1 bg-(--outline) rounded-full" />
            <a className="hover:text-(--primary) transition-colors" href="#">เงื่อนไขการใช้งาน</a>
            <span className="w-1 h-1 bg-(--outline) rounded-full" />
            <a className="hover:text-(--primary) transition-colors" href="#">ช่วยเหลือ</a>
          </div>
        </div>
      </section>
    </main>
  );
}
