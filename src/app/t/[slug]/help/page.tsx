"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchTripBySlug } from "@/lib/trip-api";
import { ApiError } from "@/lib/client-api";
import type { TripPlan } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "ทริปนี้รวมอะไรบ้าง?",
    answer: "ดูรายละเอียดในแต่ละ Day Card ของทริป จะมีกิจกรรม ที่พัก และการเดินทางทั้งหมด หากมีคำถามเพิ่มเติมติดต่อไกด์ได้โดยตรง",
  },
  {
    question: "ถ้าเที่ยวบินดีเลย์ต้องทำยังไง?",
    answer: "ติดต่อไกด์ทันทีผ่านปุ่มโทรหรือ LINE — ไกด์จะปรับแผนและแจ้งเตือนทุกคนผ่านระบบ",
  },
  {
    question: "เปลี่ยนแปลงทริปหลังจากจ่ายเงินได้ไหม?",
    answer: "นโยบายการเปลี่ยนแปลงและเงื่อนไขขึ้นกับแต่ละบริษัททัวร์ — กรุณาติดต่อไกด์ของคุณโดยตรง",
  },
  {
    question: "หากอุปกรณ์เสียหรือไม่ได้นำโทรศัพท์ติดตัว?",
    answer: "บันทึกเบอร์ฉุกเฉินและที่พักไว้ก่อนเดินทาง สามารถดูจากหน้าเอกสารตรวจคนเข้าเมือง (Imm)",
  },
];

export default function HelpCenterPage({ params }: PageProps): React.JSX.Element {
  const { slug } = use(params);
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTripBySlug(slug)
      .then(setTrip)
      .catch((err) => setError(err instanceof ApiError ? err.message : "ไม่สามารถโหลดข้อมูลได้"));
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">error</span>
          <p className="text-slate-500 text-sm">{error}</p>
          <Link href="/" className="inline-block mt-6 text-blue-600 font-semibold text-sm hover:underline">กลับหน้าหลัก</Link>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-blue-500">progress_activity</span>
      </div>
    );
  }

  const company = trip.company;

  return (
    <div className="natgan-bg min-h-screen text-on-surface pb-24">
      <nav className="bg-white/90 glass-blur border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/t/${trip.slug}`} className="material-symbols-outlined text-on-surface-variant hover:text-brand-blue transition-colors text-xl">arrow_back</Link>
            <span className="font-headline font-bold text-base sm:text-lg">ศูนย์ช่วยเหลือ</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Guide / company contact */}
        <section className="bg-brand-blue-deep rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg shrink-0 bg-white/10 flex items-center justify-center">
              {company.logoUrl ? (
                <img className="w-full h-full object-cover" src={company.logoUrl} alt={company.name} />
              ) : (
                <span className="material-symbols-outlined text-3xl text-white/70">business</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white/50 text-[10px] sm:text-xs font-bold uppercase tracking-widest">บริษัทผู้จัดทริป</p>
              <h2 className="text-lg sm:text-2xl font-headline font-bold truncate">{company.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {company.phone ? (
              <a
                href={`tel:${company.phone}`}
                className="bg-white text-brand-blue-deep font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-white/90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                โทร
              </a>
            ) : (
              <div className="bg-white/10 text-white/40 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                <span className="material-symbols-outlined text-lg">call_end</span>
                ไม่มีเบอร์
              </div>
            )}
            {company.lineId ? (
              <a
                href={`https://line.me/R/ti/p/${encodeURIComponent(company.lineId.replace(/^@/, ""))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-line-green text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                LINE
              </a>
            ) : (
              <div className="bg-white/10 text-white/40 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                <span className="material-symbols-outlined text-lg">chat</span>
                ไม่มี LINE
              </div>
            )}
          </div>
        </section>

        {/* Emergency contacts from trip */}
        {trip.emergencyContacts.length > 0 && (
          <section className="rounded-2xl bg-white border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-outline-variant/10">
              <h3 className="font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">emergency</span>
                เบอร์ติดต่อฉุกเฉิน
              </h3>
            </div>
            <ul className="divide-y divide-outline-variant/10">
              {trip.emergencyContacts.map((c, i) => (
                <li key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{c.icon}</span>
                    <span className="text-sm font-medium text-on-surface truncate">{c.name}</span>
                  </div>
                  <a href={`tel:${c.phone}`} className="text-sm font-bold text-brand-blue hover:underline whitespace-nowrap">
                    {c.phone}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ */}
        <section className="rounded-2xl bg-white border border-outline-variant/20 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-outline-variant/10">
            <h3 className="font-bold text-on-surface">คำถามที่พบบ่อย</h3>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="group">
                <summary className="px-5 py-4 cursor-pointer flex items-center justify-between gap-3 list-none hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-semibold text-on-surface">{item.question}</span>
                  <span className="material-symbols-outlined text-on-surface-variant text-base group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="px-5 pb-4 pt-0 text-sm text-on-surface-variant leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-on-surface-variant/60 px-4">
          มีปัญหาด้านระบบ? ส่งข้อความถึงทีม TripApp ได้ที่ <a href="mailto:support@tripapp.co" className="text-brand-blue hover:underline">support@tripapp.co</a>
        </p>
      </main>
    </div>
  );
}
