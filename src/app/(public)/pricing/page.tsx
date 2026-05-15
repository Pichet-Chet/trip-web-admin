import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ราคา",
  description: "เลือกแผนที่เหมาะกับคุณ — ฟรี, Pro, Enterprise",
};

const FREE_FEATURES = [
  "สูงสุด 3 ทริปพร้อมกัน",
  "แชร์ทริปได้ไม่จำกัด",
  "QR Code สำหรับทุกทริป",
  "ลูกทริปเข้าดูผ่านมือถือ",
  "อัปเดตแบบ real-time",
];

const FREE_MISSING = [
  "ส่งออก PDF",
  "ลบ TripApp watermark",
  "Push notification",
  "สนับสนุนลำดับความสำคัญ",
];

const PRO_FEATURES = [
  "ไม่จำกัดจำนวนทริป",
  "แชร์ทริปได้ไม่จำกัด",
  "QR Code สำหรับทุกทริป",
  "ลูกทริปเข้าดูผ่านมือถือ",
  "อัปเดตแบบ real-time",
  "ส่งออก PDF คุณภาพสูง",
  "ลบ TripApp watermark",
  "Push notification",
  "สนับสนุนลำดับความสำคัญ",
];

const ENTERPRISE_FEATURES = [
  "ทุกอย่างใน Pro",
  "หลายทีม / หลายองค์กร",
  "Single Sign-On (SSO)",
  "API Access",
  "ระบบรายงานขั้นสูง",
  "SLA & dedicated support",
  "ปรับแต่ง branding เต็มรูปแบบ",
];

const FAQ = [
  {
    q: "ทดลองใช้ Pro ฟรีได้ไหม?",
    a: "ได้เลย! ทุกบัญชีใหม่ได้ทดลองใช้ Pro ฟรี 14 วัน ไม่ต้องใส่ข้อมูลบัตรเครดิต",
  },
  {
    q: "ยกเลิกได้ตอนไหน?",
    a: "ยกเลิกได้ตลอดเวลา ไม่มีสัญญาผูกมัด หากยกเลิกก่อนสิ้นรอบ คุณยังใช้งานได้จนครบรอบชำระเงิน",
  },
  {
    q: "รับชำระด้วยอะไรบ้าง?",
    a: "บัตรเครดิต/เดบิต, PromptPay, และ QR Payment ผ่านช่องทางที่ได้รับการรับรอง",
  },
  {
    q: "ข้อมูลทริปเก่าหายไหมถ้าดาวน์เกรด?",
    a: "ไม่หาย ข้อมูลทั้งหมดยังคงอยู่ เพียงแต่ไม่สามารถสร้างทริปใหม่เกินโควต้า Free ได้",
  },
];

