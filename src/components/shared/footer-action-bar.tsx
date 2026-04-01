"use client";

import Link from "next/link";

interface FooterActionBarProps {
  backHref?: string;
  backLabel: string;
  backIcon?: string;
  onBack?: () => void;
  onSaveDraft?: () => void;
  saveDraftLabel?: string;
  savingDraft?: boolean;
  nextHref?: string;
  nextLabel: string;
  nextIcon?: string;
  nextVariant?: "primary" | "success";
  onNext?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function FooterActionBar({
  backHref,
  backLabel,
  onBack,
  backIcon = "arrow_back",
  onSaveDraft,
  saveDraftLabel = "บันทึกร่าง",
  savingDraft = false,
  nextHref,
  nextLabel,
  nextIcon = "arrow_forward",
  nextVariant = "primary",
  onNext,
  disabled = false,
  loading = false,
}: FooterActionBarProps): React.ReactNode {
  const nextColor = nextVariant === "success"
    ? "bg-green-600 text-white shadow-xl shadow-green-600/25"
    : "bg-(--primary) text-(--on-primary) shadow-xl shadow-(--primary)/25";

  const nextContent = (
    <>
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      ) : nextVariant === "success" ? (
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
      ) : null}
      {nextLabel}
      {!loading && nextVariant === "primary" && (
        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{nextIcon}</span>
      )}
    </>
  );

  return (
    <div className="sticky top-32 z-19 bg-white/95 backdrop-blur-sm border-b border-(--outline-variant)/30 px-4 md:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="w-full md:w-auto px-6 py-2.5 rounded-full text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-container-low) transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">{backIcon}</span> {backLabel}
        </button>
      ) : backHref ? (
        <Link
          href={backHref}
          className="w-full md:w-auto px-6 py-2.5 rounded-full text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-container-low) transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">{backIcon}</span> {backLabel}
        </Link>
      ) : (
        <div />
      )}
      <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={savingDraft || loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-bold text-(--primary) hover:bg-(--primary)/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {savingDraft ? (
              <><div className="w-4 h-4 border-2 border-(--primary)/40 border-t-(--primary) rounded-full animate-spin" /> กำลังบันทึก...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">save</span> {saveDraftLabel}</>
            )}
          </button>
        )}
        {nextHref && !disabled ? (
          <Link
            href={nextHref}
            className={`w-full sm:w-auto px-8 py-3 rounded-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group ${nextColor}`}
          >
            {nextContent}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={disabled || loading}
            className={`w-full sm:w-auto px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-3 group ${nextColor} ${disabled || loading ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"}`}
          >
            {nextContent}
          </button>
        )}
      </div>
    </div>
  );
}
