"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, getToken } from "@/lib/client-api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface RatingSummary {
  count: number;
  avgOverall: number | null;
  avgGuide: number | null;
  avgItinerary: number | null;
  avgValue: number | null;
  recentComments: Array<{ comment: string; overallScore: number; createdAt: string; firstName: string }>;
}

const DIMENSIONS = [
  { key: "overall",   label: "ภาพรวม",        icon: "star",           required: true },
  { key: "guide",     label: "ไกด์/ทีมงาน",    icon: "support_agent",  required: false },
  { key: "itinerary", label: "แผนการเดินทาง",  icon: "map",            required: false },
  { key: "value",     label: "ความคุ้มค่า",    icon: "paid",           required: false },
] as const;

type DimKey = typeof DIMENSIONS[number]["key"];

const STAR_LABELS: Record<number, string> = {
  1: "ต้องปรับปรุง",
  2: "พอใช้",
  3: "ดี",
  4: "ดีมาก",
  5: "ยอดเยี่ยม",
};

function StarRow({ value, onChange, size = "md" }: { value: number; onChange: (v: number) => void; size?: "sm" | "md" | "lg" }) {
  const [hover, setHover] = useState(0);
  const sz = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-3xl";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className={`${sz} transition-transform active:scale-90 ${(hover || value) >= s ? "text-amber-400" : "text-slate-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const sz = size === "md" ? "text-xl" : "text-sm";
  return (
    <span className={sz}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={value >= s ? "text-amber-400" : "text-slate-200"}>★</span>
      ))}
    </span>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "วันนี้";
  if (d < 7) return `${d} วันที่แล้ว`;
  if (d < 30) return `${Math.floor(d / 7)} สัปดาห์ที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH");
}

export default function TripRatingPage({ params }: PageProps): React.JSX.Element {
  const { slug } = use(params);
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [sumLoading, setSumLoading] = useState(true);

  // Form state
  const [scores, setScores] = useState<Record<DimKey, number>>({ overall: 0, guide: 0, itinerary: 0, value: 0 });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const isLoggedIn = !!getToken();

  useEffect(() => {
    api.get<RatingSummary>(`/client/t/${slug}/ratings`)
      .then(setSummary)
      .catch(() => {})
      .finally(() => setSumLoading(false));
  }, [slug]);

  async function handleSubmit() {
    if (scores.overall === 0) { setSubmitError("กรุณาให้คะแนนภาพรวม"); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.authPost(`/client/t/${slug}/rating`, {
        overallScore:   scores.overall,
        guideScore:     scores.guide || null,
        itineraryScore: scores.itinerary || null,
        valueScore:     scores.value || null,
        comment:        comment.trim() || null,
      });
      setSubmitted(true);
      // Refresh summary
      api.get<RatingSummary>(`/client/t/${slug}/ratings`).then(setSummary).catch(() => {});
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "ส่งคะแนนไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="natgan-bg min-h-screen text-on-surface pb-24">
      <nav className="bg-white/90 glass-blur border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/t/${slug}`}
              className="material-symbols-outlined text-on-surface-variant hover:text-brand-blue transition-colors text-xl">
              arrow_back
            </Link>
            <h1 className="font-headline font-bold text-lg">รีวิวทริป</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* Summary card */}
        {!sumLoading && summary && summary.count > 0 && (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-5xl font-extrabold font-headline text-amber-500">
                  {summary.avgOverall?.toFixed(1)}
                </p>
                <StarDisplay value={Math.round(summary.avgOverall ?? 0)} size="md" />
                <p className="text-xs text-on-surface-variant mt-1">{summary.count} รีวิว</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[
                  { label: "ภาพรวม",       val: summary.avgOverall },
                  { label: "ไกด์",          val: summary.avgGuide },
                  { label: "แผนการเดินทาง", val: summary.avgItinerary },
                  { label: "ความคุ้มค่า",   val: summary.avgValue },
                ].filter((d) => d.val !== null).map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <p className="text-xs text-on-surface-variant w-24 shrink-0">{d.label}</p>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${((d.val ?? 0) / 5) * 100}%` }} />
                    </div>
                    <p className="text-xs font-bold text-amber-600 w-6 shrink-0">{d.val?.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit form */}
        {submitted ? (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-emerald-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <h2 className="font-headline font-bold text-xl">ขอบคุณสำหรับรีวิว!</h2>
              <p className="text-on-surface-variant text-sm mt-1">รีวิวของคุณจะช่วยนักท่องเที่ยวคนอื่นได้มาก</p>
            </div>
            <Link href={`/t/${slug}`}
              className="inline-flex items-center gap-2 bg-brand-blue text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-brand-blue/90 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              กลับหน้าทริป
            </Link>
          </div>
        ) : !isLoggedIn ? (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-8 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block">lock</span>
            <div>
              <h2 className="font-headline font-bold text-lg">ต้องเข้าสู่ระบบก่อน</h2>
              <p className="text-on-surface-variant text-sm mt-1">กรุณาล็อกอินเพื่อให้คะแนนทริปนี้</p>
            </div>
            <Link href={`/login?next=/t/${slug}/rating`}
              className="inline-flex items-center gap-2 bg-brand-blue text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-brand-blue/90 active:scale-95 transition-all">
              เข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-5 space-y-6">
            <h2 className="font-headline font-bold text-lg">ให้คะแนนทริปนี้</h2>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{submitError}</div>
            )}

            {DIMENSIONS.map((dim) => (
              <div key={dim.key}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{dim.icon}</span>
                  <p className="text-sm font-bold text-on-surface">
                    {dim.label}
                    {dim.required && <span className="text-red-500 ml-0.5">*</span>}
                    {!dim.required && <span className="text-on-surface-variant/40 text-xs ml-1">(ไม่บังคับ)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StarRow
                    value={scores[dim.key]}
                    onChange={(v) => setScores((s) => ({ ...s, [dim.key]: v }))}
                    size={dim.required ? "lg" : "md"}
                  />
                  {scores[dim.key] > 0 && (
                    <span className="text-sm font-bold text-amber-600">{STAR_LABELS[scores[dim.key]]}</span>
                  )}
                </div>
              </div>
            ))}

            <div>
              <p className="text-sm font-bold text-on-surface mb-2">
                <span className="material-symbols-outlined align-middle text-base mr-1">chat_bubble_outline</span>
                เขียนรีวิว (ไม่บังคับ)
              </p>
              <textarea
                placeholder="เล่าประสบการณ์การเดินทาง สิ่งที่ประทับใจ หรือข้อแนะนำ..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={2048}
                className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none"
              />
              <p className="text-right text-[10px] text-on-surface-variant/40 mt-0.5">{comment.length}/2048</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || scores.overall === 0}
              className="w-full bg-brand-blue text-white rounded-full py-4 font-bold text-base hover:bg-brand-blue/90 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {submitting ? "กำลังส่ง..." : "ส่งรีวิว"}
            </button>
          </div>
        )}

        {/* Recent comments */}
        {summary && summary.recentComments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-on-surface-variant px-1">รีวิวล่าสุด</h3>
            {summary.recentComments.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-outline-variant/15 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-brand-blue">{r.firstName.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="text-sm font-bold text-on-surface">{r.firstName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarDisplay value={r.overallScore} />
                    <span className="text-xs text-on-surface-variant/50">{relativeTime(r.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
