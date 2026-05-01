import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  /** Primary action label. Pair with actionHref (link) OR onAction (button). */
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** Override the default add icon shown inside the action button. */
  actionIcon?: string;
  /** Visual tone for the action button. */
  actionVariant?: "primary" | "secondary";
}

/**
 * Centered empty placeholder. Pass `actionHref` for a Link, `onAction` for a
 * callback (e.g. "clear filters" button); the two are mutually exclusive but
 * both render with the same styling so the visual stays consistent.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  actionIcon = "add",
  actionVariant = "primary",
}: EmptyStateProps): React.ReactNode {
  const buttonClass = actionVariant === "secondary"
    ? "px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
    : "px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2";

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-slate-300">{icon}</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className={buttonClass}>
          <span className="material-symbols-outlined text-lg">{actionIcon}</span>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button type="button" onClick={onAction} className={buttonClass}>
          <span className="material-symbols-outlined text-lg">{actionIcon}</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
