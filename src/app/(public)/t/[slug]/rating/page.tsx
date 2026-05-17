"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Rating, Avatar, Spinner } from "@/components/shared";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ReviewComment {
  comment: string;
  overallScore: number;
  createdAt: string;
  firstName: string;
  imageUrls?: string[];
}

interface PaginatedComments {
  items: ReviewComment[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

interface RatingSummary {
  count: number;
  avgOverall: number | null;
  avgGuide: number | null;
  avgItinerary: number | null;
  avgValue: number | null;
  comments: PaginatedComments;
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
  const [reviews, setReviews] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    api.get<RatingSummary>(`/client/t/${slug}/ratings?page=1&pageSize=10`)
      .then((data) => {
        setSummary(data);
        setReviews(data.comments.items);
        setCurrentPage(1);
        setHasMore(data.comments.hasNext);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const data = await api.get<RatingSummary>(`/client/t/${slug}/ratings?page=${nextPage}&pageSize=10`);
      setReviews((prev) => [...prev, ...data.comments.items]);
      setCurrentPage(nextPage);
      setHasMore(data.comments.hasNext);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  }, [slug, currentPage, hasMore, loadingMore]);

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

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : !summary || summary.count === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 block">star_border</span>
            <h2 className="font-headline font-bold text-lg text-on-surface">ยังไม่มีรีวิว</h2>
            <p className="text-on-surface-variant text-sm">ทริปนี้ยังไม่มีสมาชิกให้คะแนน</p>
            <Link href={`/t/${slug}`}
              className="inline-flex items-center gap-2 text-brand-blue text-sm font-bold hover:underline mt-2">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              กลับหน้าทริป
            </Link>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-outline-variant/15 p-5">
              <div className="flex items-center gap-5">
                <div className="text-center shrink-0">
                  <p className="text-5xl font-extrabold font-headline text-amber-500">
                    {summary.avgOverall?.toFixed(1)}
                  </p>
                  <Rating value={Math.round(summary.avgOverall ?? 0)} readOnly size="lg" />
                  <p className="text-xs text-on-surface-variant mt-1">{summary.count} รีวิว</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: "ภาพรวม", val: summary.avgOverall },
                    { label: "ไกด์ / ทีมงาน", val: summary.avgGuide },
                    { label: "แผนการเดินทาง", val: summary.avgItinerary },
                    { label: "ความคุ้มค่า", val: summary.avgValue },
                  ].filter((d) => d.val !== null).map((d) => (
                    <div key={d.label} className="flex items-center gap-2">
                      <p className="text-xs text-on-surface-variant w-28 shrink-0">{d.label}</p>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${((d.val ?? 0) / 5) * 100}%` }} />
                      </div>
                      <p className="text-xs font-bold text-amber-600 w-7 text-right shrink-0">{d.val?.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews list */}
            {reviews.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-on-surface-variant px-1">
                  รีวิวจากสมาชิก ({summary.comments.totalCount})
                </h3>
                {reviews.map((r, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-outline-variant/15 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.firstName} size="sm" />
                        <p className="text-sm font-bold text-on-surface">{r.firstName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Rating value={r.overallScore} readOnly size="sm" />
                        <span className="text-xs text-on-surface-variant/50">{relativeTime(r.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{r.comment}</p>
                    {r.imageUrls && r.imageUrls.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {r.imageUrls.map((url, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => setLightboxUrl(url)}
                            className="w-16 h-16 rounded-xl overflow-hidden hover:opacity-80 transition-opacity"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Load more button */}
                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <Spinner size="sm" />
                      ) : (
                        <span className="material-symbols-outlined text-base">expand_more</span>
                      )}
                      {loadingMore ? "กำลังโหลด..." : "ดูรีวิวเพิ่มเติม"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={lightboxUrl} alt="" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-on-surface text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
