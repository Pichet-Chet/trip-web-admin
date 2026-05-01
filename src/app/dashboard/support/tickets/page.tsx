"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EmptyState,
  ErrorState,
  FilterTabs,
  Pagination,
  SelectPicker,
  StatusBadge,
  TableRowSkeleton,
} from "@/components/shared";
import type { StatusConfig } from "@/components/shared/status-badge";
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

const STATUS_CONFIG: Record<string, StatusConfig> = {
  Open:     { label: "เปิด",         tone: "primary",  cls: "bg-(--primary-container) text-(--on-primary-container) ring-1 ring-(--primary)/20" },
  Pending:  { label: "รอดำเนินการ", tone: "amber",    cls: "bg-amber-100 text-amber-800 ring-1 ring-amber-200" },
  Resolved: { label: "แก้ไขแล้ว",   tone: "emerald",  cls: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" },
  Closed:   { label: "ปิดแล้ว",     tone: "slate",    cls: "bg-slate-200 text-slate-700 ring-1 ring-slate-300" },
};

const TYPE_LABEL: Record<string, string> = {
  Bug: "แจ้งปัญหา",
  FeatureRequest: "เสนอฟีเจอร์",
  Question: "คำถาม",
  Other: "อื่นๆ",
};

const TYPE_ICON: Record<string, { icon: string; tone: string }> = {
  Bug:            { icon: "bug_report",  tone: "text-rose-600    bg-rose-50" },
  FeatureRequest: { icon: "lightbulb",   tone: "text-amber-600   bg-amber-50" },
  Question:       { icon: "help",        tone: "text-blue-600    bg-blue-50" },
  Other:          { icon: "label",       tone: "text-slate-500   bg-slate-100" },
};

/** Compact relative date for ticket rows. < 24h shows "X ชม.", < 7d shows "Y วัน",
 *  < this year shows "1 พ.ค.", older shows "1 พ.ค. 67". */
function formatRelativeDate(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาที`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "เมื่อวาน";
  if (day < 7) return `${day} วัน`;
  if (then.getFullYear() === now.getFullYear()) {
    return then.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  }
  return then.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

const TYPE_OPTIONS = [
  { value: "", label: "ทุกประเภท" },
  { value: "Bug", label: "แจ้งปัญหา" },
  { value: "FeatureRequest", label: "เสนอฟีเจอร์" },
  { value: "Question", label: "คำถาม" },
  { value: "Other", label: "อื่นๆ" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "ทุกระดับความสำคัญ" },
  { value: "High", label: "เร่งด่วน" },
  { value: "Medium", label: "ปานกลาง" },
  { value: "Low", label: "ไม่เร่งด่วน" },
];

const PAGE_SIZE = 20;
const POLL_INTERVAL = 60_000;

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

  const unreadCount = summary?.unread ?? 0;
  usePageTitle(unreadCount > 0 ? `(${unreadCount}) Support Tickets` : "Support Tickets");

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setLoadError(false); }
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
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
  }, [page, statusFilter, priorityFilter, typeFilter, subjectQuery]);

  // Filter-driven (re)load — shows skeleton on first call.
  useEffect(() => { load(); }, [load]);

  // Single polling loop: silent list refetch + summary update on visible tab.
  // Replaces the previous two-effect duplication.
  useEffect(() => {
    const fetchSummary = () =>
      api.get<TicketSummary>("/admin/support/tickets/summary").then(setSummary).catch(() => {});
    fetchSummary();

    const tick = () => {
      if (document.hidden) return;
      load(true);
      fetchSummary();
    };
    const interval = setInterval(tick, POLL_INTERVAL);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  // Cleanup search debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  function handleSubjectSearch(val: string) {
    setSubjectSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSubjectQuery(val.trim());
      setPage(1);
    }, 400);
  }

  const hasFilters =
    statusFilter !== "all" || typeFilter !== "" || priorityFilter !== "" || subjectSearch !== "";

  function clearFilters() {
    setStatusFilter("all");
    setTypeFilter("");
    setPriorityFilter("");
    setSubjectSearch("");
    setSubjectQuery("");
    setPage(1);
  }

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;
  const openCount = summary?.open ?? 0;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ตั๋วสนับสนุน</h1>
          {data && data.totalCount > 0 && (
            <p className="text-slate-400 mt-1 text-sm">{data.totalCount.toLocaleString("th-TH")} รายการ</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {openCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-semibold rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {openCount} ตั๋วที่เปิดอยู่
            </span>
          )}
          <Link
            href="/dashboard/feedback"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-(--primary) text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-(--primary)/20"
          >
            <span className="material-symbols-outlined text-base">add</span>
            เปิด Ticket ใหม่
          </Link>
        </div>
      </div>

      {/* Status tabs — primary filter, full row */}
      <FilterTabs
        tabs={STATUS_TABS}
        active={statusFilter}
        onChange={(v) => { setStatusFilter(v); setPage(1); }}
      />

      {/* Secondary filters — responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-3">
          <SelectPicker
            label="ประเภท"
            icon="bug_report"
            searchable={false}
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v as TypeFilter); setPage(1); }}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="md:col-span-3">
          <SelectPicker
            label="ความสำคัญ"
            icon="priority_high"
            searchable={false}
            value={priorityFilter}
            onChange={(v) => { setPriorityFilter(v as PriorityFilter); setPage(1); }}
            options={PRIORITY_OPTIONS}
          />
        </div>
        <div className="md:col-span-5">
          <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 block mb-2">ค้นหาหัวข้อ</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-(--on-surface-variant) text-lg leading-none">search</span>
            <input
              type="text"
              value={subjectSearch}
              onChange={(e) => handleSubjectSearch(e.target.value)}
              placeholder="พิมพ์เพื่อค้นหา..."
              className="w-full bg-(--surface-container-low) border border-transparent rounded-xl py-4 pl-12 pr-12 focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-all text-(--on-surface) font-medium placeholder:text-(--outline)/40 outline-none"
            />
            {subjectSearch && (
              <button
                onClick={() => { setSubjectSearch(""); setSubjectQuery(""); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-(--outline) hover:text-(--on-surface) hover:bg-(--surface-container) rounded-full transition-colors"
                aria-label="ล้างคำค้น"
              >
                <span className="material-symbols-outlined text-xl leading-none">close</span>
              </button>
            )}
          </div>
        </div>
        <div className="md:col-span-1 md:flex md:justify-end">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-all"
              title="ล้างตัวกรอง"
            >
              <span className="material-symbols-outlined text-base">filter_alt_off</span>
              <span className="md:hidden">ล้างตัวกรอง</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} />)}
        </div>
      ) : loadError ? (
        <ErrorState message="โหลดข้อมูลไม่สำเร็จ — กรุณาตรวจสอบการเชื่อมต่อและลองใหม่" onRetry={() => load()} />
      ) : !data || data.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          {hasFilters ? (
            <EmptyState
              icon="filter_alt_off"
              title="ไม่พบตั๋วตามตัวกรองที่เลือก"
              description="ลองเปลี่ยนเงื่อนไข หรือล้างตัวกรองทั้งหมด"
              actionLabel="ล้างตัวกรอง"
              actionIcon="restart_alt"
              actionVariant="secondary"
              onAction={clearFilters}
            />
          ) : (
            <EmptyState
              icon="support_agent"
              title="ยังไม่มีตั๋วสนับสนุน"
              description="เปิด ticket ใหม่เมื่อต้องการความช่วยเหลือ ทีมงานจะตอบกลับโดยเร็ว"
              actionLabel="เปิด Ticket ใหม่"
              actionHref="/dashboard/feedback"
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {data.items.map((t) => {
              const typeMeta = TYPE_ICON[t.type] ?? TYPE_ICON.Other;
              return (
              <li key={t.id} className="relative">
                {/* Left accent bar — drawn outside the button so it can hug the
                    very edge of the card without messing up button padding. */}
                {t.hasUnread && (
                  <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-(--primary) rounded-r" />
                )}
                <button
                  onClick={() => router.push(`/dashboard/support/tickets/${t.id}`)}
                  title={t.subject}
                  className={`w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--primary)/40 ${
                    t.hasUnread ? "bg-(--primary-container)/30" : ""
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeMeta.tone}`}>
                    <span className="material-symbols-outlined text-xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>{typeMeta.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row: subject + status pill */}
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${t.hasUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{t.subject}</p>
                      <StatusBadge status={t.status} config={STATUS_CONFIG} variant="pill" />
                    </div>

                    {/* Bottom row: type · priority(High) · replies | date */}
                    <div className="flex items-center gap-x-3 mt-1 text-xs">
                      <span className="text-slate-500">{TYPE_LABEL[t.type] ?? t.type}</span>
                      {t.priority === "High" && (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold" title="สำคัญสูง">
                          <span className="material-symbols-outlined text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
                          เร่งด่วน
                        </span>
                      )}
                      {t.replyCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <span className="material-symbols-outlined text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                          <span className="tabular-nums">{t.replyCount}</span>
                        </span>
                      )}
                      <span className="ml-auto text-slate-400 font-medium shrink-0 tabular-nums">
                        {formatRelativeDate(t.updatedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
              );
            })}
          </ul>

          {totalPages > 1 && data && (
            <div className="border-t border-slate-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={data.totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
