import { IconWrapper } from "./icon-wrapper";

export type StatCardTone = "primary" | "emerald" | "amber" | "rose" | "violet" | "blue";

const TONE_BG: Record<StatCardTone, string> = {
  primary: "bg-(--primary-container)",
  emerald: "bg-emerald-50",
  amber:   "bg-amber-50",
  rose:    "bg-rose-50",
  violet:  "bg-violet-50",
  blue:    "bg-blue-50",
};
const TONE_FG: Record<StatCardTone, string> = {
  primary: "text-(--primary)",
  emerald: "text-emerald-600",
  amber:   "text-amber-600",
  rose:    "text-rose-600",
  violet:  "text-violet-600",
  blue:    "text-blue-600",
};

interface StatCardProps {
  icon: string;
  iconColor?: string;
  /**
   * For variant="pastel": tailwind gradient classes for the icon tile background
   * (e.g. "from-emerald-100 to-emerald-50") + matching icon foreground color
   * (e.g. "text-emerald-600"). Falls back to primary tokens.
   */
  iconGradient?: string;
  title: string;
  value: string | number;
  /** Optional caption shown below the value (hero variant). */
  subtitle?: string;
  limit?: number;
  suffix?: string;
  /**
   * "default" — icon-on-top, label below, optional progress bar (used by /dashboard etc.).
   * "pastel" — icon-on-left in a pastel gradient tile, uppercase label, big number
   * (used by /dashboard/usage row of compact tiles).
   * "hero" — centered icon-on-top tile + big value + subtitle. Use for prominent
   * single-stat cards (/dashboard/billing right hero).
   */
  variant?: "default" | "pastel" | "hero";
  /** Tone preset (hero variant only). Default "primary". */
  tone?: StatCardTone;
  children?: React.ReactNode;
}

export function StatCard({
  icon,
  iconColor = "bg-(--primary)/10 text-(--primary)",
  iconGradient = "from-blue-100 to-blue-50",
  title,
  value,
  subtitle,
  limit,
  suffix,
  variant = "default",
  tone = "primary",
  children,
}: StatCardProps): React.ReactNode {
  if (variant === "hero") {
    return (
      <div className="bg-white p-6 rounded-2xl border border-(--surface-container-high) shadow-sm flex flex-col justify-center text-center space-y-3">
        <div className={`w-14 h-14 mx-auto flex items-center justify-center rounded-2xl ${TONE_BG[tone]}`}>
          <span className={`material-symbols-outlined text-2xl ${TONE_FG[tone]}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-outline">{title}</p>
          <p className="text-2xl md:text-3xl font-black text-on-surface mt-2">{value}</p>
          {subtitle && <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    );
  }

  if (variant === "pastel") {
    const fgColor = iconColor.includes("text-")
      ? iconColor.split(" ").find(c => c.startsWith("text-"))
      : "text-(--primary)";
    return (
      <div className="bg-white rounded-3xl border border-(--outline-variant)/50 p-5 md:p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-symbols-outlined ${fgColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">{title}</p>
          <p className="text-2xl md:text-3xl font-black text-on-surface mt-0.5">{value}</p>
          {children}
        </div>
      </div>
    );
  }

  const pct = limit ? Math.round((Number(value) / limit) * 100) : 0;

  return (
    <div className="bg-(--surface-container-lowest) rounded-2xl p-6 border border-(--outline-variant)/10">
      <div className="flex items-center gap-3 mb-4">
        <IconWrapper icon={icon} color={iconColor} size="md" />
        <h3 className="font-semibold text-(--on-surface)">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-(--on-surface)">
        {value}
        {limit != null && (
          <span className="text-sm font-normal text-(--on-surface-variant)"> / {limit}</span>
        )}
        {suffix && (
          <span className="text-sm font-normal text-(--on-surface-variant)"> {suffix}</span>
        )}
      </p>
      {limit != null && (
        <div className="h-2 rounded-full bg-slate-100 mt-3">
          <div
            className="h-full rounded-full bg-(--primary) transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