export default function PricingPage() {
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
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl" style={{ color: "var(--primary)" }}>
              travel_explore
            </span>
            <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
              TripApp
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium" style={{ color: "var(--on-surface-variant)" }}>
            <Link href="/how-it-works" className="hover:text-[var(--primary)] transition-colors">วิธีใช้งาน</Link>
            <Link href="/pricing" className="font-semibold" style={{ color: "var(--primary)" }}>ราคา</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-[var(--surface-container)]"
              style={{ color: "var(--primary)" }}
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
            >
              เริ่มใช้งาน
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4" style={{ color: "var(--on-surface)" }}>
              เลือกแผนที่ใช่สำหรับคุณ
            </h1>
            <p className="text-lg" style={{ color: "var(--on-surface-variant)" }}>
              เริ่มฟรี ไม่ต้องใช้บัตรเครดิต อัปเกรดได้ทุกเวลา
            </p>
          </div>
        </section>

        {/* ─── Pricing Cards ─── */}
        <section className="pb-20 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">

            {/* Free */}
            <div
              className="rounded-2xl p-8 border flex flex-col gap-6"
              style={{
                backgroundColor: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            >
              <div>
                <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "var(--on-surface-variant)" }}>Free</p>
                <p className="text-5xl font-extrabold" style={{ color: "var(--on-surface)" }}>ฟรี</p>
                <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>ตลอดไป ไม่มีหมดอายุ</p>
              </div>

              <Link
                href="/register"
                className="block text-center py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-[var(--surface-container)]"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                เริ่มใช้ฟรี
              </Link>

              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>รวมถึง</p>
                <ul className="flex flex-col gap-2.5">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--on-surface)" }}>
                      <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5" style={{ color: "var(--success)" }}>check_circle</span>
                      {f}
                    </li>
                  ))}
                  {FREE_MISSING.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--outline)" }}>
                      <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">remove_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pro */}
            <div
              className="rounded-2xl p-8 flex flex-col gap-6 relative overflow-hidden shadow-xl"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
              }}
            >
              <span
                className="absolute top-5 right-5 text-xs font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: "var(--on-primary)", color: "var(--primary)" }}
              >
                แนะนำ
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Pro</p>
                <div className="flex items-end gap-1">
                  <p className="text-5xl font-extrabold">฿199</p>
                  <p className="text-base mb-2 opacity-80">/เดือน</p>
                </div>
                <p className="text-sm mt-1 opacity-80">หรือ ฿1,990/ปี (ประหยัด 17%)</p>
              </div>

              <Link
                href="/register"
                className="block text-center py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--on-primary)", color: "var(--primary)" }}
              >
                เริ่มทดลอง Pro ฟรี 14 วัน
              </Link>

              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider opacity-80">รวมถึง</p>
                <ul className="flex flex-col gap-2.5">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-90">
                      <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Enterprise */}
            <div
              className="rounded-2xl p-8 border flex flex-col gap-6"
              style={{
                backgroundColor: "var(--surface-container-lowest)",
                borderColor: "var(--outline-variant)",
              }}
            >
              <div>
                <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "var(--on-surface-variant)" }}>Enterprise</p>
                <p className="text-4xl font-extrabold" style={{ color: "var(--on-surface)" }}>ติดต่อ</p>
                <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>ราคาพิเศษสำหรับองค์กร</p>
              </div>

              <a
                href="mailto:hello@trip-web.com"
                className="block text-center py-3 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: "var(--surface-container)", color: "var(--on-surface)" }}
              >
                ติดต่อทีมงาน
              </a>

              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>รวมถึง</p>
                <ul className="flex flex-col gap-2.5">
                  {ENTERPRISE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--on-surface)" }}>
                      <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5" style={{ color: "var(--primary)" }}>check_circle</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Feature Comparison Table ─── */}
        <section className="py-20 px-4" style={{ backgroundColor: "var(--surface-container-lowest)" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: "var(--on-surface)" }}>
              เปรียบเทียบฟีเจอร์ทุกแผน
            </h2>

            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--outline-variant)" }}>
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "var(--surface-container)" }}>
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold" style={{ color: "var(--on-surface)" }}>ฟีเจอร์</th>
                    <th className="text-center py-4 px-4 font-semibold" style={{ color: "var(--on-surface)" }}>Free</th>
                    <th className="text-center py-4 px-4 font-bold" style={{ color: "var(--primary)" }}>Pro</th>
                    <th className="text-center py-4 px-4 font-semibold" style={{ color: "var(--on-surface)" }}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "จำนวนทริป", free: "3", pro: "ไม่จำกัด", enterprise: "ไม่จำกัด" },
                    { label: "แชร์ลิงก์ / QR Code", free: true, pro: true, enterprise: true },
                    { label: "ลูกทริปดูผ่านมือถือ", free: true, pro: true, enterprise: true },
                    { label: "อัปเดต real-time", free: true, pro: true, enterprise: true },
                    { label: "ส่งออก PDF", free: false, pro: true, enterprise: true },
                    { label: "ลบ watermark", free: false, pro: true, enterprise: true },
                    { label: "Push notification", free: false, pro: true, enterprise: true },
                    { label: "API Access", free: false, pro: false, enterprise: true },
                    { label: "SSO", free: false, pro: false, enterprise: true },
                    { label: "Dedicated support", free: false, pro: false, enterprise: true },
                  ].map((row, i) => (
                    <tr
                      key={row.label}
                      style={{
                        backgroundColor: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container)",
                        borderTop: "1px solid var(--outline-variant)",
                      }}
                    >
                      <td className="py-3.5 px-6 font-medium" style={{ color: "var(--on-surface)" }}>{row.label}</td>
                      {[row.free, row.pro, row.enterprise].map((val, j) => (
                        <td key={j} className="py-3.5 px-4 text-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              <span className="material-symbols-outlined text-base" style={{ color: "var(--success)" }}>check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-base" style={{ color: "var(--outline)" }}>remove</span>
                            )
                          ) : (
                            <span
                              className="font-semibold text-xs"
                              style={{ color: j === 1 ? "var(--primary)" : "var(--on-surface-variant)" }}
                            >
                              {val}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: "var(--on-surface)" }}>
              คำถามที่พบบ่อย
            </h2>
            <div className="flex flex-col gap-4">
              {FAQ.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <p className="font-semibold mb-2" style={{ color: "var(--on-surface)" }}>
                    {item.q}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section
          className="py-20 px-4 text-center"
          style={{ backgroundColor: "var(--primary-container)" }}
        >
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--on-primary-container)" }}>
              พร้อมเริ่มต้นแล้วหรือยัง?
            </h2>
            <p className="text-base mb-8" style={{ color: "var(--on-primary-container)" }}>
              เริ่มใช้งานฟรีวันนี้ อัปเกรดได้เมื่อคุณพร้อม
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              เริ่มใช้งานฟรี
            </Link>
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
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--primary)" }}>travel_explore</span>
            <span className="font-bold" style={{ color: "var(--primary)" }}>TripApp</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="hover:text-[var(--primary)] transition-colors">หน้าแรก</Link>
            <Link href="/how-it-works" className="hover:text-[var(--primary)] transition-colors">วิธีใช้งาน</Link>
            <Link href="/login" className="hover:text-[var(--primary)] transition-colors">เข้าสู่ระบบ</Link>
          </nav>
          <p>&copy; {new Date().getFullYear()} TripApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
