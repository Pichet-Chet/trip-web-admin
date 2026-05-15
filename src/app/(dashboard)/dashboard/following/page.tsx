"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { EmptyState } from "@/components/shared";

interface FollowedTrip {
  tripId: string;
  title: string;
  slug: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  status: string;
  operatorName: string;
  followerCount: number;
  followedAt: string;
}

type TripStatus = "upcoming" | "active" | "completed";
type TabFilter = "all" | TripStatus;

function deriveStatus(start: string, end: string): TripStatus {
  const now = Date.now();
  const startMs = new Date(start + "T00:00:00").getTime();
  const endMs = new Date(end + "T23:59:59").getTime();
  if (now < startMs) return "upcoming";
  if (now > endMs) return "completed";
  return "active";
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T23:59:59");
  const fmt = (d: Date) => d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  return `${fmt(s)} — ${fmt(e)}`;
}

function getDaysUntil(start: string): number {
  return Math.ceil((new Date(start + "T00:00:00").getTime() - Date.now()) / 86_400_000);
}

export default function FollowingPage(): React.ReactNode {
  usePageTitle("ทริปที่ติดตาม");
  const [trips, setTrips] = useState<FollowedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<FollowedTrip[]>("/admin/me/following")
      .then(setTrips)
      .catch((err) => setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const enriched = useMemo(() =>
    trips.map((t) => ({ ...t, tripStatus: deriveStatus(t.startDate, t.endDate) })),
    [trips]
  );

  const counts = useMemo(() => ({
    all: enriched.length,
    upcoming: enriched.filter((t) => t.tripStatus === "upcoming").length,
    active: enriched.filter((t) => t.tripStatus === "active").length,
    completed: enriched.filter((t) => t.tripStatus === "completed").length,
  }), [enriched]);

  const filtered = useMemo(() =>
    enriched
      .filter((t) => activeTab === "all" || t.tripStatus === activeTab)
      .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const order: Record<TripStatus, number> = { active: 0, upcoming: 1, completed: 2 };
        if (order[a.tripStatus] !== order[b.tripStatus]) return order[a.tripStatus] - order[b.tripStatus];
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }),
    [enriched, activeTab, search]
  );

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <h1 className="text-2xl font-black text-(--on-surface)">ทริปที่ติดตาม</h1>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-(--outline) text-lg">search</span>
          <input
            className="w-full bg-white border border-(--outline-variant)/30 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary)"
            placeholder="ค้นหาทริป..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {([
          { tab: "all" as TabFilter, label: "ทั้งหมด", value: counts.all, icon: "luggage" },
          { tab: "upcoming" as TabFilter, label: "กำลังจะถึง", value: counts.upcoming, icon: "flight_takeoff" },
          { tab: "active" as TabFilter, label: "เดินทาง", value: counts.active, icon: "explore" },
          { tab: "completed" as TabFilter, label: "เสร็จสิ้น", value: counts.completed, icon: "check_circle" },
        ]).map((s) => (
          <button
            key={s.tab}
            onClick={() => setActiveTab(s.tab)}
            className={`shrink-0 flex items-center gap-2 rounded-2xl px-4 py-3 transition-all ${
              activeTab === s.tab
                ? "bg-(--primary) text-white shadow-lg"
                : "bg-white text-(--on-surface-variant) border border-(--outline-variant)/20 hover:border-(--primary)/20"
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={activeTab === s.tab ? { fontVariationSettings: "'FILL' 1" } : undefined}>{s.icon}</span>
            <div className="text-left">
              <p className="text-lg font-extrabold leading-none">{s.value}</p>
              <p className={`text-[10px] font-medium mt-0.5 ${activeTab === s.tab ? "text-white/70" : "text-(--on-surface-variant)"}`}>{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Trip list */}
      {filtered.length === 0 ? (
        trips.length === 0 ? (
          <EmptyState
            icon="travel_explore"
            title="ยังไม่ได้ติดตามทริปไหน"
            description="เปิดลิงก์ทริปจากไกด์แล้วกดติดตามเพื่อรับการแจ้งเตือน"
          />
        ) : (
          <EmptyState icon="filter_list_off" title="ไม่พบทริปในหมวดนี้" description="ลองเปลี่ยนตัวกรอง" />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((trip) => {
            const daysUntil = getDaysUntil(trip.startDate);
            return (
              <Link
                key={trip.tripId}
                href={`/dashboard/following/${trip.slug}`}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {trip.coverImageUrl ? (
                    <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-(--surface-variant)">
                      <span className="material-symbols-outlined text-5xl text-(--outline-variant)">landscape</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                  <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-white ${
                    trip.tripStatus === "upcoming" ? "bg-(--primary)/80"
                    : trip.tripStatus === "active" ? "bg-emerald-500/80"
                    : "bg-black/40"
                  }`}>
                    {trip.tripStatus === "upcoming" ? "กำลังจะถึง" : trip.tripStatus === "active" ? "กำลังเดินทาง" : "เสร็จสิ้น"}
                  </span>
                  {trip.tripStatus === "upcoming" && daysUntil > 0 && (
                    <div className="absolute top-3 right-3 bg-white/90 text-(--primary) text-xs font-bold px-2.5 py-1 rounded-full">
                      อีก {daysUntil} วัน
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[15px] text-(--on-surface) line-clamp-1 group-hover:text-(--primary) transition-colors">{trip.title}</h3>
                  <p className="text-xs text-(--on-surface-variant) mt-1">{trip.destination} · {trip.operatorName}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-(--outline-variant)/20">
                    <span className="text-[11px] text-(--outline) flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </span>
                    <span className="text-[11px] text-(--outline) flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">bookmark</span>
                      {trip.followerCount}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
