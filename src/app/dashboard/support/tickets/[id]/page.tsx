"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog, ErrorState, StatusBadge } from "@/components/shared";
import type { StatusConfig } from "@trip/ui";
import { usePageTitle } from "@/lib/hooks/use-page-title";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
const POLL_INTERVAL = 15_000;
const MAX_ATTACHMENTS = 5;

interface TicketReply {
  id: string;
  message: string;
  isStaffReply: boolean;
  repliedBy: string;
  attachments: string[];
  createdAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
}

interface AttachmentItem {
  url: string;
  name: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  Open:     { label: "เปิด",         tone: "primary",  cls: "bg-(--primary-container) text-(--on-primary-container) ring-1 ring-(--primary)/20" },
  Pending:  { label: "รอดำเนินการ", tone: "amber",    cls: "bg-amber-100 text-amber-800 ring-1 ring-amber-200" },
  Resolved: { label: "แก้ไขแล้ว",   tone: "emerald",  cls: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" },
  Closed:   { label: "ปิดแล้ว",     tone: "slate",    cls: "bg-slate-200 text-slate-700 ring-1 ring-slate-300" },
};

const PRIORITY_CONFIG: Record<string, StatusConfig> = {
  High:   { label: "สำคัญสูง",  tone: "rose",  cls: "bg-rose-100 text-rose-800 ring-1 ring-rose-200" },
  Medium: { label: "ปานกลาง",   tone: "amber", cls: "bg-amber-100 text-amber-800 ring-1 ring-amber-200" },
  Low:    { label: "ต่ำ",        tone: "slate", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
};

const TYPE_LABEL: Record<string, string> = {
  Bug: "บัก", FeatureRequest: "ขอฟีเจอร์", Question: "คำถาม", Other: "อื่นๆ",
};

const ADMIN_STATUS_OPTIONS = [
  { value: "Open",   label: "เปิด" },
  { value: "Closed", label: "ปิด Ticket" },
];

interface LightboxItem {
  url: string;
}

function Lightbox({ items, index, onIndexChange, onClose }: {
  items: LightboxItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const total = items.length;
  const item = items[index];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && index < total - 1) onIndexChange(index + 1);
      else if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, total, onIndexChange, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10" aria-label="ปิด">
        <span className="material-symbols-outlined text-2xl">close</span>
      </button>

      {total > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all"
              aria-label="รูปก่อนหน้า"
            >
              <span className="material-symbols-outlined text-3xl">chevron_left</span>
            </button>
          )}
          {index < total - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all"
              aria-label="รูปถัดไป"
            >
              <span className="material-symbols-outlined text-3xl">chevron_right</span>
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 text-white/90 text-xs font-mono">
            {index + 1} / {total}
          </div>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt="attachment" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function AttachmentGrid({ urls, light = false, onImageClick }: { urls: string[]; light?: boolean; onImageClick: (url: string) => void }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className={`grid ${urls.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1.5`}>
      {urls.map((url) => (
        <button key={url} type="button" onClick={() => onImageClick(url)} className="block rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="attachment"
            className={`rounded-lg aspect-video object-cover w-full border hover:opacity-90 transition-opacity cursor-zoom-in ${light ? "border-slate-200" : "border-white/20"}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingSlow, setSendingSlow] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pollFailCount, setPollFailCount] = useState(0);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);

  const nextPollAt = useRef(0);
  const [failedPayload, setFailedPayload] = useState<{ message: string; attachments: string[] } | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<TicketDetail>(`/admin/support/tickets/${id}`);
      setTicket((prev) => {
        if (!prev || !silent) return res;
        const hasNewData =
          res.replies.length !== prev.replies.length ||
          res.status !== prev.status ||
          res.updatedAt !== prev.updatedAt;
        if (!hasNewData) return prev;
        if (!document.hidden)
          api.put(`/admin/support/tickets/${id}/read`, {}).catch(() => {});
        return res;
      });
      if (silent) setPollFailCount(0);
      if (!silent) api.put(`/admin/support/tickets/${id}/read`, {}).catch(() => {});
    } catch (err) {
      if (!silent) setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
      if (silent) setPollFailCount((n) => {
        nextPollAt.current = Date.now() + Math.min((n + 1) * POLL_INTERVAL, 8 * POLL_INTERVAL);
        return n + 1;
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (Date.now() < nextPollAt.current) return;
      load(true);
    }, POLL_INTERVAL);
    const onVisible = () => {
      if (!document.hidden) { nextPollAt.current = 0; load(true); }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  usePageTitle(ticket ? `${ticket.subject} · Support Ticket` : "Support Ticket");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies.length]);

  // Outside-click + Escape closer for the floating menus.
  useEffect(() => {
    if (!showStatusMenu && !showActionMenu) return;
    const closeAll = () => { setShowStatusMenu(false); setShowActionMenu(false); };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeAll(); };
    window.addEventListener("click", closeAll);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", closeAll);
      window.removeEventListener("keydown", handleKey);
    };
  }, [showStatusMenu, showActionMenu]);

  // Build flat list of all attachments in chronological order — used by the
  // lightbox so user can arrow-key through everything in the ticket.
  const allAttachments = useMemo<LightboxItem[]>(() => {
    if (!ticket) return [];
    const out: LightboxItem[] = [];
    for (const u of ticket.attachments ?? []) out.push({ url: u });
    for (const r of ticket.replies) for (const u of r.attachments ?? []) out.push({ url: u });
    return out;
  }, [ticket]);

  const openLightboxByUrl = useCallback((url: string) => {
    const idx = allAttachments.findIndex((a) => a.url === url);
    if (idx >= 0) setLightboxIndex(idx);
  }, [allAttachments]);

  const handleUpload = async (files: FileList) => {
    const remaining = MAX_ATTACHMENTS - attachments.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const { getValidToken } = await import("@/lib/auth");
      const token = await getValidToken();

      const results = await Promise.all(
        toUpload.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(`${API_URL}/admin/upload/image?folder=support`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token ?? ""}` },
            body: formData,
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error);
          return { url: json.data.url as string, name: file.name };
        })
      );
      setAttachments((prev) => [...prev, ...results]);
    } catch {
      setError("อัปโหลดบางไฟล์ไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  };

  const sendReply = useCallback(async (payload: { message: string; attachments: string[] }) => {
    if (!ticket) return;
    setSending(true);
    setError("");
    setFailedPayload(null);
    // After 3s of "sending" still in flight, surface a slow-network hint.
    const slowTimer = setTimeout(() => setSendingSlow(true), 3000);
    try {
      const reply = await api.post<TicketReply>(`/admin/support/tickets/${ticket.id}/reply`, payload);
      setTicket((prev) => prev ? { ...prev, replies: [...prev.replies, reply] } : prev);
      setMessage("");
      setAttachments([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ส่งข้อความไม่สำเร็จ");
      setFailedPayload(payload);
    } finally {
      clearTimeout(slowTimer);
      setSending(false);
      setSendingSlow(false);
    }
  }, [ticket]);

  const handleSend = () => {
    const trimmed = message.trim();
    if ((!trimmed && attachments.length === 0) || sending || !ticket) return;
    sendReply({ message: trimmed, attachments: attachments.map((a) => a.url) });
  };

  const handleRetry = () => {
    if (!failedPayload || sending || !ticket) return;
    sendReply(failedPayload);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket || newStatus === ticket.status) { setConfirmStatus(null); return; }
    setStatusUpdating(true);
    try {
      const res = await api.put<{ id: string; status: string }>(`/admin/support/tickets/${ticket.id}/status`, { status: newStatus });
      setTicket((prev) => prev ? { ...prev, status: res.status } : prev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setStatusUpdating(false);
      setConfirmStatus(null);
    }
  };

  function exportCsv() {
    if (!ticket) return;
    const rows = [
      ["ผู้ส่ง", "ข้อความ", "แนบไฟล์", "เวลา"],
      ["คุณ", ticket.description, ticket.attachments.join(" | "), ticket.createdAt],
      ...ticket.replies.map((r) => [
        r.isStaffReply ? r.repliedBy : "คุณ",
        r.message,
        r.attachments.join(" | "),
        r.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
    a.download = `ticket-${ticket.id.slice(0, 8)}.csv`;
    a.click();
    setShowActionMenu(false);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] animate-pulse">
        <div className="shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4">
          <div className="flex items-start gap-3 max-w-2xl mx-auto">
            <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
              <div className="flex gap-2">
                <div className="h-3 bg-slate-100 rounded-full w-16" />
                <div className="h-3 bg-slate-100 rounded-full w-12" />
                <div className="h-3 bg-slate-100 rounded-full w-20" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-slate-50 px-4 py-5 space-y-4 overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="w-56 h-16 bg-slate-200 rounded-xl rounded-tr-sm" />
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="w-48 h-12 bg-slate-200 rounded-xl rounded-tl-sm" />
            </div>
          </div>
        </div>
        <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="h-14 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="p-8">
        <ErrorState message={error} onRetry={() => load()} />
        <div className="text-center mt-4">
          <button
            onClick={() => router.push("/dashboard/support/tickets")}
            className="text-sm text-(--primary) hover:underline"
          >
            ← กลับไปรายการตั๋ว
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const canReply = ticket.status === "Open" || ticket.status === "Pending";
  const shortId = ticket.id.slice(0, 8).toUpperCase();

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] bg-slate-50">

      {lightboxIndex !== null && allAttachments.length > 0 && (
        <Lightbox
          items={allAttachments}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        onConfirm={() => confirmStatus && handleStatusChange(confirmStatus)}
        title={confirmStatus ? `เปลี่ยนสถานะเป็น "${STATUS_CONFIG[confirmStatus]?.label ?? confirmStatus}"?` : ""}
        description={
          confirmStatus === "Closed"
            ? "ตั๋วจะถูกปิด — ตอบกลับเพิ่มเติมไม่ได้จนกว่าจะเปิดใหม่"
            : "ระบบจะอัปเดตสถานะตั๋วทันที"
        }
        confirmLabel={statusUpdating ? "กำลังบันทึก..." : "ยืนยัน"}
        variant={confirmStatus === "Closed" ? "danger" : "default"}
      />

      {/* Poll failure banner */}
      {pollFailCount >= 2 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
          <span className="material-symbols-outlined text-sm">wifi_off</span>
          ไม่สามารถอัปเดตอัตโนมัติได้ —{" "}
          <button onClick={() => { setPollFailCount(0); load(true); }} className="underline font-semibold">
            โหลดใหม่
          </button>
        </div>
      )}

      {/* Header — sticky below the dashboard's 4rem header */}
      <div className="sticky top-16 z-20 bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="flex items-start justify-between gap-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={() => router.push("/dashboard/support/tickets")}
              className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
              aria-label="กลับ"
            >
              <span className="material-symbols-outlined text-xl leading-none">arrow_back</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-base font-bold text-slate-900 leading-snug">{ticket.subject}</h1>
                <span className="font-mono text-[11px] text-slate-400">#{shortId}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                <StatusBadge status={ticket.status} config={STATUS_CONFIG} variant="pill" />
                <StatusBadge status={ticket.priority} config={PRIORITY_CONFIG} variant="pill" />
                <span className="text-slate-400">{TYPE_LABEL[ticket.type] ?? ticket.type}</span>
                <span className="text-slate-400">· {formatDate(ticket.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setShowStatusMenu(!showStatusMenu); setShowActionMenu(false); }}
                disabled={statusUpdating}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
                title="เปลี่ยนสถานะ"
              >
                <span className="material-symbols-outlined text-base leading-none">swap_horiz</span>
                <span className="hidden sm:inline text-xs font-medium">สถานะ</span>
                <span className="material-symbols-outlined text-sm leading-none">expand_more</span>
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-10 min-w-[160px] py-1 overflow-hidden">
                  {ADMIN_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setShowStatusMenu(false);
                        if (opt.value !== ticket.status) setConfirmStatus(opt.value);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                        opt.value === ticket.status
                          ? "text-(--primary) font-semibold bg-(--primary-container)/40"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {opt.value === ticket.status
                        ? <span className="material-symbols-outlined text-sm text-(--primary) leading-none">check</span>
                        : <span className="w-4" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setShowActionMenu(!showActionMenu); setShowStatusMenu(false); }}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                aria-label="เพิ่มเติม"
                title="เพิ่มเติม"
              >
                <span className="material-symbols-outlined text-lg leading-none">more_vert</span>
              </button>
              {showActionMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-10 min-w-[200px] py-1 overflow-hidden">
                  <button
                    onClick={exportCsv}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base leading-none">download</span>
                    ดาวน์โหลดเป็น CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat area — flows naturally; window scroll handles overflow so we
          don't get a nested scrollbar on top of the page scroll. */}
      <div className="flex-1 px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-4">

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              ข้อความแรก · {formatDate(ticket.createdAt)}
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Original message — admin side (right / blue) */}
          <div className="flex gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-(--primary) flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm text-white leading-none">person</span>
            </div>
            <div className="max-w-[80%] flex flex-col items-end">
              {ticket.description.trim().length > 0 ? (
                <div className="bg-(--primary) text-white rounded-xl rounded-tr-sm px-4 py-3 shadow-sm">
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                  {ticket.attachments.length > 0 && (
                    <div className="mt-2">
                      <AttachmentGrid urls={ticket.attachments} light={false} onImageClick={openLightboxByUrl} />
                    </div>
                  )}
                </div>
              ) : ticket.attachments.length > 0 ? (
                <div className="bg-(--primary) rounded-xl rounded-tr-sm p-2 shadow-sm">
                  <AttachmentGrid urls={ticket.attachments} light={false} onImageClick={openLightboxByUrl} />
                </div>
              ) : null}
              <p className="text-xs text-slate-400 mt-1 mr-1">{formatTime(ticket.createdAt)}</p>
            </div>
          </div>

          {/* Replies */}
          {ticket.replies.map((reply, idx) => {
            const replyDay = reply.createdAt.slice(0, 10);
            const prevDay = idx === 0
              ? ticket.createdAt.slice(0, 10)
              : ticket.replies[idx - 1].createdAt.slice(0, 10);
            const showSeparator = replyDay !== prevDay;
            const hasText = reply.message.trim().length > 0;
            const hasAttachments = reply.attachments && reply.attachments.length > 0;
            return (
              <div key={reply.id}>
                {showSeparator && (
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {formatDate(reply.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                )}
                <div className={`flex gap-3 ${!reply.isStaffReply ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    reply.isStaffReply ? "bg-slate-200" : "bg-(--primary)"
                  }`}>
                    <span className={`material-symbols-outlined text-sm leading-none ${reply.isStaffReply ? "text-slate-500" : "text-white"}`}>
                      {reply.isStaffReply ? "support_agent" : "person"}
                    </span>
                  </div>
                  <div className={`max-w-[80%] flex flex-col ${!reply.isStaffReply ? "items-end" : ""}`}>
                    {(hasText || hasAttachments) && (
                      <div className={`rounded-xl shadow-sm ${
                        reply.isStaffReply
                          ? "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                          : "bg-(--primary) text-white rounded-tr-sm"
                      } ${hasText ? "px-4 py-3" : "p-2"}`}>
                        {reply.isStaffReply && hasText && (
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">{reply.repliedBy}</p>
                        )}
                        {hasText && <p className="text-sm whitespace-pre-wrap">{reply.message}</p>}
                        {hasAttachments && (
                          <div className={hasText ? "mt-2" : ""}>
                            <AttachmentGrid urls={reply.attachments} light={reply.isStaffReply} onImageClick={openLightboxByUrl} />
                          </div>
                        )}
                      </div>
                    )}
                    <p className={`text-xs text-slate-400 mt-1 ${!reply.isStaffReply ? "mr-1" : "ml-1"}`}>
                      {formatTime(reply.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sending indicator */}
          {sending && (
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-(--primary)/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm text-(--primary) leading-none">person</span>
              </div>
              <div className="max-w-[80%] flex flex-col items-end">
                <div className="bg-(--primary)/10 rounded-xl rounded-tr-sm px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-(--primary)/50 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-(--primary)/50 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-(--primary)/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
                {sendingSlow && (
                  <p className="text-[11px] text-slate-400 mt-1 mr-1">เครือข่ายช้า — กำลังพยายามส่ง…</p>
                )}
              </div>
            </div>
          )}

          {/* scroll-mb leaves headroom above the sticky composer so
              auto-scroll-to-latest doesn't land hidden behind it. */}
          <div ref={chatEndRef} className="scroll-mb-40 h-px" />
        </div>
      </div>

      {/* Reply box or closed notice — sticks to viewport bottom so the
          composer is always reachable while the user scrolls history. */}
      <div className="sticky bottom-0 z-20 bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {canReply ? (
            <>
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <div key={a.url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.url)}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        aria-label="ลบไฟล์แนบ"
                      >
                        <span className="material-symbols-outlined text-sm leading-none">close</span>
                      </button>
                    </div>
                  ))}
                  {attachments.length < MAX_ATTACHMENTS && (
                    <span className="text-xs text-slate-400 self-center">เพิ่มได้อีก {MAX_ATTACHMENTS - attachments.length} ไฟล์</span>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl flex items-center justify-between gap-2">
                  <span>{error}</span>
                  {failedPayload && (
                    <button
                      onClick={handleRetry}
                      disabled={sending}
                      className="shrink-0 font-semibold underline disabled:opacity-40"
                    >
                      ลองใหม่
                    </button>
                  )}
                </div>
              )}

              <div className="border border-slate-300 rounded-2xl bg-white shadow-sm focus-within:border-(--primary) focus-within:ring-2 focus-within:ring-(--primary)/20 transition-all">
                <div className="flex items-end p-1.5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-(--primary) hover:bg-(--primary)/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    title={attachments.length >= MAX_ATTACHMENTS ? `แนบได้สูงสุด ${MAX_ATTACHMENTS} ไฟล์` : "แนบรูปภาพ"}
                  >
                    {uploading
                      ? <span className="material-symbols-outlined text-xl animate-spin leading-none">progress_activity</span>
                      : <span className="material-symbols-outlined text-xl leading-none">attach_file</span>
                    }
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); }}
                  />
                  <textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); if (error) { setError(""); setFailedPayload(null); } }}
                    onInput={(e) => {
                      // Auto-grow up to ~6 lines (~144px), then scroll.
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="พิมพ์ข้อความถึงทีมงาน..."
                    rows={1}
                    className="flex-1 resize-none py-2.5 px-1 text-sm leading-relaxed outline-none bg-transparent border-none focus:ring-0 min-h-[40px] max-h-36"
                  />
                  {(() => {
                    const canSend = (message.trim().length > 0 || attachments.length > 0) && !sending && !uploading;
                    return (
                      <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 ${
                          canSend
                            ? "bg-(--primary) text-white shadow-md shadow-(--primary)/30 hover:brightness-110"
                            : "bg-slate-100 text-slate-300 cursor-not-allowed"
                        }`}
                        aria-label="ส่งข้อความ"
                      >
                        <span className="material-symbols-outlined text-lg leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <p className="text-[11px] text-slate-400">
                  <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">Enter</kbd> ส่ง ·{" "}
                  <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">Shift+Enter</kbd> ขึ้นบรรทัดใหม่
                </p>
                <p className={`text-[11px] tabular-nums ${message.length > 4000 ? "text-red-500 font-semibold" : "text-slate-300"}`}>{message.length}/4096</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between py-2 flex-wrap gap-2">
              <p className="text-sm text-slate-400">
                {ticket.status === "Resolved" ? "ตั๋วนี้ได้รับการแก้ไขแล้ว" : "ตั๋วนี้ถูกปิดแล้ว"} — ไม่สามารถส่งข้อความเพิ่มเติมได้
              </p>
              <button
                onClick={() => setConfirmStatus("Open")}
                disabled={statusUpdating}
                className="text-xs font-semibold text-(--primary) hover:underline disabled:opacity-40"
              >
                เปิดใหม่
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
