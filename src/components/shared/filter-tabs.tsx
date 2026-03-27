"use client";

interface FilterTabsProps<T extends string> {
  tabs: { value: T; label: string; emoji?: string }[];
  active: T;
  onChange: (value: T) => void;
  variant?: "pill" | "subtle";
  className?: string;
}

export function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = "pill",
  className = "",
}: FilterTabsProps<T>): React.ReactNode {
  const containerCls = variant === "pill"
    ? "flex gap-1 p-1 bg-(--surface-container-low) rounded-full overflow-x-auto max-w-full scrollbar-hide"
    : "flex gap-1.5 p-1 bg-(--surface-variant)/50 border border-(--outline-variant) rounded-xl overflow-x-auto scrollbar-hide";

  const activeCls = variant === "pill"
    ? "bg-white text-(--primary) shadow-sm"
    : "bg-white text-(--on-surface) shadow-sm border border-(--outline-variant)";

  const inactiveCls = variant === "pill"
    ? "text-(--on-surface-variant) hover:text-(--primary)"
    : "text-(--on-surface-variant) hover:bg-white/50";

  return (
    <div className={`${containerCls} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 md:px-6 py-2.5 ${variant === "pill" ? "rounded-full" : "rounded-lg"} font-bold text-xs md:text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${active === tab.value ? activeCls : inactiveCls}`}
        >
          {tab.label}
          {tab.emoji && <span className="text-base">{tab.emoji}</span>}
        </button>
      ))}
    </div>
  );
}
