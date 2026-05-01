"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ErrorState, LoadingState, FilterTabs, Pagination } from "@/components/shared";

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
  trip_unpublished: { label: "ยกเลิกเผยแพร่", icon: "unpublished", tone: "text-slate-600 bg-slate-100" },
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
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => { document.title = "ประวัติการใช้งาน | Trip Admin"; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (filter !== "all") params.set("action", filter);
      const res = await api.get<ActivityResponse>(`/admin/me/activity?${params}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ประวัติการใช้งาน</h1>
        <p className="text-slate-500 mt-2 text-sm">บันทึกการกระทำสำคัญในบัญชีของคุณ — ใช้ตรวจสอบความผิดปกติและความปลอดภัย</p>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <span className="material-symbols-outlined text-slate-300 text-4xl">history</span>
          <p className="mt-3 text-sm text-slate-500">ยังไม่มีบันทึกในช่วงนี้</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {data.items.map((item) => {
              const meta = ACTION_META[item.action] ?? {
                label: item.action,
                icon: "info",
                tone: "text-slate-600 bg-slate-100",
              };
              return (
                <div key={item.id} className="p-4 md:p-5 flex items-start gap-4">
                  <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${meta.tone}`}>
                    <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-semibold text-slate-900 text-sm">{meta.label}</span>
                      <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("th-TH")}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{item.detail}</p>
                    {item.ipAddress && (
                      <p className="text-xs text-slate-400 font-mono mt-1">{item.ipAddress}</p>
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
