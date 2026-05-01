"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FilterTabs, EmptyState } from "@/components/shared";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";

interface TicketItem {
  id: string;
  subject: string;
  type: string;
  status: string;
  priority: string;
  replyCount: number;
  hasUnread: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResult {
  items: TicketItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface TicketSummary {
  unread: number;
  open: number;
  total: number;
}

type StatusFilter = "all" | "Open" | "Pending" | "Resolved" | "Closed";
type PriorityFilter = "" | "High" | "Medium" | "Low";
type TypeFilter = "" | "Bug" | "FeatureRequest" | "Question" | "Other";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all",      label: "ทั้งหมด" },
  { value: "Open",     label: "เปิด" },
  { value: "Pending",  label: "รอดำเนินการ" },
  { value: "Resolved", label: "แก้ไขแล้ว" },
  { value: "Closed",   label: "ปิดแล้ว" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Open:     { label: "เปิด",          cls: "bg-(--primary-container)/40 text-(--primary)" },
  Pending:  { label: "รอดำเนินการ",  cls: "bg-amber-50 text-amber-700" },
  Resolved: { label: "แก้ไขแล้ว",    cls: "bg-emerald-50 text-emerald-700" },
  Closed:   { label: "ปิดแล้ว",      cls: "bg-slate-100 text-slate-500" },
};

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  High:   { label: "เร่งด่วน",    cls: "text-red-600 bg-red-50" },
  Medium: { label: "ปานกลาง",     cls: "text-amber-600 bg-amber-50" },
  Low:    { label: "ไม่เร่งด่วน", cls: "text-slate-500 bg-slate-100" },
};

const TYPE_LABEL: Record<string, string> = {
  Bug: "แจ้งปัญหา", FeatureRequest: "เสนอฟีเจอร์", Question: "คำถาม", Other: "อื่นๆ",
};

export default function SupportTicketsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const unreadCount = summary?.unread ?? 0;
  usePageTitle(unreadCount > 0 ? `(${unreadCount}) Support Tickets` : "Support Tickets");

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setLoadError(false); }
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (subjectQuery) params.set("subject", subjectQuery);
      const res = await api.get<PaginatedResult>(`/admin/support/tickets?${params}`);
      setData(res);
    } catch {
      if (!silent) setLoadError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, pageSize, statusFilter, priorityFilter, typeFilter, subjectQuery]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleSubjectSearch = (val: string) => {
    setSubjectSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSubjectQuery(val.trim());
      setPage(1);
    }, 400);
  };

  const hasFilters = statusFilter !== "all" || typeFilter !== "" || priorityFilter !== "" || subjectSearch !== "";
  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("");
    setPriorityFilter("");
    setSubjectSearch("");
    setSubjectQuery("");
    setPage(1);
  };

  useEffect(() => {
    const fetchSummary = () => {
      if (document.hidden) return;
      api.get<TicketSummary>("/admin/support/tickets/summary")
        .then(setSummary)
        .catch(() => {});
    };
    fetchSummary();
    const interval = setInterval(fetchSummary, 60_000);
    const onVisible = () => { if (!document.hidden) fetchSummary(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const PAGE_SIZES = [10, 20, 50];

  useEffect(() => { load(); }, [load]);

  // Silent auto-refresh every 60s — no skeleton flash
  useEffect(() => {
    const interval = setInterval(() => { if (!document.hidden) load(true); }, 60_000);
    const onVisible = () => { if (!document.hidden) load(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;
  const openCount = summary?.open ?? 0;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ตั๋วสนับสนุน</h1>
          {data && data.totalCount > 0 && (
            <p className="text-slate-400 mt-1 text-sm">{data.totalCount} รายการ</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {openCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-(--primary-container)/40 text-(--primary) text-sm font-semibold rounded-lg">
              <span className="w-2 h-2 rounded-full bg-(--primary)" />
              {openCount} ตั๋วที่เปิดอยู่
            </span>
          )}
          <Link
            href="/dashboard/feedback"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--primary) text-white text-sm font-bold rounded-xl hover:bg-(--primary) active:scale-95 transition-all shadow-lg shadow-(--primary)/20"
          >
            <span className="material-symbols-outlined text-base">add</span>
            เปิด Ticket ใหม่
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterTabs
          tabs={STATUS_TABS}
          active={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/10 cursor-pointer text-slate-600"
        >
          <option value="">ทุกประเภท</option>
          <option value="Bug">แจ้งปัญหา</option>
          <option value="FeatureRequest">เสนอฟีเจอร์</option>
          <option value="Question">คำถาม</option>
          <option value="Other">อื่นๆ</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value as PriorityFilter); setPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/10 cursor-pointer text-slate-600"
        >
          <option value="">ทุกระดับ</option>
          <option value="High">เร่งด่วน</option>
          <option value="Medium">ปานกลาง</option>
          <option value="Low">ไม่เร่งด่วน</option>
        </select>
        {/* Subject search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
          <input
            type="text"
            value={subjectSearch}
            onChange={(e) => handleSubjectSearch(e.target.value)}
            placeholder="ค้นหาหัวข้อ..."
            className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/10 text-slate-600 w-44"
          />
          {subjectSearch && (
            <button
              onClick={() => { setSubjectSearch(""); setSubjectQuery(""); setPage(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Content area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-100 rounded-lg w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded w-1/3" />
              </div>
              <div className="h-5 w-16 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-red-300 block mb-3">error_outline</span>
          <p className="font-semibold text-slate-700">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-sm text-slate-400 mt-1">กรุณาตรวจสอบการเชื่อมต่อและลองใหม่</p>
          <button
            onClick={() => load()}
            className="mt-4 px-4 py-2 bg-(--primary) text-white text-sm font-semibold rounded-xl hover:bg-(--primary) transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState
            icon="support_agent"
            title="ยังไม่มีตั๋วสนับสนุน"
            description={hasFilters ? "ลองเปลี่ยนหรือล้างตัวกรอง" : "ยังไม่มีตั๋ว"}
            actionLabel="เปิด Ticket ใหม่"
            actionHref="/dashboard/feedback"
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {data.items.map((t) => {
              const st = STATUS_MAP[t.status] ?? { label: t.status, cls: "bg-slate-100 text-slate-600" };
              const pr = PRIORITY_MAP[t.priority] ?? PRIORITY_MAP.Medium;
              return (
                <button
                  key={t.id}
                  onClick={() => router.push(`/dashboard/support/tickets/${t.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="relative w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">confirmation_number</span>
                    {t.hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-(--primary) rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.subject}</p>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400">{TYPE_LABEL[t.type] ?? t.type}</span>
                      <span className="text-slate-300 text-xs">·</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${pr.cls}`}>{pr.label}</span>
                      {t.replyCount > 0 && (
                        <>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <span className="material-symbols-outlined text-sm">chat_bubble</span>
                            {t.replyCount}
                          </span>
                        </>
                      )}
                      <span className="text-slate-300 text-xs">·</span>
                      <span className="text-xs text-slate-400">
                        {new Date(t.updatedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-slate-300 shrink-0">chevron_right</span>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-400">
                  {data && `แสดง ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, data.totalCount)} จาก ${data.totalCount} รายการ`}
                </p>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 outline-none cursor-pointer"
                >
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / หน้า</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                          page === p
                            ? "bg-(--primary) text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
