"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

interface TicketSummary {
  unread: number;
  open: number;
  total: number;
}

export function Header({ title, subtitle, onMenuClick, actions }: HeaderProps): React.ReactNode {
  const [notifOpen, setNotifOpen] = useState(false);
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Close on outside click or Escape
  useEffect(() => {
    if (!notifOpen) return;
    const onMouse = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    const onKeydown = (e: KeyboardEvent) => { if (e.key === "Escape") setNotifOpen(false); };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKeydown);
    };
  }, [notifOpen]);

  const unreadCount = summary?.unread ?? 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-(--surface-container-lowest)/80 backdrop-blur-xl border-b border-(--outline-variant)/20 flex items-center gap-4 px-4 md:px-8">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-(--surface-variant)/50 transition-colors"
      >
        <span className="material-symbols-outlined text-(--on-surface)">menu</span>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-(--on-surface) truncate">{title}</h1>
        {subtitle && <p className="text-xs text-(--on-surface-variant) truncate">{subtitle}</p>}
      </div>

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Search (desktop) */}
      <div className="hidden md:flex items-center gap-2 bg-(--surface-container-low) rounded-xl px-4 py-2.5 w-64">
        <span className="material-symbols-outlined text-(--outline) text-xl">search</span>
        <input
          type="text"
          placeholder="ค้นหาทริป..."
          className="bg-transparent text-sm text-(--on-surface) placeholder:text-(--outline)/50 outline-none w-full"
        />
      </div>

      {/* Notification bell */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg hover:bg-(--surface-variant)/50 transition-colors"
        >
          <span className="material-symbols-outlined text-(--on-surface-variant)">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-800">ตั๋วสนับสนุน</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{unreadCount} ใหม่</span>
              )}
            </div>

            <div className="px-4 py-3 space-y-2">
              {summary ? (
                <>
                  {unreadCount > 0 ? (
                    <Link
                      href="/dashboard/support/tickets"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
                    >
                      <span className="material-symbols-outlined text-red-500 text-2xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>mark_chat_unread</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-800">Staff ตอบกลับแล้ว {unreadCount} ใบ</p>
                        <p className="text-xs text-red-400">แตะเพื่ออ่านการตอบกลับ</p>
                      </div>
                      <span className="material-symbols-outlined text-red-400 text-base group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                    </Link>
                  ) : summary.open > 0 ? (
                    <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-xl">
                      <span className="material-symbols-outlined text-blue-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-800">ตั๋วที่เปิดอยู่ {summary.open} ใบ</p>
                        <p className="text-xs text-blue-400">ทีมงานกำลังดำเนินการ</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-3 gap-1.5">
                      <span className="material-symbols-outlined text-emerald-400 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <p className="text-xs text-slate-500 font-medium">ตั๋วทั้งหมดอัปเดตแล้ว</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-3 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between gap-2">
              <Link
                href="/dashboard/feedback"
                onClick={() => setNotifOpen(false)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                เปิด Ticket ใหม่
              </Link>
              <Link
                href="/dashboard/support/tickets"
                onClick={() => setNotifOpen(false)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                ดูทั้งหมด
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
