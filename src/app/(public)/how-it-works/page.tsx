import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "วิธีใช้งาน",
  description: "เรียนรู้วิธีใช้งาน TripApp ใน 5 ขั้นตอนง่ายๆ",
};

const STEPS = [
  {
    step: "01",
    icon: "person_add",
    title: "สมัครสมาชิกฟรี",
    desc: "เริ่มต้นด้วยการสมัครบัญชีฟรี ใช้เวลาไม่ถึง 1 นาที ไม่ต้องใส่ข้อมูลบัตรเครดิต สมัครด้วยอีเมลหรือเชื่อมต่อผ่าน Google ได้เลย",
    detail: [
      "กรอกอีเมลและรหัสผ่านที่ต้องการ",
      "ยืนยันอีเมลของคุณ",
      "ตั้งค่าโปรไฟล์ไกด์เบื้องต้น",
      "พร้อมใช้งานทันที!",
    ],
    color: "var(--primary)",
    bgColor: "var(--primary-container)",
    textColor: "var(--on-primary-container)",
  },
  {
    step: "02",
    icon: "edit_document",
    title: "สร้างทริปใหม่",
    desc: "สร้างทริปได้ง่ายๆ เพียงกรอกชื่อทริป วันเดินทาง จุดหมายปลายทาง และรายละเอียดที่ต้องการ ระบบจะช่วยจัดระเบียบข้อมูลให้อัตโนมัติ",
    detail: [
      "ตั้งชื่อและคำอธิบายทริป",
      "กำหนดวันและเวลาเดินทาง",
      "เพิ่มจุดหมายปลายทาง",
      "ใส่รายละเอียดพิเศษสำหรับลูกทริป",
    ],
    color: "var(--secondary)",
    bgColor: "var(--secondary-container)",
    textColor: "var(--on-secondary-container)",
  },
  {
    step: "03",
    icon: "add_circle",
    title: "ใส่ข้อมูลทริปให้ครบ",
    desc: "เพิ่มรายละเอียดที่พัก กิจกรรม ร้านอาหาร ตารางเวลา และข้อมูลสำคัญต่างๆ ที่ลูกทริปควรรู้ได้อย่างละเอียด",
    detail: [
      "เพิ่มที่พักพร้อมรายละเอียดและที่อยู่",
      "ใส่กิจกรรมและตารางเวลาแต่ละวัน",
      "เพิ่มร้านอาหารและสถานที่แนะนำ",
      "ใส่ข้อมูลฉุกเฉินและข้อควรระวัง",
      "แนบเอกสารสำคัญหรือลิงก์ที่เกี่ยวข้อง",
    ],
    color: "var(--tertiary)",
    bgColor: "var(--tertiary-container)",
    textColor: "var(--on-surface)",
  },
  {
    step: "04",
    icon: "qr_code_2",
    title: "แชร์ QR Code ให้ลูกทริป",
    desc: "เมื่อทริปพร้อมแล้ว แชร์ QR Code หรือลิงก์ให้ลูกทริปทุกคน พวกเขาจะเห็นแผนการเดินทางทั้งหมดผ่านมือถือทันที",
    detail: [
      "กด 'แชร์ทริป' เพื่อสร้าง QR Code",
      "แชร์ QR Code หรือลิงก์ผ่าน Line / WhatsApp",
      "ลูกทริปสแกน QR หรือคลิกลิงก์",
      "เปิดดูทริปได้ทันทีไม่ต้องดาวน์โหลดแอป",
    ],
    color: "var(--success)",
    bgColor: "#dcfce7",
    textColor: "var(--on-surface)",
  },
  {
    step: "05",
    icon: "notifications_active",
    title: "ลูกทริปติดตามแบบ real-time",
    desc: "ลูกทริปสามารถติดตามแผนการเดินทางได้ตลอดเวลา เมื่อคุณอัปเดตข้อมูล ทุกคนจะเห็นการเปลี่ยนแปลงทันที",
    detail: [
      "แผนทริปอัปเดตทันทีเมื่อมีการเปลี่ยนแปลง",
      "ลูกทริปรับ push notification เมื่อมีการแจ้งเตือน",
      "เช็คตารางเวลาได้ตลอด 24/7",
      "ดูข้อมูลออฟไลน์ได้หลังจากโหลดครั้งแรก",
    ],
    color: "var(--warning)",
    bgColor: "#fef3c7",
    textColor: "var(--on-surface)",
  },
];

const TIPS = [
  {
    icon: "lightbulb",
    title: "เตรียมข้อมูลก่อนสร้างทริป",
    desc: "รวบรวมข้อมูลที่พัก กิจกรรม และตารางเวลาไว้ล่วงหน้า จะทำให้สร้างทริปได้เร็วขึ้นมาก",
  },
  {
    icon: "update",
    title: "อัปเดตข้อมูลสม่ำเสมอ",
    desc: "หากมีการเปลี่ยนแปลงแผน อัปเดตในระบบทันที ลูกทริปจะเห็นข้อมูลใหม่โดยอัตโนมัติ",
  },
  {
    icon: "group",
    title: "แชร์ล่วงหน้าก่อนเดินทาง",
    desc: "แชร์ QR Code ให้ลูกทริปล่วงหน้าอย่างน้อย 3-5 วัน เพื่อให้พวกเขาเตรียมตัวได้ถูกต้อง",
  },
];

