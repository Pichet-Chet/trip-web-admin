"use client";

import { useState } from "react";
import Link from "next/link";
import type { PendingChangelog } from "@/lib/trip-api";
import { acknowledgeChangelog } from "@/lib/trip-api";

interface AcknowledgeModalProps {
  slug: string;
  followerId?: string;
  pending: PendingChangelog;
  onDone: () => void;
}

export function AcknowledgeModal({ slug, followerId, pending, onDone }: AcknowledgeModalProps) {
  const [loading, setLoading] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const allChanges = pending.changelogs.flatMap((cl) => cl.changes);

  async function handleAcknowledge() {
    setLoading(true);
    try {
      await Promise.all(
        pending.changelogs.map((cl) => acknowledgeChangelog(cl.id, followerId))
      );
      setAcknowledged(true);
      setTimeout(() => onDone(), 1500);
    } catch {
      // best-effort — don't block the user
      setAcknowledged(true);
      setTimeout(() => onDone(), 1500);
    } finally {
      setLoading(false);
    }
  }

  const iconForType = (type: string) => {
    if (type === "add") return { bg: "bg-green-500", icon: "add" };
    if (type === "remove") return { bg: "bg-red-500", icon: "remove" };
    return { bg: "bg-amber-500", icon: "edit" };
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-sm" />

      {/* Modal card — centered on desktop, bottom-sheet feel on mobile */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Company header */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {pending.companyLogoUrl ? (
                <img
                  src={pending.companyLogoUrl}
                  alt={pending.companyName}
                  className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>tour</span>
                </div>
              )}
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-blue">
                {pending.companyName}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            {acknowledged ? (
              <div className="py-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3">
                  <span className="material-symbols-outlined text-green-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <p className="font-bold text-slate-900 mb-1">รับทราบแล้ว!</p>
                <p className="text-sm text-slate-500">ขอบคุณที่ตอบรับ 🙏</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">มีการเปลี่ยนแปลง:</h2>
                <p className="text-sm text-slate-500 mb-4">
                  มีการเปลี่ยนแปลงในโปรแกรมทัวร์ กรุณาตรวจสอบรายละเอียดด้านล่าง
                </p>

                {/* Change list */}
                <div className="space-y-2.5 mb-5">
                  {allChanges.slice(0, 5).map((change) => {
                    const { bg, icon } = iconForType(change.type);
                    return (
                      <div key={change.id} className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${bg}`}>
                          <span className="material-symbols-outlined text-[11px]">{icon}</span>
                        </span>
                        <p className="text-sm text-slate-700 leading-snug">{change.description}</p>
                      </div>
                    );
                  })}
                  {allChanges.length > 5 && (
                    <p className="text-xs text-slate-400 pl-8">+{allChanges.length - 5} รายการเพิ่มเติม</p>
                  )}
                </div>

                {/* Acknowledge button */}
                <button
                  onClick={handleAcknowledge}
                  disabled={loading}
                  className="w-full h-12 bg-brand-blue text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  ) : (
                    "รับทราบ"
                  )}
                </button>
              </>
            )}
          </div>

          {/* Footer link */}
          {!acknowledged && (
            <div className="px-5 pb-5 text-center">
              <Link
                href={`/t/${slug}/changelog`}
                onClick={onDone}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-base">history</span>
                ดูประวัติการเปลี่ยนแปลงทั้งหมด
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
