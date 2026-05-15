"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { refreshAuth } from "@/lib/auth";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    refreshAuth().then((ok) => setLoggedIn(ok));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--surface)", color: "var(--on-surface)" }}>
      {/* ─── Navbar ─── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl" style={{ color: "var(--primary)" }}>
              travel_explore
            </span>
            <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
              TripApp
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>
            <Link href="/how-it-works" className="hover:text-[var(--primary)] transition-colors">
              วิธีใช้งาน
            </Link>
            <Link href="/pricing" className="hover:text-[var(--primary)] transition-colors">
              ราคา
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {loggedIn ? (
              <a
                href="/dashboard"
                className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
              >
                Dashboard
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-[var(--surface-container)]"
                  style={{ color: "var(--primary)" }}
                >
                  เข้าสู่ระบบ
                </a>
                <a
                  href="/register"
                  className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                >
                  เริ่มใช้งาน
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden py-24 sm:py-32 px-4 text-center">
          {/* Background gradient blob */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -10%, var(--primary-container) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-3xl mx-auto">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{
                backgroundColor: "var(--primary-container)",
                color: "var(--on-primary-container)",
              }}
            >
              <span className="material-symbols-outlined text-base">new_releases</span>
              เปิดตัวแล้ว — ทดลองใช้ฟรีวันนี้
            </span>

            <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6" style={{ color: "var(--on-surface)" }}>
              จัดทริปง่าย
              <br />
              <span style={{ color: "var(--primary)" }}>แชร์ง่าย</span>
            </h1>

            <p className="text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
              สร้างทริปออนไลน์ แชร์ให้ลูกทริป
              <br />
              ติดตามแบบ real-time ไม่ต้องพิมพ์เอกสาร
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {loggedIn ? (
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-lg hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  ไปที่ Dashboard
                </a>
              ) : (
                <>
                  <a
                    href="/register"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold shadow-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                  >
                    <span className="material-symbols-outlined">rocket_launch</span>
                    เริ่มใช้งานฟรี
                  </a>
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold border transition-colors hover:bg-[var(--surface-container)]"
                    style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
                  >
                    เข้าสู่ระบบ
                  </a>
                </>
              )}
            </div>

            <p className="mt-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              ไม่ต้องใช้บัตรเครดิต · ฟรีสูงสุด 3 ทริป
            </p>
          </div>
        </section>

        {/* ─── Features Section ─── */}
        <section className="py-20 px-4" style={{ backgroundColor: "var(--surface-container-lowest)" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "var(--on-surface)" }}>
                ทำไมต้องใช้ TripApp?
              </h2>
              <p className="text-base" style={{ color: "var(--on-surface-variant)" }}>
                ออกแบบมาเพื่อไกด์มืออาชีพและนักท่องเที่ยวที่รักความสะดวก
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: "flight_takeoff",
                  emoji: "✈️",
                  title: "สร้างทริป",
                  desc: "สร้างแผนการเดินทางครบวงจร ใส่ที่พัก กิจกรรม นัดหมาย และข้อมูลสำคัญได้ทุกอย่างในที่เดียว",
                },
                {
                  icon: "qr_code_2",
                  emoji: "📍",
                  title: "แชร์ได้ทันที",
                  desc: "แชร์ทริปด้วย QR Code หรือลิงก์ ลูกทริปเปิดดูได้ทันทีผ่านมือถือ ไม่ต้องดาวน์โหลดแอป",
                },
                {
                  icon: "notifications_active",
                  emoji: "🔔",
                  title: "แจ้งเตือน real-time",
                  desc: "ส่งการแจ้งเตือนถึงลูกทริปทุกคนได้ทันที เมื่อเวลาหรือสถานที่เปลี่ยน ทุกคนรับรู้พร้อมกัน",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl p-8 flex flex-col gap-4 border"
                  style={{
                    backgroundColor: "var(--surface-container-low)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: "var(--primary-container)" }}
                  >
                    {f.emoji}
                  </div>
                  <h3 className="text-xl font-bold" style={{ color: "var(--on-surface)" }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works (preview) ─── */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "var(--on-surface)" }}>
                ใช้งานง่ายใน 3 ขั้นตอน
              </h2>
              <p className="text-base" style={{ color: "var(--on-surface-variant)" }}>
                เริ่มต้นได้ภายในไม่กี่นาที ไม่ต้องมีความรู้ด้านเทคนิค
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {[
                {
                  step: "01",
                  icon: "person_add",
                  title: "สมัครสมาชิกฟรี",
                  desc: "ลงทะเบียนด้วยอีเมล ไม่มีค่าใช้จ่าย ไม่ต้องใช้บัตรเครดิต",
                },
                {
                  step: "02",
                  icon: "edit_document",
                  title: "สร้างและจัดการทริป",
                  desc: "ใส่ข้อมูลทริป ที่พัก กิจกรรม เวลานัดหมาย และรายละเอียดสำคัญ",
                },
                {
                  step: "03",
                  icon: "share",
                  title: "แชร์ให้ลูกทริป",
                  desc: "แชร์ QR Code หรือลิงก์ ลูกทริปติดตามแผนได้ทันทีแบบ real-time",
                },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className="flex items-start gap-6 rounded-2xl p-6 border"
                  style={{
                    backgroundColor: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-extrabold"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--on-primary)",
                    }}
                  >
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: "var(--on-surface)" }}>
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                style={{ color: "var(--primary)" }}
              >
                ดูรายละเอียดวิธีใช้งานทั้งหมด
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Pricing Preview ─── */}
        <section className="py-20 px-4" style={{ backgroundColor: "var(--surface-container-lowest)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: "var(--on-surface)" }}>
                เลือกแผนที่เหมาะกับคุณ
              </h2>
              <p className="text-base" style={{ color: "var(--on-surface-variant)" }}>
                เริ่มฟรี อัปเกรดเมื่อพร้อม ยกเลิกได้ทุกเวลา
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Free */}
              <div
                className="rounded-2xl p-8 border flex flex-col gap-4"
                style={{
                  backgroundColor: "var(--surface-container-low)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--on-surface-variant)" }}>
                    Free
                  </p>
                  <p className="text-4xl font-extrabold" style={{ color: "var(--on-surface)" }}>
                    ฟรี
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
                    ตลอดไป
                  </p>
                </div>
                <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  {["3 ทริป", "แชร์ได้ไม่จำกัด", "QR Code"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base" style={{ color: "var(--success)" }}>check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/register"
                  className="mt-auto inline-block text-center py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-[var(--surface-container)]"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                >
                  เริ่มใช้ฟรี
                </a>
              </div>

              {/* Pro */}
              <div
                className="rounded-2xl p-8 border-2 flex flex-col gap-4 relative overflow-hidden"
                style={{
                  backgroundColor: "var(--primary)",
                  borderColor: "var(--primary)",
                  color: "var(--on-primary)",
                }}
              >
                <span
                  className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full"
                  style={{ backgroundColor: "var(--on-primary)", color: "var(--primary)" }}
                >
                  แนะนำ
                </span>
                <div>
                  <p className="text-sm font-semibold mb-1 opacity-80">Pro</p>
                  <p className="text-4xl font-extrabold">฿199</p>
                  <p className="text-sm mt-1 opacity-80">/เดือน</p>
                </div>
                <ul className="flex flex-col gap-2 text-sm opacity-90">
                  {["ไม่จำกัดทริป", "ส่งออก PDF", "ลบ watermark", "แจ้งเตือน push"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/register"
                  className="mt-auto inline-block text-center py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--on-primary)", color: "var(--primary)" }}
                >
                  เริ่มใช้ Pro
                </a>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                style={{ color: "var(--primary)" }}
              >
                ดูแผนราคาทั้งหมด รวม Enterprise
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ─── */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--on-surface)" }}>
              พร้อมเริ่มต้นแล้วหรือยัง?
            </h2>
            <p className="text-base mb-8" style={{ color: "var(--on-surface-variant)" }}>
              เข้าร่วมกับไกด์และนักท่องเที่ยวนับพันคนที่ใช้ TripApp ทุกวัน
            </p>
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              เริ่มใช้งานฟรีเลย
            </a>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer
        className="border-t py-10 px-4"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--primary)" }}>
              travel_explore
            </span>
            <span className="font-bold" style={{ color: "var(--primary)" }}>TripApp</span>
            <span className="hidden sm:inline">— จัดทริปง่าย แชร์ง่าย</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/how-it-works" className="hover:text-[var(--primary)] transition-colors">วิธีใช้งาน</Link>
            <Link href="/pricing" className="hover:text-[var(--primary)] transition-colors">ราคา</Link>
            <a href="/login" className="hover:text-[var(--primary)] transition-colors">เข้าสู่ระบบ</a>
          </nav>
          <p>&copy; {new Date().getFullYear()} TripApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
