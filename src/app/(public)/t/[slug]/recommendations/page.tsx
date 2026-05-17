"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Spinner } from "@/components/shared";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Recommendation {
  id: string;
  category: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  mapsLink: string | null;
  likeCount: number;
  createdByName: string;
}

interface PaginatedRecs {
  items: Recommendation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
}

const categories = [
  { key: "", label: "ทั้งหมด", icon: "explore" },
  { key: "restaurant", label: "ร้านอาหาร", icon: "restaurant" },
  { key: "cafe", label: "คาเฟ่", icon: "local_cafe" },
  { key: "attraction", label: "สถานที่", icon: "landscape" },
  { key: "shopping", label: "ช้อปปิ้ง", icon: "shopping_bag" },
  { key: "other", label: "อื่นๆ", icon: "place" },
];

const catStyle: Record<string, { icon: string; color: string }> = {
  restaurant: { icon: "restaurant", color: "text-orange-500 bg-orange-50" },
  attraction: { icon: "landscape", color: "text-blue-500 bg-blue-50" },
  cafe: { icon: "local_cafe", color: "text-amber-600 bg-amber-50" },
  shopping: { icon: "shopping_bag", color: "text-pink-500 bg-pink-50" },
  other: { icon: "place", color: "text-slate-500 bg-slate-50" },
};

export default function RecommendationsPage({ params }: PageProps): React.JSX.Element {
  const { slug } = use(params);
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchPage = useCallback(async (page: number, category: string, append: boolean) => {
    const params = new URLSearchParams({ page: String(page), pageSize: "12" });
    if (category) params.set("category", category);
    const data = await api.get<PaginatedRecs>(`/client/t/${slug}/recommendations?${params}`);
    setItems((prev) => append ? [...prev, ...data.items] : data.items);
    setCurrentPage(page);
    setHasMore(data.hasNext);
    setTotalCount(data.totalCount);
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    fetchPage(1, activeCategory, false)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try { await fetchPage(currentPage + 1, activeCategory, true); }
    catch { /* silent */ }
    finally { setLoadingMore(false); }
  }, [currentPage, hasMore, loadingMore, activeCategory, fetchPage]);

  return (
    <div className="natgan-bg min-h-screen text-on-surface pb-24">
      <nav className="bg-white/90 glass-blur border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/t/${slug}`}
              className="material-symbols-outlined text-on-surface-variant hover:text-brand-blue transition-colors text-xl">
              arrow_back
            </Link>
            <h1 className="font-headline font-bold text-lg">แนะนำโดยสมาชิก</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Category filter chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                activeCategory === c.key
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-on-surface-variant px-1">{totalCount} รายการ</p>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant/15 p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 block">explore_off</span>
            <h2 className="font-headline font-bold text-lg text-on-surface">ยังไม่มีรายการแนะนำ</h2>
            <p className="text-on-surface-variant text-sm">
              {activeCategory ? "ไม่พบรายการในหมวดนี้" : "ทริปนี้ยังไม่มีสถานที่แนะนำ"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((rec) => {
                const cat = catStyle[rec.category] ?? catStyle.other;
                return (
                  <div key={rec.id} className="flex gap-3 rounded-2xl bg-white border border-outline-variant/15 p-4 hover:shadow-md transition-all">
                    {rec.imageUrl ? (
                      <button type="button" onClick={() => setLightboxUrl(rec.imageUrl)} className="w-16 h-16 rounded-xl overflow-hidden shrink-0 hover:opacity-80 transition-opacity">
                        <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ) : (
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-on-surface truncate">{rec.name}</h4>
                        <span className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cat.color}`}>
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                        </span>
                      </div>
                      {rec.description && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{rec.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs text-rose-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                          {rec.likeCount}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">โดย {rec.createdByName}</span>
                        {rec.mapsLink && (
                          <a href={rec.mapsLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-blue font-bold flex items-center gap-0.5 hover:underline">
                            <span className="material-symbols-outlined text-xs">map</span>
                            แผนที่
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-outline-variant/30 text-sm font-bold text-on-surface-variant hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-base">expand_more</span>}
                  {loadingMore ? "กำลังโหลด..." : "ดูเพิ่มเติม"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {lightboxUrl && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={lightboxUrl} alt="" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
            <button onClick={() => setLightboxUrl(null)} className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
