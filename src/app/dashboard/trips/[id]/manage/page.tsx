"use client";

import { use, useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  SectionHeader,
  EmptyState,
  ChannelBadge,
  PageSkeleton,
  ConfirmDialog,
  Modal,
  useToast,
} from "@/components/shared";
import { ROUTES } from "@/constants/routes";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { FollowChannel } from "@/types";

const toFollowChannel = (raw: string): FollowChannel =>
  raw.toLowerCase().includes("line") ? "line" : "web_push";

interface Follower {
  id: string;
  displayName: string;
  channel: string;
  followedAt: string;
  groupRole?: string | null;
}

const GROUP_ROLES = [
  { value: "", label: "— ไม่ระบุ —" },
  { value: "head_of_group", label: "หัวหน้ากลุ่ม" },
  { value: "expense_keeper", label: "ผู้ดูแลค่าใช้จ่าย" },
  { value: "driver", label: "คนขับ" },
  { value: "member", label: "สมาชิก" },
] as const;

interface ChangeEntry {
  id: string;
  type: string;
  description: string;
  sortOrder: number;
}

interface ChangeLog {
  id: string;
  changedBy: string;
  changes: ChangeEntry[];
  summaryText: string;
  notiSent: boolean;
  notiSentAt: string | null;
  createdAt: string;
  /** Server-provided count of followers who haven't acknowledged yet.
      Optional so this UI degrades gracefully if the API doesn't include it. */
  unreadCount?: number;
}

interface Announcement {
  id: string;
  message: string;
  isPinned: boolean;
  createdByName: string | null;
  createdAt: string;
}

interface Receipt {
  followerId: string;
  displayName: string;
  channel: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
}

interface ReceiptResponse {
  changeLogId: string;
  totalFollowers: number;
  acknowledgedCount: number;
  unreadCount: number;
  receipts: Receipt[];
}

const channelLabel = (c: string) => {
  if (c.toLowerCase().includes("line")) return "LINE";
  if (c.toLowerCase().includes("web")) return "Web Push";
  return c;
};

const formatThaiDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatThaiDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function ManagePage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id: tripId } = use(params);
  usePageTitle("จัดการทริป");
  const { toast } = useToast();

  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [changelogs, setChangelogs] = useState<ChangeLog[]>([]);

  // Tab state lives in the URL so the page is shareable and survives
  // refresh. Falls back to "changelog" — the more important view since
  // unsent notifications need attention.
  const tabParam = searchParams.get("tab");
  const activeTab: "followers" | "changelog" | "announcements" =
    tabParam === "followers" ? "followers"
    : tabParam === "announcements" ? "announcements"
    : "changelog";
  const setActiveTab = (tab: "followers" | "changelog" | "announcements"): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "changelog") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [announcementNotify, setAnnouncementNotify] = useState(true);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const [sending, setSending] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ logId: string; mode: "send" | "resend" } | null>(null);

  const [receiptOpen, setReceiptOpen] = useState<ChangeLog | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptResponse | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const downloadIcs = useCallback(async () => {
    try {
      const { getValidToken } = await import("@/lib/auth");
      const token = await getValidToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
      const res = await fetch(`${apiUrl}/admin/trips/${tripId}/calendar.ics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trip-${tripId}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      toast("ดาวน์โหลดไฟล์ปฏิทินแล้ว");
    } catch {
      toast("ไม่สามารถสร้างไฟล์ปฏิทินได้", "error");
    }
  }, [tripId, toast]);

  const downloadPdf = useCallback(async () => {
    try {
      const { getValidToken } = await import("@/lib/auth");
      const token = await getValidToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
      const res = await fetch(`${apiUrl}/admin/trips/${tripId}/export.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trip-${tripId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast("ดาวน์โหลด PDF แล้ว");
    } catch {
      toast("ไม่สามารถสร้าง PDF ได้", "error");
    }
  }, [tripId, toast]);

  const reload = async () => {
    const [f, c, a] = await Promise.all([
      api.get<Follower[]>(`/admin/trips/${tripId}/followers`),
      api.get<ChangeLog[]>(`/admin/trips/${tripId}/changelog`),
      api.get<Announcement[]>(`/admin/trips/${tripId}/announcements`),
    ]);
    setFollowers(f);
    setChangelogs(c);
    setAnnouncements(a);
  };

  useEffect(() => {
    reload()
      .catch((err) => {
        toast(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ", "error");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const pendingCount = useMemo(() => changelogs.filter((l) => !l.notiSent).length, [changelogs]);

  async function handleSend(logId: string, mode: "send" | "resend") {
    setSending(logId);
    try {
      const path = mode === "send"
        ? `/admin/trips/${tripId}/notify/${logId}`
        : `/admin/trips/${tripId}/notify/${logId}/resend`;
      await api.post(path);
      toast(mode === "send" ? "ส่งการแจ้งเตือนเรียบร้อย" : "ส่งซ้ำเรียบร้อย", "success");
      await reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ส่งไม่สำเร็จ", "error");
    } finally {
      setSending(null);
      setConfirmAction(null);
    }
  }

  async function setFollowerRole(followerId: string, role: string) {
    try {
      await api.put(`/admin/trips/${tripId}/followers/${followerId}/role`, { role: role || null });
      setFollowers((prev) => prev.map((f) => f.id === followerId ? { ...f, groupRole: role || null } : f));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "อัปเดตบทบาทไม่สำเร็จ", "error");
    }
  }

  async function handlePostAnnouncement() {
    if (!announcementMsg.trim()) return;
    setPostingAnnouncement(true);
    try {
      await api.post(`/admin/trips/${tripId}/announcements`, {
        message: announcementMsg.trim(),
        isPinned: announcementPinned,
        notify: announcementNotify,
      });
      setAnnouncementMsg("");
      setAnnouncementPinned(false);
      toast("โพสต์ประกาศเรียบร้อย" + (announcementNotify ? " · กำลังส่งแจ้งเตือน" : ""), "success");
      await reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "โพสต์ไม่สำเร็จ", "error");
    } finally {
      setPostingAnnouncement(false);
    }
  }

  async function handleTogglePin(a: Announcement) {
    try {
      await api.put(`/admin/trips/${tripId}/announcements/${a.id}/pin`, { isPinned: !a.isPinned });
      await reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "อัปเดตไม่สำเร็จ", "error");
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      await api.delete(`/admin/trips/${tripId}/announcements/${id}`);
      toast("ลบประกาศแล้ว");
      await reload();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ", "error");
    }
  }

  async function openReceipts(log: ChangeLog) {
    setReceiptOpen(log);
    setReceiptData(null);
    setReceiptLoading(true);
    try {
      const data = await api.get<ReceiptResponse>(`/admin/trips/${tripId}/changelog/${log.id}/receipts`);
      setReceiptData(data);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "โหลดสถานะการอ่านไม่สำเร็จ", "error");
      setReceiptOpen(null);
    } finally {
      setReceiptLoading(false);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href={ROUTES.tripPreview(tripId)}
            className="p-2 rounded-lg hover:bg-(--surface-variant) transition-colors"
            aria-label="กลับ"
          >
            <span className="material-symbols-outlined text-(--on-surface-variant)">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-(--on-surface)">จัดการผู้ติดตาม &amp; การแจ้งเตือน</h1>
            <p className="text-xs md:text-sm text-(--on-surface-variant) mt-0.5">
              {followers.length} ผู้ติดตาม · {pendingCount > 0 ? `${pendingCount} การเปลี่ยนแปลงรอแจ้งเตือน` : "ไม่มีการเปลี่ยนแปลงรอแจ้งเตือน"}
            </p>
          </div>
          <Link
            href={ROUTES.tripExpenses(tripId)}
            title="ค่าใช้จ่ายกลุ่ม"
            className="p-2 rounded-lg hover:bg-(--surface-variant) transition-colors text-(--on-surface-variant)"
          >
            <span className="material-symbols-outlined">receipt_long</span>
          </Link>
          <Link
            href={ROUTES.tripTranslations(tripId)}
            title="คำแปลทริป"
            className="p-2 rounded-lg hover:bg-(--surface-variant) transition-colors text-(--on-surface-variant)"
          >
            <span className="material-symbols-outlined">translate</span>
          </Link>
          <button
            onClick={downloadIcs}
            title="เพิ่มในปฏิทิน"
            className="p-2 rounded-lg hover:bg-(--surface-variant) transition-colors text-(--on-surface-variant)"
          >
            <span className="material-symbols-outlined">calendar_add_on</span>
          </button>
          <button
            onClick={downloadPdf}
            title="ดาวน์โหลด PDF"
            className="p-2 rounded-lg hover:bg-(--surface-variant) transition-colors text-(--on-surface-variant)"
          >
            <span className="material-symbols-outlined">picture_as_pdf</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-(--outline-variant)/30">
          <button
            onClick={() => setActiveTab("changelog")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "changelog"
                ? "border-(--primary) text-(--primary)"
                : "border-transparent text-(--on-surface-variant) hover:text-(--on-surface)"
            }`}
          >
            ประวัติการเปลี่ยนแปลง
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "followers"
                ? "border-(--primary) text-(--primary)"
                : "border-transparent text-(--on-surface-variant) hover:text-(--on-surface)"
            }`}
          >
            ผู้ติดตาม
            <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-(--surface-variant) text-(--on-surface-variant)">
              {followers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "announcements"
                ? "border-(--primary) text-(--primary)"
                : "border-transparent text-(--on-surface-variant) hover:text-(--on-surface)"
            }`}
          >
            ประกาศระหว่างทาง
            {announcements.some((a) => a.isPinned) && (
              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700">
                ปักหมุด
              </span>
            )}
          </button>
        </div>

        {/* Changelog tab */}
        {activeTab === "changelog" && (
          <div className="space-y-4">
            {changelogs.length === 0 ? (
              <EmptyState
                icon="history"
                title="ยังไม่มีการเปลี่ยนแปลง"
                description="เมื่อแก้ไขข้อมูลทริปที่เผยแพร่แล้ว ระบบจะบันทึกประวัติและให้คุณส่งการแจ้งเตือนผู้ติดตามได้"
              />
            ) : (
              changelogs.map((log) => (
                <article
                  key={log.id}
                  className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-sm overflow-hidden"
                >
                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-(--outline)">{formatThaiDateTime(log.createdAt)}</p>
                        {log.notiSent ? (
                          <p className="text-[11px] text-emerald-600 mt-0.5 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            แจ้งเตือนแล้ว · {log.notiSentAt ? formatThaiDateTime(log.notiSentAt) : ""}
                          </p>
                        ) : (
                          <p className="text-[11px] text-amber-600 mt-0.5 inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            ยังไม่ได้แจ้งเตือน
                          </p>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-1.5 mb-4">
                      {log.changes.map((c) => (
                        <li key={c.id} className="flex items-start gap-2 text-sm text-(--on-surface)">
                          <span className="material-symbols-outlined text-(--primary) text-base mt-0.5 shrink-0">edit</span>
                          <span>{c.description}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-(--outline-variant)/20">
                      {!log.notiSent ? (
                        <button
                          onClick={() => setConfirmAction({ logId: log.id, mode: "send" })}
                          disabled={sending === log.id || followers.length === 0}
                          className="px-4 py-2 bg-(--primary) text-white text-sm font-bold rounded-lg hover:bg-(--primary) transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">send</span>
                          ส่งการแจ้งเตือน
                          {followers.length > 0 && ` (${followers.length})`}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openReceipts(log)}
                            className="px-4 py-2 bg-(--surface-variant) text-(--on-surface) text-sm font-bold rounded-lg hover:bg-(--surface-variant)/80 transition-colors inline-flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            ดูสถานะการอ่าน
                          </button>
                          <button
                            onClick={() => setConfirmAction({ logId: log.id, mode: "resend" })}
                            disabled={sending === log.id}
                            className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-bold rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-sm">replay</span>
                            ส่งซ้ำให้ผู้ที่ยังไม่อ่าน
                            {typeof log.unreadCount === "number" && log.unreadCount > 0 && ` (${log.unreadCount})`}
                          </button>
                        </>
                      )}
                    </div>

                    {!log.notiSent && followers.length === 0 && (
                      <p className="text-[11px] text-(--outline) mt-2">
                        ยังไม่มีผู้ติดตามให้แจ้งเตือน
                      </p>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* Followers tab */}
        {activeTab === "followers" && (
          <section className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-(--outline-variant)/20">
              <SectionHeader
                title="รายชื่อผู้ติดตาม"
                subtitle="ผู้ที่กดติดตามทริปนี้และจะได้รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลง"
                variant="bar"
              />
            </div>

            {followers.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon="group"
                  title="ยังไม่มีผู้ติดตาม"
                  description="เมื่อมีคนกดติดตามทริปนี้จากหน้าสาธารณะ จะแสดงรายชื่อที่นี่"
                />
              </div>
            ) : (
              <ul className="divide-y divide-(--outline-variant)/20">
                {followers.map((f) => (
                  <li key={f.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-(--surface-variant) flex items-center justify-center text-sm font-bold text-(--on-surface-variant) shrink-0">
                        {f.displayName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-(--on-surface) truncate">{f.displayName}</p>
                        <p className="text-[11px] text-(--outline)">เริ่มติดตามเมื่อ {formatThaiDate(f.followedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <select
                        value={f.groupRole ?? ""}
                        onChange={(e) => setFollowerRole(f.id, e.target.value)}
                        className="text-xs rounded-lg border border-(--outline-variant)/40 px-2 py-1.5 bg-white text-(--on-surface) focus:border-(--primary) focus:outline-none"
                        title="บทบาทในกลุ่ม"
                      >
                        {GROUP_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                        {/* If the current role is free-form (not in preset list), show it */}
                        {f.groupRole && !GROUP_ROLES.some((r) => r.value === f.groupRole) && (
                          <option value={f.groupRole}>{f.groupRole}</option>
                        )}
                      </select>
                      <ChannelBadge channel={toFollowChannel(f.channel)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Announcements tab */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            {/* Compose form */}
            <section className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 md:p-6 shadow-sm">
              <h2 className="text-sm font-bold text-(--on-surface) mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-(--primary)">campaign</span>
                โพสต์ประกาศใหม่
              </h2>
              <textarea
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                maxLength={2048}
                rows={3}
                placeholder="เช่น ฝนตก เปลี่ยนแผน 14:00 ไปคาเฟ่แทน ..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-(--outline-variant)/40 focus:border-(--primary) focus:outline-none resize-none"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-(--on-surface-variant) cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={announcementPinned}
                    onChange={(e) => setAnnouncementPinned(e.target.checked)}
                    className="w-4 h-4 accent-(--primary)"
                  />
                  ปักหมุดด้านบนหน้าทริป
                </label>
                <label className="flex items-center gap-2 text-sm text-(--on-surface-variant) cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={announcementNotify}
                    onChange={(e) => setAnnouncementNotify(e.target.checked)}
                    className="w-4 h-4 accent-(--primary)"
                  />
                  ส่งแจ้งเตือนผู้ติดตาม
                </label>
                <button
                  onClick={handlePostAnnouncement}
                  disabled={postingAnnouncement || !announcementMsg.trim()}
                  className="ml-auto px-5 py-2 bg-(--primary) text-(--on-primary) rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  {postingAnnouncement && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  โพสต์ประกาศ
                </button>
              </div>
            </section>

            {/* Announcement list */}
            {announcements.length === 0 ? (
              <EmptyState
                icon="campaign"
                title="ยังไม่มีประกาศ"
                description="ใช้ประกาศส่งข้อความด่วนถึงลูกทริป เช่น เปลี่ยนแผน เวลานัดหมาย"
              />
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 ${
                      a.isPinned ? "border-orange-300" : "border-(--outline-variant)/30"
                    }`}
                  >
                    {a.isPinned && (
                      <span className="material-symbols-outlined text-orange-500 shrink-0 mt-0.5" title="ปักหมุด" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-(--on-surface) whitespace-pre-wrap">{a.message}</p>
                      <p className="text-[11px] text-(--on-surface-variant) mt-1.5">
                        {formatThaiDateTime(a.createdAt)}
                        {a.createdByName && ` · ${a.createdByName}`}
                      </p>
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      <button
                        onClick={() => handleTogglePin(a)}
                        title={a.isPinned ? "เลิกปักหมุด" : "ปักหมุด"}
                        className={`p-1.5 rounded-lg transition-colors ${a.isPinned ? "text-orange-500 hover:bg-orange-50" : "text-(--on-surface-variant) hover:bg-(--surface-variant)"}`}
                      >
                        <span className="material-symbols-outlined text-base" style={a.isPinned ? { fontVariationSettings: "'FILL' 1" } : undefined}>push_pin</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        title="ลบ"
                        className="p-1.5 rounded-lg text-(--on-surface-variant) hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm send/resend */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleSend(confirmAction.logId, confirmAction.mode)}
        title={confirmAction?.mode === "send" ? "ส่งการแจ้งเตือนหรือไม่?" : "ส่งซ้ำให้ผู้ที่ยังไม่อ่านหรือไม่?"}
        description={(() => {
          if (!confirmAction) return "";
          if (confirmAction.mode === "send") {
            return `จะส่งแจ้งเตือนถึงผู้ติดตาม ${followers.length} คน — ตรวจสอบให้แน่ใจว่าข้อมูลทริปอัปเดตเรียบร้อย`;
          }
          const unread = changelogs.find((l) => l.id === confirmAction.logId)?.unreadCount;
          return typeof unread === "number"
            ? `ระบบจะส่งซ้ำเฉพาะผู้ที่ยังไม่ได้กดยืนยันการอ่าน (${unread} คน)`
            : "ระบบจะส่งเฉพาะผู้ที่ยังไม่ได้กดยืนยันการอ่าน";
        })()}
        confirmLabel={confirmAction?.mode === "send" ? "ส่ง" : "ส่งซ้ำ"}
      />

      <Modal
        open={!!receiptOpen}
        onClose={() => setReceiptOpen(null)}
        size="lg"
        title="สถานะการอ่าน"
        subtitle={receiptOpen ? formatThaiDateTime(receiptOpen.createdAt) : undefined}
      >
        {receiptLoading ? (
          <div className="p-12 text-center text-(--outline) animate-pulse">กำลังโหลด...</div>
        ) : receiptData ? (
          <>
            <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-(--outline-variant)/20 bg-(--surface-container-low)">
              <div>
                <p className="text-[10px] text-(--outline) uppercase">ทั้งหมด</p>
                <p className="text-2xl font-bold text-(--on-surface)">{receiptData.totalFollowers}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-600 uppercase">อ่านแล้ว</p>
                <p className="text-2xl font-bold text-emerald-600">{receiptData.acknowledgedCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-600 uppercase">ยังไม่อ่าน</p>
                <p className="text-2xl font-bold text-amber-600">{receiptData.unreadCount}</p>
              </div>
            </div>
            <ul className="divide-y divide-(--outline-variant)/20">
              {receiptData.receipts.map((r) => (
                <li key={r.followerId} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-(--surface-variant) flex items-center justify-center text-xs font-bold text-(--on-surface-variant) shrink-0">
                      {r.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-(--on-surface) truncate">{r.displayName}</p>
                      <p className="text-[11px] text-(--outline)">
                        {channelLabel(r.channel)}
                        {r.acknowledged && r.acknowledgedAt && ` · อ่านเมื่อ ${formatThaiDateTime(r.acknowledgedAt)}`}
                      </p>
                    </div>
                  </div>
                  {r.acknowledged ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <span className="material-symbols-outlined text-sm">done_all</span>
                      อ่านแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600">ยังไม่อ่าน</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Modal>
    </main>
  );
}
