"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchTripBySlug } from "@/lib/trip-api";
import { ApiError } from "@/lib/client-api";
import type { TripPlan } from "@/lib/mock-data";
import { formatDateRange, getTripDuration } from "@/lib/trip-utils";

type ImmLang = "en" | "ja" | "th";

const IMM_LABELS: Record<ImmLang, {
  title: string; subtitle: string; status: string; confirmed: string;
  tourOperator: string; dates: string; destination: string; travelers: string;
  flight: string; departure: string; returnFlight: string; arrival: string;
  accommodation: string; nights: string; tel: string;
  dailySchedule: string; backToTrip: string; savePdf: string; official: string;
  daysTotal: string;
}> = {
  en: {
    title: "Travel Itinerary", subtitle: "For Immigration & Visa Application Purposes",
    status: "Status", confirmed: "Confirmed",
    tourOperator: "Tour Operator", dates: "Travel Dates", destination: "Destination",
    travelers: "Travelers", flight: "Flight Details", departure: "Departure",
    returnFlight: "Return", arrival: "Arrival", accommodation: "Accommodation",
    nights: "nights", tel: "Tel", dailySchedule: "Daily Activity Schedule",
    backToTrip: "← Back to Trip", savePdf: "Save as PDF", official: "Official",
    daysTotal: "Days Total",
  },
  ja: {
    title: "旅行日程表", subtitle: "入国審査・ビザ申請用",
    status: "ステータス", confirmed: "確認済み",
    tourOperator: "ツアーオペレーター", dates: "旅行期間", destination: "目的地",
    travelers: "旅行者数", flight: "フライト情報", departure: "出発",
    returnFlight: "帰国", arrival: "到着", accommodation: "宿泊先",
    nights: "泊", tel: "電話", dailySchedule: "日別スケジュール",
    backToTrip: "← 旅程に戻る", savePdf: "PDFで保存", official: "公式",
    daysTotal: "日間",
  },
  th: {
    title: "แผนการเดินทาง", subtitle: "สำหรับยื่นตรวจคนเข้าเมือง",
    status: "สถานะ", confirmed: "ยืนยันแล้ว",
    tourOperator: "บริษัททัวร์", dates: "วันเดินทาง", destination: "จุดหมาย",
    travelers: "ผู้เดินทาง", flight: "ข้อมูลเที่ยวบิน", departure: "ขาไป",
    returnFlight: "ขากลับ", arrival: "ถึง", accommodation: "ที่พัก",
    nights: "คืน", tel: "โทร", dailySchedule: "กำหนดการรายวัน",
    backToTrip: "← กลับหน้าทริป", savePdf: "บันทึก PDF", official: "เอกสารทางการ",
    daysTotal: "วัน",
  },
};

