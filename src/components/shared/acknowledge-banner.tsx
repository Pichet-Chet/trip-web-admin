"use client";

import { useState } from "react";

import type { PendingChange } from "@/lib/mock-data";

type AcknowledgeBannerProps = {
  pendingChange: PendingChange;
  onAcknowledge: (changelogId: string) => void;
};

export function AcknowledgeBanner({
  pendingChange,
  onAcknowledge,
}: AcknowledgeBannerProps): React.JSX.Element | null {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  function handleAcknowledge(): void {
    setIsAcknowledged(true);
    onAcknowledge(pendingChange.changelogId);

    // Fade out after 3 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  }

  if (!isVisible) return null;

  if (isAcknowledged) {
    return (
      <div className="sticky top-0 z-50 border-b border-success/30 bg-success/10 px-4 py-3 text-center transition-all">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-success">
          <span className="material-symbols-outlined text-sm">check</span>
          รับทราบแล้ว — ขอบคุณค่ะ 🙏
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 border-b border-warning/30 bg-warning-light px-4 py-3">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 text-lg shrink-0 text-warning">warning</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">
              มีการเปลี่ยนแปลง!
            </p>
            <ul className="mt-1 space-y-0.5">
              {pendingChange.changes.map((change, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  • {change.description}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={handleAcknowledge}
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-primary-dark hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined mr-1 inline text-xs">check</span>
            รับทราบแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
