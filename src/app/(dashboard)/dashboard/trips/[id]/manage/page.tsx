"use client";

import { use, useEffect, useState, useCallback } from "react";
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
  ProgressBar,
  StatCard,
  StatusBadge,
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
  const [tripSlug, setTripSlug] = useState<string | null>(null);
  const [tripCover, setTripCover] = useState<string | null>(null);
  const [tripDestination, setTripDestination] = useState<string>("");
  const [tripStartDate, setTripStartDate] = useState<string | null>(null);
  const [tripEndDate, setTripEndDate] = useState<string | null>(null);

  // UTM link generator state
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmSource, setUtmSource] = useState("line");
  const [utmLinkCopied, setUtmLinkCopied] = useState(false);

  const isEnded = tripEndDate ? new Date(tripEndDate + "T23:59:59") < new Date() : false;

  // Post-trip summary (loaded lazily when tab activated)
  interface PostTripSummary {
    memberCount: number; followerCount: number; reviewCount: number; responseRate: number;
    scoreBreakdown: { avgOverall: number; avgGuide: number | null; avgItinerary: number | null; avgValue: number | null } | null;
    scoreDistribution: { score: number; count: number }[] | null;
    topRecommendations: { id: string; category: string; name: string; imageUrl: string | null; mapsLink: string | null; likeCount: number; createdByName: string }[];
    recentFeedback: { comment: string; overallScore: number; createdAt: string; firstName: string; imageUrls: string[] }[];
    channelBreakdown: { channel: string; count: number }[];
  }
  const [postTripSummary, setPostTripSummary] = useState<PostTripSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Tab state lives in the URL so the page is shareable and survives
  // refresh. Falls back to "changelog" — the more important view since
  // unsent notifications need attention.
  const tabParam = searchParams.get("tab");
  const activeTab: "followers" | "changelog" | "announcements" | "join-requests" | "summary" =
    tabParam === "followers" ? "followers"
    : tabParam === "announcements" ? "announcements"
    : tabParam === "join-requests" ? "join-requests"
    : tabParam === "summary" ? "summary"
    : "changelog";
  const setActiveTab = (tab: "followers" | "changelog" | "announcements" | "join-requests" | "summary"): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "changelog") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "summary" || !isEnded || postTripSummary) return;
    setSummaryLoading(true);
    setSummaryError(null);
    api.get<PostTripSummary>(`/admin/trips/${tripId}/post-trip-summary`)
      .then(setPostTripSummary)
      .catch((err) => {
        setSummaryError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด");
      })
      .finally(() => setSummaryLoading(false));
  }, [activeTab, isEnded, tripId, postTripSummary]);

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
        slug?: string;
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
      setTripSlug(tripMeta.slug ?? null);
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

            {/* แจ้งเตือนแล้ว */}
            <span className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-(--surface-variant) text-(--on-surface-variant)">
              <span className="material-symbols-outlined text-sm">notifications_active</span>
              {changelogs.filter((l) => l.notiSent).length} แจ้งเตือนแล้ว
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

        {/* ── UTM Link Generator ── */}
        {tripSlug && (
          <section className="bg-white rounded-2xl border border-(--outline-variant)/30 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-lg text-(--primary)">link</span>
              <h3 className="text-sm font-semibold text-(--on-surface)">แชร์และติดตามผล</h3>
            </div>
            <p className="text-xs text-(--on-surface-variant) mb-4">สร้างลิงก์พร้อม UTM เพื่อติดตามว่า traffic มาจากช่องทางไหน</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(["line", "facebook", "instagram", "x", "other"] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => setUtmSource(src)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    utmSource === src
                      ? "bg-(--primary) text-(--on-primary)"
                      : "bg-(--surface-variant) text-(--on-surface-variant) hover:bg-(--outline-variant)/30"
                  }`}
                >
                  {src === "line" ? "LINE" : src === "facebook" ? "Facebook" : src === "instagram" ? "Instagram" : src === "x" ? "X (Twitter)" : "อื่น ๆ"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                placeholder="ชื่อแคมเปญ เช่น summer2026"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-(--outline-variant)/40 bg-(--surface-variant)/40 text-sm text-(--on-surface) placeholder:text-(--on-surface-variant)/50 focus:outline-none focus:ring-2 focus:ring-(--primary)/30"
              />
              <button
                onClick={async () => {
                  const base = `${window.location.origin}/t/${tripSlug}`;
                  const params = new URLSearchParams({
                    utm_source: utmSource,
                    utm_medium: "social",
                    ...(utmCampaign.trim() ? { utm_campaign: utmCampaign.trim() } : {}),
                  });
                  await navigator.clipboard.writeText(`${base}?${params}`);
                  setUtmLinkCopied(true);
                  setTimeout(() => setUtmLinkCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-(--primary) text-(--on-primary) text-sm font-semibold hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-base">
                  {utmLinkCopied ? "check" : "content_copy"}
                </span>
                {utmLinkCopied ? "คัดลอกแล้ว!" : "คัดลอกลิงก์"}
              </button>
            </div>
            {utmCampaign.trim() && (
              <p className="mt-2 text-[11px] text-(--outline) truncate">
                {window?.location?.origin}/t/{tripSlug}?utm_source={utmSource}&utm_medium=social&utm_campaign={utmCampaign.trim()}
              </p>
            )}
          </section>
        )}

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
              {changelogs.length > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[10px] font-bold rounded-full ${
                  activeTab === "changelog"
                    ? "bg-white/30 text-white"
                    : "bg-(--surface-variant) text-(--on-surface-variant)"
                }`}>
                  {changelogs.length}
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

            {/* สรุปทริป — only for ended trips */}
            {isEnded && (
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "summary"
                    ? "bg-amber-500 text-white"
                    : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50"
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                สรุปทริป
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
                description="เมื่อเผยแพร่ทริปอีกครั้งหลังแก้ไข ระบบจะสร้างประวัติการเปลี่ยนแปลงและแจ้งเตือนผู้ติดตามอัตโนมัติ"
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

                    {log.notiSent && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-(--outline-variant)/20">
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
                      </div>
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

        {/* Post-trip summary tab */}
        {activeTab === "summary" && isEnded && (
          <div className="space-y-4">
            {summaryLoading ? (
              <div className="flex justify-center py-16">
                <span className="w-8 h-8 border-3 border-(--primary) border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !postTripSummary ? (
              <div className="text-center py-12">
                <EmptyState icon="insights" title="ไม่สามารถโหลดข้อมูลสรุปได้" description={summaryError ?? "ลองรีเฟรชหน้าอีกครั้ง"} />
                <button
                  onClick={() => { setPostTripSummary(null); setSummaryError(null); }}
                  className="mt-4 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  ลองอีกครั้ง
                </button>
              </div>
            ) : (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: "group", label: "สมาชิก", value: postTripSummary.memberCount, color: "text-blue-600 bg-blue-50" },
                    { icon: "rate_review", label: "รีวิว", value: postTripSummary.reviewCount, color: "text-amber-600 bg-amber-50" },
                    { icon: "percent", label: "อัตราตอบกลับ", value: `${postTripSummary.responseRate}%`, color: "text-emerald-600 bg-emerald-50" },
                    { icon: "people", label: "ผู้ติดตามทั้งหมด", value: postTripSummary.followerCount, color: "text-violet-600 bg-violet-50" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-(--outline-variant)/30 p-4 text-center shadow-sm">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                      </div>
                      <p className="text-2xl font-bold text-(--on-surface) tabular-nums">{s.value}</p>
                      <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Score breakdown */}
                {postTripSummary.scoreBreakdown && (
                  <section className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-(--on-surface) flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-base text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      คะแนนจากสมาชิก
                    </h3>
                    <div className="flex items-center gap-5 mb-4">
                      <p className="text-4xl font-extrabold text-amber-500 tabular-nums">
                        {postTripSummary.scoreBreakdown.avgOverall.toFixed(1)}
                      </p>
                      <div className="flex-1 space-y-2">
                        {[
                          { label: "ภาพรวม", val: postTripSummary.scoreBreakdown.avgOverall },
                          { label: "ไกด์ / ทีมงาน", val: postTripSummary.scoreBreakdown.avgGuide },
                          { label: "แผนเดินทาง", val: postTripSummary.scoreBreakdown.avgItinerary },
                          { label: "ความคุ้มค่า", val: postTripSummary.scoreBreakdown.avgValue },
                        ].filter((d) => d.val !== null).map((d) => (
                          <div key={d.label} className="flex items-center gap-2">
                            <p className="text-xs text-(--on-surface-variant) w-24 shrink-0">{d.label}</p>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${((d.val ?? 0) / 5) * 100}%` }} />
                            </div>
                            <p className="text-xs font-bold text-amber-600 w-7 text-right tabular-nums">{d.val?.toFixed(1)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Score distribution */}
                    {postTripSummary.scoreDistribution && (
                      <div className="border-t border-(--outline-variant)/20 pt-3 mt-3">
                        <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase mb-2">การกระจายคะแนน</p>
                        <div className="space-y-1">
                          {[...postTripSummary.scoreDistribution].reverse().map((d) => (
                            <div key={d.score} className="flex items-center gap-2">
                              <span className="text-xs text-(--on-surface-variant) w-4 text-right tabular-nums">{d.score}</span>
                              <span className="material-symbols-outlined text-xs text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: postTripSummary.reviewCount > 0 ? `${(d.count / postTripSummary.reviewCount) * 100}%` : "0%" }} />
                              </div>
                              <span className="text-[10px] text-(--on-surface-variant) w-5 text-right tabular-nums">{d.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* Channel breakdown */}
                {postTripSummary.channelBreakdown.length > 0 && (
                  <section className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-(--on-surface) flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-base text-(--primary)">device_hub</span>
                      ช่องทางติดตาม
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {postTripSummary.channelBreakdown.map((ch) => (
                        <div key={ch.channel} className="flex items-center justify-between px-3 py-2 rounded-xl bg-(--surface-container-low)">
                          <span className="text-xs font-medium text-(--on-surface-variant)">{ch.channel}</span>
                          <span className="text-sm font-bold text-(--on-surface) tabular-nums">{ch.count}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Top recommendations */}
                {postTripSummary.topRecommendations.length > 0 && (
                  <section className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-(--on-surface) flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-base text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
                      สถานที่แนะนำยอดนิยม
                    </h3>
                    <div className="space-y-2">
                      {postTripSummary.topRecommendations.map((rec, i) => (
                        <div key={rec.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-(--surface-container-low)">
                          <span className="text-sm font-bold text-(--on-surface-variant) w-5 text-center tabular-nums">{i + 1}</span>
                          {rec.imageUrl && <img src={rec.imageUrl} alt={rec.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-(--on-surface) truncate">{rec.name}</p>
                            <p className="text-[10px] text-(--on-surface-variant)">โดย {rec.createdByName}</p>
                          </div>
                          <span className="text-xs text-rose-500 flex items-center gap-0.5 shrink-0">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                            {rec.likeCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Recent feedback */}
                {postTripSummary.recentFeedback.length > 0 && (
                  <section className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-(--on-surface) flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-base text-blue-600">chat</span>
                      ความคิดเห็นล่าสุด
                    </h3>
                    <div className="space-y-3">
                      {postTripSummary.recentFeedback.map((fb, i) => (
                        <div key={i} className="px-4 py-3 rounded-xl bg-(--surface-container-low)">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-(--on-surface)">{fb.firstName}</span>
                            <span className="flex items-center gap-0.5 text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <span key={s} className={`text-xs ${fb.overallScore >= s ? "text-amber-400" : "text-slate-200"}`}>★</span>
                              ))}
                            </span>
                            <span className="text-[10px] text-(--outline)">{new Date(fb.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
                          </div>
                          <p className="text-xs text-(--on-surface-variant) leading-relaxed">{fb.comment}</p>
                          {fb.imageUrls?.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {fb.imageUrls.map((url, imgIdx) => (
                                <img key={imgIdx} src={url} alt="" className="w-12 h-12 rounded-lg object-cover" loading="lazy" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* No reviews state */}
                {postTripSummary.reviewCount === 0 && (
                  <EmptyState icon="rate_review" title="ยังไม่มีรีวิว" description="สมาชิกยังไม่ได้ให้คะแนนทริปนี้" />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirm send/resend */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleSend(confirmAction.logId, confirmAction.mode)}
        title="ส่งซ้ำให้ผู้ที่ยังไม่อ่านหรือไม่?"
        description={(() => {
          if (!confirmAction) return "";
          const unread = changelogs.find((l) => l.id === confirmAction.logId)?.unreadCount;
          return typeof unread === "number"
            ? `ระบบจะส่งซ้ำเฉพาะผู้ที่ยังไม่ได้กดยืนยันการอ่าน (${unread} คน)`
            : "ระบบจะส่งเฉพาะผู้ที่ยังไม่ได้กดยืนยันการอ่าน";
        })()}
        confirmLabel="ส่งซ้ำ"
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
            <div className="px-5 pt-5 pb-4 border-b border-(--outline-variant)/20 bg-(--surface-container-low)">
              <ProgressBar
                value={receiptData.acknowledgedCount}
                max={receiptData.totalFollowers}
                label={`อ่านแล้ว ${receiptData.acknowledgedCount}/${receiptData.totalFollowers} คน`}
                showValue
                size="lg"
                color={receiptData.totalFollowers > 0 && receiptData.acknowledgedCount === receiptData.totalFollowers ? "emerald" : "primary"}
                animated
              />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <StatCard
                  icon="group"
                  iconColor="blue"
                  title="ทั้งหมด"
                  value={receiptData.totalFollowers}
                  suffix="คน"
                  variant="compact"
                />
                <StatCard
                  icon="done_all"
                  iconColor="emerald"
                  title="อ่านแล้ว"
                  value={receiptData.acknowledgedCount}
                  suffix="คน"
                  variant="compact"
                  tone="emerald"
                />
                <StatCard
                  icon="schedule"
                  iconColor="amber"
                  title="ยังไม่อ่าน"
                  value={receiptData.unreadCount}
                  suffix="คน"
                  variant="compact"
                  tone="amber"
                />
              </div>
            </div>
            <ul className="divide-y divide-(--outline-variant)/20 max-h-[400px] overflow-y-auto">
              {receiptData.receipts.map((r) => (
                <li key={r.followerId} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={r.displayName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-(--on-surface) truncate">{r.displayName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <ChannelBadge channel={r.channel.toLowerCase().includes("line") ? "line" : "web_push"} />
                        {r.acknowledged && r.acknowledgedAt && (
                          <span className="text-[11px] text-(--outline)">อ่านเมื่อ {formatThaiDateTime(r.acknowledgedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge
                    status={r.acknowledged ? "read" : "unread"}
                    config={{
                      read: { label: "อ่านแล้ว", tone: "emerald" },
                      unread: { label: "ยังไม่อ่าน", tone: "amber" },
                    }}
                    variant="pill"
                  />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Modal>
    </main>
  );
}
