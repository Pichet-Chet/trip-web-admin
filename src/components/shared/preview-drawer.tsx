"use client";

import { useRef, useState } from "react";
import { MobilePreview } from "./mobile-preview";

interface DayLite {
  id: string;
  title: string;
  date: string | null;
  coverImageUrl: string | null;
  activities: { id: string; time: string | null; name: string; description: string | null; emoji: string | null }[];
}

interface PreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  travelersCount: number;
  coverImageUrl: string | null;
  airlineName: string | null;
  accommodationsCount: number;
  countdownDays: number;
  days: DayLite[];
}

export function PreviewDrawer({
  open,
  onClose,
  ...previewProps
}: PreviewDrawerProps) {
  const [activeDay, setActiveDay] = useState(0);
  const touchStartX = useRef(0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel — slides from right */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-(--surface) shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (e.changedTouches[0].clientX - touchStartX.current > 80) onClose(); }}
        aria-label="Mobile preview"
        role="dialog"
        aria-modal
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--outline-variant)/30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-(--primary)">phone_iphone</span>
            <h2 className="text-sm font-bold text-(--on-surface)">ตัวอย่างบนมือถือ</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-(--on-surface-variant) hover:bg-(--surface-variant) transition-colors"
            aria-label="ปิด"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable preview area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-3">
          <MobilePreview
            {...previewProps}
            activeDayIndex={activeDay}
            onActiveDayChange={setActiveDay}
          />
          <p className="text-[10px] text-(--on-surface-variant) uppercase tracking-wider font-semibold">
            ตัวอย่างหน้าตาบนมือถือ
          </p>
        </div>
      </div>
    </>
  );
}
