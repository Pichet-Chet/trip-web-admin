"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

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

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Open:     { label: "เปิด",          cls: "bg-blue-50 text-blue-700 border-blue-200" },
  Pending:  { label: "รอดำเนินการ",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  Resolved: { label: "แก้ไขแล้ว",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Closed:   { label: "ปิดแล้ว",      cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const PRIORITY_MAP: Record<string, { label: string; icon: string; cls: string }> = {
  High:   { label: "สำคัญสูง",  icon: "priority_high",       cls: "text-red-600 bg-red-50" },
  Medium: { label: "ปานกลาง",   icon: "remove",               cls: "text-amber-600 bg-amber-50" },
  Low:    { label: "ต่ำ",        icon: "keyboard_arrow_down",  cls: "text-slate-500 bg-slate-100" },
};

const TYPE_LABEL: Record<string, string> = {
  Bug: "บัก", FeatureRequest: "ขอฟีเจอร์", Question: "คำถาม", Other: "อื่นๆ",
};

// Status options admin can set
const ADMIN_STATUS_OPTIONS = [
  { value: "Open",   label: "เปิด" },
  { value: "Closed", label: "ปิด Ticket" },
];

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10">
        <span className="material-symbols-outlined text-3xl">close</span>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="attachment" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function AttachmentGrid({ urls, light = false, onImageClick }: { urls: string[]; light?: boolean; onImageClick: (url: string) => void }) {
  if (!urls || urls.length === 0) return null;
  return (
    <div className={`mt-2 grid ${urls.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1.5`}>
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
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setLightboxUrl(null), []);
  const [pollFailCount, setPollFailCount] = useState(0);

  // Status change
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);

  // Poll backoff
  const nextPollAt = useRef(0);
  // Reply fail recovery
  const [failedPayload, setFailedPayload] = useState<{ message: string; attachments: string[] } | null>(null);
  // Confirm dialog focus trap
  const confirmDialogRef = useRef<HTMLDivElement>(null);

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
        // New data arrived while page is open — mark as read (fire-and-forget)
        if (!document.hidden)
          api.put(`/admin/support/tickets/${id}/read`, {}).catch(() => {});
        return res;
      });
      if (silent) setPollFailCount(0);
      // Mark as read on initial open (fire-and-forget)
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

  useEffect(() => {
    document.title = ticket ? `${ticket.subject} | ตั๋วสนับสนุน` : "ตั๋วสนับสนุน";
  }, [ticket?.subject]);
  useEffect(() => () => { document.title = "ตั๋วสนับสนุน"; }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies.length]);

  // Focus trap for confirm dialog
  useEffect(() => {
    if (!confirmStatus) return;
    const dialog = confirmDialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>("button:not([disabled])");
    focusable[focusable.length - 1]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setConfirmStatus(null); return; }
      if (e.key !== "Tab") return;
      const els = Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled])"));
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [confirmStatus]);

  // Close status menu on outside click or Escape key
  useEffect(() => {
    if (!showStatusMenu) return;
    const handleClick = () => setShowStatusMenu(false);
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowStatusMenu(false);
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [showStatusMenu]);

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

  const handleSend = async () => {
    const trimmed = message.trim();
    if ((!trimmed && attachments.length === 0) || sending || !ticket) return;
    const payload = { message: trimmed || "(แนบไฟล์)", attachments: attachments.map((a) => a.url) };
    setSending(true);
    setError("");
    setFailedPayload(null);
    try {
      const reply = await api.post<TicketReply>(`/admin/support/tickets/${ticket.id}/reply`, payload);
      setTicket((prev) => prev ? { ...prev, replies: [...prev.replies, reply] } : prev);
      setMessage("");
      setAttachments([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ส่งข้อความไม่สำเร็จ");
      setFailedPayload(payload);
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async () => {
    if (!failedPayload || sending || !ticket) return;
    const payload = failedPayload;
    setSending(true);
    setError("");
    setFailedPayload(null);
    try {
      const reply = await api.post<TicketReply>(`/admin/support/tickets/${ticket.id}/reply`, payload);
      setTicket((prev) => prev ? { ...prev, replies: [...prev.replies, reply] } : prev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ส่งข้อความไม่สำเร็จ");
      setFailedPayload(payload);
    } finally {
      setSending(false);
    }
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

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] animate-pulse">
        {/* Header skeleton */}
        <div className="shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4">
          <div className="flex items-start gap-3 max-w-4xl mx-auto">
            <div className="w-8 h-8 rounded-xl bg-slate-200 shrink-0" />
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
        {/* Chat skeleton */}
        <div className="flex-1 bg-slate-50 px-4 py-5 space-y-4 overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Right bubble (admin) */}
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="w-56 h-16 bg-slate-200 rounded-xl rounded-tr-sm" />
            </div>
            {/* Left bubble (staff) */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="w-48 h-12 bg-slate-200 rounded-xl rounded-tl-sm" />
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="w-64 h-10 bg-slate-200 rounded-xl rounded-tr-sm" />
            </div>
          </div>
        </div>
        {/* Reply box skeleton */}
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
      <div className="p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">error_outline</span>
        <p className="text-slate-600 font-semibold">{error}</p>
        <button onClick={() => router.push("/dashboard/support/tickets")} className="mt-4 text-sm text-blue-600 hover:underline">ย้อนกลับ</button>
      </div>
    );
  }

  if (!ticket) return null;

  const st = STATUS_MAP[ticket.status] ?? { label: ticket.status, cls: "bg-slate-100 text-slate-500 border-slate-200" };
  const pr = PRIORITY_MAP[ticket.priority] ?? PRIORITY_MAP.Medium;
  const canReply = ticket.status === "Open" || ticket.status === "Pending";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={closeLightbox} />}

      {/* Confirm status dialog */}
      {confirmStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div ref={confirmDialogRef} className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-900 text-base">
              เปลี่ยนสถานะเป็น &ldquo;{STATUS_MAP[confirmStatus]?.label ?? confirmStatus}&rdquo;?
            </h3>
            <p className="text-sm text-slate-500 mt-2">การดำเนินการนี้จะอัปเดตสถานะตั๋วทันที</p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setConfirmStatus(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleStatusChange(confirmStatus)}
                disabled={statusUpdating}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {statusUpdating ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poll failure banner */}
      {pollFailCount >= 2 && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
          <span className="material-symbols-outlined text-sm">wifi_off</span>
          ไม่สามารถอัปเดตอัตโนมัติได้ —{" "}
          <button onClick={() => { setPollFailCount(0); load(true); }} className="underline font-semibold">
            โหลดใหม่
          </button>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="flex items-start justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={() => router.push("/dashboard/support/tickets")}
              className="mt-0.5 p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 leading-snug">{ticket.subject}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${pr.cls}`}>
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>{pr.icon}</span>
                  {pr.label}
                </span>
                <span className="text-xs text-slate-400">{TYPE_LABEL[ticket.type] ?? ticket.type}</span>
                <span className="text-xs text-slate-400">· {formatDate(ticket.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">

          {/* Export CSV */}
          <button
            onClick={() => {
              if (!ticket) return;
              const rows = [
                ["ผู้ส่ง", "ข้อความ", "เวลา"],
                ["คุณ", ticket.description, ticket.createdAt],
                ...ticket.replies.map((r) => [
                  r.isStaffReply ? r.repliedBy : "คุณ",
                  r.message,
                  r.createdAt,
                ]),
              ];
              const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
              const a = document.createElement("a");
              a.href = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
              a.download = `ticket-${ticket.id.slice(0, 8)}.csv`;
              a.click();
            }}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
            title="Export CSV"
          >
            <span className="material-symbols-outlined text-base">download</span>
          </button>

          {/* Status control */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={statusUpdating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              title="เปลี่ยนสถานะ"
            >
              <span className="material-symbols-outlined text-base">swap_horiz</span>
              <span className="hidden sm:inline text-xs font-medium">สถานะ</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-10 min-w-[140px] py-1 overflow-hidden">
                {ADMIN_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setShowStatusMenu(false);
                      if (opt.value !== ticket.status) setConfirmStatus(opt.value);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      opt.value === ticket.status
                        ? "text-blue-600 font-semibold bg-blue-50/50"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.value === ticket.status && (
                      <span className="material-symbols-outlined text-sm text-blue-600">check</span>
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          </div>{/* end Actions */}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 bg-slate-50">
        <div className="max-w-2xl mx-auto space-y-4">

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              {formatDate(ticket.createdAt)}
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Original message — admin side (right / blue) */}
          <div className="flex gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sm text-white">person</span>
            </div>
            <div className="max-w-[80%] flex flex-col items-end">
              <div className="bg-blue-600 text-white rounded-xl rounded-tr-sm px-4 py-3 shadow-sm">
                <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                <AttachmentGrid urls={ticket.attachments} light={false} onImageClick={setLightboxUrl} />
              </div>
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
                reply.isStaffReply ? "bg-slate-200" : "bg-blue-600"
              }`}>
                <span className={`material-symbols-outlined text-sm ${reply.isStaffReply ? "text-slate-500" : "text-white"}`}>
                  {reply.isStaffReply ? "support_agent" : "person"}
                </span>
              </div>
              <div className={`max-w-[80%] flex flex-col ${!reply.isStaffReply ? "items-end" : ""}`}>
                <div className={`rounded-xl px-4 py-3 shadow-sm ${
                  reply.isStaffReply
                    ? "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}>
                  {reply.isStaffReply && (
                    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wide">{reply.repliedBy}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  <AttachmentGrid urls={reply.attachments} light={reply.isStaffReply} onImageClick={setLightboxUrl} />
                </div>
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
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm text-blue-400">person</span>
              </div>
              <div className="max-w-[80%] flex flex-col items-end">
                <div className="bg-blue-600/10 rounded-xl rounded-tr-sm px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500/50 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-blue-500/50 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-blue-500/50 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Reply box or closed notice */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          {canReply ? (
            <>
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <div key={a.url} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.url)}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-white text-base">close</span>
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

              <div className="border border-slate-200 rounded-2xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <div className="flex items-end p-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-40"
                    title={attachments.length >= MAX_ATTACHMENTS ? `แนบได้สูงสุด ${MAX_ATTACHMENTS} ไฟล์` : "แนบรูปภาพ"}
                  >
                    {uploading
                      ? <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined text-xl">attach_file</span>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="พิมพ์ข้อความถึงทีมงาน... (Enter เพื่อส่ง)"
                    rows={2}
                    className="flex-1 resize-none py-2 text-sm outline-none bg-transparent border-none focus:ring-0"
                  />
                  <button
                    onClick={handleSend}
                    disabled={(!message.trim() && attachments.length === 0) || sending || uploading}
                    className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-slate-400">Shift+Enter ขึ้นบรรทัดใหม่</p>
                <p className={`text-xs tabular-nums ${message.length > 4000 ? "text-red-500" : "text-slate-300"}`}>{message.length}/4096</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-slate-400">
                {ticket.status === "Resolved" ? "ตั๋วนี้ได้รับการแก้ไขแล้ว" : "ตั๋วนี้ถูกปิดแล้ว"} — ไม่สามารถส่งข้อความเพิ่มเติมได้
              </p>
              <button
                onClick={() => setConfirmStatus("Open")}
                disabled={statusUpdating}
                className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-40"
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
