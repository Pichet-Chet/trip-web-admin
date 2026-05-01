"use client";

import { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface ToastAction {
  label: string;
  /** Receives a `dismiss` callback so the action can close the toast
      synchronously after handling the click (typical for undo flows). */
  onClick: (dismiss: () => void) => void;
}

interface ToastOptions {
  /** Override the default 3 s lifetime — useful for undo prompts that
      should linger long enough for the operator to react. */
  durationMs?: number;
  /** Optional inline action button (e.g. "ยกเลิก" for undo). */
  action?: ToastAction;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success", options?: ToastOptions) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action: options?.action }]);
    setTimeout(() => dismiss(id), options?.durationMs ?? 3000);
  }, [dismiss]);

  const icon: Record<ToastType, string> = {
    success: "check_circle",
    error: "error",
    info: "info",
  };

  const style: Record<ToastType, string> = {
    success: "bg-slate-900 text-white",
    error: "bg-red-600 text-white",
    info: "bg-blue-600 text-white",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${style[t.type]} px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium pointer-events-auto animate-[slideUp_0.3s_ease-out]`}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{icon[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => t.action!.onClick(() => dismiss(t.id))}
                className="ml-2 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold uppercase tracking-wide transition-colors"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
