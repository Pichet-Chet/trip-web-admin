"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Helpers ─── */
const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* ─── Props ─── */
interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  required?: boolean;
  error?: string;
  icon?: string;
}

export function DatePicker({ label, value, onChange, placeholder = "เลือกวันที่", min, max, required, error, icon = "calendar_today" }: DatePickerProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedDate = parseDate(value);
  const minDate = parseDate(min ?? "");
  const maxDate = parseDate(max ?? "");
  const today = new Date();

  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Position dropdown
  useEffect(() => {
    if (!open || !dropdownRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdown = dropdownRef.current;
    if (spaceBelow < 360) {
      dropdown.style.bottom = "100%";
      dropdown.style.top = "auto";
      dropdown.style.marginBottom = "4px";
    } else {
      dropdown.style.top = "100%";
      dropdown.style.bottom = "auto";
      dropdown.style.marginTop = "4px";
    }
  }, [open]);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handleSelect = useCallback((day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toDateStr(d));
    setOpen(false);
  }, [viewYear, viewMonth, onChange]);

  const isDisabled = useCallback((day: number): boolean => {
    const d = new Date(viewYear, viewMonth, day);
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && d > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    return false;
  }, [viewYear, viewMonth, minDate, maxDate]);

  /* ─── Build calendar grid ─── */
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  /* ─── Display value ─── */
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" })
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

      {/* Dropdown Calendar */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-(--outline-variant)/30 p-4 w-[300px] animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header: Month/Year Nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-(--surface-variant) transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-(--on-surface-variant)">chevron_left</span>
            </button>
            <span className="text-sm font-bold text-(--on-surface)">
              {MONTHS_TH[viewMonth]} {viewYear + 543}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-(--surface-variant) transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-(--on-surface-variant)">chevron_right</span>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS_TH.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells — aspect-square so cell height = column width, no slack */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className="aspect-square" />;

              const d = new Date(viewYear, viewMonth, day);
              const isToday = isSameDay(d, today);
              const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
              const disabled = isDisabled(day);

              return (
                <button
                  key={`d-${day}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={`aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center ${
                    isSelected
                      ? "bg-(--primary) text-(--on-primary) shadow-md shadow-(--primary)/25"
                      : isToday
                        ? "bg-(--primary-container) text-(--on-primary-container) font-bold"
                        : disabled
                          ? "text-(--outline)/30 cursor-not-allowed"
                          : "text-(--on-surface) hover:bg-(--surface-variant)"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-(--outline-variant)/20">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-xs font-bold text-(--on-surface-variant) hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              ล้าง
            </button>
            <button
              type="button"
              onClick={() => { handleSelect(today.getDate()); setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
              className="text-xs font-bold text-(--primary) hover:bg-(--primary-container) transition-colors px-3 py-1 rounded-lg"
            >
              วันนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
