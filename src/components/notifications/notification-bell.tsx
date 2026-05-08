"use client";

import Link from "next/link";
import { useState } from "react";
import { useDashboard } from "@/lib/contexts/dashboard-context";

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

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม. ที่แล้ว`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH");
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationBell({ open, onOpenChange }: Props): React.ReactNode {
  const { notifications, refreshNotifications, markNotificationRead, markAllNotificationsRead } = useDashboard();
  const [busy, setBusy] = useState(false);

  const unread = notifications?.unreadCount ?? 0;
  const items = notifications?.items ?? [];

  async function handleMarkAllRead() {
    if (busy || unread === 0) return;
    setBusy(true);
    try { markAllNotificationsRead(); }
    finally { setBusy(false); }
  }

  return (
    <div className="relative">
      <button
        onClick={() => { onOpenChange(!open); if (!open) refreshNotifications(); }}
        className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative"
        aria-label={`การแจ้งเตือน${unread > 0 ? ` (${unread} ใหม่)` : ""}`}
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => onOpenChange(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">การแจ้งเตือน</span>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={busy || unread === 0}
                className="text-xs text-(--primary) font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:underline"
              >
                อ่านทั้งหมด
              </button>
            </div>

            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                <span className="material-symbols-outlined text-3xl text-slate-200">notifications_off</span>
                <p className="mt-2">ยังไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {items.map((n) => {
                  const icon = TYPE_ICON[n.type] ?? "info";
                  const tone = TYPE_TONE[n.type] ?? "text-slate-600 bg-slate-100";
                  const inner = (
                    <div className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition ${!n.isRead ? "bg-(--primary-container)/30" : ""}`}>
                      <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${tone}`}>
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{fmtRelative(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 bg-(--primary) rounded-full shrink-0 mt-2" />}
                    </div>
                  );
                  return n.actionUrl ? (
                    <Link
                      key={n.id}
                      href={n.actionUrl}
                      onClick={() => { markNotificationRead(n.id); onOpenChange(false); }}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="w-full text-left"
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="px-4 py-2 border-t border-slate-100 text-center">
              <Link
                href="/dashboard/notifications"
                onClick={() => onOpenChange(false)}
                className="text-xs text-(--primary) font-semibold hover:underline"
              >
                ดูทั้งหมด
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
