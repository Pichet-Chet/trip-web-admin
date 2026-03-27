"use client";

import { useState } from "react";
import type { ChangeEntry } from "@/types";

interface ChangeSummaryModalProps {
  open: boolean;
  onClose: () => void;
  tripTitle: string;
  followerCount: number;
  changes: ChangeEntry[];
}

const changeTypeIcon: Record<ChangeEntry["type"], { icon: string; color: string; label: string }> = {
  add: { icon: "add_circle", color: "text-green-600", label: "เพิ่ม" },
  update: { icon: "edit", color: "text-blue-600", label: "แก้ไข" },
  delete: { icon: "remove_circle", color: "text-red-500", label: "ลบ" },
};

export function ChangeSummaryModal({
  open,
  onClose,
  tripTitle,
  followerCount,
  changes,
}: ChangeSummaryModalProps): React.ReactNode {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  function handleSendNotification(): void {
    setSending(true);
    // Mock: simulate sending
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1500);
  }

  function handleClose(): void {
    setSent(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Success State */}
        {sent ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-green-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">ส่งแจ้งเตือนแล้ว!</h3>
            <p className="text-sm text-slate-500">ส่งไปยัง {followerCount} คนที่ติดตามทริปนี้</p>
            <button
              onClick={handleClose}
              className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              เสร็จสิ้น
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600">edit_notifications</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">สรุปการเปลี่ยนแปลง</h3>
                    <p className="text-xs text-slate-500">{tripTitle}</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Changes List */}
            <div className="p-6 space-y-3 max-h-64 overflow-y-auto">
              {changes.map((change, i) => {
                const ct = changeTypeIcon[change.type];
                return (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <span className={`material-symbols-outlined ${ct.color} text-lg mt-0.5`} style={{ fontVariationSettings: "'FILL' 1" }}>{ct.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{change.description}</p>
                      {change.dayNumber && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Day {change.dayNumber}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 space-y-3">
              {/* Follower info */}
              <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                <span className="material-symbols-outlined text-blue-600 text-lg">group</span>
                <p className="text-sm text-blue-700">
                  จะส่งแจ้งเตือนไปยัง <strong>{followerCount} คน</strong> ที่ติดตามทริปนี้
                </p>
              </div>

              {/* Edit count warning */}
              <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3">
                <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
                <p className="text-sm text-amber-700">
                  การแก้ไขครั้งที่ <strong>1/2</strong> (Free Plan)
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  บันทึกอย่างเดียว
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={sending}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">send</span>
                      ส่งแจ้งเตือน
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
