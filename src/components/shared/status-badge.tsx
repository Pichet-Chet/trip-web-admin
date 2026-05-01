import type { TripStatus, FollowChannel } from "@/types";

/** Tone preset for the dot variant. Maps to bg-* (dot) + text-* (label). */
export type StatusTone = "emerald" | "amber" | "rose" | "cyan" | "slate" | "primary" | "blue";

export interface StatusConfig {
  label: string;
  /** Pill variant: full bg + text class set, e.g. "bg-emerald-100 text-emerald-700". */
  cls?: string;
  /** Dot variant: tone preset for the leading dot + text color. */
  tone?: StatusTone;
}

const TONE_DOT: Record<StatusTone, string> = {
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  rose:    "bg-rose-500",
  cyan:    "bg-cyan-500",
  slate:   "bg-slate-400",
  primary: "bg-(--primary)",
  blue:    "bg-blue-500",
};
const TONE_TEXT: Record<StatusTone, string> = {
  emerald: "text-emerald-700",
  amber:   "text-amber-700",
  rose:    "text-rose-700",
  cyan:    "text-cyan-700",
  slate:   "text-slate-500",
  primary: "text-(--primary)",
  blue:    "text-blue-700",
};

const tripStatusConfig: Record<TripStatus, StatusConfig> = {
  published:      { label: "เผยแพร่",     cls: "bg-(--primary-container) text-(--on-primary-container)", tone: "primary" },
  pending_review: { label: "รอตรวจสอบ",  cls: "bg-orange-100 text-orange-700",                          tone: "amber" },
  draft:          { label: "ฉบับร่าง",    cls: "bg-amber-100 text-amber-800",                            tone: "amber" },
  unpublished:    { label: "ปิดแล้ว",     cls: "bg-(--surface-variant) text-(--on-surface-variant)",     tone: "slate" },
  archived:       { label: "จบแล้ว",      cls: "bg-slate-100 text-slate-500",                            tone: "slate" },
};

const channelConfig: Record<FollowChannel, { label: string; icon: string; cls: string }> = {
  line: { label: "LINE", icon: "chat", cls: "bg-green-100 text-green-700" },
  web_push: { label: "Push", icon: "notifications_active", cls: "bg-blue-100 text-blue-700" },
};

interface StatusBadgeProps {
  status: string;
  /** Optional config map keyed by status code. Falls back to TripStatus defaults. */
  config?: Record<string, StatusConfig>;
  /** "pill" — colored pill (default). "dot" — minimalist dot + text. */
  variant?: "pill" | "dot";
  className?: string;
}

/**
 * Single source of truth for status visualization across the admin UI.
 *
 * - Default usage with TripStatus keeps the existing pill look automatically.
 * - For other domains (payments, refunds, …) pass a `config` map with tone or
 *   `cls`. Use `variant="dot"` for the minimalist dot+text style favoured in
 *   data tables; "pill" for prominent badges.
 */
export function StatusBadge({ status, config, variant = "pill", className = "" }: StatusBadgeProps): React.ReactNode {
  const c = (config ?? tripStatusConfig as Record<string, StatusConfig>)[status]
    ?? { label: status, cls: "bg-slate-100 text-slate-500", tone: "slate" as StatusTone };

  if (variant === "dot") {
    const tone = c.tone ?? "slate";
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${TONE_TEXT[tone]} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[tone]}`} />
        {c.label}
      </span>
    );
  }

  const cls = c.cls ?? (c.tone ? `${TONE_TEXT[c.tone]} bg-slate-50` : "bg-slate-100 text-slate-500");
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${cls} ${className}`}>
      {c.label}
    </span>
  );
}

interface ChannelBadgeProps {
  channel: FollowChannel;
  className?: string;
}

export function ChannelBadge({ channel, className = "" }: ChannelBadgeProps): React.ReactNode {
  const c = channelConfig[channel];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.cls} ${className}`}>
      <span className="material-symbols-outlined text-xs">{c.icon}</span>
      {c.label}
    </span>
  );
}
