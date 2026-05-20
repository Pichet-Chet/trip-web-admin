"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { EmptyState, ErrorState, LoadingState, Pagination } from "@/components/shared";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarketplaceTripItem {
  id: string;
  slug: string;
  title: string;
  destination: string;
  countryCode: string | null;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelersCount: number;
  coverImageUrl: string | null;
  companyName: string;
  publishedAt: string | null;
}

interface Paginated<T> { items: T[]; totalCount: number; page: number; pageSize: number; }

// ─── Duration filter options ──────────────────────────────────────────────

interface DurationOption { label: string; min?: number; max?: number; }
const DURATION_OPTIONS: DurationOption[] = [
  { label: "ทั้งหมด" },
  { label: "1–3 วัน",           min: 1,  max: 3  },
  { label: "4–7 วัน",           min: 4,  max: 7  },
  { label: "1–2 สัปดาห์",       min: 8,  max: 14 },
  { label: "มากกว่า 2 สัปดาห์", min: 15         },
];

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  usePageTitle("ค้นหาทริป");

  const [items, setItems] = useState<MarketplaceTripItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [durationIdx, setDurationIdx] = useState(0);

  const dur = DURATION_OPTIONS[durationIdx];

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search.trim()) qs.set("search", search.trim());
    if (dur.min !== undefined) qs.set("durationMin", String(dur.min));
    if (dur.max !== undefined) qs.set("durationMax", String(dur.max));
    api.get<Paginated<MarketplaceTripItem>>(`/client/trips?${qs}`)
      .then(d => { setItems(d.items); setTotal(d.totalCount); })
      .catch(e => setError(e instanceof ApiError ? e.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [page, search, dur]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(draftSearch);
    setPage(1);
  }

  function selectDuration(idx: number) {
    setDurationIdx(idx);
    setPage(1);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-(--on-surface) tracking-tight">ค้นหาทริป</h1>
        <p className="text-(--on-surface-variant) text-sm mt-1">เรียกดูทริปที่เปิดให้สาธารณะจากทุกบริษัท</p>
      </div>

      {/* Search + Duration filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-(--on-surface-variant) text-lg pointer-events-none">search</span>
            <input
              type="text"
              value={draftSearch}
              onChange={e => setDraftSearch(e.target.value)}
              placeholder="ค้นหาชื่อทริป หรือ ปลายทาง..."
              className="w-full pl-10 pr-4 py-2.5 border border-(--outline-variant) rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary) transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-(--primary) text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all"
          >
            ค้นหา
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setDraftSearch(""); setSearch(""); setPage(1); }}
              className="px-4 py-2.5 border border-(--outline-variant) rounded-xl text-sm text-(--on-surface-variant) hover:bg-(--surface-variant)/30 transition-all"
            >
              ล้าง
            </button>
          )}
        </form>

        {/* Duration filter chips */}
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => selectDuration(idx)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                durationIdx === idx
                  ? "bg-(--primary) text-white border-(--primary)"
                  : "bg-white text-(--on-surface-variant) border-(--outline-variant) hover:border-(--primary)/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs text-(--on-surface-variant)">
          {total > 0 ? `พบ ${total.toLocaleString("th-TH")} ทริป` : "ไม่พบทริป"}
          {search && <span> สำหรับ "<strong className="text-(--on-surface)">{search}</strong>"</span>}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="travel_explore"
          title="ไม่พบทริปที่ตรงเงื่อนไข"
          description="ลองเปลี่ยนคำค้นหาหรือระยะเวลา"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(trip => (
            <Link
              key={trip.id}
              href={`/t/${trip.slug}`}
              className="group bg-white rounded-2xl border border-(--outline-variant)/40 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Cover */}
              <div className="aspect-video bg-(--surface-variant)/40 overflow-hidden">
                {trip.coverImageUrl ? (
                  <img
                    src={trip.coverImageUrl}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-(--outline)">travel_explore</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-(--on-surface) text-sm line-clamp-2 group-hover:text-(--primary) transition-colors">
                  {trip.title}
                </h3>

                <div className="flex items-center gap-1 text-xs text-(--on-surface-variant)">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span className="truncate">{trip.destination}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-(--on-surface-variant)">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    <span>{formatDate(trip.startDate)}</span>
                  </div>
                  <span className="font-semibold text-(--primary) bg-(--primary-container)/50 px-2 py-0.5 rounded-full">
                    {trip.durationDays} วัน
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-(--outline-variant)/30">
                  <span className="text-xs text-(--on-surface-variant) truncate">{trip.companyName}</span>
                  <div className="flex items-center gap-0.5 text-xs text-(--on-surface-variant)">
                    <span className="material-symbols-outlined text-sm">group</span>
                    <span>{trip.travelersCount}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / PAGE_SIZE)}
          totalItems={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
