"use client";

import { use } from "react";
import Link from "next/link";
import { getMockTrip, getMockDays } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { IconWrapper, FooterActionBar, QRCodeDisplay } from "@/components/shared";

export default function TripPreviewPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const trip = getMockTrip(id);
  const days = getMockDays(id);

  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  const tripUrl = `app.example.com/t/${trip.slug}`;
  const shareMessage = `สวัสดีค่ะ 🙏\nทริป ${trip.title} พร้อมแล้วค่ะ\nเปิดดู itinerary ได้ที่:\n👉 ${tripUrl}\n\nกด "ติดตาม" เพื่อรับแจ้งเตือนเมื่อมีการเปลี่ยนแปลงค่ะ 🔔`;

  return (
    <div className="flex flex-col min-h-screen">
      <TripStepperHeader currentStep={4} tripId={id} subtitle="ดูตัวอย่าง & เผยแพร่" />

      {/* ═══ Canvas Area ═══ */}
      <div className="flex-1 overflow-y-auto bg-(--surface-container-low) p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-(--on-surface) tracking-tight mb-1">ดูตัวอย่างก่อนเผยแพร่</h2>
              <p className="text-sm lg:text-base text-(--on-surface-variant)">ตรวจสอบทริปของคุณก่อนแชร์ให้ลูกทริป</p>
            </div>
          </div>

          {/* ═══ Main Grid ═══ */}
          <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left: Mobile Device Mockup */}
            <div className="col-span-12 lg:col-span-5 flex justify-center order-1">
              <div className="relative w-full max-w-[320px] aspect-320/650 bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] p-2 sm:p-3 border-[6px] sm:border-8 border-slate-800 shadow-2xl overflow-hidden">
                <div className="w-full h-full bg-white rounded-[1.8rem] sm:rounded-4xl overflow-hidden flex flex-col relative">
                  {/* Status Bar */}
                  <div className="h-8 w-full flex justify-between items-center px-6 pt-2">
                    <span className="text-[10px] font-bold">9:41</span>
                    <div className="flex gap-1">
                      <span className="material-symbols-outlined text-[10px]">signal_cellular_4_bar</span>
                      <span className="material-symbols-outlined text-[10px]">wifi</span>
                      <span className="material-symbols-outlined text-[10px]">battery_full</span>
                    </div>
                  </div>
                  {/* Scrollable Content — Mini Guest View */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* Hero Section */}
                    <div className="relative h-52 w-full overflow-hidden">
                      {trip.coverImageUrl && <img className="w-full h-full object-cover" src={trip.coverImageUrl} alt="" />}
                      <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/30 to-blue-900/20" />
                      {/* Floating decorative emoji */}
                      <div className="absolute top-4 right-4 text-2xl opacity-30 animate-bounce">✈️</div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        {/* Countdown badge */}
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[8px] font-bold mb-2">
                          <span>🔴</span> LIVE — อีก 20 วัน!
                        </div>
                        <h3 className="text-base font-extrabold leading-tight">{trip.title}</h3>
                        <p className="text-[9px] text-white/80 mt-0.5">
                          {trip.startDate && new Date(trip.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                          {trip.endDate && ` — ${new Date(trip.endDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`}
                          {" · "}{days.length} วัน
                        </p>
                        {/* Info badges */}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[7px] text-white/90 border border-white/10">👥 {trip.travelersCount}</span>
                          {trip.airlineInfo[0] && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[7px] text-white/90 border border-white/10">✈️ {trip.airlineInfo[0].airline}</span>}
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[7px] text-white/90 border border-white/10">🏨 {trip.accommodations.length}</span>
                        </div>
                        {/* Follow button */}
                        <button className="mt-2.5 w-full py-1.5 rounded-full bg-linear-to-r from-blue-600 to-blue-500 text-[9px] font-bold text-white flex items-center justify-center gap-1 shadow-lg shadow-blue-600/30">
                          ⭐ ติดตามทริปนี้
                        </button>
                      </div>
                    </div>

                    {/* Sticky Day Nav */}
                    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                      {days.map((day) => (
                        <button key={day.id} className={`shrink-0 px-2 py-1 rounded-lg text-[8px] font-bold whitespace-nowrap ${day.dayNumber === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {day.subtitle?.slice(0, 2) || "📅"} D{day.dayNumber}
                        </button>
                      ))}
                    </div>

                    {/* Day Cards + Activities */}
                    <div className="px-3 py-4 space-y-4">
                      {days.map((day, dayIdx) => {
                        const gradients = [
                          "from-blue-600 to-indigo-700",
                          "from-rose-500 to-pink-600",
                          "from-emerald-500 to-teal-600",
                          "from-amber-500 to-orange-600",
                        ];
                        const grad = gradients[dayIdx % gradients.length];
                        return (
                          <div key={day.id} className="rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                            {/* Day Header */}
                            <div className={`relative h-20 bg-linear-to-r ${grad} p-3 flex flex-col justify-end`}>
                              {day.coverImageUrl && <img className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" src={day.coverImageUrl} alt="" />}
                              <div className="relative flex items-center gap-2">
                                <span className="text-lg">{day.subtitle?.slice(0, 2) || "📅"}</span>
                                <div className="text-white">
                                  <p className="text-[8px] font-medium text-white/70">
                                    {day.date && new Date(day.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                                  </p>
                                  <h4 className="text-[11px] font-extrabold leading-tight">{day.title || `Day ${day.dayNumber}`}</h4>
                                </div>
                                <span className="ml-auto bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[7px] font-bold text-white">{day.activities.length} activities</span>
                              </div>
                            </div>
                            {/* Activities */}
                            <div className="p-2.5 space-y-2">
                              {day.activities.map((act) => (
                                <div key={act.id} className="flex gap-2 items-start">
                                  <div className="flex flex-col items-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1" />
                                    <div className="w-px flex-1 bg-slate-200" />
                                  </div>
                                  <div className="flex-1 min-w-0 pb-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm">{act.emoji}</span>
                                      {act.time && <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{act.time}</span>}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-800 leading-tight mt-0.5">{act.name}</p>
                                    {act.description && <p className="text-[8px] text-slate-400 line-clamp-1">{act.description}</p>}
                                  </div>
                                  {act.mapsLink && (
                                    <div className="shrink-0 w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                                      <span className="material-symbols-outlined text-[10px] text-slate-400">location_on</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Company Footer Mini */}
                      <div className="text-center py-4 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto">
                          <span className="material-symbols-outlined text-blue-600 text-sm">business</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-700">Amazing Tour Co.</p>
                        <p className="text-[7px] text-slate-400">TAT: 11/09876</p>
                        <div className="flex justify-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><span className="text-[8px]">📞</span></span>
                          <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><span className="text-[8px]">💬</span></span>
                        </div>
                        <p className="text-[6px] text-slate-300 mt-2">Powered by Trip Platform</p>
                      </div>
                    </div>
                  </div>
                  {/* Mobile Nav Bar */}
                  <div className="h-14 border-t border-slate-100 bg-white flex justify-around items-center px-4 shrink-0">
                    <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                    <span className="material-symbols-outlined text-slate-300">calendar_month</span>
                    <span className="material-symbols-outlined text-slate-300">map</span>
                    <span className="material-symbols-outlined text-slate-300">chat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sharing Controls */}
            <div className="col-span-12 lg:col-span-7 space-y-6 order-2">
              {/* Status Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">เผยแพร่แล้ว</h3>
                      <p className="text-sm text-slate-500">ทุกคนที่มีลิงก์สามารถเข้าดูได้</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">เปิดใช้งาน</span>
                </div>
              </div>

              {/* ลิงก์ทริป */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">link</span>
                  ลิงก์ทริป
                </h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-1 sm:pl-4 rounded-lg border border-slate-200">
                  <span className="text-sm text-slate-600 font-medium py-2 px-3 sm:p-0 truncate">{tripUrl}</span>
                  <div className="sm:ml-auto flex border-t sm:border-t-0 border-slate-200 sm:pt-0 pt-1">
                    <button className="flex-1 sm:flex-none px-4 py-2 bg-white text-slate-700 text-sm font-semibold rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">คัดลอก</button>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit Link">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="bg-white border-8 border-slate-50 p-2 rounded-xl shadow-inner shrink-0">
                    <QRCodeDisplay url={`https://${tripUrl}`} size={160} />
                  </div>
                  <div className="flex-1 space-y-4 text-center sm:text-left">
                    <h3 className="font-bold text-slate-900">QR Code</h3>
                    <p className="text-sm text-slate-500">สร้าง QR Code สำหรับพิมพ์หรือแปะบนเอกสาร</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">download</span> ดาวน์โหลด PNG
                      </button>
                      <button className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">PNG มาตรฐาน</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* แชร์ให้ลูกทริป */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">แชร์ให้ลูกทริป</h3>
                <div className="space-y-4">
                  {/* LINE Message */}
                  <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <IconWrapper icon="chat" size="md" color="bg-[#06C755] text-white" />
                      <div className="flex-1 w-full">
                        <h4 className="font-bold text-slate-900 text-sm">ข้อความ LINE สำเร็จรูป</h4>
                        <p className="text-xs text-slate-500 mt-1 mb-4 italic whitespace-pre-line">&ldquo;{shareMessage.slice(0, 120)}...&rdquo;</p>
                        <button className="w-full py-2.5 bg-[#06C755] text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                          คัดลอกข้อความ LINE
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Email + Share */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button className="flex-1 py-2 px-4 border border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-xl text-blue-500">mail</span>
                      <span className="text-sm font-semibold">ส่งอีเมล</span>
                    </button>
                    <button className="flex-1 py-2 px-4 border border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-xl text-blue-400">share</span>
                      <span className="text-sm font-semibold">แชร์</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Read Receipt Link */}
              <Link
                href={ROUTES.tripReceipts(id)}
                className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-blue-200 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <IconWrapper icon="analytics" size="md" color="bg-blue-50 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">สถานะการรับทราบ</h3>
                      <p className="text-xs text-slate-500">ดูว่าใครรับทราบการเปลี่ยนแปลงแล้ว</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">arrow_forward</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <FooterActionBar
        backHref={ROUTES.tripEdit(id)}
        backLabel="กลับหน้ากิจกรรม"
        nextHref={ROUTES.dashboard}
        nextLabel="เผยแพร่ทริป"
        nextVariant="success"
      />
    </div>
  );
}
