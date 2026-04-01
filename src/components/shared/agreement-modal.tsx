"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface AgreementModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  title: string;
  children: React.ReactNode;
}

export function AgreementModal({ open, onClose, onAccept, title, children }: AgreementModalProps): React.ReactNode {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (isBottom) setScrolledToBottom(true);
  }, []);

  useEffect(() => {
    if (open) setScrolledToBottom(false);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6 text-sm text-slate-600 leading-relaxed"
        >
          {children}
        </div>

        {/* Scroll indicator */}
        {!scrolledToBottom && (
          <div className="absolute bottom-[72px] left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
            <div className="flex items-center gap-1 text-xs text-slate-400 animate-bounce">
              <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
              เลื่อนลงเพื่ออ่านต่อ
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            {scrolledToBottom ? (
              <span className="text-green-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                อ่านครบแล้ว
              </span>
            ) : (
              "กรุณาเลื่อนอ่านจนจบก่อนกดยอมรับ"
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ปิด
            </button>
            <button
              onClick={onAccept}
              disabled={!scrolledToBottom}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-(--primary) text-white hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ฉันได้อ่านและยอมรับ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