export default function HowItWorksPage() {
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
            <Link href="/how-it-works" className="font-semibold" style={{ color: "var(--primary)" }}>วิธีใช้งาน</Link>
            <Link href="/pricing" className="hover:text-[var(--primary)] transition-colors">ราคา</Link>
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
              วิธีใช้งาน TripApp
            </h1>
            <p className="text-lg" style={{ color: "var(--on-surface-variant)" }}>
              เพียง 5 ขั้นตอน จัดทริปออนไลน์ได้อย่างมืออาชีพ
              <br />
              ลูกทริปติดตามได้แบบ real-time ตลอด 24 ชั่วโมง
            </p>
          </div>
        </section>

        {/* ─── Steps ─── */}
        <section className="pb-20 px-4">
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            {STEPS.map((s, index) => (
              <div key={s.step} className="relative">
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className="absolute left-7 top-full h-8 w-0.5 -translate-x-1/2 hidden sm:block"
                    style={{ backgroundColor: "var(--outline-variant)" }}
                  />
                )}

                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    backgroundColor: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  {/* Step header */}
                  <div
                    className="flex items-center gap-4 p-6 pb-0"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-extrabold"
                      style={{ backgroundColor: s.color, color: "white" }}
                    >
                      {s.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="material-symbols-outlined text-xl"
                          style={{ color: s.color }}
                        >
                          {s.icon}
                        </span>
                        <h2 className="text-xl font-bold" style={{ color: "var(--on-surface)" }}>
                          {s.title}
                        </h2>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>
                        {s.desc}
                      </p>
                    </div>
                  </div>

                  {/* Step details */}
                  <div className="p-6 pt-4">
                    <div
                      className="rounded-xl p-5"
                      style={{ backgroundColor: s.bgColor }}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: s.color }}>
                        ขั้นตอนย่อย
                      </p>
                      <ol className="flex flex-col gap-2">
                        {s.detail.map((d, i) => (
                          <li
                            key={d}
                            className="flex items-start gap-3 text-sm"
                            style={{ color: s.textColor }}
                          >
                            <span
                              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                              style={{ backgroundColor: s.color, color: "white" }}
                            >
                              {i + 1}
                            </span>
                            {d}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Tips ─── */}
        <section className="py-20 px-4" style={{ backgroundColor: "var(--surface-container-lowest)" }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: "var(--on-surface)" }}>
              เคล็ดลับจากไกด์มืออาชีพ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TIPS.map((tip) => (
                <div
                  key={tip.title}
                  className="rounded-2xl p-6 border flex flex-col gap-3"
                  style={{
                    backgroundColor: "var(--surface-container-low)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "var(--primary-container)" }}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ color: "var(--primary)" }}>
                      {tip.icon}
                    </span>
                  </div>
                  <h3 className="font-bold" style={{ color: "var(--on-surface)" }}>{tip.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>{tip.desc}</p>
                </div>
              ))}
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
              {[
                {
                  q: "ลูกทริปต้องดาวน์โหลดแอปไหม?",
                  a: "ไม่ต้องเลย! ลูกทริปเปิดดูทริปผ่านเว็บเบราว์เซอร์บนมือถือได้ทันที เพียงแค่สแกน QR Code หรือคลิกลิงก์",
                },
                {
                  q: "อัปเดตทริปหลังจากแชร์แล้วได้ไหม?",
                  a: "ได้เลย! คุณสามารถแก้ไขและอัปเดตทริปได้ตลอดเวลา ลูกทริปจะเห็นข้อมูลที่อัปเดตแล้วทันที",
                },
                {
                  q: "ถ้ามีการเปลี่ยนแปลงกะทันหัน ลูกทริปจะรู้ได้อย่างไร?",
                  a: "ระบบจะส่ง push notification ให้ลูกทริปทุกคนอัตโนมัติเมื่อมีการแก้ไขข้อมูลสำคัญ (ฟีเจอร์นี้ใช้ได้กับแผน Pro ขึ้นไป)",
                },
                {
                  q: "TripApp รองรับทริปกี่คน?",
                  a: "ไม่จำกัดจำนวนลูกทริป! แชร์ให้กี่คนก็ได้ ทุกคนจะเห็นข้อมูลเดียวกันแบบ real-time",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl p-6 border"
                  style={{
                    backgroundColor: "var(--surface-container-lowest)",
                    borderColor: "var(--outline-variant)",
                  }}
                >
                  <p className="font-semibold mb-2" style={{ color: "var(--on-surface)" }}>{item.q}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>{item.a}</p>
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
              พร้อมจัดทริปแรกของคุณหรือยัง?
            </h2>
            <p className="text-base mb-8" style={{ color: "var(--on-primary-container)" }}>
              สมัครฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต เริ่มสร้างทริปได้เลย
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-bold shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                เริ่มใช้งานฟรี
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold border transition-colors hover:bg-[var(--primary-container)]"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                ดูแผนราคา
              </Link>
            </div>
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
            <Link href="/pricing" className="hover:text-[var(--primary)] transition-colors">ราคา</Link>
            <Link href="/login" className="hover:text-[var(--primary)] transition-colors">เข้าสู่ระบบ</Link>
          </nav>
          <p>&copy; {new Date().getFullYear()} TripApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
