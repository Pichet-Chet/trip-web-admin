"use client";

import Link from "next/link";

interface FooterActionBarProps {
  backHref: string;
  backLabel: string;
  backIcon?: string;
  onSaveDraft?: () => void;
  nextHref?: string;
  nextLabel: string;
  nextIcon?: string;
  nextVariant?: "primary" | "success";
  onNext?: () => void;
}

export function FooterActionBar({
  backHref,
  backLabel,
  backIcon = "arrow_back",
  onSaveDraft,
  nextHref,
  nextLabel,
  nextIcon = "arrow_forward",
  nextVariant = "primary",
  onNext,
}: FooterActionBarProps): React.ReactNode {
  const nextColor = nextVariant === "success"
    ? "bg-green-600 text-white shadow-xl shadow-green-600/25"
    : "bg-(--primary) text-(--on-primary) shadow-xl shadow-(--primary)/25";

  const nextContent = (
    <>
      {nextVariant === "success" && (
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
      )}
      {nextLabel}
      {nextVariant === "primary" && (
        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{nextIcon}</span>
      )}
    </>
  );

  return (
    <footer className="shrink-0 bg-white border-t border-(--outline-variant)/30 px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <Link
        href={backHref}
        className="w-full md:w-auto px-8 py-4 rounded-full text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-container-low) transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">{backIcon}</span> {backLabel}
      </Link>
      <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
        <button
          type="button"
          onClick={onSaveDraft}
          className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-bold text-(--primary) hover:bg-(--primary)/5 transition-all"
        >
          Save Draft
        </button>
        {nextHref ? (
          <Link
            href={nextHref}
            className={`w-full sm:w-auto px-10 py-5 rounded-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group ${nextColor}`}
          >
            {nextContent}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className={`w-full sm:w-auto px-10 py-5 rounded-full font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group ${nextColor}`}
          >
            {nextContent}
          </button>
        )}
      </div>
    </footer>
  );
}
