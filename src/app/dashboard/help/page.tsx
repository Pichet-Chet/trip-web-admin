"use client";

import { useState } from "react";

const faqs = [
  { q: "จะสร้างทริปใหม่ได้อย่างไร?", a: "กดเมนู \"Trip Builder\" ที่ sidebar → เลือกประเภททริป (ในประเทศ/ต่างประเทศ) → กรอกข้อมูล → เพิ่มกิจกรรม → ดูตัวอย่าง → เผยแพร่" },
  { q: "ลูกทริปจะดูทริปได้อย่างไร?", a: "หลังเผยแพร่ทริปแล้ว ระบบจะสร้างลิงก์และ QR Code ให้อัตโนมัติ ส่งลิงก์ให้ลูกทริปผ่าน LINE หรือช่องทางอื่น ลูกทริปเปิดดูได้เลยไม่ต้องสมัครสมาชิก" },
  { q: "ระบบแจ้งเตือนทำงานอย่างไร?", a: "เมื่อลูกทริปกด \"ติดตาม\" ระบบจะเก็บช่องทาง (LINE หรือ Web Push) เมื่อคุณแก้ไขทริปและเลือกส่งแจ้งเตือน ระบบจะส่งสรุปการเปลี่ยนแปลงไปยังทุกคนที่ติดตาม" },
  { q: "ลูกทริปต้องสมัครสมาชิกไหม?", a: "ไม่ต้อง ลูกทริปเปิดลิงก์ดูได้เลย ถ้าต้องการรับแจ้งเตือนก็กด \"ติดตาม\" โดยไม่ต้องสมัครสมาชิก" },
  { q: "แพลน Free มีข้อจำกัดอะไรบ้าง?", a: "สร้างทริปได้ 3 ทริป, ผู้ติดตาม 30 คน/ทริป, แก้ไขหลัง publish 2 ครั้ง/ทริป, แจ้งเตือน 10 ครั้ง/เดือน" },
  { q: "จะยกเลิกแพลนได้อย่างไร?", a: "ไปที่ การใช้งาน & แพลน → กดยกเลิก ระบบจะใช้งานได้ถึงสิ้นรอบบิลปัจจุบัน" },
  { q: "โหมดยื่น ตม. คืออะไร?", a: "เป็นมุมมองพิเศษสำหรับลูกทริปต่างประเทศ แสดงข้อมูลที่ ตม. ต้องการ (เที่ยวบิน, ที่พัก, itinerary) ในรูปแบบทางการ ใช้งานได้แม้ offline" },
];

const contacts = [
  { label: "LINE Official", value: "@tripadmin-support", icon: "chat" },
  { label: "อีเมล", value: "support@example.com", icon: "mail" },
  { label: "เวลาทำการ", value: "จ-ศ 09:00-18:00", icon: "schedule" },
];

export default function HelpPage(): React.ReactNode {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-8 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ศูนย์ช่วยเหลือ</h1>
        <p className="text-slate-400 mt-2 text-sm">คำถามที่พบบ่อยและช่องทางติดต่อทีมงาน</p>
      </div>

      {/* ═══ FAQ ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">คำถามที่พบบ่อย</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {faqs.map((faq, i) => (
            <details
              key={i}
              open={openFaq === i}
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) setOpenFaq(i);
                else if (openFaq === i) setOpenFaq(null);
              }}
              className="group"
            >
              <summary className="px-6 py-5 cursor-pointer flex items-center justify-between hover:bg-slate-50/50 transition-colors list-none">
                <span className="font-semibold text-slate-900 text-sm pr-4">{faq.q}</span>
                <span className="material-symbols-outlined text-slate-300 text-lg shrink-0 group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-6 pb-5 text-sm text-slate-500 leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* ═══ Contact ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">ติดต่อทีมงาน</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div key={c.label} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-slate-400">{c.icon}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.label}</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Feedback CTA ═══ */}
      <a href="/dashboard/feedback" className="block bg-blue-600 rounded-2xl p-6 text-white hover:bg-blue-700 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">มีไอเดียหรือพบปัญหา?</h3>
            <p className="text-blue-100 text-sm mt-1">แจ้งปัญหาหรือเสนอฟีเจอร์ที่อยากได้ ทีมงานจะนำไปพัฒนาต่อ</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-blue-200">arrow_forward</span>
        </div>
      </a>

      {/* ═══ Quick Links ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/dashboard/terms" className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:border-slate-300 transition-colors group">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">เงื่อนไขการใช้งาน</h3>
            <p className="text-xs text-slate-400 mt-0.5">ข้อตกลงและเงื่อนไขในการใช้ระบบ</p>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
        </a>
        <a href="/dashboard/privacy" className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:border-slate-300 transition-colors group">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">นโยบายความเป็นส่วนตัว</h3>
            <p className="text-xs text-slate-400 mt-0.5">ข้อมูลที่เราเก็บและวิธีการใช้งาน</p>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
        </a>
      </div>
    </div>
  );
}
