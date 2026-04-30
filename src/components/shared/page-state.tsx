"use client";

interface LoadingStateProps {
  /** Optional message under the spinner. Default: no message. */
  message?: string;
  /** Vertical padding hint. "page" = min-h-60, "section" = py-12. Default "page". */
  size?: "page" | "section";
}

export function LoadingState({ message, size = "page" }: LoadingStateProps): React.ReactNode {
  const padding = size === "page" ? "p-8 min-h-60" : "py-12";
  return (
    <div className={`${padding} flex flex-col items-center justify-center gap-3`}>
      <span className="material-symbols-outlined animate-spin text-(--primary) text-3xl">progress_activity</span>
      {message && <p className="text-sm text-(--on-surface-variant)">{message}</p>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ message, onRetry, retryLabel = "ลองใหม่" }: ErrorStateProps): React.ReactNode {
  return (
    <div className="p-8 text-center space-y-3">
      <span className="material-symbols-outlined text-4xl text-red-400">error</span>
      <p className="text-(--on-surface-variant) text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-(--primary) font-semibold cursor-pointer hover:underline"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
