"use client";

type BannerVariant = "info" | "success" | "warning" | "danger";

interface BannerProps {
  variant?: BannerVariant;
  icon?: string;
  title?: string;
  /** Body content. If string, rendered as <p>; if ReactNode, rendered raw. */
  children?: React.ReactNode;
  /** Show a dismiss (×) button. Calls onDismiss when clicked. */
  onDismiss?: () => void;
  /** Optional right-side action button or link (rendered after the body). */
  action?: React.ReactNode;
  className?: string;
}

const VARIANTS: Record<BannerVariant, { wrap: string; iconColor: string; titleColor: string; iconFilled: boolean }> = {
  info:    { wrap: "bg-blue-50 border-blue-200",       iconColor: "text-blue-600",     titleColor: "text-blue-900",    iconFilled: true },
  success: { wrap: "bg-green-50 border-green-200",     iconColor: "text-green-600",    titleColor: "text-green-700",   iconFilled: true },
  warning: { wrap: "bg-amber-50 border-amber-300",     iconColor: "text-amber-600",    titleColor: "text-amber-800",   iconFilled: true },
  danger:  { wrap: "bg-rose-50 border-rose-300",       iconColor: "text-rose-600",     titleColor: "text-rose-800",    iconFilled: true },
};

const DEFAULT_ICON: Record<BannerVariant, string> = {
  info:    "info",
  success: "check_circle",
  warning: "warning",
  danger:  "error",
};

/**
 * Banner — flat alert bar typically placed at the top of a page or section.
 * Distinct from a modal (no overlay, doesn't trap focus). Variants encode
 * semantic meaning consistently across pages.
 */
export function Banner({
  variant = "info",
  icon,
  title,
  children,
  onDismiss,
  action,
  className = "",
}: BannerProps): React.ReactNode {
  const v = VARIANTS[variant];
  const resolvedIcon = icon ?? DEFAULT_ICON[variant];

  return (
    <div className={`border rounded-2xl p-4 flex items-start gap-3 ${v.wrap} ${className}`}>
      <span
        className={`material-symbols-outlined mt-0.5 text-2xl ${v.iconColor}`}
        style={v.iconFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {resolvedIcon}
      </span>
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-bold ${v.titleColor}`}>{title}</p>}
        {children && (
          typeof children === "string"
            ? <p className={`text-xs ${v.titleColor.replace("-900", "-800").replace("-800", "-700").replace("-700", "-600")} ${title ? "mt-1" : ""} leading-relaxed`}>{children}</p>
            : <div className={title ? "mt-1" : ""}>{children}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`shrink-0 p-1 rounded ${v.iconColor} hover:opacity-70 cursor-pointer`}
          aria-label="ปิด"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}
