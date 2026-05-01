"use client";

import { FormInput, IconButton } from "@/components/shared";

export type EmergencyContactRow = {
  serverId?: string;
  name: string;
  phone: string;
  /** Operator-facing hint (e.g. "กรอกเบอร์ตามประเทศปลายทาง"). Not persisted. */
  note: string;
};

interface EmergencyContactCardProps {
  contact: EmergencyContactRow;
  showRemove: boolean;
  onUpdate: (patch: Partial<EmergencyContactRow>) => void;
  onRemove: () => void;
}

export function EmergencyContactCard({
  contact, showRemove, onUpdate, onRemove,
}: EmergencyContactCardProps): React.ReactNode {
  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-(--outline-variant)/30 shadow-sm">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
          <span className="material-symbols-outlined">emergency</span>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            label="ชื่อ / หน่วยงาน"
            placeholder="เช่น สถานทูตไทย โตเกียว"
            value={contact.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
          <FormInput
            label="เบอร์โทร"
            placeholder="เช่น +81-3-2207-9100"
            type="tel"
            icon="call"
            value={contact.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
          />
        </div>
        {showRemove && (
          <IconButton icon="close" variant="danger" size="sm" onClick={onRemove} />
        )}
      </div>
      {contact.note && (
        <p className="text-[11px] text-amber-600 mt-2 ml-13 pl-0.5">{contact.note}</p>
      )}
    </div>
  );
}
