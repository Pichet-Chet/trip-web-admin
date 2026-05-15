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
  ToggleSwitch,
  FormTextarea,
  Checkbox,
  SelectPicker,
  Avatar,
  Button,
  IconButton,
} from "@/components/shared";
import type { SelectOption } from "@/components/shared";
import { ROUTES } from "@/constants/routes";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import type { FollowChannel } from "@/types";

const toFollowChannel = (raw: string): FollowChannel =>
  raw.toLowerCase().includes("line") ? "line" : "web_push";

const isMember = (channel: string) => channel.toLowerCase() === "member";

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

const groupRoleOptions: SelectOption[] = GROUP_ROLES.map((r) => ({ value: r.value, label: r.label }));

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
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [togglingApproval, setTogglingApproval] = useState(false);
  const [joinRequests, setJoinRequests] = useState<{ id: string; displayName: string; email: string | null; requestedAt: string }[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [processingJoin, setProcessingJoin] = useState<string | null>(null);

  // Trip meta state
  const [tripTitle, setTripTitle] = useState<string>("");
  const [tripCover, setTripCover] = useState<string | null>(null);
  const [tripDestination, setTripDestination] = useState<string>("");
  const [tripStartDate, setTripStartDate] = useState<string | null>(null);
  const [tripEndDate, setTripEndDate] = useState<string | null>(null);

  // Tab state lives in the URL so the page is shareable and survives
  // refresh. Falls back to "changelog" — the more important view since
  // unsent notifications need attention.
  const tabParam = searchParams.get("tab");
  const activeTab: "followers" | "changelog" | "announcements" | "join-requests" =
    tabParam === "followers" ? "followers"
    : tabParam === "announcements" ? "announcements"
    : tabParam === "join-requests" ? "join-requests"
    : "changelog";
  const setActiveTab = (tab: "followers" | "changelog" | "announcements" | "join-requests"): void => {
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
      toast.success("ดาวน์โหลดไฟล์ปฏิทินแล้ว");
    } catch {
      toast.error("ไม่สามารถสร้างไฟล์ปฏิทินได้");
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
      toast.success("ดาวน์โหลด PDF แล้ว");
    } catch {
      toast.error("ไม่สามารถสร้าง PDF ได้");
    }
  }, [tripId, toast]);

  const loadJoinRequests = useCallback(async () => {
    setJoinRequestsLoading(true);
    try {
      const rows = await api.get<{ id: string; displayName: string; email: string | null; requestedAt: string }[]>(
        `/admin/trips/${tripId}/join-requests`
      );
      setJoinRequests(rows);
    } catch { /* ignore */ }
    finally { setJoinRequestsLoading(false); }
  }, [tripId]);

  const reload = async () => {
    const [f, c, a, tripMeta] = await Promise.all([
      api.get<Follower[]>(`/admin/trips/${tripId}/followers`),
      api.get<ChangeLog[]>(`/admin/trips/${tripId}/changelog`),
      api.get<Announcement[]>(`/admin/trips/${tripId}/announcements`),
      api.get<{
        requiresApproval: boolean;
        title?: string;
        coverImageUrl?: string;
        destination?: string;
        startDate?: string;
        endDate?: string;
      }>(`/admin/trips/${tripId}`).catch(() => null),
    ]);
    setFollowers(f);
    setChangelogs(c);
    setAnnouncements(a);
    if (tripMeta) {
      setRequiresApproval(tripMeta.requiresApproval ?? false);
      setTripTitle(tripMeta.title ?? "");
      setTripCover(tripMeta.coverImageUrl ?? null);
      setTripDestination(tripMeta.destination ?? "");
      setTripStartDate(tripMeta.startDate ?? null);
      setTripEndDate(tripMeta.endDate ?? null);
    }
  };

  useEffect(() => {
    reload()
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    if (requiresApproval) loadJoinRequests();
  }, [requiresApproval, loadJoinRequests]);

  async function handleToggleApproval() {
    setTogglingApproval(true);
    try {
      await api.put(`/admin/trips/${tripId}`, { requiresApproval: !requiresApproval });
      setRequiresApproval((v) => !v);
      toast.success(!requiresApproval ? "เปิดการอนุมัติสมาชิกแล้ว" : "ปิดการอนุมัติสมาชิกแล้ว");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally { setTogglingApproval(false); }
  }

  async function handleApproveJoin(followerId: string) {
    setProcessingJoin(followerId);
    try {
      await api.post(`/admin/trips/${tripId}/join-requests/${followerId}/approve`);
      setJoinRequests((prev) => prev.filter((r) => r.id !== followerId));
      toast.success("อนุมัติเรียบร้อยแล้ว");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally { setProcessingJoin(null); }
  }

  async function handleRejectJoin(followerId: string) {
    setProcessingJoin(followerId);
    try {
      await api.post(`/admin/trips/${tripId}/join-requests/${followerId}/reject`);
      setJoinRequests((prev) => prev.filter((r) => r.id !== followerId));
      toast.success("ปฏิเสธคำขอแล้ว");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally { setProcessingJoin(null); }
  }

  const pendingCount = useMemo(() => changelogs.filter((l) => !l.notiSent).length, [changelogs]);

  async function handleSend(logId: string, mode: "send" | "resend") {
    setSending(logId);
    try {
      const path = mode === "send"
        ? `/admin/trips/${tripId}/notify/${logId}`
        : `/admin/trips/${tripId}/notify/${logId}/resend`;
      await api.post(path);
      toast.success(mode === "send" ? "ส่งการแจ้งเตือนเรียบร้อย" : "ส่งซ้ำเรียบร้อย");
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ส่งไม่สำเร็จ");
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
      toast.error(err instanceof ApiError ? err.message : "อัปเดตบทบาทไม่สำเร็จ");
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
      toast.success("โพสต์ประกาศเรียบร้อย" + (announcementNotify ? " · กำลังส่งแจ้งเตือน" : ""));
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "โพสต์ไม่สำเร็จ");
    } finally {
      setPostingAnnouncement(false);
    }
  }

  async function handleTogglePin(a: Announcement) {
    try {
      await api.put(`/admin/trips/${tripId}/announcements/${a.id}/pin`, { isPinned: !a.isPinned });
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "อัปเดตไม่สำเร็จ");
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      await api.delete(`/admin/trips/${tripId}/announcements/${id}`);
      toast.success("ลบประกาศแล้ว");
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ");
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
      toast.error(err instanceof ApiError ? err.message : "โหลดสถานะการอ่านไม่สำเร็จ");
      setReceiptOpen(null);
    } finally {
      setReceiptLoading(false);
    }
  }

  if (loading) return <PageSkeleton />;

  const hasPinnedAnnouncement = announcements.some((a) => a.isPinned);
  const showJoinTab = requiresApproval || joinRequests.length > 0;

  const dateRange = (() => {
    if (!tripStartDate && !tripEndDate) return null;
    if (tripStartDate && tripEndDate)
      return `${formatThaiDate(tripStartDate)} – ${formatThaiDate(tripEndDate)}`;
    if (tripStartDate) return formatThaiDate(tripStartDate);
    return null;
  })();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-(--surface-container-lowest) pb-10">
      {/* ── Top header bar ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-(--outline-variant)/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <IconButton icon="arrow_back" onClick={() => router.back()} aria-label="กลับ" />

          <h1 className="flex-1 text-center text-base font-bold text-(--on-surface)">จัดการทริป</h1>

          <IconButton icon="picture_as_pdf" onClick={downloadPdf} title="ดาวน์โหลด PDF" />
          <IconButton icon="calendar_add_on" onClick={downloadIcs} title="เพิ่มในปฏิทิน" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 space-y-4">
        {/* ── Trip context card ── */}
        <div className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm p-4 md:p-5">
          {/* Trip identity row */}
          <div className="flex items-center gap-4">
            {tripCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tripCover}
                alt={tripTitle}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-(--surface-variant) flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-(--on-surface-variant) text-3xl">travel_explore</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-lg text-(--on-surface) leading-snug truncate">
                {tripTitle || "ทริปของฉัน"}
              </p>
              <p className="text-sm text-(--on-surface-variant) mt-0.5 truncate">
                {[tripDestination, dateRange].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* ผู้ติดตาม */}
            <span className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-(--surface-variant) text-(--on-surface-variant)">
              <span className="material-symbols-outlined text-sm">group</span>
              {followers.length} ผู้ติดตาม
            </span>

            {/* รอแจ้งเตือน */}
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              pendingCount > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-(--surface-variant) text-(--on-surface-variant)"
            }`}>
              <span className="material-symbols-outlined text-sm">schedule_send</span>
              {pendingCount} รอแจ้งเตือน
            </span>

            {/* คำขอเข้าร่วม */}
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              joinRequests.length > 0
                ? "bg-blue-100 text-blue-700"
                : "bg-(--surface-variant) text-(--on-surface-variant)"
            }`}>
              <span className="material-symbols-outlined text-sm">how_to_reg</span>
              {joinRequests.length} คำขอเข้าร่วม
            </span>
          </div>

          {/* Secondary action links */}
          <div className="mt-3 pt-3 border-t border-(--outline-variant)/20 flex flex-wrap gap-4">
            <Link
              href={ROUTES.tripExpenses(tripId)}
              className="flex items-center gap-1 text-xs text-(--on-surface-variant) hover:text-(--primary) transition-colors"
            >
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              จัดการค่าใช้จ่าย
            </Link>
            <Link
              href={ROUTES.tripTranslations(tripId)}
              className="flex items-center gap-1 text-xs text-(--on-surface-variant) hover:text-(--primary) transition-colors"
            >
              <span className="material-symbols-outlined text-sm">translate</span>
              คำแปลทริป
            </Link>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-0.5">
            {/* ประวัติ */}
            <button
              onClick={() => setActiveTab("changelog")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "changelog"
                  ? "bg-(--primary) text-(--on-primary)"
                  : "bg-white border border-(--outline-variant)/40 text-(--on-surface-variant) hover:bg-(--surface-variant)"
              }`}
            >
              <span className="material-symbols-outlined text-base">history</span>
              ประวัติ
              {pendingCount > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[10px] font-bold rounded-full ${
                  activeTab === "changelog"
                    ? "bg-white/30 text-white"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            {/* ผู้ติดตาม */}
            <button
              onClick={() => setActiveTab("followers")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "followers"
                  ? "bg-(--primary) text-(--on-primary)"
                  : "bg-white border border-(--outline-variant)/40 text-(--on-surface-variant) hover:bg-(--surface-variant)"
              }`}
            >
              <span className="material-symbols-outlined text-base">group</span>
              ผู้ติดตาม
              <span className={`inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[10px] font-bold rounded-full ${
                activeTab === "followers"
                  ? "bg-white/30 text-white"
                  : "bg-(--surface-variant) text-(--on-surface-variant)"
              }`}>
                {followers.length}
              </span>
            </button>

            {/* ประกาศ */}
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === "announcements"
                  ? "bg-(--primary) text-(--on-primary)"
                  : "bg-white border border-(--outline-variant)/40 text-(--on-surface-variant) hover:bg-(--surface-variant)"
              }`}
            >
              <span className="material-symbols-outlined text-base">campaign</span>
              ประกาศ
              {hasPinnedAnnouncement && (
                <span className={`w-2 h-2 rounded-full ${
                  activeTab === "announcements" ? "bg-white/70" : "bg-orange-400"
                }`} />
              )}
            </button>

            {/* คำขอ — only when relevant */}
            {showJoinTab && (
              <button
                onClick={() => setActiveTab("join-requests")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "join-requests"
                    ? "bg-(--primary) text-(--on-primary)"
                    : "bg-white border border-(--outline-variant)/40 text-(--on-surface-variant) hover:bg-(--surface-variant)"
                }`}
              >
                <span className="material-symbols-outlined text-base">how_to_reg</span>
                คำขอ
                {joinRequests.length > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[10px] font-bold rounded-full ${
                    activeTab === "join-requests"
                      ? "bg-white/30 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {joinRequests.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Tab content ── */}

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
                  className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-sm"
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
                        <Button
                          onClick={() => setConfirmAction({ logId: log.id, mode: "send" })}
                          disabled={sending === log.id || followers.length === 0}
                          icon="send"
                          iconPosition="left"
                        >
                          ส่งการแจ้งเตือน
                          {followers.length > 0 && ` (${followers.length})`}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => openReceipts(log)}
                            icon="visibility"
                            iconPosition="left"
                          >
                            ดูสถานะการอ่าน
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setConfirmAction({ logId: log.id, mode: "resend" })}
                            disabled={sending === log.id}
                            icon="replay"
                            iconPosition="left"
                            className="text-amber-700 hover:bg-amber-100"
                          >
                            ส่งซ้ำให้ผู้ที่ยังไม่อ่าน
                            {typeof log.unreadCount === "number" && log.unreadCount > 0 && ` (${log.unreadCount})`}
                          </Button>
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
        {activeTab === "followers" && (() => {
          const members = followers.filter((f) => isMember(f.channel));
          const notifOnly = followers.filter((f) => !isMember(f.channel));
          return (
            <div className="space-y-4">
              {/* ── สมาชิกทริป ── */}
              <section className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-sm">
                <div className="px-5 py-4 border-b border-(--outline-variant)/20 flex items-center justify-between">
                  <SectionHeader
                    title="สมาชิกทริป"
                    subtitle="เข้าร่วมด้วยบัญชี — เห็นข้อมูลทริปครบ และร่วมแชร์ค่าใช้จ่ายได้"
                    variant="bar"
                  />
                  <span className="text-xs font-bold text-(--on-surface-variant) bg-(--surface-variant) px-2.5 py-1 rounded-full shrink-0">
                    {members.length} คน
                  </span>
                </div>
                {members.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon="person_add"
                      title="ยังไม่มีสมาชิก"
                      description="เมื่อมีคนกด 'เข้าร่วมทริปนี้' จากหน้าสาธารณะ จะแสดงรายชื่อที่นี่"
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-(--outline-variant)/20">
                    {members.map((f) => (
                      <li key={f.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar name={f.displayName} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-(--on-surface) truncate">{f.displayName}</p>
                            <p className="text-[11px] text-(--outline)">เข้าร่วมเมื่อ {formatThaiDate(f.followedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <SelectPicker
                            value={f.groupRole ?? ""}
                            onChange={(v) => setFollowerRole(f.id, v)}
                            options={groupRoleOptions}
                            placeholder="— ไม่ระบุ —"
                            searchable={false}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── ผู้รับแจ้งเตือน ── */}
              <section className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-sm">
                <div className="px-5 py-4 border-b border-(--outline-variant)/20 flex items-center justify-between">
                  <SectionHeader
                    title="ผู้รับแจ้งเตือน"
                    subtitle="ติดตามผ่าน LINE หรือ Web Push — รับ notification เท่านั้น ไม่ได้เป็นสมาชิก"
                    variant="bar"
                  />
                  <span className="text-xs font-bold text-(--on-surface-variant) bg-(--surface-variant) px-2.5 py-1 rounded-full shrink-0">
                    {notifOnly.length} คน
                  </span>
                </div>
                {notifOnly.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon="notifications_off"
                      title="ยังไม่มีผู้รับแจ้งเตือน"
                      description="เมื่อมีคนกด 'รับแจ้งเตือนอย่างเดียว' จะแสดงที่นี่"
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-(--outline-variant)/20">
                    {notifOnly.map((f) => (
                      <li key={f.id} className="px-5 py-4 flex items-center gap-3">
                        <Avatar name={f.displayName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-(--on-surface) truncate">{f.displayName}</p>
                          <p className="text-[11px] text-(--outline)">ติดตามเมื่อ {formatThaiDate(f.followedAt)}</p>
                        </div>
                        <ChannelBadge channel={toFollowChannel(f.channel)} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          );
        })()}

        {/* Join Requests tab */}
        {activeTab === "join-requests" && (
          <section className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-sm">
            {/* Approval toggle — lives here, at the top of join-requests tab */}
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-(--outline-variant)/20">
              <div>
                <p className="text-sm font-semibold text-(--on-surface)">ต้องอนุมัติก่อนเข้าร่วม</p>
                <p className="text-xs text-(--outline) mt-0.5">เมื่อเปิด สมาชิกต้องรอการอนุมัติก่อนเห็นข้อมูลทริป</p>
              </div>
              <ToggleSwitch
                checked={requiresApproval}
                onChange={handleToggleApproval}
                disabled={togglingApproval}
              />
            </div>

            <div className="px-5 py-4 border-b border-(--outline-variant)/20">
              <SectionHeader
                title="คำขอเข้าร่วมทริป"
                subtitle="สมาชิกที่รอการอนุมัติ — อนุมัติแล้วจะเห็นข้อมูลทริปทั้งหมด"
                variant="bar"
              />
            </div>
            {joinRequestsLoading ? (
              <div className="p-8 text-center text-sm text-(--outline)">กำลังโหลด...</div>
            ) : joinRequests.length === 0 ? (
              <div className="p-8">
                <EmptyState icon="how_to_reg" title="ไม่มีคำขอรอการอนุมัติ" description="เมื่อมีสมาชิกกดเข้าร่วมทริปนี้จะแสดงที่นี่" />
              </div>
            ) : (
              <ul className="divide-y divide-(--outline-variant)/20">
                {joinRequests.map((req) => (
                  <li key={req.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar name={req.displayName} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-(--on-surface) truncate">{req.displayName}</p>
                        {req.email && <p className="text-xs text-(--outline) truncate">{req.email}</p>}
                        <p className="text-[10px] text-(--outline)/60 mt-0.5">{new Date(req.requestedAt).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveJoin(req.id)}
                        disabled={processingJoin === req.id}
                        icon="check"
                        iconPosition="left"
                      >
                        อนุมัติ
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRejectJoin(req.id)}
                        disabled={processingJoin === req.id}
                        icon="close"
                        iconPosition="left"
                      >
                        ปฏิเสธ
                      </Button>
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
              <FormTextarea
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                maxLength={2048}
                rows={3}
                placeholder="เช่น ฝนตก เปลี่ยนแผน 14:00 ไปคาเฟ่แทน ..."
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Checkbox
                  checked={announcementPinned}
                  onChange={(checked) => setAnnouncementPinned(checked)}
                  label="ปักหมุดด้านบนหน้าทริป"
                />
                <Checkbox
                  checked={announcementNotify}
                  onChange={(checked) => setAnnouncementNotify(checked)}
                  label="ส่งแจ้งเตือนผู้ติดตาม"
                />
                <Button
                  onClick={handlePostAnnouncement}
                  disabled={postingAnnouncement || !announcementMsg.trim()}
                  loading={postingAnnouncement}
                  className="ml-auto"
                >
                  โพสต์ประกาศ
                </Button>
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
                    <Avatar name={r.displayName} size="sm" />
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
