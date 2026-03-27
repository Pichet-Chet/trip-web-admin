"use client";

import { useState } from "react";
import Link from "next/link";
import { mockTrips } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { StatusBadge, FilterTabs, IconButton } from "@/components/shared";

type FilterTab = "all" | "draft" | "published" | "active";

export default function DashboardPage(): React.ReactNode {
  const [filter, setFilter] = useState<FilterTab>("all");
  const filteredTrips = filter === "all"
    ? mockTrips
    : filter === "active"
      ? mockTrips.filter((t) => t.status === "published")
      : mockTrips.filter((t) => t.status === filter);

  return (
    <>
      {/* ═══ Header ═══ */}

      <div className="px-4 sm:px-6 md:px-8 py-8 space-y-12">
        {/* ═══ Hero Bento ═══ */}
        <section className="grid grid-cols-12 gap-6 lg:h-[420px]">
          {/* Large CTA Card */}
          <div className="col-span-12 lg:col-span-7 relative overflow-hidden rounded-[2.5rem] bg-(--primary) group cursor-pointer shadow-2xl shadow-(--primary)/10 aspect-video lg:aspect-auto">
            <img className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80" alt="" />
            <div className="absolute inset-0 bg-gradient-to-tr from-(--primary) via-(--primary)/60 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-6 md:p-12 text-(--on-primary)">
              <span className="inline-block w-fit px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">เริ่มต้น</span>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">สร้าง <br />ประสบการณ์ใหม่</h2>
              <Link href={ROUTES.tripNew} className="w-fit bg-white text-(--primary) px-6 md:px-8 py-3 md:py-4 rounded-full font-extrabold text-sm md:text-lg flex items-center gap-3 hover:bg-(--primary-container) transition-colors shadow-xl">
                <span className="material-symbols-outlined">add_circle</span>
                สร้างทริปใหม่
              </Link>
            </div>
          </div>

          {/* Membership Card + Stats */}
          <div className="col-span-12 lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
            {/* Membership Card */}
            <Link href="/dashboard/upgrade" className="group relative bg-slate-900 rounded-4xl p-6 md:p-8 flex flex-col justify-between text-white shadow-xl overflow-hidden min-h-48">
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-blue-600 rounded-md text-[10px] font-bold tracking-widest uppercase">Free Plan</span>
                  <span className="text-white/40 text-xs font-bold">2 / 3 ทริป</span>
                </div>
                <div className="mt-6">
                  <p className="text-white/60 text-xs font-medium mb-1">Amazing Tour Co.</p>
                  <p className="text-lg font-bold">สมชาย ใจดี</p>
                </div>
              </div>
              <div className="relative z-10 flex justify-between items-end mt-6">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">สมาชิกตั้งแต่</p>
                  <p className="text-sm font-semibold">ม.ค. 2569</p>
                </div>
                <span className="text-white/30 group-hover:text-white/60 transition-colors text-xs font-bold flex items-center gap-1">
                  อัปเกรด <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
              <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl" />
            </Link>

            {/* Read Receipt Stat */}
            <div className="bg-white rounded-4xl p-6 md:p-8 flex flex-col justify-between shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4 lg:mb-0">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">การรับทราบล่าสุด</span>
                <span className="text-xs font-bold text-slate-400">12/18 คน</span>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black text-slate-900">67%</p>
                <p className="text-slate-400 font-medium mt-1 text-sm">อัตราการรับทราบ</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Trip Management ═══ */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-(--on-surface) mb-2">ทริปที่กำลังดำเนินการ</h3>
              <p className="text-(--on-surface-variant) text-sm md:text-base">จัดการและติดตามการสื่อสารกับลูกทริป</p>
            </div>
            <FilterTabs
              tabs={[
                { value: "all" as FilterTab, label: "ทั้งหมด" },
                { value: "draft" as FilterTab, label: "ร่าง" },
                { value: "published" as FilterTab, label: "เผยแพร่แล้ว" },
                { value: "active" as FilterTab, label: "กำลังเดินทาง" },
              ]}
              active={filter}
              onChange={setFilter}
            />
          </div>

          {/* Trip List — Horizontal Cards */}
          <div className="grid grid-cols-1 gap-6">
            {filteredTrips.map((trip) => {
              const isDraft = trip.status === "draft";
              return (
                <div key={trip.id} className="group bg-(--surface-container-lowest) hover:bg-white rounded-3xl p-4 md:p-6 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8 border border-(--outline-variant)/30 hover:border-(--primary)/30 hover:shadow-2xl hover:shadow-(--primary)/5">
                  {/* Image */}
                  <div className={`w-full sm:w-48 h-40 sm:h-32 rounded-2xl overflow-hidden shrink-0 ${isDraft ? "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" : ""}`}>
                    {trip.coverImageUrl ? (
                      <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={trip.coverImageUrl} alt={trip.title} />
                    ) : (
                      <div className="w-full h-full bg-(--surface-dim) flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-(--outline)">photo_camera</span></div>
                    )}
                  </div>
                  {/* Info Grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center w-full">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3 mb-1">
                        <StatusBadge status={trip.status} />
                        {trip.startDate && <span className="text-(--on-surface-variant) text-[10px] font-medium">{new Date(trip.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      </div>
                      <h4 className="text-lg md:text-xl font-extrabold text-(--on-surface)">{trip.title}</h4>
                      <p className="text-(--on-surface-variant) text-sm line-clamp-1">{trip.destination} · {trip.travelersCount} คน</p>
                    </div>
                    {/* Guests */}
                    <div className="flex flex-row md:flex-col items-center justify-between md:justify-center">
                      <p className="text-xs text-(--on-surface-variant) uppercase tracking-tighter mb-1 font-bold hidden md:block">ลูกทริป</p>
                      {trip.followerCount > 0 ? (
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(3, trip.followerCount))].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-(--primary-container) flex items-center justify-center text-[10px] font-bold text-(--on-primary-container)">{String.fromCharCode(65 + i)}</div>
                          ))}
                          {trip.followerCount > 3 && <div className="w-8 h-8 rounded-full border-2 border-white bg-(--primary) text-white text-[10px] flex items-center justify-center font-bold">+{trip.followerCount - 3}</div>}
                        </div>
                      ) : <p className="text-sm font-bold text-(--on-surface-variant)">—</p>}
                    </div>
                    {/* Actions */}
                    <div className="flex flex-row md:flex-col items-end justify-end gap-2">
                      <Link href={isDraft ? ROUTES.tripEdit(trip.id) : ROUTES.tripManage(trip.id)}>
                        <IconButton icon="edit" variant="primary" />
                      </Link>
                      <IconButton icon="more_vert" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ Usage Insights ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="md:col-span-2 bg-(--surface-container-low)/50 rounded-[2.5rem] p-6 md:p-10 border border-(--outline-variant)/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h3 className="text-xl md:text-2xl font-black text-(--on-surface)">สถิติการสื่อสาร</h3>
              <div className="flex gap-4">
                <span className="flex items-center gap-2 text-xs font-bold text-(--on-surface-variant)"><span className="w-2 h-2 rounded-full bg-(--primary)" /> Read</span>
                <span className="flex items-center gap-2 text-xs font-bold text-(--on-surface-variant)"><span className="w-2 h-2 rounded-full bg-(--secondary)" /> Unread</span>
              </div>
            </div>
            <div className="h-48 flex items-end gap-2 md:gap-3 px-2 md:px-4">
              {[40, 15, 60, 10, 85, 5, 70, 12, 90, 4, 75, 10].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-lg transition-all hover:opacity-80 ${i % 2 === 0 ? "bg-(--primary)" : "bg-(--secondary)"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-4 px-2 md:px-4 text-[10px] text-(--on-surface-variant) font-bold">
              <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
            </div>
          </div>
          {/* Circular Progress */}
          <div className="col-span-1 bg-(--surface-container-lowest) rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-(--outline-variant)/30 flex flex-col justify-center text-center">
            <div className="mb-6 relative">
              <svg className="w-24 h-24 md:w-32 md:h-32 mx-auto" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eeedf2" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeDasharray="67, 100" strokeLinecap="round" strokeWidth="3" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl md:text-3xl font-black text-(--primary)">67%</span>
                <span className="text-[8px] font-bold text-(--on-surface-variant) uppercase">Quota</span>
              </div>
            </div>
            <h4 className="text-lg font-bold text-(--on-surface) mb-2">การใช้งานแพลน</h4>
            <p className="text-sm text-(--on-surface-variant) mb-6">คุณใช้ 2 จาก 3 trip slots (Free Plan)</p>
            <Link href={ROUTES.usage} className="bg-(--primary)/10 text-(--primary) px-6 py-3 rounded-full font-bold text-xs hover:bg-(--primary) hover:text-white transition-all mx-auto">อัปเกรดแพลน</Link>
          </div>
        </section>
      </div>
    </>
  );
}