// Auto-detect language based on destination
function detectImmLang(destination: string): ImmLang {
  const d = destination.toLowerCase();
  if (d.includes("japan") || d.includes("ญี่ปุ่น")) return "ja";
  if (d.includes("thai") || d.includes("ไทย")) return "th";
  return "en";
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ImmigrationViewPage({ params }: PageProps): React.JSX.Element {
  const { slug } = use(params);
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTripBySlug(slug)
      .then(setTrip)
      .catch((err) => setError(err instanceof ApiError ? err.message : "ไม่สามารถโหลดทริปได้"));
  }, [slug]);

  const defaultLang: ImmLang = trip ? detectImmLang(trip.destination) : "en";
  const [lang, setLang] = useState<ImmLang>("en");
  useEffect(() => { setLang(defaultLang); }, [defaultLang]);
  const l = IMM_LABELS[lang];

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

  const duration = getTripDuration(trip.startDate, trip.endDate);

  const langOptions: { code: ImmLang; flag: string; label: string }[] = [
    { code: "en", flag: "🇬🇧", label: "English" },
    { code: "ja", flag: "🇯🇵", label: "日本語" },
    { code: "th", flag: "🇹🇭", label: "ไทย" },
  ];

  return (
    <div className="bg-white text-[#111] antialiased min-h-screen print:bg-white">
      {/* ── Header ── */}
      <header className="bg-[#1e3a5f] text-white print:bg-[#1e3a5f]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{l.title}</h1>
              <p className="text-white/60 text-xs sm:text-sm mt-0.5">{l.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Language toggle */}
              <div className="flex rounded-lg overflow-hidden border border-white/20 print:hidden">
                {langOptions.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => setLang(opt.code)}
                    className={`px-2 sm:px-3 py-1.5 text-xs font-medium transition-colors ${
                      lang === opt.code ? "bg-white text-[#1e3a5f] font-bold" : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="mr-1">{opt.flag}</span>
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                ))}
              </div>
              <span className="bg-green-500/20 text-green-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider hidden sm:inline">
                {l.confirmed}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── 1. Tour Operator & Trip Info ── */}
        <section className="border border-[#d1d5db] rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#d1d5db]">
            <div className="p-4 sm:p-5">
              <p className="text-[10px] sm:text-xs text-[#6b7280] font-bold uppercase tracking-wider mb-1">{l.tourOperator}</p>
              <p className="text-sm sm:text-base font-semibold">{trip.company.name}</p>
              {trip.company.tatLicense && (
                <p className="text-xs text-[#6b7280] mt-0.5">TAT: {trip.company.tatLicense}</p>
              )}
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[10px] sm:text-xs text-[#6b7280] font-bold uppercase tracking-wider mb-1">{l.dates}</p>
              <p className="text-sm sm:text-base font-semibold">{formatDateRange(trip.startDate, trip.endDate)}</p>
              <p className="text-xs text-[#6b7280] mt-0.5">{duration} {l.daysTotal}</p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[10px] sm:text-xs text-[#6b7280] font-bold uppercase tracking-wider mb-1">{l.destination}</p>
              <p className="text-sm sm:text-base font-semibold">{trip.destination}</p>
              <p className="text-xs text-[#6b7280] mt-0.5">{trip.travelersCount} {l.travelers}</p>
            </div>
          </div>
        </section>

        {/* ── 2. Flight Information ── */}
        <section className="border border-[#d1d5db] rounded-lg overflow-hidden">
          <div className="bg-[#f8fafc] px-4 sm:px-5 py-3 border-b border-[#d1d5db] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1e3a5f] text-lg">flight</span>
            <h2 className="font-bold text-sm uppercase tracking-wide text-[#1e3a5f]">{l.flight}</h2>
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {trip.airlineInfo.map((flight, i) => (
              <div key={i} className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    flight.type === "departure" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {flight.type === "departure" ? l.departure : l.returnFlight}
                  </span>
                  <span className="text-xs text-[#6b7280]">{flight.airline} • {flight.flightNumber}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg sm:text-2xl font-bold text-[#1e3a5f]">{flight.departureAirport}</p>
                    <p className="text-xs text-[#6b7280]">{flight.departureTime}</p>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#1e3a5f]" />
                    <div className="flex-1 h-px bg-[#d1d5db] mx-1 relative">
                      <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-[#1e3a5f] text-sm px-1">flight</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#1e3a5f]" />
                  </div>
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg sm:text-2xl font-bold text-[#1e3a5f]">{flight.arrivalAirport}</p>
                    <p className="text-xs text-[#6b7280]">{flight.arrivalTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Accommodation ── */}
        <section className="border border-[#d1d5db] rounded-lg overflow-hidden">
          <div className="bg-[#f8fafc] px-4 sm:px-5 py-3 border-b border-[#d1d5db] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1e3a5f] text-lg">hotel</span>
            <h2 className="font-bold text-sm uppercase tracking-wide text-[#1e3a5f]">{l.accommodation}</h2>
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {trip.accommodations.map((acc, i) => (
              <div key={i} className="p-4 sm:p-5">
                <h3 className="font-bold text-sm sm:text-base">{acc.name}</h3>
                <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">{acc.address}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[#6b7280]">
                  <span>{l.tel}: {acc.phone}</span>
                  <span>{acc.nights} {l.nights}</span>
                  <span>Check-in: {acc.checkIn} / Check-out: {acc.checkOut}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Daily Schedule ── */}
        <section className="border border-[#d1d5db] rounded-lg overflow-hidden">
          <div className="bg-[#f8fafc] px-4 sm:px-5 py-3 border-b border-[#d1d5db] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1e3a5f] text-lg">calendar_today</span>
            <h2 className="font-bold text-sm uppercase tracking-wide text-[#1e3a5f]">{l.dailySchedule}</h2>
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {trip.days.map((day) => {
              const dateObj = new Date(day.date);
              const dateStr = dateObj.toLocaleDateString(lang === "ja" ? "ja-JP" : lang === "th" ? "th-TH" : "en-US", {
                weekday: "short", month: "short", day: "numeric",
              });
              const activities = day.activities.map((a) => `${a.time} ${a.name}`).join(" → ");

              return (
                <div key={day.id} className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                    {day.dayNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs sm:text-sm text-[#1e3a5f]">
                      {dateStr} — {day.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-[#6b7280] mt-0.5 leading-relaxed break-words">
                      {activities}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Tour Operator Contact ── */}
        <section className="border border-[#d1d5db] rounded-lg p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <img src={trip.company.logoUrl} alt={trip.company.name} className="w-10 h-10 rounded-full" />
            <div className="min-w-0">
              <p className="font-bold text-sm">{trip.company.name}</p>
              <p className="text-xs text-[#6b7280]">{l.tel}: {trip.company.phone}</p>
              {trip.company.tatLicense && <p className="text-xs text-[#6b7280]">TAT License: {trip.company.tatLicense}</p>}
            </div>
          </div>
        </section>

        {/* Save as PDF */}
        <div className="flex justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-[#1e3a5f] text-white flex items-center gap-2 px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm font-bold"
          >
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            {l.savePdf}
            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">{l.official}</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center text-[#9ca3af] text-[10px] sm:text-xs pt-6 pb-24 sm:pb-12 space-y-2">
          <p>&copy; {new Date().getFullYear()} Travel Communication Platform</p>
          <Link href={`/t/${trip.slug}`} className="text-[#1e3a5f] font-semibold hover:underline text-xs">
            {l.backToTrip}
          </Link>
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white border-t border-[#e5e7eb] print:hidden">
        <Link href={`/t/${trip.slug}`} className="flex flex-col items-center text-[#9ca3af]">
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="text-[10px]">Trip</span>
        </Link>
        <span className="flex flex-col items-center text-[#1e3a5f]">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <span className="text-[10px] font-bold">Document</span>
        </span>
        <Link href={`/t/${trip.slug}/help`} className="flex flex-col items-center text-[#9ca3af]">
          <span className="material-symbols-outlined text-xl">support_agent</span>
          <span className="text-[10px]">Help</span>
        </Link>
      </nav>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, .print\\:hidden, button { display: none !important; }
          body { background: white !important; }
          main { padding-bottom: 0 !important; }
          section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
