"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  ariaLabel?: string;
}

/**
 * Token-themed on/off toggle. Replaces the duplicated hand-rolled toggles in
 * /dashboard/profile (portfolio enabled) and /dashboard/billing/profile
 * (wantsTaxInvoice). Uses CSS-var primary tokens so re-theming flows through
 * automatically.
 */
export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = "md",
  ariaLabel,
}: ToggleSwitchProps): React.ReactNode {
  const dims = size === "sm"
    ? { track: "h-5 w-9", thumb: "h-4 w-4", on: "translate-x-4", off: "translate-x-0.5" }
    : { track: "h-6 w-11", thumb: "h-5 w-5", on: "translate-x-5", off: "translate-x-0.5" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex ${dims.track} items-center rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
        checked ? "bg-(--primary)" : "bg-slate-300"
      }`}
    >
      <span className={`inline-block ${dims.thumb} transform rounded-full bg-white shadow-sm transition-transform ${checked ? dims.on : dims.off}`} />
    </button>
  );
}
