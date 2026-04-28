"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { FilterTabs, ConfirmDialog, useToast, EmptyState } from "@/components/shared";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { api, ApiError } from "@/lib/api";

type FilterTab = "all" | "draft" | "pending_review" | "published" | "unpublished" | "archived";

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
  createdAt: string;
  /** H3.3 — Entitlement source consumed at create. */
  quotaSource?: string | null;
}

const QUOTA_SOURCE_LABEL: Record<string, { text: string; cls: string; icon: string }> = {
  free:         { text: "ฟรี",            cls: "bg-slate-100 text-slate-600 border-slate-200",       icon: "card_giftcard" },
  per_trip:     { text: "ต่อทริป",         cls: "bg-sky-50 text-sky-700 border-sky-200",              icon: "credit_card" },
  pack_5:       { text: "แพ็ค 5",          cls: "bg-violet-50 text-violet-700 border-violet-200",     icon: "redeem" },
  subscription: { text: "Subscription",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  icon: "workspace_premium" },
};

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "ยังไม่กำหนดวัน";
  const s = new Date(start + "T00:00:00");
  const fmt = (d: Date): string => d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  if (!end) return fmt(s);
  const e = new Date(end + "T00:00:00");
  return `${fmt(s)} — ${fmt(e)}`;
}

export default function MyTripsPage(): React.ReactNode {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [quotaFull, setQuotaFull] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();

  async function handleClone(trip: Trip) {
    if (cloning) return;
    if (quotaFull) {
      toast("Quota เต็ม — ซื้อเครดิตเพิ่มก่อน clone", "error");
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
      toast(`Clone เรียบร้อย: ${result.title}`, "success");
      router.push(`/dashboard/trips/new?scope=edit&id=${result.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Clone ไม่สำเร็จ", "error");
    } finally {
      setCloning(null);
    }
  }

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
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-slate-400 animate-pulse">กำลังโหลด...</div>
    </div>
  );

  return (
    <>
      <div className="p-4 md:p-8 space-y-6">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="ค้นหาชื่อทริป หรือจุดหมาย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FilterTabs
            tabs={[
              { value: "all" as FilterTab, label: `ทั้งหมด (${trips.length})` },
              { value: "pending_review" as FilterTab, label: `รอตรวจสอบ (${trips.filter(t => t.status === "PendingReview").length})` },
              { value: "published" as FilterTab, label: `เผยแพร่ (${trips.filter(t => t.status === "Published").length})` },
              { value: "draft" as FilterTab, label: `ร่าง (${trips.filter(t => t.status === "Draft").length})` },
              { value: "unpublished" as FilterTab, label: "ปิดแล้ว" },
              { value: "archived" as FilterTab, label: `จบแล้ว (${trips.filter(t => t.status === "Archived").length})` },
            ]}
            active={filter}
            onChange={setFilter}
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
              <Link
                href={ROUTES.tripNew}
                className="group rounded-2xl border-2 border-dashed border-(--outline-variant)/30 hover:border-(--primary)/40 flex flex-col items-center justify-center min-h-70 transition-all duration-300 hover:bg-(--primary)/3"
              >
                <div className="w-12 h-12 rounded-xl bg-(--primary)/8 flex items-center justify-center text-(--primary) group-hover:scale-110 transition-transform mb-3">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <p className="font-bold text-(--on-surface) text-sm">สร้างทริปใหม่</p>
                <p className="text-[11px] text-(--on-surface-variant) mt-0.5">เริ่มต้นวางแผนทริปถัดไป</p>
              </Link>
            )}

            {/* Trip Cards */}
            {filtered.map((trip) => {
              const isDraft = trip.status === "Draft";
              const isPendingReview = trip.status === "PendingReview";
              const isArchived = trip.status === "Archived";
              const isEnded = isArchived || (trip.endDate ? new Date(trip.endDate + "T23:59:59") < new Date() : false);

              return (
                <div key={trip.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Cover */}
                  <div className={`relative aspect-16/10 overflow-hidden ${isEnded ? "grayscale opacity-80" : ""}`}>
                    {trip.coverImageUrl ? (
                      <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">landscape</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${
                        isArchived ? "bg-slate-400"
                        : isPendingReview ? "bg-orange-500"
                        : isDraft ? "bg-amber-500"
                        : isEnded ? "bg-slate-500"
                        : "bg-emerald-500"
                      }`}>
                        {isArchived ? "จบแล้ว" : isPendingReview ? "รอตรวจสอบ" : isDraft ? "ฉบับร่าง" : isEnded ? "สิ้นสุด" : "เผยแพร่"}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-md shadow-sm ${
                        trip.scope === "international" ? "bg-purple-500 text-white" : "bg-white/90 text-slate-700"
                      }`}>
                        {trip.scope === "international" ? "ต่างประเทศ" : "ในประเทศ"}
                      </span>
                      {/* H3.3: Quota source badge — shows which entitlement was used to create this trip */}
                      {trip.quotaSource && QUOTA_SOURCE_LABEL[trip.quotaSource] && (
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md border ${QUOTA_SOURCE_LABEL[trip.quotaSource].cls}`}
                          title={`สร้างด้วยเครดิต: ${QUOTA_SOURCE_LABEL[trip.quotaSource].text}`}
                        >
                          <span className="material-symbols-outlined text-[10px]">{QUOTA_SOURCE_LABEL[trip.quotaSource].icon}</span>
                          {QUOTA_SOURCE_LABEL[trip.quotaSource].text}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-4 flex flex-col">
                    <Link href={`/dashboard/trips/new?scope=edit&id=${trip.id}`} className="min-w-0">
                      <h3 className="font-bold text-[15px] text-slate-900 leading-snug line-clamp-1 group-hover:text-(--primary) transition-colors">{trip.title}</h3>
                    </Link>
                    <p className="text-[12px] text-slate-400 mt-1">
                      {trip.destination} · {trip.travelersCount} คน
                    </p>
                    {trip.followerCount > 0 && (
                      <p className="text-[11px] text-slate-400 mt-1">{trip.followerCount} ผู้ติดตาม</p>
                    )}

                    <div className="flex-1" />

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </span>
                      <div className="flex gap-1">
                        {!isArchived && (
                          <Link href={`/dashboard/trips/new?scope=edit&id=${trip.id}`} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </Link>
                        )}
                        <button
                          onClick={() => handleClone(trip)}
                          disabled={cloning === trip.id || quotaFull}
                          title={quotaFull ? "Quota เต็ม — ซื้อเครดิตเพิ่มก่อน" : "Clone ทริปนี้"}
                          className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>
                        {isDraft && (
                          <button
                            onClick={() => setDeleteTarget(trip)}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
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
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">luggage</span>
            <p className="text-slate-400 mb-6">ยังไม่มีทริป — สร้างทริปแรกกันเลย!</p>
            <Link href={ROUTES.tripNew} className="inline-flex items-center gap-2 bg-(--primary) text-white px-6 py-3 rounded-full font-bold hover:brightness-110 transition-all">
              <span className="material-symbols-outlined">add</span> สร้างทริป
            </Link>
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
            toast("ลบทริปเรียบร้อย", "success");
          } catch (err) {
            toast(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ", "error");
          }
          setDeleteTarget(null);
        }}
        title={`ลบ "${deleteTarget?.title || ""}"?`}
        description="ทริปและข้อมูลทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบทริป"
        variant="danger"
      />
    </>
  );
}
