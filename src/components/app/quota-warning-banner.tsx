"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface UsageResponse {
  tier: string | null;
  tripQuotaUsed: number;
  tripQuotaLimit: number;
  remainingTrips: number;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  hasActiveSubscription: boolean;
  subscriptionExpiresAt: string | null;
}

const DISMISS_KEY = "quota_warning_dismissed_at";
const DISMISS_HOURS = 24;

/**
 * Proactive quota warning. Three triggers:
 *   - Trip quota used ≥ 80% (free tier only)
 *   - Subscription expiring within 7 days
 *   - All credits exhausted (no subscription)
 *
 * Dismissable for 24h via localStorage; reappears after that.
 */
export function QuotaWarningBanner(): React.ReactNode {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(DISMISS_KEY) : null;
    if (stored) {
      const ts = Number(stored);
      if (!Number.isNaN(ts) && Date.now() - ts < DISMISS_HOURS * 3600_000) return;
    }
    setDismissed(false);
    api.get<UsageResponse>("/admin/usage")
      .then(setUsage)
      .catch((err) => { if (!(err instanceof ApiError)) console.error(err); });
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  if (dismissed || !usage) return null;

  const { warning, message, action, actionLabel } = analyzeUsage(usage);
  if (!warning) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">warning</span>
        <p className="text-sm text-amber-900 flex-1">{message}</p>
        {action && (
          <Link href={action} className="text-xs font-bold text-amber-900 underline hover:no-underline whitespace-nowrap">
            {actionLabel}
          </Link>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="text-amber-600 hover:text-amber-900 shrink-0"
          aria-label="ปิดการแจ้งเตือน"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}

function analyzeUsage(u: UsageResponse): {
  warning: boolean;
  message: string;
  action?: string;
  actionLabel?: string;
} {
  // Subscription expiring soon (within 7 days)
  if (u.hasActiveSubscription && u.subscriptionExpiresAt) {
    const ms = new Date(u.subscriptionExpiresAt).getTime() - Date.now();
    const days = Math.floor(ms / (24 * 3600 * 1000));
    if (days >= 0 && days <= 7) {
      return {
        warning: true,
        message: `แพ็กเกจของคุณจะหมดอายุใน ${days === 0 ? "วันนี้" : `${days} วัน`} — ระบบจะต่ออายุอัตโนมัติ`,
        action: "/dashboard/billing",
        actionLabel: "จัดการการเรียกเก็บ",
      };
    }
  }

  // No subscription + free quota usage at 80%+
  if (!u.hasActiveSubscription && u.tripQuotaLimit > 0) {
    const totalCapacity = u.tripQuotaLimit + u.creditsTotal;
    const totalUsed = u.tripQuotaUsed + u.creditsUsed;
    const remaining = Math.max(0, totalCapacity - totalUsed);
    const pct = totalCapacity === 0 ? 100 : Math.round((totalUsed / totalCapacity) * 100);

    if (remaining === 0) {
      return {
        warning: true,
        message: "คุณใช้สิทธิ์ทริปครบแล้ว — ซื้อเพิ่มหรืออัปเกรดเพื่อสร้างทริปใหม่",
        action: "/dashboard/upgrade",
        actionLabel: "ซื้อเพิ่ม",
      };
    }
    if (pct >= 80) {
      return {
        warning: true,
        message: `ใช้สิทธิ์ทริปแล้ว ${totalUsed}/${totalCapacity} (${pct}%) — เหลืออีก ${remaining} ทริป`,
        action: "/dashboard/upgrade",
        actionLabel: "ดูแพ็กเกจ",
      };
    }
  }

  return { warning: false, message: "" };
}
