"use client";

import { useEffect, useRef } from "react";
import type { TripActivity } from "@/types";
import { ActivityEditorCard } from "./activity-editor-card";

interface ActivityBottomSheetProps {
  activity: TripActivity | null;
  onClose: () => void;
  onLocalChange: (patch: Partial<TripActivity>) => void;
  onCommit: (field: keyof TripActivity, value: string | null) => void;
  onImagesChange: (urls: string[]) => void;
  onRemove: () => void;
}

export function ActivityBottomSheet({
  activity, onClose,
  onLocalChange, onCommit, onImagesChange, onRemove,
}: ActivityBottomSheetProps): React.ReactNode {
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);

  // Trap body scroll when open
  useEffect(() => {
    if (!activity) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [activity]);

  if (!activity) return null;

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  }
  function handleTouchMove(e: React.TouchEvent) {
    touchDeltaY.current = e.touches[0].clientY - touchStartY.current;
    if (sheetRef.current && touchDeltaY.current > 0) {
      sheetRef.current.style.transform = `translateY(${touchDeltaY.current}px)`;
    }
  }
  function handleTouchEnd() {
    if (touchDeltaY.current > 80) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    touchDeltaY.current = 0;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 bg-(--surface) rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col transition-transform duration-200"
        role="dialog"
        aria-modal
        aria-label="แก้ไขกิจกรรม"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-(--outline-variant)" />
        </div>

        {/* Scrollable card content */}
        <div className="flex-1 overflow-y-auto px-4 pb-safe-area-inset-bottom">
          <ActivityEditorCard
            activity={activity}
            defaultExpanded
            onLocalChange={onLocalChange}
            onCommit={onCommit}
            onImagesChange={onImagesChange}
            onRemove={() => { onRemove(); onClose(); }}
            onCollapse={onClose}
          />
        </div>
      </div>
    </>
  );
}
