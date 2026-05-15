"use client";

import { useState } from "react";

import { cn } from "@/lib/trip-utils";

type FollowModalProps = {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function FollowModal({ tripId: _tripId, isOpen, onClose, onSuccess }: FollowModalProps): React.JSX.Element | null {
  const [selectedChannel, setSelectedChannel] = useState<"line" | "web_push" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(): Promise<void> {
    if (!selectedChannel || !displayName.trim()) return;
    setIsSubmitting(true);

    // TODO: Connect to API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <span className="material-symbols-outlined text-2xl text-primary">notifications</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">ติดตามทริปนี้</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            รับแจ้งเตือนเมื่อ plan เปลี่ยน เพื่อไม่พลาดข้อมูลสำคัญ
          </p>
        </div>

        {/* Channel selection */}
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            เลือกช่องทางที่สะดวก:
          </p>

          <button
            onClick={() => setSelectedChannel("line")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border-2 p-4 transition-all",
              selectedChannel === "line"
                ? "border-[#06c755] bg-[#06c755]/5"
                : "border-border hover:border-[#06c755]/50",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#06c755]">
              <span className="text-lg font-bold text-white">L</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">LINE OA Notifications</p>
              <p className="text-xs text-muted-foreground">
                ส่งแจ้งเตือนผ่าน LINE
              </p>
            </div>
            <span className="rounded-full bg-[#06c755]/10 px-2 py-0.5 text-[10px] font-bold text-[#06c755]">
              แนะนำ
            </span>
          </button>

          <button
            onClick={() => setSelectedChannel("web_push")}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border-2 p-4 transition-all",
              selectedChannel === "web_push"
                ? "border-primary bg-primary-50"
                : "border-border hover:border-primary/50",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="material-symbols-outlined text-xl text-white">notifications</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Web Browser Push</p>
              <p className="text-xs text-muted-foreground">
                แจ้งเตือนผ่านเบราว์เซอร์
              </p>
            </div>
          </button>
        </div>

        {/* Display name */}
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            ชื่อของคุณ:
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ใส่ชื่อเรียกสั้นๆ..."
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            ไกด์จะได้เห็นว่าคุณรับทราบแล้ว
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedChannel || !displayName.trim() || isSubmitting}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
        >
          {isSubmitting ? "กำลังดำเนินการ..." : "Confirm & Follow →"}
        </button>

        {/* Skip */}
        <button
          onClick={onClose}
          className="mt-3 w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          NOT NOW, MAYBE LATER
        </button>
      </div>
    </div>
  );
}
