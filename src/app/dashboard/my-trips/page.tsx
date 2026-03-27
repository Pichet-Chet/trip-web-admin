"use client";

import { useState } from "react";
import Link from "next/link";
import { mockTrips } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { FilterTabs } from "@/components/shared";
import type { TripPlan, TripStatus, TransportType } from "@/types";

type FilterTab = "all" | "draft" | "published" | "unpublished";

const statusLabel: Record<TripStatus, { text: string; bg: string; badge: string }> = {
  published: { text: "LIVE", bg: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  draft: { text: "DRAFT", bg: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  unpublished: { text: "CLOSED", bg: "bg-slate-400", badge: "bg-slate-100 text-slate-500" },
};

const transportIcon: Record<TransportType, { icon: string; label: string }> = {
  flight: { icon: "flight", label: "เครื่องบิน" },
  van: { icon: "airport_shuttle", label: "รถตู้" },
  bus: { icon: "directions_bus", label: "รถบัส" },
  train: { icon: "train", label: "รถไฟ" },
  boat: { icon: "directions_boat", label: "เรือ" },
  car: { icon: "directions_car", label: "รถยนต์" },
};

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "ยังไม่กำหนดวัน";
  const s = new Date(start);
  const fmt = (d: Date): string => d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  if (!end) return fmt(s);
  const e = new Date(end);
  return `${fmt(s)} — ${fmt(e)}`;
}

function TripCard({ trip }: { trip: TripPlan }): React.ReactNode {
  const s = statusLabel[trip.status];
  const t = transportIcon[trip.transportType];
  const href = trip.status === "draft" ? ROUTES.tripEdit(trip.id) : `/dashboard/trips/${trip.id}/manage`;

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden flex flex-col">
      {/* ── Cover ── */}
      <div className="relative aspect-16/10 overflow-hidden">
        {trip.coverImageUrl ? (
          <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">landscape</span>
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`${s.bg} text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm`}>{s.text}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Title */}
        <Link href={href} className="min-w-0">
          <h3 className="font-bold text-[15px] text-slate-900 leading-snug line-clamp-1 group-hover:text-(--primary) transition-colors">{trip.title}</h3>
        </Link>

        {/* Meta line: destination · transport · travelers */}
        <p className="text-[12px] text-slate-400 mt-1">
          {trip.destination || "ยังไม่ระบุ"} · {t.label} · {trip.travelersCount} คน
        </p>

        {/* Summary line */}
        <p className="text-[11px] text-slate-400 mt-1.5">
          {trip.dayCount} วัน · {trip.activityCount} กิจกรรม
          {trip.accommodations.length > 0 && ` · ${trip.accommodations.length} ที่พัก`}
          {trip.followerCount > 0 && ` · ${trip.followerCount} ผู้ติดตาม`}
        </p>

        <div className="flex-1" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
          <div className="flex gap-1">
            <Link href={href} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </Link>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
              <span className="material-symbols-outlined text-[16px]">more_vert</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyTripsPage(): React.ReactNode {
  const [filter, setFilter] = useState<FilterTab>("all");
  const filtered = filter === "all" ? mockTrips : mockTrips.filter((t) => t.status === filter);

  return (
    <>
      {/* Header */}
      <header className="h-20 px-4 md:px-10 flex justify-between items-center sticky top-0 bg-white/70 backdrop-blur-xl z-30 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Trips</h1>
          <p className="text-[11px] text-slate-400 font-medium">{mockTrips.length} ทริปทั้งหมด</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input className="bg-slate-50 border-none rounded-full py-2.5 pl-10 pr-5 text-sm w-56 focus:ring-2 focus:ring-(--primary)/20 outline-none" placeholder="ค้นหาทริป..." />
          </div>
          <Link
            href={ROUTES.tripNew}
            className="bg-(--primary) text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-(--primary)/20"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="hidden sm:inline">สร้างทริปใหม่</span>
          </Link>
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 space-y-6">
        {/* Filter */}
        <FilterTabs
          tabs={[
            { value: "all" as FilterTab, label: "ทั้งหมด" },
            { value: "published" as FilterTab, label: "เผยแพร่แล้ว" },
            { value: "draft" as FilterTab, label: "ร่าง" },
            { value: "unpublished" as FilterTab, label: "ปิดแล้ว" },
          ]}
          active={filter}
          onChange={setFilter}
        />

        {/* Trip Grid — 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}

          {/* + Create Card */}
          <Link
            href={ROUTES.tripNew}
            className="group rounded-[1.25rem] border-2 border-dashed border-slate-200 hover:border-(--primary)/40 flex flex-col items-center justify-center min-h-70 transition-all duration-300 hover:bg-(--primary)/3"
          >
            <div className="w-12 h-12 rounded-xl bg-(--primary)/8 flex items-center justify-center text-(--primary) group-hover:scale-110 transition-transform mb-3">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <p className="font-bold text-slate-700 text-sm">สร้างทริปใหม่</p>
            <p className="text-[11px] text-slate-400 mt-0.5">เริ่มต้นวางแผนทริปถัดไป</p>
          </Link>
        </div>
      </div>
    </>
  );
}
