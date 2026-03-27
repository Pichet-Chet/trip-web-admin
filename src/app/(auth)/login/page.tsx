import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { FormInput } from "@/components/shared";

export const metadata = { title: "Sign In" } satisfies Metadata;

export default function LoginPage(): React.ReactNode {
  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Hero Image */}
      <section className="relative hidden md:flex md:w-1/2 lg:w-3/5 min-h-screen">
        <div className="absolute inset-0 w-full h-full">
          <img
            alt="Serene Thai Landscape"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80"
          />
          <div className="absolute inset-0 bg-linear-to-tr from-(--primary)/70 via-(--primary)/20 to-transparent" />
        </div>
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
        {/* Logo */}
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
          {/* Mobile Logo */}
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

          {/* Social Login */}
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

          <form className="space-y-6">
            <FormInput label="อีเมล" placeholder="admin@example.com" type="email" icon="mail" />
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest">รหัสผ่าน</label>
                <a className="text-sm text-(--primary) hover:underline" href="#">ลืมรหัสผ่าน?</a>
              </div>
              <FormInput placeholder="••••••••" type="password" icon="lock" />
            </div>
            <div className="flex items-center">
              <input className="w-5 h-5 rounded border-(--outline-variant) text-(--primary) focus:ring-(--primary) bg-(--surface-container-low)" id="remember" type="checkbox" />
              <label className="ml-3 text-sm text-(--on-surface-variant)" htmlFor="remember">จดจำฉัน 30 วัน</label>
            </div>
            <Link
              href={ROUTES.dashboard}
              className="block w-full bg-(--primary) text-(--on-primary) py-4 px-6 rounded-xl font-bold text-lg hover:opacity-95 shadow-xl shadow-(--primary)/20 transition-all active:scale-[0.98] duration-200 text-center mt-2"
            >
              เข้าสู่ระบบ
            </Link>
          </form>

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
