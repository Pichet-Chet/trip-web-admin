"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getValidToken } from "@/lib/auth";
import { ErrorState, LoadingState, FilterTabs, Pagination, useToast } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string;
  createdAt: string;
}

interface ActivityResponse {
  totalCount: number;
  page: number;
  pageSize: number;
  items: ActivityItem[];
}

const ACTION_META: Record<string, { label: string; icon: string; tone: string }> = {
  login: { label: "เข้าสู่ระบบ", icon: "login", tone: "text-blue-600 bg-blue-50" },
  password_changed: { label: "เปลี่ยนรหัสผ่าน", icon: "key", tone: "text-amber-700 bg-amber-50" },
  data_exported: { label: "ดาวน์โหลดข้อมูล", icon: "download", tone: "text-violet-600 bg-violet-50" },
  account_deleted: { label: "ลบบัญชี", icon: "delete", tone: "text-red-600 bg-red-50" },
  trip_published: { label: "เผยแพร่ทริป", icon: "flight_takeoff", tone: "text-emerald-700 bg-emerald-50" },
  trip_unpublished: { label: "ยกเลิกเผยแพร่", icon: "unpublished", tone: "text-(--on-surface-variant) bg-(--surface-variant)" },
  member_invited: { label: "เชิญสมาชิก", icon: "person_add", tone: "text-indigo-600 bg-indigo-50" },
  member_removed: { label: "ลบสมาชิก", icon: "person_remove", tone: "text-rose-600 bg-rose-50" },
  plan_purchased: { label: "ซื้อแพ็กเกจ", icon: "shopping_bag", tone: "text-emerald-700 bg-emerald-50" },
  plan_cancelled: { label: "ยกเลิกแพ็กเกจ", icon: "cancel", tone: "text-rose-600 bg-rose-50" },
};

const FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "login", label: "การเข้าสู่ระบบ" },
  { value: "password_changed", label: "รหัสผ่าน" },
  { value: "data_exported", label: "ดาวน์โหลดข้อมูล" },
];

export default function ActivityPage(): React.ReactNode {
  const { toast } = useToast();
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  usePageTitle("ประวัติการใช้งาน");

  const buildParams = useCallback((includePagination: boolean) => {
    const params = new URLSearchParams();
    if (includePagination) {
      params.set("page", String(page));
      params.set("pageSize", "20");
    }
    if (filter !== "all") params.set("action", filter);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to + "T23:59:59").toISOString());
    return params;
  }, [page, filter, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ActivityResponse>(`/admin/me/activity?${buildParams(true)}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  async function exportCsv() {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api"}/admin/me/activity/export.csv?${buildParams(false)}`;
    try {
      const token = await getValidToken();
      const res = await fetch(url, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = `activity-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
      toast("ดาวน์โหลดเรียบร้อย", "success");
    } catch {
      toast("ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่", "error");
    }
  }

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-(--on-surface) tracking-tight">ประวัติการใช้งาน</h1>
          <p className="text-(--on-surface-variant) mt-2 text-sm">บันทึกการกระทำสำคัญในบัญชีของคุณ — ใช้ตรวจสอบความผิดปกติและความปลอดภัย</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!data || data.totalCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-(--outline-variant)/30 text-sm font-semibold text-(--on-surface) hover:bg-(--surface-container-low) disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">download</span>
          ดาวน์โหลด CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-(--outline-variant)/30 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-(--on-surface-variant) mb-1">ตั้งแต่วันที่</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-(--outline-variant) px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--on-surface-variant) mb-1">ถึงวันที่</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-(--outline-variant) px-3 py-2 text-sm"
          />
        </div>
      </div>

      <FilterTabs
        tabs={FILTERS}
        active={filter}
        onChange={(v) => { setFilter(v); setPage(1); }}
      />

      {loading ? (
        <LoadingState message="กำลังโหลด..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data || data.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-(--outline-variant)/30 p-10 text-center">
          <span className="material-symbols-outlined text-(--outline-variant) text-4xl">history</span>
          <p className="mt-3 text-sm text-(--on-surface-variant)">ยังไม่มีบันทึกในช่วงนี้</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-(--outline-variant)/30 divide-y divide-(--outline-variant)/20">
            {data.items.map((item) => {
              const meta = ACTION_META[item.action] ?? {
                label: item.action,
                icon: "info",
                tone: "text-(--on-surface-variant) bg-(--surface-variant)",
              };
              return (
                <div key={item.id} className="p-4 md:p-5 flex items-start gap-4">
                  <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.tone}`}>
                    <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-semibold text-(--on-surface) text-sm">{meta.label}</span>
                      <span className="text-xs text-(--outline)">{new Date(item.createdAt).toLocaleString("th-TH")}</span>
                    </div>
                    <p className="text-sm text-(--on-surface-variant) mt-0.5">{item.detail}</p>
                    {item.ipAddress && (
                      <p className="text-xs text-(--outline) font-mono mt-1">{item.ipAddress}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {data.totalCount > data.pageSize && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(data.totalCount / data.pageSize)}
              totalItems={data.totalCount}
              pageSize={data.pageSize}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
