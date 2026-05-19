"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageSkeleton, SectionHeader, StatCard } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { ROUTES } from "@/constants/routes";

interface TripSummary {
  tripId: string;
  tripTitle: string;
  tripStatus: string;
  shareCount: number;
  memberCount: number;
  followerCount: number;
  reviewCount: number;
  responseRate: number;
  viewTotal: number;
  viewLast7d: number;
  viewLast30d: number;
  viewsBySource: Record<string, number>;
  acknowledgedCount: number;
  acknowledgementRate: number;
  scoreBreakdown: {
    avgOverall: number;
    avgGuide: number | null;
    avgItinerary: number | null;
    avgValue: number | null;
  } | null;
}

const SOURCE_LABELS: Record<string, string> = {
  line: "LINE",
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  direct: "Direct",
  other: "Other",
};
const SOURCE_COLORS: Record<string, string> = {
  line: "#06c755",
  instagram: "#e1306c",
  facebook: "#1877f2",
  google: "#ea4335",
  direct: "#6366f1",
  other: "#94a3b8",
};

export default function TripSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tripId } = use(params);
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageTitle(summary?.tripTitle ? `สรุปผล: ${summary.tripTitle}` : "สรุปผลทริป");

  useEffect(() => {
    api
      .get<TripSummary>(`/admin/trips/${tripId}/post-trip-summary`)
      .then(setSummary)
      .catch(() => setError("ไม่สามารถโหลดข้อมูลสรุปได้"))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) return <PageSkeleton />;

  if (error || !summary) {
    return (
      <div className="p-8 text-center text-red-500">{error ?? "ไม่พบข้อมูล"}</div>
    );
  }

  const sourceEntries = Object.entries(summary.viewsBySource ?? {}).sort(
    ([, a], [, b]) => b - a
  );
  const maxSource = Math.max(...sourceEntries.map(([, v]) => v), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back + title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href={ROUTES.tripManage(tripId)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-flex items-center gap-1"
          >
            ← กลับไปจัดการทริป
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{summary.tripTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{summary.tripStatus}</p>
        </div>
        <a
          href={`/api/admin/trips/${tripId}/export-members.csv`}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined text-base leading-none">download</span>
          Export สมาชิก CSV
        </a>
      </div>

      {/* View stats */}
      <section>
        <SectionHeader title="ยอดชม" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          <StatCard icon="visibility" iconColor="blue" title="ทั้งหมด" value={summary.viewTotal} variant="compact" />
          <StatCard icon="trending_up" iconColor="emerald" title="7 วันล่าสุด" value={summary.viewLast7d} variant="compact" />
          <StatCard icon="calendar_month" iconColor="violet" title="30 วัน" value={summary.viewLast30d} variant="compact" />
          <StatCard icon="share" iconColor="amber" title="แชร์" value={summary.shareCount ?? 0} variant="compact" />
        </div>
      </section>

      {/* Source breakdown */}
      {sourceEntries.length > 0 && (
        <section>
          <SectionHeader title="ยอดชมตาม Channel" />
          <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            {sourceEntries.map(([src, count]) => (
              <div key={src} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600 shrink-0">
                  {SOURCE_LABELS[src] ?? src}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${(count / maxSource) * 100}%`,
                      backgroundColor: SOURCE_COLORS[src] ?? "#94a3b8",
                    }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-semibold text-gray-800">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Engagement */}
      <section>
        <SectionHeader title="Engagement" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          <StatCard icon="group" iconColor="blue" title="ผู้ติดตาม" value={summary.followerCount} suffix="คน" variant="compact" />
          <StatCard icon="person" iconColor="emerald" title="สมาชิกทริป" value={summary.memberCount} suffix="คน" variant="compact" />
          <StatCard
            icon="done_all"
            iconColor="emerald"
            title="Acknowledge"
            value={summary.acknowledgedCount}
            suffix={`/ ${summary.memberCount} (${summary.acknowledgementRate.toFixed(0)}%)`}
            variant="compact"
          />
          <StatCard
            icon="rate_review"
            iconColor="amber"
            title="รีวิว"
            value={summary.reviewCount}
            suffix={`ตอบ ${summary.responseRate.toFixed(0)}%`}
            variant="compact"
          />
        </div>
      </section>

      {/* Rating breakdown */}
      {summary.scoreBreakdown && (
        <section>
          <SectionHeader title="คะแนนรีวิว (เฉลี่ย)" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
            <StatCard icon="star" iconColor="amber" title="Overall" value={summary.scoreBreakdown.avgOverall.toFixed(1)} suffix="/ 5" variant="compact" />
            {summary.scoreBreakdown.avgGuide != null && (
              <StatCard icon="hiking" iconColor="emerald" title="ไกด์" value={summary.scoreBreakdown.avgGuide.toFixed(1)} suffix="/ 5" variant="compact" />
            )}
            {summary.scoreBreakdown.avgItinerary != null && (
              <StatCard icon="map" iconColor="blue" title="Itinerary" value={summary.scoreBreakdown.avgItinerary.toFixed(1)} suffix="/ 5" variant="compact" />
            )}
            {summary.scoreBreakdown.avgValue != null && (
              <StatCard icon="savings" iconColor="violet" title="Value" value={summary.scoreBreakdown.avgValue.toFixed(1)} suffix="/ 5" variant="compact" />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
