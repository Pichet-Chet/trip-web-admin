"use client";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  /** Optional Material icon name. */
  icon?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Optional label rendered above the control. */
  label?: string;
  /** Match other form controls' default 56px height when set. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Pill-style toggle for picking one of N short options. Use over a
 * `<select>` when there are 2-4 options and the user benefits from
 * seeing them all at once (e.g. language picker, scope filter).
 */
export function SegmentedControl<T extends string>({
  options, value, onChange, label, size = "md", className = "",
}: SegmentedControlProps<T>): React.ReactNode {
  const heightCls = size === "md" ? "h-14" : "h-10";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <div className={`flex bg-(--surface-container-low) rounded-xl p-1 ${heightCls}`} role="tablist">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={`flex-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                active
                  ? "bg-white shadow-sm text-(--primary)"
                  : "text-(--on-surface-variant) hover:text-(--on-surface)"
              }`}
            >
              {opt.icon && <span className="material-symbols-outlined text-base">{opt.icon}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
