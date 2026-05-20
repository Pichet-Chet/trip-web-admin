"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { FilterTabs, ConfirmDialog, useToast, EmptyState, OperatorUnlockModal } from "@/components/shared";
import { Badge, Button, IconButton } from "@pichetch08/trip-ui";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { getUser } from "@/lib/auth";

type FilterTab = "all" | "draft" | "pending_review" | "published" | "unpublished" | "archived";

interface TripCategory {
  id: string;
  slug: string;
  nameTh: string;
  icon?: string | null;
}

interface Trip {
  id: string;
  title: string;
  scope: string;
  destination: string;
  countryCode: string | null;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  status: string;
  travelersCount: number;
  followerCount: number;
  createdAt: string;
  /** H3.3 — Entitlement source consumed at create. */
  quotaSource?: string | null;
  publishedAt: string | null;
  categories?: TripCategory[];
}

const QUOTA_SOURCE_LABEL: Record<string, { text: string; cls: string; icon: string }> = {
  free:         { text: "ฟรี",            cls: "bg-(--surface-variant) text-(--on-surface-variant) border-(--outline-variant)/30",       icon: "card_giftcard" },
  per_trip:     { text: "ต่อทริป",         cls: "bg-sky-50 text-sky-700 border-sky-200",              icon: "credit_card" },
  pack_5:       { text: "แพ็ค 5",          cls: "bg-violet-50 text-violet-700 border-violet-200",     icon: "redeem" },
  subscription: { text: "Subscription",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  icon: "workspace_premium" },
};

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "ยังไม่กำหนดวัน";
  const s = new Date(start + "T00:00:00");
  const short = (d: Date): string => d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  const withYear = (d: Date): string => d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  if (!end) return withYear(s);
  const e = new Date(end + "T00:00:00");
  if (s.getFullYear() === e.getFullYear()) {
    return `${short(s)} — ${withYear(e)}`;
  }
  return `${withYear(s)} — ${withYear(e)}`;
}

