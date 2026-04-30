"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
import type { FollowChannel } from "@/types";

const toFollowChannel = (raw: string): FollowChannel =>
  raw.toLowerCase().includes("line") ? "line" : "web_push";

interface Follower {
  id: string;
  displayName: string;
  channel: string;
  followedAt: string;
}

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
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [changelogs, setChangelogs] = useState<ChangeLog[]>([]);
  const [activeTab, setActiveTab] = useState<"followers" | "changelog">("changelog");

  const [sending, setSending] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ logId: string; mode: "send" | "resend" } | null>(null);

  const [receiptOpen, setReceiptOpen] = useState<ChangeLog | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptResponse | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const reload = async () => {
    const [f, c] = await Promise.all([
      api.get<Follower[]>(`/admin/trips/${tripId}/followers`),
      api.get<ChangeLog[]>(`/admin/trips/${tripId}/changelog`),
    ]);
    setFollowers(f);
    setChangelogs(c);
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
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="กลับ"
          >
            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">จัดการผู้ติดตาม &amp; การแจ้งเตือน</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              {followers.length} ผู้ติดตาม · {pendingCount > 0 ? `${pendingCount} การเปลี่ยนแปลงรอแจ้งเตือน` : "ไม่มีการเปลี่ยนแปลงรอแจ้งเตือน"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("changelog")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "changelog"
                ? "border-(--primary) text-(--primary)"
                : "border-transparent text-slate-500 hover:text-slate-700"
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
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            ผู้ติดตาม
            <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
              {followers.length}
            </span>
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
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <div className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-xs text-slate-400">{formatThaiDateTime(log.createdAt)}</p>
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
                        <li key={c.id} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="material-symbols-outlined text-(--primary) text-base mt-0.5 shrink-0">edit</span>
                          <span>{c.description}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
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
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-2"
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
                          </button>
                        </>
                      )}
                    </div>

                    {!log.notiSent && followers.length === 0 && (
                      <p className="text-[11px] text-slate-400 mt-2">
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
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
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
              <ul className="divide-y divide-slate-100">
                {followers.map((f) => (
                  <li key={f.id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                        {f.displayName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{f.displayName}</p>
                        <p className="text-[11px] text-slate-400">เริ่มติดตามเมื่อ {formatThaiDate(f.followedAt)}</p>
                      </div>
                    </div>
                    <ChannelBadge channel={toFollowChannel(f.channel)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* Confirm send/resend */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleSend(confirmAction.logId, confirmAction.mode)}
        title={confirmAction?.mode === "send" ? "ส่งการแจ้งเตือนหรือไม่?" : "ส่งซ้ำให้ผู้ที่ยังไม่อ่านหรือไม่?"}
        description={
          confirmAction?.mode === "send"
            ? `จะส่งแจ้งเตือนถึงผู้ติดตาม ${followers.length} คน — ตรวจสอบให้แน่ใจว่าข้อมูลทริปอัปเดตเรียบร้อย`
            : "ระบบจะส่งเฉพาะผู้ที่ยังไม่ได้กดยืนยันการอ่าน"
        }
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
          <div className="p-12 text-center text-slate-400 animate-pulse">กำลังโหลด...</div>
        ) : receiptData ? (
          <>
            <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">ทั้งหมด</p>
                <p className="text-2xl font-bold text-slate-900">{receiptData.totalFollowers}</p>
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
            <ul className="divide-y divide-slate-100">
              {receiptData.receipts.map((r) => (
                <li key={r.followerId} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {r.displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{r.displayName}</p>
                      <p className="text-[11px] text-slate-400">
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
