"use client";

import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import Link from "next/link";

interface Overview {
  totalTrips: number;
  publishedTrips: number;
  draftTrips: number;
  totalViews: number;
  totalFollowers: number;
  newFollowers30d: number;
  changelogsSent: number;
  acknowledgeRate: number;
  avgRating: number | null;
}

interface TripAnalytic {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  viewCount: number;
  followerCount: number;
  changelogCount: number;
  ackRate: number | null;
  avgRating: number | null;
  ratingCount: number;
  updatedAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  Published: "bg-emerald-100 text-emerald-700",
  Draft: "bg-slate-100 text-slate-500",
  Archived: "bg-amber-100 text-amber-700",
  PendingReview: "bg-blue-100 text-blue-700",
};
const STATUS_LABEL: Record<string, string> = {
  Published: "เผยแพร่",
  Draft: "ฉบับร่าง",
  Archived: "เก็บถาวร",
  PendingReview: "รอตรวจสอบ",
};

function StatCard({ icon, label, value, sub, color = "blue" }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-(--outline-variant)/40 p-5 space-y-3">
      <div className={`inline-flex p-2.5 rounded-xl ${colorMap[color]}`}>
        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-(--on-surface)">{value}</p>
        <p className="text-sm text-(--on-surface-variant) mt-0.5">{label}</p>
        {sub && <p className="text-xs text-(--outline) mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      <span className="text-sm font-bold text-(--on-surface)">{score.toFixed(1)}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  usePageTitle("Analytics");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trips, setTrips] = useState<TripAnalytic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Overview>("/admin/analytics/overview"),
      api.get<TripAnalytic[]>("/admin/analytics/trips"),
    ])
      .then(([ov, tr]) => { setOverview(ov); setTrips(tr); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 flex justify-center items-center min-h-60">
      <span className="material-symbols-outlined animate-spin text-(--primary) text-3xl">progress_activity</span>
    </div>
  );
  if (error) return (
    <div className="p-8 text-center space-y-2">
      <span className="material-symbols-outlined text-4xl text-red-400">error</span>
      <p className="text-sm text-(--on-surface-variant)">{error}</p>
      <button onClick={() => window.location.reload()} className="text-sm text-(--primary) font-semibold">ลองใหม่</button>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-(--on-surface)">Analytics</h1>
        <p className="text-sm text-(--on-surface-variant) mt-0.5">ภาพรวมประสิทธิภาพทริปและการมีส่วนร่วมของผู้เดินทาง</p>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="visibility" label="ยอดผู้เข้าชมทั้งหมด" value={overview.totalViews.toLocaleString("th-TH")} color="blue" />
          <StatCard icon="group" label="ผู้ติดตามทั้งหมด" value={overview.totalFollowers.toLocaleString("th-TH")} sub={`+${overview.newFollowers30d} ใน 30 วัน`} color="emerald" />
          <StatCard icon="task_alt" label="อัตรารับทราบ" value={`${overview.acknowledgeRate}%`} sub={`ส่ง changelog ${overview.changelogsSent} ครั้ง`} color="purple" />
          <StatCard
            icon="star"
            label="คะแนนเฉลี่ย"
            value={overview.avgRating != null ? overview.avgRating.toFixed(1) : "—"}
            sub={overview.avgRating != null ? "จากรีวิวทั้งหมด" : "ยังไม่มีรีวิว"}
            color="amber"
          />
        </div>
      )}

      {/* Trip breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-(--on-surface)">รายละเอียดแต่ละทริป</h2>
          <div className="flex gap-3 text-xs text-(--on-surface-variant)">
            <span>เรียงตามยอดเข้าชม</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-(--outline-variant)/40 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-(--surface-variant)/30 text-xs font-bold text-(--on-surface-variant) uppercase tracking-wider border-b border-(--outline-variant)/30">
            <div className="col-span-4">ทริป</div>
            <div className="col-span-1 text-right">Views</div>
            <div className="col-span-2 text-right">Followers</div>
            <div className="col-span-2 text-right">รับทราบ</div>
            <div className="col-span-2 text-right">คะแนน</div>
            <div className="col-span-1"></div>
          </div>

          {trips && trips.length === 0 && (
            <div className="py-16 text-center text-(--on-surface-variant) text-sm">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">analytics</span>
              ยังไม่มีทริป
            </div>
          )}

          {trips?.map((t, i) => (
            <div
              key={t.id}
              className={`grid grid-cols-12 gap-4 px-5 py-4 items-center ${i < (trips.length - 1) ? "border-b border-(--outline-variant)/20" : ""} hover:bg-(--surface-variant)/20 transition-colors`}
            >
              {/* Title + status */}
              <div className="col-span-4 min-w-0">
                <p className="font-semibold text-sm text-(--on-surface) truncate">{t.title}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status] ?? "bg-slate-100 text-slate-500"}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>

              {/* Views */}
              <div className="col-span-1 text-right">
                <p className="text-sm font-bold text-(--on-surface)">{t.viewCount.toLocaleString("th-TH")}</p>
              </div>

              {/* Followers */}
              <div className="col-span-2 text-right">
                <p className="text-sm font-semibold text-(--on-surface)">{t.followerCount}</p>
                <p className="text-xs text-(--outline)">{t.changelogCount} updates</p>
              </div>

              {/* Ack rate */}
              <div className="col-span-2">
                {t.ackRate != null ? (
                  <div className="space-y-1">
                    <p className="text-xs text-right font-semibold text-(--on-surface)">{t.ackRate}%</p>
                    <div className="h-1.5 rounded-full bg-(--surface-variant) overflow-hidden">
                      <div
                        className={`h-full rounded-full ${t.ackRate >= 80 ? "bg-emerald-500" : t.ackRate >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${t.ackRate}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-right text-(--outline)">—</p>
                )}
              </div>

              {/* Rating */}
              <div className="col-span-2 flex justify-end">
                {t.avgRating != null ? (
                  <div className="text-right">
                    <StarRating score={t.avgRating} />
                    <p className="text-xs text-(--outline) mt-0.5">{t.ratingCount} รีวิว</p>
                  </div>
                ) : (
                  <p className="text-xs text-(--outline)">—</p>
                )}
              </div>

              {/* Link */}
              <div className="col-span-1 flex justify-end">
                {t.slug && (
                  <Link
                    href={`/dashboard/trips/${t.id}`}
                    className="text-(--primary) hover:underline text-xs font-medium"
                  >
                    ดู
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary row */}
      {overview && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-(--surface-variant)/30 rounded-xl p-4">
            <p className="text-2xl font-extrabold text-(--on-surface)">{overview.publishedTrips}</p>
            <p className="text-sm text-(--on-surface-variant)">ทริปเผยแพร่</p>
          </div>
          <div className="bg-(--surface-variant)/30 rounded-xl p-4">
            <p className="text-2xl font-extrabold text-(--on-surface)">{overview.draftTrips}</p>
            <p className="text-sm text-(--on-surface-variant)">ฉบับร่าง</p>
          </div>
          <div className="bg-(--surface-variant)/30 rounded-xl p-4">
            <p className="text-2xl font-extrabold text-(--on-surface)">{overview.totalTrips}</p>
            <p className="text-sm text-(--on-surface-variant)">ทริปทั้งหมด</p>
          </div>
        </div>
      )}
    </div>
  );
}