export default function MyTripsPage(): React.ReactNode {
  usePageTitle("ทริปของฉัน");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [availableCategories, setAvailableCategories] = useState<TripCategory[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [quotaFull, setQuotaFull] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();

  function handleCreateTrip() {
    const user = getUser();
    if (!user?.isOperator) {
      setShowUnlockModal(true);
      return;
    }
    router.push(ROUTES.tripNew);
  }

  async function handleClone(trip: Trip) {
    if (cloning) return;
    if (quotaFull) {
      toast.error("Quota เต็ม — ซื้อเครดิตเพิ่มก่อน clone");
      return;
    }
    const ok = await confirm({
      title: `Clone "${trip.title}"?`,
      description: "• สร้างเป็น Draft ใหม่ + ใช้ 1 quota\n• ทุก day/activity/airline/accommodation ถูก copy\n• Slug จะถูกสร้างใหม่ตอน publish",
      confirmLabel: "ดำเนินการ",
    });
    if (!ok) return;
    setCloning(trip.id);
    try {
      const result = await api.post<{ id: string; title: string }>(`/admin/trips/${trip.id}/clone`);
      toast.success(`Clone เรียบร้อย: ${result.title}`);
      router.push(`/dashboard/trips/new?id=${result.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Clone ไม่สำเร็จ");
    } finally {
      setCloning(null);
    }
  }

  useEffect(() => {
    api.get<TripCategory[]>("/meta/trip-categories")
      .then(setAvailableCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      api.get<Trip[]>("/admin/trips"),
      api.get<{
        tripQuotaUsed: number;
        tripQuotaLimit: number;
        creditsRemaining: number;
        hasActiveSubscription: boolean;
      }>("/admin/usage"),
    ]).then(([tripsData, usage]) => {
      setTrips(tripsData);
      // Quota is "full" only when ALL three sources are exhausted:
      //   - free quota used up (tripQuotaUsed >= tripQuotaLimit)
      //   - no purchased credits remaining
      //   - no active subscription (subscription = unlimited)
      const freeExhausted = usage.tripQuotaUsed >= usage.tripQuotaLimit;
      const noCredits = (usage.creditsRemaining ?? 0) <= 0;
      const noSub = !usage.hasActiveSubscription;
      setQuotaFull(freeExhausted && noCredits && noSub);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = trips
    .filter((t) => {
      if (filter === "all") return true;
      if (filter === "pending_review") return t.status === "PendingReview";
      return t.status.toLowerCase() === filter;
    })
    .filter((t) => search === "" || t.title.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase()))
    .filter((t) => categoryFilter === "" || (t.categories ?? []).some((c) => c.slug === categoryFilter))
    .filter((t) => countryFilter === "" || t.countryCode === countryFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Unique countries from loaded trips (for filter dropdown)
  const uniqueCountries = Array.from(new Set(trips.map((t) => t.countryCode).filter(Boolean))) as string[];

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
    </div>
  );

  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
        {/* Search + Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-(--outline) text-lg">search</span>
              <input
                className="w-full bg-white border border-(--outline-variant)/30 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary)"
                placeholder="ค้นหาชื่อทริป หรือจุดหมาย..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Category filter */}
              {availableCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={categoryFilter === "" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter("")}
                  >ทั้งหมด</Button>
                  {availableCategories.map((cat) => (
                    <Button
                      key={cat.slug}
                      variant={categoryFilter === cat.slug ? "primary" : "outline"}
                      size="sm"
                      icon={cat.icon ?? undefined}
                      onClick={() => setCategoryFilter(categoryFilter === cat.slug ? "" : cat.slug)}
                    >
                      {cat.nameTh}
                    </Button>
                  ))}
                </div>
              )}
              {/* Country filter — only shown when operator has trips in multiple countries */}
              {uniqueCountries.length > 1 && (
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-3 py-1.5 border border-(--outline-variant) rounded-xl text-xs bg-white text-(--on-surface-variant) focus:outline-none focus:ring-2 focus:ring-(--primary)/30"
                >
                  <option value="">ทุกประเทศ</option>
                  {uniqueCountries.map((cc) => (
                    <option key={cc} value={cc}>{cc}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <FilterTabs
            tabs={[
              { id: "all" as FilterTab, label: `ทั้งหมด (${trips.length})` },
              { id: "pending_review" as FilterTab, label: `รอตรวจสอบ (${trips.filter(t => t.status === "PendingReview").length})` },
              { id: "published" as FilterTab, label: `เผยแพร่ (${trips.filter(t => t.status === "Published").length})` },
              { id: "draft" as FilterTab, label: `ร่าง (${trips.filter(t => t.status === "Draft").length})` },
              { id: "unpublished" as FilterTab, label: "ปิดแล้ว" },
              { id: "archived" as FilterTab, label: `จบแล้ว (${trips.filter(t => t.status === "Archived").length})` },
            ]}
            activeTab={filter}
            onTabChange={(v) => setFilter(v as FilterTab)}
          />
        </div>

        {/* Trip Grid */}
        {filtered.length === 0 && trips.length > 0 ? (
          <EmptyState
            icon={search ? "search_off" : "filter_list_off"}
            title={search ? `ไม่พบ "${search}"` : "ไม่มีทริปในหมวดนี้"}
            description={search ? "ลองค้นหาด้วยคำอื่น" : "ลองเปลี่ยนตัวกรอง"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* + Create Card — ตำแหน่งแรกเสมอ */}
            {quotaFull ? (
              <div className="rounded-2xl border-2 border-dashed border-(--outline-variant)/30 flex flex-col items-center justify-center min-h-70 opacity-60">
                <div className="w-12 h-12 rounded-xl bg-(--surface-variant) flex items-center justify-center text-(--on-surface-variant) mb-3">
                  <span className="material-symbols-outlined text-2xl">block</span>
                </div>
                <p className="font-bold text-(--on-surface-variant) text-sm">โควต้าเต็ม</p>
                <p className="text-[11px] text-(--on-surface-variant) mt-0.5">อัปเกรดแพลนเพื่อสร้างทริปเพิ่ม</p>
              </div>
            ) : (
              <button
                onClick={handleCreateTrip}
                className="group rounded-2xl border-2 border-dashed border-(--outline-variant)/30 hover:border-(--primary)/40 flex flex-col items-center justify-center min-h-70 transition-all duration-300 hover:bg-(--primary)/3 w-full"
              >
                <div className="w-12 h-12 rounded-xl bg-(--primary)/8 flex items-center justify-center text-(--primary) group-hover:scale-110 transition-transform mb-3">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <p className="font-bold text-(--on-surface) text-sm">สร้างทริปใหม่</p>
                <p className="text-[11px] text-(--on-surface-variant) mt-0.5">เริ่มต้นวางแผนทริปถัดไป</p>
              </button>
            )}

            {/* Trip Cards */}
            {filtered.map((trip) => {
              const isDraft = trip.status === "Draft";
              const isPendingReview = trip.status === "PendingReview";
              const isArchived = trip.status === "Archived";
              const isEnded = isArchived || (trip.endDate ? new Date(trip.endDate + "T23:59:59") < new Date() : false);
              const hasPublishedSnapshot = !!trip.publishedAt;

              return (
                <div key={trip.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-(--outline-variant)/60 transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Cover */}
                  <div className={`relative aspect-16/10 overflow-hidden ${isEnded ? "grayscale opacity-80" : ""}`}>
                    {trip.coverImageUrl ? (
                      <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-(--surface-variant) to-(--outline-variant)/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-(--outline-variant)">landscape</span>
                      </div>
                    )}
                    {/* Status badge */}
                    <span className={`absolute top-3 left-3 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm ${
                      isArchived ? "bg-(--outline)"
                      : isPendingReview ? "bg-orange-500"
                      : isDraft ? "bg-amber-500"
                      : isEnded ? "bg-(--on-surface-variant)"
                      : "bg-emerald-500"
                    }`}>
                      {isArchived ? "จบแล้ว" : isPendingReview ? "รอตรวจสอบ" : isDraft ? "ฉบับร่าง" : isEnded ? "สิ้นสุด" : "เผยแพร่"}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/trips/new?id=${trip.id}`} className="min-w-0 flex-1">
                        <h3 className="font-bold text-[15px] text-(--on-surface) leading-snug line-clamp-1 group-hover:text-(--primary) transition-colors">{trip.title}</h3>
                      </Link>
                      {isDraft && hasPublishedSnapshot && (
                        <Badge variant="success" size="sm" icon="public">เผยแพร่อยู่</Badge>
                      )}
                    </div>
                    <p className="text-[12px] text-(--outline) mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>{trip.scope === "international" ? "ต่างประเทศ" : "ในประเทศ"}</span>
                      {trip.countryCode && (
                        <span className="px-1.5 py-0.5 rounded bg-(--surface-variant)/60 font-mono text-[10px] text-(--on-surface-variant)">{trip.countryCode}</span>
                      )}
                      <span>· {trip.destination} · {trip.travelersCount} คน</span>
                    </p>
                    {trip.categories && trip.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {trip.categories.map((cat) => (
                          <span key={cat.id} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-(--surface-variant)/60 text-(--on-surface-variant) text-[10px] font-medium">
                            {cat.icon && <span className="material-symbols-outlined text-[12px]">{cat.icon}</span>}
                            {cat.nameTh}
                          </span>
                        ))}
                      </div>
                    )}
                    {trip.followerCount > 0 && (
                      <p className="text-[11px] text-(--outline) mt-1">{trip.followerCount} ผู้ติดตาม</p>
                    )}

                    <div className="flex-1" />

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-(--outline-variant)/20">
                      <span className="text-[11px] text-(--outline)">
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </span>
                      <div className="flex gap-1">
                        {!isArchived && (
                          <Link href={`/dashboard/trips/new?id=${trip.id}`} title="แก้ไขทริป" className="w-7 h-7 rounded-lg hover:bg-(--surface-variant) flex items-center justify-center text-(--outline) hover:text-(--on-surface) transition-colors">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </Link>
                        )}
                        {hasPublishedSnapshot && (
                          <Link href={`/dashboard/trips/${trip.id}/manage`} title="จัดการสมาชิก" className="w-7 h-7 rounded-lg hover:bg-(--primary-container)/40 flex items-center justify-center text-(--outline) hover:text-(--primary) transition-colors">
                            <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                          </Link>
                        )}
                        <IconButton
                          icon="content_copy"
                          variant="ghost"
                          size="sm"
                          disabled={cloning === trip.id || quotaFull}
                          aria-label={quotaFull ? "Quota เต็ม — ซื้อเครดิตเพิ่มก่อน" : "Clone ทริปนี้"}
                          onClick={() => handleClone(trip)}
                        />
                        {isDraft && !hasPublishedSnapshot && (
                          <IconButton
                            icon="delete"
                            variant="danger"
                            size="sm"
                            aria-label="ลบทริป"
                            onClick={() => setDeleteTarget(trip)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state — ไม่มีทริปเลย */}
        {trips.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-(--outline-variant) mb-4 block">luggage</span>
            <p className="text-(--outline) mb-6">ยังไม่มีทริป</p>
            <Button variant="primary" icon="add" size="lg" onClick={handleCreateTrip}>สร้างทริป</Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await api.delete(`/admin/trips/${deleteTarget.id}`);
            setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
            toast.success("ลบทริปเรียบร้อย");
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ");
          }
          setDeleteTarget(null);
        }}
        title={`ลบ "${deleteTarget?.title || ""}"?`}
        description="ทริปและข้อมูลทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบทริป"
        variant="danger"
      />

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
