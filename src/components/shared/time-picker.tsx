"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Quick presets ─── */
const QUICK_TIMES = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

/* ─── Props ─── */
interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: string;
}

export function TimePicker({ label, value, onChange, onBlur, placeholder = "เลือกเวลา", required, error, icon = "schedule" }: TimePickerProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  const [hour, setHour] = useState(() => value ? parseInt(value.split(":")[0]) : -1);
  const [minute, setMinute] = useState(() => value ? parseInt(value.split(":")[1]) : -1);

  // Sync from external value
  useEffect(() => {
    if (value && value.includes(":")) {
      setHour(parseInt(value.split(":")[0]));
      setMinute(parseInt(value.split(":")[1]));
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onBlur]);

  // Scroll to selected on open
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (hourRef.current && hour >= 0) {
        const el = hourRef.current.querySelector(`[data-hour="${hour}"]`);
        el?.scrollIntoView({ block: "center" });
      }
      if (minRef.current && minute >= 0) {
        const el = minRef.current.querySelector(`[data-min="${minute}"]`);
        el?.scrollIntoView({ block: "center" });
      }
    });
  }, [open, hour, minute]);

  // Position dropdown
  useEffect(() => {
    if (!open || !dropdownRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdown = dropdownRef.current;
    if (spaceBelow < 380) {
      dropdown.style.bottom = "100%";
      dropdown.style.top = "auto";
      dropdown.style.marginBottom = "4px";
    } else {
      dropdown.style.top = "100%";
      dropdown.style.bottom = "auto";
      dropdown.style.marginTop = "4px";
    }
  }, [open]);

  const commit = useCallback((h: number, m: number) => {
    if (h >= 0 && m >= 0) {
      onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }, [onChange]);

  const selectHour = useCallback((h: number) => {
    setHour(h);
    const m = minute >= 0 ? minute : 0;
    setMinute(m);
    commit(h, m);
  }, [minute, commit]);

  const selectMinute = useCallback((m: number) => {
    setMinute(m);
    const h = hour >= 0 ? hour : 8;
    setHour(h);
    commit(h, m);
  }, [hour, commit]);

  const selectQuick = useCallback((t: string) => {
    const [h, m] = t.split(":").map(Number);
    setHour(h);
    setMinute(m);
    onChange(t);
    setOpen(false);
    onBlur?.();
  }, [onChange, onBlur]);

  /* ─── Display ─── */
  const displayValue = hour >= 0 && minute >= 0
    ? `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    : "";

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative w-full bg-(--surface-container-low) border rounded-xl py-4 px-6 text-left transition-all font-medium outline-none ${icon ? "pl-12" : ""} ${
          open
            ? "bg-white ring-2 ring-(--primary)/20 border-(--primary)"
            : error
              ? "border-red-400 bg-red-50/30"
              : "border-transparent hover:border-(--outline-variant)"
        }`}
      >
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-(--on-surface-variant)">
            {icon}
          </span>
        )}
        {displayValue ? (
          <span className="text-(--on-surface)">{displayValue}</span>
        ) : (
          <span className="text-(--outline)/40">{placeholder}</span>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-500 px-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-(--outline-variant)/30 w-[300px] animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
        >
          {/* Hour + Minute columns */}
          <div className="flex border-b border-(--outline-variant)/20">
            {/* Hours */}
            <div className="flex-1 border-r border-(--outline-variant)/20">
              <div className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest text-center py-2 bg-(--surface-variant)/30">
                ชั่วโมง
              </div>
              <div ref={hourRef} className="h-48 overflow-y-auto scrollbar-hide">
                {Array.from({ length: 24 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    data-hour={i}
                    onClick={() => selectHour(i)}
                    className={`w-full py-2.5 text-center text-sm font-semibold transition-all ${
                      hour === i
                        ? "bg-(--primary) text-(--on-primary)"
                        : "text-(--on-surface) hover:bg-(--surface-variant)"
                    }`}
                  >
                    {String(i).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest text-center py-2 bg-(--surface-variant)/30">
                นาที
              </div>
              <div ref={minRef} className="h-48 overflow-y-auto scrollbar-hide">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-min={m}
                    onClick={() => selectMinute(m)}
                    className={`w-full py-2.5 text-center text-sm font-semibold transition-all ${
                      minute === m
                        ? "bg-(--primary) text-(--on-primary)"
                        : "text-(--on-surface) hover:bg-(--surface-variant)"
                    }`}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick select */}
          <div className="p-3">
            <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest mb-2">เลือกเร็ว</p>
            <div className="grid grid-cols-4 gap-1">
              {QUICK_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectQuick(t)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    displayValue === t
                      ? "bg-(--primary) text-(--on-primary)"
                      : "bg-(--surface-variant)/40 text-(--on-surface) hover:bg-(--surface-variant)"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-(--outline-variant)/20">
            <button
              type="button"
              onClick={() => { onChange(""); setHour(-1); setMinute(-1); setOpen(false); onBlur?.(); }}
              className="text-xs font-bold text-(--on-surface-variant) hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              ล้าง
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onBlur?.(); }}
              className="text-xs font-bold text-(--primary) hover:bg-(--primary-container) transition-colors px-3 py-1.5 rounded-lg"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
