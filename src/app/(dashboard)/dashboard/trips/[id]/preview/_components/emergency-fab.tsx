"use client";

import { useState } from "react";

interface EmergencyContact {
  name: string;
  phone: string;
  icon: string | null;
}

interface EmergencyFabProps {
  contacts: EmergencyContact[];
}

export function EmergencyFab({ contacts }: EmergencyFabProps) {
  const [open, setOpen] = useState(false);

  if (contacts.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 md:hidden bg-(--surface) rounded-t-3xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal
        aria-label="เบอร์ฉุกเฉิน"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-(--outline-variant)" />
        </div>

        <div className="px-6 py-4 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
              <h3 className="text-base font-bold text-(--on-surface)">เบอร์ฉุกเฉิน</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-(--on-surface-variant) hover:bg-(--surface-variant)"
              aria-label="ปิด"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="space-y-3">
            {contacts.map((c, i) => (
              <a
                key={i}
                href={`tel:${c.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-4 p-4 bg-(--surface-container-low) rounded-2xl hover:bg-(--surface-variant)/60 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-rose-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {c.icon ?? "phone"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-(--on-surface) truncate">{c.name}</p>
                  <p className="text-sm text-(--on-surface-variant) font-mono">{c.phone}</p>
                </div>
                <span className="material-symbols-outlined text-rose-600 text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  call
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* FAB — mobile only, bottom-right */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="เบอร์ฉุกเฉิน"
        className="fixed bottom-6 right-4 z-50 md:hidden w-14 h-14 rounded-full bg-rose-600 text-white shadow-xl flex items-center justify-center hover:bg-rose-700 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
      </button>
    </>
  );
}
