"use client";

import { useState } from "react";
// Inline SVG icons (lucide-react not available in trip-web-admin)
function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  );
}
function Check({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
import type { PendingChange } from "@/lib/types/trip";

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
          <Check className="h-4 w-4" />
          รับทราบแล้ว — ขอบคุณค่ะ 🙏
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 border-b border-warning/30 bg-warning-light px-4 py-3">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
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
            <Check className="mr-1 inline h-3 w-3" />
            รับทราบแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
