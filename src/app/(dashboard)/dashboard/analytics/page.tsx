"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface SourceCount { source: string; count: number; }
interface DailyCount { date: string; count: number; }
interface TopTrip { id: string; title: string; views: number; followers: number; }

interface Summary {
  totalViews: number;
  viewGrowth: number;
  totalFollowers: number;
  followerGrowth: number;
  topTrips: TopTrip[];
  viewsBySource: SourceCount[];
  viewsByDay: DailyCount[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

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

const SOURCE_LABEL: Record<string, string> = {
  direct: "ตรง",
  google: "Google",
  facebook: "Facebook",
  line: "LINE",
  instagram: "Instagram",
  x: "X (Twitter)",
  other: "อื่นๆ",
};
const SOURCE_COLOR: Record<string, string> = {
  direct: "bg-slate-400",
  google: "bg-blue-500",
  facebook: "bg-indigo-500",
  line: "bg-green-500",
  instagram: "bg-pink-500",
  x: "bg-slate-700",
  other: "bg-gray-400",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, growth, color = "blue" }: {
  icon: string; label: string; value: string | number; sub?: string;
  growth?: number; color?: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  const growthPositive = growth != null && growth > 0;
  const growthNegative = growth != null && growth < 0;
  return (
    <div className="bg-white rounded-2xl border border-(--outline-variant)/40 p-5 space-y-3">
      <div className={`inline-flex p-2.5 rounded-xl ${colorMap[color]}`}>
        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-extrabold text-(--on-surface)">{value}</p>
          {growth != null && (
            <span className={`mb-0.5 text-xs font-bold ${growthPositive ? "text-emerald-600" : growthNegative ? "text-red-500" : "text-(--outline)"}`}>
              {growthPositive ? "+" : ""}{growth.toFixed(1)}%
            </span>
          )}
        </div>
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

function SourceBar({ items }: { items: SourceCount[] }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return <p className="text-sm text-(--outline) text-center py-8">ยังไม่มีข้อมูล</p>;
  const sorted = [...items].sort((a, b) => b.count - a.count);
  return (
    <div className="space-y-3">
      {sorted.map(({ source, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={source}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-(--on-surface-variant) font-medium">{SOURCE_LABEL[source] ?? source}</span>
              <span className="text-(--on-surface) font-bold tabular-nums">{count.toLocaleString("th-TH")} <span className="text-(--outline) font-normal">({pct}%)</span></span>
            </div>
            <div className="h-2 rounded-full bg-(--surface-variant) overflow-hidden">
              <div
                className={`h-full rounded-full ${SOURCE_COLOR[source] ?? "bg-slate-400"} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyLineChart({ items, days }: { items: DailyCount[]; days: number }) {
  if (items.length === 0) return <p className="text-sm text-(--outline) text-center py-8">ยังไม่มีข้อมูล</p>;

  const W = 600, H = 120, PAD_L = 32, PAD_R = 12, PAD_T = 12, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const maxVal = Math.max(...items.map(i => i.count), 1);
  const minVal = 0;

  const xScale = (idx: number) => PAD_L + (idx / Math.max(items.length - 1, 1)) * chartW;
  const yScale = (v: number) => PAD_T + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  const points = items.map((item, idx) => ({ x: xScale(idx), y: yScale(item.count), ...item }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD_T + chartH} L ${points[0].x} ${PAD_T + chartH} Z`;

  // Show ~5 x-axis labels
  const step = Math.max(1, Math.floor(items.length / 5));
  const xLabels = items
    .map((item, idx) => ({ idx, label: item.date }))
    .filter((_, idx) => idx % step === 0 || idx === items.length - 1);

  // Y-axis labels: 0, mid, max
  const yLabels = [
    { v: 0, y: yScale(0) },
    { v: Math.round(maxVal / 2), y: yScale(Math.round(maxVal / 2)) },
    { v: maxVal, y: yScale(maxVal) },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map(({ y }, i) => (
        <line key={i} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#e2e8f0" strokeWidth="1" />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
      ))}

      {/* Y-axis labels */}
      {yLabels.map(({ v, y }, i) => (
        <text key={i} x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
      ))}

      {/* X-axis labels */}
      {xLabels.map(({ idx, label }) => {
        const x = xScale(idx);
        const d = label.slice(5); // MM-DD
        return (
          <text key={idx} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">{d}</text>
        );
      })}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Days = 7 | 30 | 90;

export default function AnalyticsPage() {
  usePageTitle("Analytics");

  const [days, setDays] = useState<Days>(30);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trips, setTrips] = useState<TripAnalytic[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Initial load: overview + trips (period-independent) + summary
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<Overview>("/admin/analytics/overview"),
      api.get<TripAnalytic[]>("/admin/analytics/trips"),
      api.get<Summary>(`/admin/analytics/summary?days=${days}`),
    ])
      .then(([ov, tr, sum]) => { setOverview(ov); setTrips(tr); setSummary(sum); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch only summary when days changes
  const fetchSummary = useCallback((d: Days) => {
    setSummaryLoading(true);
    api.get<Summary>(`/admin/analytics/summary?days=${d}`)
      .then(setSummary)
      .catch(() => { /* keep stale */ })
      .finally(() => setSummaryLoading(false));
  }, []);

  function handleDaysChange(d: Days) {
    setDays(d);
    fetchSummary(d);
  }

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

  const periodLabel = days === 7 ? "7 วันที่ผ่านมา" : days === 30 ? "30 วันที่ผ่านมา" : "90 วันที่ผ่านมา";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header + Period selector */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-(--on-surface)">Analytics</h1>
          <p className="text-sm text-(--on-surface-variant) mt-0.5">ภาพรวมประสิทธิภาพทริปและการมีส่วนร่วมของผู้เดินทาง</p>
        </div>
        <div className="flex items-center gap-1 bg-(--surface-variant)/40 rounded-xl p-1">
          {([7, 30, 90] as Days[]).map((d) => (
            <button
              key={d}
              onClick={() => handleDaysChange(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                days === d
                  ? "bg-white shadow text-(--primary)"
                  : "text-(--on-surface-variant) hover:text-(--on-surface)"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Period-based summary cards */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-opacity ${summaryLoading ? "opacity-50 pointer-events-none" : ""}`}>
        <StatCard
          icon="visibility"
          label={`ยอดเข้าชม (${periodLabel})`}
          value={summary?.totalViews.toLocaleString("th-TH") ?? "—"}
          growth={summary?.viewGrowth}
          color="blue"
        />
        <StatCard
          icon="group"
          label={`ผู้ติดตาม (${periodLabel})`}
          value={summary?.totalFollowers.toLocaleString("th-TH") ?? "—"}
          growth={summary?.followerGrowth}
          color="emerald"
        />
        <StatCard icon="task_alt" label="อัตรารับทราบ" value={overview ? `${overview.acknowledgeRate}%` : "—"} sub={overview ? `ส่ง changelog ${overview.changelogsSent} ครั้ง` : undefined} color="purple" />
        <StatCard
          icon="star"
          label="คะแนนเฉลี่ย"
          value={overview?.avgRating != null ? overview.avgRating.toFixed(1) : "—"}
          sub={overview?.avgRating != null ? "จากรีวิวทั้งหมด" : "ยังไม่มีรีวิว"}
          color="amber"
        />
      </div>

      {/* Views by day + Views by source */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity ${summaryLoading ? "opacity-50" : ""}`}>

        {/* Line chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-(--outline-variant)/40 p-5">
          <h2 className="text-sm font-bold text-(--on-surface) mb-4">ยอดเข้าชมรายวัน</h2>
          {summary ? (
            <DailyLineChart items={summary.viewsByDay} days={days} />
          ) : (
            <div className="h-28 flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-(--primary)">progress_activity</span>
            </div>
          )}
        </div>

        {/* Source bars */}
        <div className="bg-white rounded-2xl border border-(--outline-variant)/40 p-5">
          <h2 className="text-sm font-bold text-(--on-surface) mb-4">แหล่งที่มา</h2>
          {summary ? (
            <SourceBar items={summary.viewsBySource} />
          ) : (
            <div className="h-28 flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-(--primary)">progress_activity</span>
            </div>
          )}
        </div>
      </div>

      {/* Top trips */}
      {summary && summary.topTrips.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-(--on-surface) mb-4">ทริปยอดนิยม ({periodLabel})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.topTrips.slice(0, 6).map((t, rank) => (
              <div key={t.id} className="bg-white rounded-2xl border border-(--outline-variant)/40 p-4 flex gap-3 items-start">
                <span className={`text-sm font-extrabold w-6 text-center shrink-0 mt-0.5 ${rank === 0 ? "text-amber-500" : rank === 1 ? "text-slate-500" : "text-(--outline)"}`}>
                  #{rank + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-(--on-surface) truncate">{t.title}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-(--on-surface-variant)">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      {t.views.toLocaleString("th-TH")}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {t.followers.toLocaleString("th-TH")}
                    </span>
                  </div>
                </div>
                <Link href={`/dashboard/trips/${t.id}`} className="text-(--primary) text-xs font-semibold shrink-0 hover:underline mt-0.5">ดู</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trip breakdown table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-(--on-surface)">รายละเอียดแต่ละทริป</h2>
          <span className="text-xs text-(--on-surface-variant)">เรียงตามยอดเข้าชม</span>
        </div>

        <div className="bg-white rounded-2xl border border-(--outline-variant)/40 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-(--surface-variant)/30 text-xs font-bold text-(--on-surface-variant) uppercase tracking-wider border-b border-(--outline-variant)/30">
            <div className="col-span-4">ทริป</div>
            <div className="col-span-1 text-right">Views</div>
            <div className="col-span-2 text-right">Followers</div>
            <div className="col-span-2 text-right">รับทราบ</div>
            <div className="col-span-2 text-right">คะแนน</div>
            <div className="col-span-1" />
          </div>

          {trips?.length === 0 && (
            <div className="py-16 text-center text-(--on-surface-variant) text-sm">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">analytics</span>
              ยังไม่มีทริป
            </div>
          )}

          {trips?.map((t, i) => (
            <div
              key={t.id}
              className={`grid grid-cols-12 gap-4 px-5 py-4 items-center ${i < trips.length - 1 ? "border-b border-(--outline-variant)/20" : ""} hover:bg-(--surface-variant)/20 transition-colors`}
            >
              <div className="col-span-4 min-w-0">
                <p className="font-semibold text-sm text-(--on-surface) truncate">{t.title}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status] ?? "bg-slate-100 text-slate-500"}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>

              <div className="col-span-1 text-right">
                <p className="text-sm font-bold text-(--on-surface)">{t.viewCount.toLocaleString("th-TH")}</p>
              </div>

              <div className="col-span-2 text-right">
                <p className="text-sm font-semibold text-(--on-surface)">{t.followerCount}</p>
                <p className="text-xs text-(--outline)">{t.changelogCount} updates</p>
              </div>

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

              <div className="col-span-1 flex justify-end">
                {t.slug && (
                  <Link href={`/dashboard/trips/${t.id}`} className="text-(--primary) hover:underline text-xs font-medium">ดู</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trip count summary */}
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
