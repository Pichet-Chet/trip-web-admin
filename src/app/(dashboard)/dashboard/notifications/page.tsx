"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { EmptyState, ErrorState, Pagination, TableRowSkeleton, useToast } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface ListResponse {
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  items: NotificationItem[];
}

const TYPE_ICON: Record<string, string> = {
  ticket_replied: "support_agent",
  refund_approved: "check_circle",
  refund_rejected: "cancel",
  payment_succeeded: "payments",
  payment_failed: "report",
  member_joined: "person_add",
  trip_acknowledged: "task_alt",
  comment_received: "comment",
  plan_expiring: "schedule",
};

const TYPE_TONE: Record<string, string> = {
  refund_approved: "text-emerald-600 bg-emerald-50",
  refund_rejected: "text-red-600 bg-red-50",
  ticket_replied: "text-blue-600 bg-blue-50",
  payment_succeeded: "text-emerald-600 bg-emerald-50",
  payment_failed: "text-red-600 bg-red-50",
  plan_expiring: "text-amber-600 bg-amber-50",
};

export default function NotificationsPage(): React.ReactNode {
  const { toast } = useToast();
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  usePageTitle("การแจ้งเตือน");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "30" });
      if (unreadOnly) params.set("unread", "true");
      const res = await api.get<ListResponse>(`/me/notifications?${params}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    setData((prev) => prev && {
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - 1),
      items: prev.items.map((n) => n.id === id ? { ...n, isRead: true } : n),
    });
    try { await api.put(`/me/notifications/${id}/read`, {}); } catch { /* non-critical — UI updated optimistically */ }
  }

  async function markAllRead() {
    if (!data || data.unreadCount === 0) return;
    try {
      await api.post("/me/notifications/read-all", {});
      toast.success("อ่านทั้งหมดเรียบร้อย");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ไม่สำเร็จ");
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-(--on-surface) tracking-tight">การแจ้งเตือน</h1>
          <p className="text-(--on-surface-variant) mt-2 text-sm">
            {data ? `ทั้งหมด ${data.totalCount} รายการ — ยังไม่อ่าน ${data.unreadCount}` : "กำลังโหลด..."}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {data && data.unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="px-4 py-2 rounded-lg border border-(--outline-variant)/30 text-sm font-semibold text-(--on-surface) hover:bg-(--surface-container-low)"
            >
              อ่านทั้งหมด
            </button>
          )}
          <Link
            href="/dashboard/settings#notifications"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-(--outline-variant)/30 text-sm font-semibold text-(--on-surface-variant) hover:bg-(--surface-container-low) transition-colors"
          >
            <span className="material-symbols-outlined text-base">tune</span>
            ตั้งค่าการแจ้งเตือน
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setUnreadOnly(false); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${!unreadOnly ? "bg-(--primary) text-white" : "bg-white border border-(--outline-variant)/30 text-(--on-surface)"}`}
        >
          ทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => { setUnreadOnly(true); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${unreadOnly ? "bg-(--primary) text-white" : "bg-white border border-(--outline-variant)/30 text-(--on-surface)"}`}
        >
          ยังไม่อ่าน {data?.unreadCount ? `(${data.unreadCount})` : ""}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-(--outline-variant)/30 divide-y divide-(--outline-variant)/20">
          {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon="notifications_off"
          title={unreadOnly ? "ไม่มีการแจ้งเตือนที่ยังไม่อ่าน" : "ยังไม่มีการแจ้งเตือน"}
          description={unreadOnly ? "การแจ้งเตือนทั้งหมดอ่านแล้ว" : "ระบบจะแจ้งเตือนเมื่อมีความเคลื่อนไหวในทริปของคุณ"}
        />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-(--outline-variant)/30 divide-y divide-(--outline-variant)/20">
            {data.items.map((n) => {
              const icon = TYPE_ICON[n.type] ?? "info";
              const tone = TYPE_TONE[n.type] ?? "text-(--on-surface-variant) bg-(--surface-variant)";
              const inner = (
                <div className={`p-4 md:p-5 flex items-start gap-4 hover:bg-(--surface-container-low) transition ${!n.isRead ? "bg-(--primary-container)/20" : ""}`}>
                  <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.isRead ? "font-bold text-(--on-surface)" : "font-semibold text-(--on-surface)"}`}>
                      {n.title}
                    </p>
                    <p className="text-sm text-(--on-surface-variant) mt-1">{n.body}</p>
                    <p className="text-xs text-(--outline) mt-2">{new Date(n.createdAt).toLocaleString("th-TH")}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 bg-(--primary) rounded-full shrink-0 mt-2" />}
                </div>
              );
              return n.actionUrl ? (
                <Link key={n.id} href={n.actionUrl} onClick={() => markRead(n.id)}>{inner}</Link>
              ) : (
                <button key={n.id} type="button" onClick={() => markRead(n.id)} className="w-full text-left">{inner}</button>
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
