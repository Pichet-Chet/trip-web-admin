"use client";

import { IconButton } from "@/components/shared";

export type ChecklistRow = {
  serverId?: string;
  label: string;
  isRequired: boolean;
};

interface ChecklistItemCardProps {
  item: ChecklistRow;
  onUpdate: (patch: Partial<ChecklistRow>) => void;
  onRemove: () => void;
}

export function ChecklistItemCard({ item, onUpdate, onRemove }: ChecklistItemCardProps): React.ReactNode {
  return (
    <div className="flex items-center gap-3 bg-white p-3 md:p-4 rounded-2xl border border-(--outline-variant)/30 shadow-sm">
      <div className="w-8 h-8 rounded-lg bg-(--surface-variant) flex items-center justify-center shrink-0 text-(--on-surface-variant)">
        <span className="material-symbols-outlined text-base">checklist</span>
      </div>
      <input
        type="text"
        className="flex-1 bg-transparent text-sm text-(--on-surface) placeholder:text-(--on-surface-variant)/60 outline-none min-w-0"
        placeholder="รายการที่ต้องเตรียม..."
        value={item.label}
        maxLength={256}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <button
        type="button"
        onClick={() => onUpdate({ isRequired: !item.isRequired })}
        className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
          item.isRequired
            ? "bg-(--error-container) text-(--on-error-container)"
            : "bg-(--surface-variant) text-(--on-surface-variant) hover:bg-(--secondary-container) hover:text-(--on-secondary-container)"
        }`}
      >
        {item.isRequired ? "จำเป็น" : "แนะนำ"}
      </button>
      <IconButton icon="close" variant="danger" size="sm" onClick={onRemove} />
    </div>
  );
}
