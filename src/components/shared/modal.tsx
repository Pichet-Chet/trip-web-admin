"use client";

import { useEffect } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  /** Title in the header strip. Omit for full-bleed content (e.g. PDF preview). */
  title?: string;
  /** Subtitle under the title. */
  subtitle?: React.ReactNode;
  /** Right-side header actions (rendered before the close button). */
  headerActions?: React.ReactNode;
  /** Set to true to disable close on backdrop click + Esc (during a network call). */
  blocking?: boolean;
  /** Hide the standard close (×) button — useful for confirm-only modals. */
  hideCloseButton?: boolean;
  /** Content body. Provide own padding via class on a wrapper. */
  children: React.ReactNode;
  /** Optional sticky footer slot for action buttons. */
  footer?: React.ReactNode;
  /** Pass-through className on the outer card (e.g. extra max-h or h overrides). */
  className?: string;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};

/**
 * Token-themed modal shell. Replaces hand-rolled fixed overlays scattered across
 * billing/refund/invoice modals. Backdrop uses the canonical bg-slate-900/50
 * to match ConfirmDialog. Esc + backdrop click respect the `blocking` flag.
 *
 * For simple yes/no prompts prefer ConfirmDialog (or useConfirm hook) — Modal is
 * the building block when you need custom body content.
 */
export function Modal({
  open,
  onClose,
  size = "md",
  title,
  subtitle,
  headerActions,
  blocking = false,
  hideCloseButton = false,
  children,
  footer,
  className = "",
}: ModalProps): React.ReactNode {
  useEffect(() => {
    if (!open || blocking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, blocking, onClose]);

  if (!open) return null;

  const handleBackdrop = () => {
    if (!blocking) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 cursor-pointer"
        onClick={handleBackdrop}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${SIZE_CLASS[size]} flex flex-col max-h-[90vh] overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || headerActions || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-(--outline-variant)/40 flex-shrink-0">
            <div className="min-w-0 flex-1">
              {title && <h3 className="text-lg font-bold text-(--on-surface) truncate">{title}</h3>}
              {subtitle && (
                <div className="text-sm text-(--on-surface-variant) mt-1">{subtitle}</div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
              {!hideCloseButton && (
                <button
                  onClick={onClose}
                  disabled={blocking}
                  className="p-2 text-(--on-surface-variant) hover:bg-(--surface-container) rounded-full transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="ปิด"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-(--outline-variant)/40 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
