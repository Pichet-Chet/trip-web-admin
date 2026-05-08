"use client";

import { useState } from "react";
import { IconWrapper } from "@trip/ui";

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  subtitle?: string;
  /** Badge text shown in header when collapsed (e.g. "2 ที่พัก") */
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  subtitle,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border border-(--outline-variant)/30 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-5 text-left transition-colors"
        aria-expanded={open}
      >
        <IconWrapper icon={icon} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-(--on-surface)">{title}</h3>
            {!open && summary && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-(--primary)/10 text-(--primary)">
                {summary}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-(--on-surface-variant) mt-0.5">{subtitle}</p>
          )}
        </div>
        <span
          className="material-symbols-outlined text-xl text-(--on-surface-variant) transition-transform duration-200 shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      {open && <div className="px-6 pb-6 pt-2 space-y-6">{children}</div>}
    </div>
  );
}
