"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { FilterTabs, IconButton, EmptyState, ConfirmDialog, OperatorUnlockModal } from "@/components/shared";
import { Badge } from "@pichetch08/trip-ui";
import { api } from "@/lib/api";
import { subscribe, type UserInfo } from "@/lib/auth";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { TRIP_STATUS_CONFIG, tripStatusLabel } from "@/lib/trip-status";

type FilterTab = "all" | "draft" | "published" | "active";

interface Trip {
  id: string;
  title: string;
  scope: string;
  destination: string;
  countryCode: string | null;
  categories: { id: string; nameTh: string; icon?: string }[];
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  status: string;
  travelersCount: number;
  followerCount: number;
  viewCount: number;
  createdAt: string;
  hasRejectionItems: boolean;
  publishedAt: string | null;
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

interface FollowedTrip {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  coverImageUrl: string | null;
  status: string;
  operatorName: string;
  operatorLogoUrl: string | null;
  followerCount: number;
}

// ─── Member dashboard ────────────────────────────────────────────────────────

function MemberDashboard({ user, onUnlock }: { user: UserInfo | null; onUnlock: () => void }) {
  const [followed, setFollowed] = useState<FollowedTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<FollowedTrip[]>("/admin/followers/following")
      .then(setFollowed)
      .catch(() => {/* silently ignore */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-10">
      {/* Greeting + Upgrade CTA */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -left-10 -bottom-20 w-72 h-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-extrabold text-(--on-surface) mb-2">
              สวัสดี {user?.firstName || ""} 👋
            </h2>
            <p className="text-(--on-surface-variant) max-w-lg">
              คุณกำลังติดตามทริปและสถานที่ที่น่าสนใจ อยากจัดทริปเองด้วยไหม?
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={onUnlock}
              className="flex items-center gap-3 bg-(--primary) text-white px-7 py-4 rounded-full font-bold text-sm shadow-lg hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
              เริ่มสร้างทริป
            </button>
            <p className="text-[11px] text-(--on-surface-variant) mt-2 text-center">ฟรีสูงสุด 3 ทริป</p>
          </div>
        </div>
      </section>

      {/* Followed trips */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-(--on-surface)">ทริปที่ติดตาม</h3>
          <Link href="/dashboard/following" className="text-xs font-bold text-(--primary) hover:underline flex items-center gap-1">
            ดูทั้งหมด <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="text-(--outline) animate-pulse text-sm">กำลังโหลด...</div>
        ) : followed.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title="ยังไม่ได้ติดตามทริปไหน"
            description="ค้นหาทริปที่น่าสนใจแล้วกด Follow เพื่อติดตามอัปเดต"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {followed.slice(0, 6).map((trip) => (
              <Link
                key={trip.id}
                href={`/t/${trip.id}`}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-(--outline-variant)/60 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative aspect-16/10 overflow-hidden">
                  {trip.coverImageUrl ? (
                    <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-(--surface-variant) to-(--outline-variant)/40 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-(--outline-variant)">landscape</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
                    {tripStatusLabel(trip.status)}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-bold text-[15px] text-(--on-surface) leading-snug line-clamp-1 group-hover:text-(--primary) transition-colors">{trip.title}</h4>
                  <p className="text-[12px] text-(--outline) mt-1">{trip.destination}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-(--outline-variant)/20">
                    <div className="w-5 h-5 rounded-full bg-(--primary-container) flex items-center justify-center text-[9px] font-bold text-(--on-primary-container) shrink-0">
                      {trip.operatorName.charAt(0)}
                    </div>
                    <span className="text-[11px] text-(--on-surface-variant) truncate">{trip.operatorName}</span>
                    <span className="ml-auto text-[11px] text-(--outline) flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">bookmark</span>
                      {trip.followerCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/dashboard/following", icon: "bookmark", label: "ทริปที่ติดตาม" },
          { href: "/dashboard/saved", icon: "favorite", label: "สถานที่บันทึก" },
          { href: ROUTES.profile, icon: "person", label: "โปรไฟล์" },
          { href: "/dashboard/support/tickets", icon: "support_agent", label: "ตั๋วสนับสนุน" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-(--outline-variant)/30 hover:border-(--primary)/30 hover:shadow-md transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-(--on-surface-variant) group-hover:text-(--primary) transition-colors">{item.icon}</span>
            <span className="text-xs font-bold text-(--on-surface-variant) group-hover:text-(--primary) transition-colors text-center">{item.label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

// ─── Operator dashboard ──────────────────────────────────────────────────────

// ─── Onboarding types ────────────────────────────────────────────────────────

interface OnboardingItem {
  key: string;
  label: string;
  points: number;
  completed: boolean;
  href: string;
  hidden: boolean;
}
interface OnboardingData { score: number; items: OnboardingItem[]; }

const ONBOARDING_HIDE_KEY = "onboarding_hidden_until";

function OnboardingBanner({ data, onHide }: { data: OnboardingData; onHide: () => void }) {
  const visible = data.items.filter(i => !i.hidden);
  const done = visible.filter(i => i.completed).length;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm">ตั้งค่าโปรไฟล์ให้สมบูรณ์ ({done}/{visible.length})</p>
            <p className="text-xs text-amber-700 mt-0.5">เพื่อให้นักเดินทางเจอทริปของคุณได้ง่ายขึ้น</p>
          </div>
        </div>
        <button
          onClick={onHide}
          className="text-amber-400 hover:text-amber-600 shrink-0"
          aria-label="ซ่อน"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-amber-700">
          <span>ความสมบูรณ์</span>
          <span className="font-bold">{data.score}%</span>
        </div>
        <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${data.score}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visible.map(item => (
          <Link
            key={item.key}
            href={item.completed ? "#" : item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
              item.completed
                ? "bg-amber-100/60 text-amber-700 cursor-default pointer-events-none"
                : "bg-white border border-amber-200 text-amber-900 hover:border-amber-400 hover:bg-amber-50"
            }`}
          >
            <span className={`material-symbols-outlined text-base shrink-0 ${item.completed ? "text-emerald-500" : "text-amber-400"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {item.completed ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className="font-medium flex-1">{item.label}</span>
            {!item.completed && <span className="text-xs text-amber-500">+{item.points}pts</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Operator dashboard ───────────────────────────────────────────────────────

function OperatorDashboard({ user }: { user: UserInfo | null }) {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [apiError, setApiError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

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

    // Onboarding banner: fetch + check localStorage hide flag
    const hiddenUntil = localStorage.getItem(ONBOARDING_HIDE_KEY);
    const isHidden = hiddenUntil && new Date(hiddenUntil) > new Date();
    if (!isHidden) {
      api.get<OnboardingData>("/admin/me/onboarding")
        .then(data => {
          if (data.score < 100) {
            setOnboarding(data);
            setOnboardingVisible(true);
          }
        })
        .catch(() => { /* non-blocking */ });
    }
  }, []);

  function handleHideOnboarding() {
    const until = new Date();
    until.setDate(until.getDate() + 7);
    localStorage.setItem(ONBOARDING_HIDE_KEY, until.toISOString());
    setOnboardingVisible(false);
  }

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
  const quotaPercent = usage && !usage.hasActiveSubscription
    ? Math.min(100, Math.round(((usage.tripQuotaUsed + usage.creditsUsed) / Math.max(1, usage.tripQuotaLimit + usage.creditsTotal)) * 100))
    : 0;
  const quotaFull = usage
    ? usage.remainingTrips <= 0 && (usage.creditsRemaining ?? 0) <= 0 && !usage.hasActiveSubscription
    : false;

  const sortedTrips = [...filteredTrips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function refreshUsage() {
    try {
      const u = await api.get<Usage>("/admin/usage");
      setUsage(u);
    } catch { /* ignore */ }
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-12">

      {apiError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">error</span>
          <p className="text-sm text-red-700 flex-1">{apiError}</p>
          <button onClick={() => setApiError("")} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-lg">close</span></button>
        </div>
      )}

      {/* Onboarding banner */}
      {onboardingVisible && onboarding && (
        <OnboardingBanner data={onboarding} onHide={handleHideOnboarding} />
      )}

      {/* Rejection alert banner */}
      {trips.some((t) => t.hasRejectionItems) && (
        <div className="flex items-start gap-4 p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
          <span className="material-symbols-outlined text-red-500 text-2xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-red-800 text-sm">
              {trips.filter((t) => t.hasRejectionItems).length === 1
                ? "มี 1 ทริปที่ไม่ผ่านการตรวจสอบ"
                : `มี ${trips.filter((t) => t.hasRejectionItems).length} ทริปที่ไม่ผ่านการตรวจสอบ`}
            </p>
            <p className="text-xs text-red-600 mt-0.5">ทีมงานได้แจ้งรายละเอียดที่ต้องแก้ไข กรุณาเปิดทริปเพื่อดูรายการ</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {trips.filter((t) => t.hasRejectionItems).map((t) => (
                <Link
                  key={t.id}
                  href={`/dashboard/trips/${t.id}/preview`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  {t.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding (0 trips) */}
      {showOnboarding && (
        <section className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-indigo-50" />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -left-10 -bottom-20 w-72 h-72 rounded-full bg-indigo-200/30 blur-3xl" />
          <div className="relative z-10 p-8 md:p-12 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-(--on-surface) mb-3">
              สวัสดี {user?.firstName || ""}
            </h2>
            <p className="text-(--on-surface-variant) mb-10 max-w-lg">เริ่มจากตั้งค่าโปรไฟล์ แล้วสร้างทริปแรก</p>
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
                    s.done ? "bg-white/60 border-transparent" : "bg-white border-(--primary)/20 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                    s.done ? "bg-green-500 text-white" : "bg-(--primary) text-white"
                  }`}>
                    {s.done ? <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> : s.step}
                  </div>
                  <div>
                    <p className={`font-bold ${s.done ? "text-(--on-surface-variant) line-through" : "text-(--on-surface)"}`}>{s.title}</p>
                    <p className={`text-sm mt-0.5 ${s.done ? "text-(--outline-variant)" : "text-(--on-surface-variant)"}`}>{s.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hero Bento */}
      <section className="grid grid-cols-12 gap-6 lg:h-105">
        <div className="col-span-12 lg:col-span-7 relative overflow-hidden rounded-[2.5rem] bg-(--primary) group cursor-pointer shadow-2xl shadow-(--primary)/10 aspect-video lg:aspect-auto">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-blue-700 to-indigo-900" />
          <div className="absolute inset-0 bg-linear-to-tr from-(--primary) via-(--primary)/40 to-transparent" />
          <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-white/10 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-300/10 blur-3xl" />
          <div className="relative h-full flex flex-col justify-end p-6 md:p-12 text-(--on-primary)">
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">สร้างทริปใหม่</h2>
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

        <div className="col-span-12 lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          <Link href={ROUTES.usage} className="group relative bg-slate-900 rounded-4xl p-6 md:p-8 flex flex-col justify-between text-white shadow-xl overflow-hidden min-h-48">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {usage?.tier || "free"} Plan
                </span>
                <span className="text-white/40 text-xs font-bold">
                  {usage?.hasActiveSubscription
                    ? `${(usage?.tripQuotaUsed ?? 0) + (usage?.creditsUsed ?? 0)} / ∞ ทริป`
                    : `${(usage?.tripQuotaUsed ?? 0) + (usage?.creditsUsed ?? 0)} / ${(usage?.tripQuotaLimit ?? 3) + (usage?.creditsTotal ?? 0)} ทริป`}
                </span>
              </div>
              <div className="mt-6 flex items-center gap-3">
                {(() => {
                  const avatarUrl = user?.companies?.find((c) => c.id === user.companyId)?.logoUrl;
                  return avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {user?.firstName?.charAt(0) || "?"}
                    </div>
                  );
                })()}
                <div>
                  <p className="text-white/60 text-xs font-medium">{user?.companyName}</p>
                  <p className="text-lg font-bold leading-tight">{user ? `${user.firstName} ${user.lastName}` : "..."}</p>
                </div>
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

          <div className="bg-white rounded-4xl p-6 md:p-8 flex flex-col justify-between shadow-sm border border-(--outline-variant)/30">
            <div className="flex justify-between items-start mb-4 lg:mb-0">
              <span className="text-(--outline) text-xs font-bold uppercase tracking-wider">ทริปทั้งหมด</span>
              <span className="text-xs font-bold text-(--outline-variant)">
                {usage?.hasActiveSubscription
                  ? `${(usage?.tripQuotaUsed ?? 0) + (usage?.creditsUsed ?? 0)}/∞`
                  : `${(usage?.tripQuotaUsed ?? 0) + (usage?.creditsUsed ?? 0)}/${(usage?.tripQuotaLimit ?? 3) + (usage?.creditsTotal ?? 0)}`}
              </span>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-black text-(--on-surface)">{trips.length}</p>
              <p className="text-(--outline) font-medium mt-1 text-sm">
                {usage?.publishedCount || 0} เผยแพร่ · {usage?.draftCount || 0} ร่าง
              </p>
              {quotaFull && (
                <p className="text-red-500 text-xs font-bold mt-2">โควต้าเต็ม — อัปเกรดเพื่อสร้างทริปเพิ่ม</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trip Management */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <h3 className="text-2xl md:text-3xl font-black text-(--on-surface)">ทริปของคุณ</h3>
          {trips.length > 0 && (
            <FilterTabs
              tabs={[
                { id: "all" as FilterTab, label: `ทั้งหมด (${trips.length})` },
                { id: "draft" as FilterTab, label: `ร่าง (${trips.filter(t => t.status === "Draft").length})` },
                { id: "published" as FilterTab, label: `เผยแพร่ (${trips.filter(t => t.status === "Published").length})` },
                { id: "active" as FilterTab, label: "กำลังเดินทาง" },
              ]}
              activeTab={filter}
              onTabChange={(v) => setFilter(v as FilterTab)}
            />
          )}
        </div>

        {sortedTrips.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {sortedTrips.map((trip) => {
              const isDraft = trip.status === "Draft";
              const isRejected = isDraft && trip.hasRejectionItems;
              const effectiveStatus = isRejected ? "rejected" : trip.status.toLowerCase();
              const hasPublishedSnapshot = !!trip.publishedAt;
              return (
                <div
                  key={trip.id}
                  onClick={() => router.push(`/dashboard/trips/new?id=${trip.id}`)}
                  className={`group bg-white rounded-3xl overflow-hidden transition-all duration-300 flex flex-col sm:flex-row border hover:shadow-xl cursor-pointer ${isRejected ? "border-red-200 hover:border-red-300 hover:shadow-red-100/50" : "border-(--outline-variant)/30 hover:border-(--primary)/20 hover:shadow-(--primary)/5"}`}
                >
                  {/* Cover image — flush left, full height */}
                  <div className={`sm:w-52 md:w-56 shrink-0 ${isDraft ? "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" : ""}`}>
                    <div className="h-44 sm:h-full min-h-[8rem] relative">
                      {trip.coverImageUrl ? (
                        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={trip.coverImageUrl} alt={trip.title} />
                      ) : (
                        <div className="w-full h-full bg-(--surface-dim) flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-(--outline)">photo_camera</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col gap-2.5 min-w-0">
                    {/* Status badges — all use Badge for consistent pill style */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        size="sm"
                        variant={
                          effectiveStatus === "rejected" ? "error"
                          : effectiveStatus === "unpublished" ? "error"
                          : effectiveStatus === "published" ? "success"
                          : effectiveStatus === "archived" ? "default"
                          : "warning"
                        }
                      >
                        {TRIP_STATUS_CONFIG[effectiveStatus]?.label ?? effectiveStatus}
                      </Badge>
                      {isDraft && hasPublishedSnapshot && (
                        <Badge variant="success" size="sm">เผยแพร่อยู่</Badge>
                      )}
                      <Badge variant={trip.scope === "international" ? "info" : "secondary"} size="sm">
                        {trip.scope === "international" ? "ต่างประเทศ" : "ในประเทศ"}
                      </Badge>
                      {trip.countryCode && (
                        <Badge variant="default" size="sm">{trip.countryCode}</Badge>
                      )}
                      {isRejected && (
                        <Link
                          href={`/dashboard/trips/${trip.id}/preview`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full border border-red-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">warning</span>
                          ต้องแก้ไข
                        </Link>
                      )}
                    </div>

                    {/* Category chips */}
                    {trip.categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {trip.categories.slice(0, 3).map((cat) => (
                          <span key={cat.id} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {cat.icon && <span>{cat.icon}</span>}
                            {cat.nameTh}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title + destination */}
                    <div>
                      <h4 className="text-lg md:text-xl font-extrabold text-(--on-surface) leading-tight line-clamp-1 group-hover:text-(--primary) transition-colors">{trip.title}</h4>
                      <p className="text-(--on-surface-variant) text-sm mt-0.5 line-clamp-1">{trip.destination}</p>
                    </div>

                    {/* Date range */}
                    {trip.startDate && (
                      <div className="flex items-center gap-1 text-xs text-(--outline)">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span>
                          {new Date(trip.startDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          {trip.endDate && (
                            <> — {new Date(trip.endDate + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Bottom bar: stats + actions */}
                    <div className="flex items-center gap-3 mt-auto pt-3 border-t border-(--outline-variant)/20">
                      {/* Stats */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs text-(--outline) flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-sm">group</span>
                          {trip.travelersCount} คน
                        </span>
                        {trip.followerCount > 0 && (
                          <span className="text-xs text-(--outline) flex items-center gap-1 shrink-0">
                            <span className="material-symbols-outlined text-sm">bookmark</span>
                            {trip.followerCount}
                          </span>
                        )}
                        {trip.viewCount > 0 && (
                          <span className="text-xs text-(--outline) flex items-center gap-1 shrink-0">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            {trip.viewCount.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Actions — stopPropagation so card click doesn't fire */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/dashboard/trips/new?id=${trip.id}`}>
                          <IconButton icon="edit" variant="primary" />
                        </Link>
                        {(hasPublishedSnapshot || !isDraft) && (
                          <Link href={`/dashboard/trips/${trip.id}/manage`}>
                            <IconButton icon="manage_accounts" variant="ghost" title="จัดการทริป" />
                          </Link>
                        )}
                        {isDraft && !hasPublishedSnapshot && (
                          <button
                            onClick={() => setDeleteTarget(trip)}
                            className="p-2 rounded-xl hover:bg-red-50 text-(--outline-variant) hover:text-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
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
            <span className="material-symbols-outlined text-5xl text-(--outline-variant) mb-4 block">luggage</span>
            <p className="text-(--outline) mb-6">ยังไม่มีทริป — สร้างทริปแรกกันเลย!</p>
            <Link href={ROUTES.tripNew} className="inline-flex items-center gap-2 bg-(--primary) text-white px-6 py-3 rounded-full font-bold hover:brightness-110 transition-all">
              <span className="material-symbols-outlined">add</span> สร้างทริป
            </Link>
          </div>
        )}
      </section>

      {/* Usage Insights */}
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
              {usage.hasActiveSubscription
                ? `ใช้ ${usage.tripQuotaUsed + usage.creditsUsed} ทริป (${usage.tier} Plan)`
                : `ใช้ ${usage.tripQuotaUsed + usage.creditsUsed} จาก ${usage.tripQuotaLimit + usage.creditsTotal} ทริป (${usage.tier} Plan)`}
            </p>
            <Link href={ROUTES.usage} className="bg-(--primary)/10 text-(--primary) px-6 py-3 rounded-full font-bold text-xs hover:bg-(--primary) hover:text-white transition-all mx-auto">
              {usage.hasActiveSubscription
                ? "ใช้งานไม่จำกัด"
                : (usage.remainingTrips + usage.creditsRemaining) > 0
                  ? `เหลือ ${usage.remainingTrips + usage.creditsRemaining} ทริป`
                  : "อัปเกรดแพลน"}
            </Link>
          </div>
        </section>
      )}

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

// ─── Root page ───────────────────────────────────────────────────────────────

export default function DashboardPage(): React.ReactNode {
  usePageTitle("Dashboard");
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => subscribe(setUser), []);

  // Still loading user info
  if (user === null) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
    </div>
  );

  return (
    <>
      {user.isOperator ? (
        <OperatorDashboard user={user} />
      ) : (
        <MemberDashboard
          user={user}
          onUnlock={() => setShowUnlockModal(true)}
        />
      )}

      <OperatorUnlockModal
        open={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onSuccess={() => {
          setShowUnlockModal(false);
          router.push(ROUTES.tripNew);
        }}
      />
    </>
  );
}
