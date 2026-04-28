"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { StatusBadge, FilterTabs, IconButton, EmptyState, ConfirmDialog } from "@/components/shared";
import { api } from "@/lib/api";
import { getUser, type UserInfo } from "@/lib/auth";

type FilterTab = "all" | "draft" | "published" | "active";

interface Trip {
  id: string;
  title: string;
  scope: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  status: string;
  travelersCount: number;
  followerCount: number;
  viewCount: number;
  createdAt: string;
}

interface Usage {
  tier: string;
  tripQuotaUsed: number;
  tripQuotaLimit: number;
  remainingTrips: number;
  publishedCount: number;
  draftCount: number;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  hasActiveSubscription: boolean;
}

export default function DashboardPage(): React.ReactNode {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [apiError, setApiError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const u = getUser();
      if (u) { setUser(u); clearInterval(interval); }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<Trip[]>("/admin/trips"),
      api.get<Usage>("/admin/usage"),
    ]).then(([tripsData, usageData]) => {
      setTrips(tripsData);
      setUsage(usageData);
      setLoading(false);
    }).catch((err) => {
      setApiError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
      setLoading(false);
    });
  }, []);

  const filteredTrips = filter === "all"
    ? trips
    : filter === "active"
      ? trips.filter((t) => {
          if (t.status !== "Published") return false;
          const now = new Date();
          const start = new Date(t.startDate + "T00:00:00");
          const end = new Date(t.endDate + "T23:59:59");
          return now >= start && now <= end;
        })
      : trips.filter((t) => t.status.toLowerCase() === filter);

  const showOnboarding = !loading && trips.length === 0;
  const hasProfile = !!(user?.companyName);
  const quotaPercent = usage ? Math.min(100, Math.round((usage.tripQuotaUsed / usage.tripQuotaLimit) * 100)) : 0;
  // Quota "full" only when free + credits + subscription all exhausted
  const quotaFull = usage
    ? usage.remainingTrips <= 0 && (usage.creditsRemaining ?? 0) <= 0 && !usage.hasActiveSubscription
    : false;

  // Sort trips by createdAt desc
  const sortedTrips = [...filteredTrips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Refresh usage after trip changes
  async function refreshUsage() {
    try {
      const u = await api.get<Usage>("/admin/usage");
      setUsage(u);
    } catch { /* ignore */ }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-slate-400 animate-pulse">กำลังโหลด...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-12">

      {/* API Error */}
      {apiError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">error</span>
          <p className="text-sm text-red-700 flex-1">{apiError}</p>
          <button onClick={() => setApiError("")} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-lg">close</span></button>
        </div>
      )}

      {/* ═══ Onboarding (0 trips) ═══ */}
      {showOnboarding && (
        <section className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-indigo-50" />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -left-10 -bottom-20 w-72 h-72 rounded-full bg-indigo-200/30 blur-3xl" />
          <div className="relative z-10 p-8 md:p-12 max-w-3xl">
            <span className="inline-block px-3 py-1 bg-blue-600 rounded-md text-[10px] font-bold tracking-widest uppercase text-white mb-6">เริ่มต้นใช้งาน</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
              สวัสดี {user?.firstName || ""}!
            </h2>
            <p className="text-slate-500 mb-10 max-w-lg">สร้างแผนทริปแรกของคุณ แชร์ให้ลูกทริป แล้วระบบจะจัดการแจ้งเตือนให้อัตโนมัติ</p>
            <div className="space-y-3">
              {[
                { step: 1, title: "ตั้งค่าโปรไฟล์", desc: "ใส่ชื่อ โลโก้ ช่องทางติดต่อ เพื่อแสดงบนหน้าทริป", href: ROUTES.profile, done: hasProfile },
                { step: 2, title: "สร้างทริปแรก", desc: "เลือกในประเทศหรือต่างประเทศ ใส่ข้อมูลการเดินทาง ที่พัก กิจกรรม", href: ROUTES.tripNew, done: trips.length > 0 },
                { step: 3, title: "แชร์ให้ลูกทริป", desc: "เผยแพร่ทริป แล้วส่งลิงก์หรือ QR Code ให้ลูกทริปเปิดดู", href: "#", done: trips.some(t => t.status === "Published") },
              ].map((s) => (
                  <Link
                    key={s.step}
                    href={s.href}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                      s.done ? "bg-white/60 border-transparent" : "bg-white border-blue-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                      s.done ? "bg-green-500 text-white" : "bg-blue-600 text-white"
                    }`}>
                      {s.done ? <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : s.step}
                    </div>
                    <div>
                      <p className={`font-bold ${s.done ? "text-slate-500 line-through" : "text-slate-900"}`}>{s.title}</p>
                      <p className={`text-sm mt-0.5 ${s.done ? "text-slate-300" : "text-slate-500"}`}>{s.desc}</p>
                    </div>
                  </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Hero Bento ═══ */}
      <section className="grid grid-cols-12 gap-6 lg:h-105">
        {/* Large CTA Card */}
        <div className="col-span-12 lg:col-span-7 relative overflow-hidden rounded-[2.5rem] bg-(--primary) group cursor-pointer shadow-2xl shadow-(--primary)/10 aspect-video lg:aspect-auto">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-blue-700 to-indigo-900" />
          <div className="absolute inset-0 bg-linear-to-tr from-(--primary) via-(--primary)/40 to-transparent" />
          <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-white/10 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="relative h-full flex flex-col justify-end p-6 md:p-12 text-(--on-primary)">
            <span className="inline-block w-fit px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest mb-4 border border-white/20">เริ่มต้น</span>
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">สร้าง <br />ประสบการณ์ใหม่</h2>
            {quotaFull ? (
              <Link href={ROUTES.usage} className="w-fit bg-white text-red-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-extrabold text-sm md:text-lg flex items-center gap-3 shadow-xl">
                <span className="material-symbols-outlined">warning</span>
                โควต้าเต็ม — อัปเกรดแพลน
              </Link>
            ) : (
              <Link href={ROUTES.tripNew} className="w-fit bg-white text-(--primary) px-6 md:px-8 py-3 md:py-4 rounded-full font-extrabold text-sm md:text-lg flex items-center gap-3 hover:bg-(--primary-container) transition-colors shadow-xl">
                <span className="material-symbols-outlined">add_circle</span>
                สร้างทริปใหม่
              </Link>
            )}
          </div>
        </div>

        {/* Membership + Stats */}
        <div className="col-span-12 lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          {/* Membership Card */}
          <Link href={ROUTES.usage} className="group relative bg-slate-900 rounded-4xl p-6 md:p-8 flex flex-col justify-between text-white shadow-xl overflow-hidden min-h-48">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 bg-blue-600 rounded-md text-[10px] font-bold tracking-widest uppercase">
                  {usage?.tier || "free"} Plan
                </span>
                <span className="text-white/40 text-xs font-bold">
                  {usage?.tripQuotaUsed || 0} / {usage?.tripQuotaLimit || 3} ทริป
                </span>
              </div>
              <div className="mt-6">
                <p className="text-white/60 text-xs font-medium mb-1">{user?.companyName}</p>
                <p className="text-lg font-bold">{user ? `${user.firstName} ${user.lastName}` : "..."}</p>
              </div>
            </div>
            <div className="relative z-10 flex justify-between items-end mt-6">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{user?.role === "owner" ? "Owner" : "Editor"}</p>
              </div>
              <span className="text-white/30 group-hover:text-white/60 transition-colors text-xs font-bold flex items-center gap-1">
                ดูแพลน <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </div>
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
          </Link>

          {/* Trip Count Stat */}
          <div className="bg-white rounded-4xl p-6 md:p-8 flex flex-col justify-between shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4 lg:mb-0">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">ทริปทั้งหมด</span>
              <span className="text-xs font-bold text-slate-300">
                {usage?.hasActiveSubscription
                  ? `${(usage?.tripQuotaUsed ?? 0) + (usage?.creditsUsed ?? 0)}/∞`
                  : `${(usage?.tripQuotaUsed ?? 0) + (usage?.creditsUsed ?? 0)}/${(usage?.tripQuotaLimit ?? 3) + (usage?.creditsTotal ?? 0)}`}
              </span>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-slate-900">{trips.length}</p>
              <p className="text-slate-400 font-medium mt-1 text-sm">
                {usage?.publishedCount || 0} เผยแพร่ · {usage?.draftCount || 0} ร่าง
              </p>
              {quotaFull && (
                <p className="text-red-500 text-xs font-bold mt-2">โควต้าเต็ม — อัปเกรดเพื่อสร้างทริปเพิ่ม</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Trip Management ═══ */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-(--on-surface) mb-2">ทริปของคุณ</h3>
            <p className="text-(--on-surface-variant) text-sm md:text-base">จัดการและติดตามการสื่อสารกับลูกทริป</p>
          </div>
          {trips.length > 0 && (
            <FilterTabs
              tabs={[
                { value: "all" as FilterTab, label: `ทั้งหมด (${trips.length})` },
                { value: "draft" as FilterTab, label: `ร่าง (${trips.filter(t => t.status === "Draft").length})` },
                { value: "published" as FilterTab, label: `เผยแพร่ (${trips.filter(t => t.status === "Published").length})` },
                { value: "active" as FilterTab, label: "กำลังเดินทาง" },
              ]}
              active={filter}
              onChange={setFilter}
            />
          )}
        </div>

        {sortedTrips.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {sortedTrips.map((trip) => {
              const isDraft = trip.status === "Draft";
              return (
                <div key={trip.id} className="group bg-(--surface-container-lowest) hover:bg-white rounded-3xl p-4 md:p-6 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8 border border-(--outline-variant)/30 hover:border-(--primary)/30 hover:shadow-2xl hover:shadow-(--primary)/5">
                  <div className={`w-full sm:w-48 h-40 sm:h-32 rounded-2xl overflow-hidden shrink-0 ${isDraft ? "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" : ""}`}>
                    {trip.coverImageUrl ? (
                      <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={trip.coverImageUrl} alt={trip.title} />
                    ) : (
                      <div className="w-full h-full bg-(--surface-dim) flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-(--outline)">photo_camera</span></div>
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center w-full">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge status={trip.status.toLowerCase() as "draft" | "published" | "unpublished"} />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${trip.scope === "international" ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {trip.scope === "international" ? "ต่างประเทศ" : "ในประเทศ"}
                        </span>
                        {trip.startDate && (
                          <span className="text-(--on-surface-variant) text-[10px] font-medium">
                            {new Date(trip.startDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg md:text-xl font-extrabold text-(--on-surface)">{trip.title}</h4>
                      <p className="text-(--on-surface-variant) text-sm line-clamp-1">{trip.destination} · {trip.travelersCount} คน</p>
                    </div>
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
                    <div className="flex flex-row md:flex-col items-end justify-end gap-2">
                      <Link href={`/dashboard/trips/new?scope=edit&id=${trip.id}`}>
                        <IconButton icon="edit" variant="primary" />
                      </Link>
                      {isDraft && (
                        <button
                          onClick={() => setDeleteTarget(trip)}
                          className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : filteredTrips.length === 0 && trips.length > 0 ? (
          <EmptyState icon="filter_list" title="ไม่พบทริปในหมวดนี้" description="ลองเปลี่ยน filter ดู" />
        ) : (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">luggage</span>
            <p className="text-slate-400 mb-6">ยังไม่มีทริป — สร้างทริปแรกกันเลย!</p>
            <Link href={ROUTES.tripNew} className="inline-flex items-center gap-2 bg-(--primary) text-white px-6 py-3 rounded-full font-bold hover:brightness-110 transition-all">
              <span className="material-symbols-outlined">add</span> สร้างทริป
            </Link>
          </div>
        )}
      </section>

      {/* ═══ Usage Insights ═══ */}
      {usage && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 bg-(--surface-container-lowest) rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-(--outline-variant)/30 flex flex-col justify-center text-center">
            <div className="mb-6 relative">
              <svg className="w-24 h-24 md:w-32 md:h-32 mx-auto" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eeedf2" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeDasharray={`${quotaPercent}, 100`} strokeLinecap="round" strokeWidth="3" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl md:text-3xl font-black text-(--primary)">{quotaPercent}%</span>
                <span className="text-[8px] font-bold text-(--on-surface-variant) uppercase">Quota</span>
              </div>
            </div>
            <h4 className="text-lg font-bold text-(--on-surface) mb-2">การใช้งานแพลน</h4>
            <p className="text-sm text-(--on-surface-variant) mb-6">
              ใช้ {usage.tripQuotaUsed} จาก {usage.tripQuotaLimit} ทริป ({usage.tier} Plan)
            </p>
            <Link href={ROUTES.usage} className="bg-(--primary)/10 text-(--primary) px-6 py-3 rounded-full font-bold text-xs hover:bg-(--primary) hover:text-white transition-all mx-auto">
              {usage.remainingTrips > 0 ? `เหลือ ${usage.remainingTrips} ทริป` : "อัปเกรดแพลน"}
            </Link>
          </div>
        </section>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await api.delete(`/admin/trips/${deleteTarget.id}`);
            setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
            await refreshUsage();
          } catch (err) {
            setApiError(err instanceof Error ? err.message : "ลบทริปไม่สำเร็จ");
          }
          setDeleteTarget(null);
        }}
        title={`ลบ "${deleteTarget?.title || ""}"?`}
        description="ทริปและข้อมูลทั้งหมด (กิจกรรม ที่พัก สายการบิน) จะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบทริป"
        variant="danger"
      />
    </div>
  );
}
