"use client";

import { useState, useRef, useEffect } from "react";

/* ─── Types ─── */
export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  searchable?: boolean;
  icon?: string;
}

export function SelectPicker({ label, value, onChange, options, placeholder = "เลือก", required, error, searchable = true, icon }: SelectPickerProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()) || o.value.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Focus search on open
  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open) setSearch("");
  }, [open, searchable]);

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
    if (spaceBelow < 300) {
      dropdown.style.bottom = "100%";
      dropdown.style.top = "auto";
      dropdown.style.marginBottom = "4px";
    } else {
      dropdown.style.top = "100%";
      dropdown.style.bottom = "auto";
      dropdown.style.marginTop = "4px";
    }
  }, [open]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2 relative" ref={containerRef}>
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
        className={`relative w-full bg-(--surface-container-low) border rounded-xl py-4 px-6 text-left transition-all font-medium outline-none ${icon ? "pl-12" : ""} pr-10 ${
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
        {selectedOption ? (
          <span className="flex items-center gap-2 text-(--on-surface)">
            {selectedOption.icon && (
              <span className="material-symbols-outlined text-base text-(--on-surface-variant)">{selectedOption.icon}</span>
            )}
            {selectedOption.label}
          </span>
        ) : (
          <span className="text-(--outline)/40">{placeholder}</span>
        )}
        <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-(--on-surface-variant) text-lg transition-transform ${open ? "rotate-180" : ""}`}>
          expand_more
        </span>
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
          className="absolute z-50 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-(--outline-variant)/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Search */}
          {searchable && (
            <div className="p-3 border-b border-(--outline-variant)/20">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-(--on-surface-variant) text-lg">search</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหา..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-(--surface-container-low) border border-transparent text-sm text-(--on-surface) font-medium placeholder:text-(--outline)/40 outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="max-h-56 overflow-y-auto scrollbar-hide py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-(--on-surface-variant)">
                ไม่พบรายการ
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-(--primary-container) text-(--on-primary-container)"
                        : "text-(--on-surface) hover:bg-(--surface-variant)/50"
                    }`}
                  >
                    {opt.icon && (
                      <span className={`material-symbols-outlined text-base ${isSelected ? "text-(--on-primary-container)" : "text-(--on-surface-variant)"}`}>
                        {opt.icon}
                      </span>
                    )}
                    <span className="flex-1">{opt.label}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-base text-(--primary)">check</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
