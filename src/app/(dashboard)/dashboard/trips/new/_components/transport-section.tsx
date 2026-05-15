"use client";

import { FormInput, DashedAddButton, IconButton, DatePicker, TimePicker } from "@/components/shared";
import { airportTimezone, utcOffsetLabel } from "@/lib/airport-timezone";

export type TransportType = "flight" | "van" | "bus" | "train" | "boat" | "car";

export type TransportSegment = {
  /** Local-only key for React/list ops. */
  id: string;
  /** Server-assigned id. Absent until the row has been saved to DB. */
  serverId?: string;
  type: TransportType;
  direction: "outbound" | "return";
  from: string;
  fromDetail: string;
  to: string;
  toDetail: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  // Flight-specific
  airline: string;
  flightNumber: string;
  bookingRef: string;
  baggage: string;
  // General
  operator: string;
  vehicleInfo: string;
  meetingPoint: string;
  note: string;
};

export const transportOptions: { value: TransportType; label: string; icon: string }[] = [
  { value: "flight", label: "เครื่องบิน", icon: "flight" },
  { value: "van", label: "รถตู้", icon: "airport_shuttle" },
  { value: "bus", label: "รถบัส", icon: "directions_bus" },
  { value: "train", label: "รถไฟ", icon: "train" },
  { value: "boat", label: "เรือ", icon: "directions_boat" },
  { value: "car", label: "รถยนต์", icon: "directions_car" },
];

export function makeSegment(direction: "outbound" | "return", type: TransportType = "flight"): TransportSegment {
  return {
    id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, direction, from: "", fromDetail: "", to: "", toDetail: "",
    departureDate: "", departureTime: "", arrivalDate: "", arrivalTime: "",
    airline: "", flightNumber: "", bookingRef: "", baggage: "",
    operator: "", vehicleInfo: "", meetingPoint: "", note: "",
  };
}

const isFlight = (t: TransportType): boolean => t === "flight";
const fromLabel = (t: TransportType): string =>
  isFlight(t) ? "สนามบิน" : t === "train" ? "สถานี" : t === "boat" ? "ท่าเรือ" : "จุดขึ้นรถ";
const toLabel = (t: TransportType): string =>
  isFlight(t) ? "สนามบิน" : t === "train" ? "สถานี" : t === "boat" ? "ท่าเรือ" : "จุดลงรถ";

interface TransportSectionProps {
  label: string;
  icon: string;
  segments: TransportSegment[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<TransportSegment>) => void;
}

export function TransportSection({
  label, icon, segments, onAdd, onRemove, onUpdate,
}: TransportSectionProps): React.ReactNode {
  return (
    <div className="bg-white p-5 md:p-7 rounded-3xl border border-(--outline-variant)/30 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-(--primary)">{icon}</span>
        <h4 className="text-sm font-bold text-(--on-surface)">{label}</h4>
      </div>

      {segments.map((seg) => (
        <div key={seg.id} className="space-y-4 py-4 border-t border-(--outline-variant)/20 first:border-0 first:pt-0">
          {/* Transport type selector + remove */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 p-0.5 bg-(--surface-container-low) rounded-xl overflow-x-auto scrollbar-hide">
              {transportOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate(seg.id, { type: opt.value })}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    seg.type === opt.value
                      ? "bg-white shadow-sm text-(--primary)"
                      : "text-(--on-surface-variant) hover:text-(--on-surface)"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{opt.icon}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
            {segments.length > 1 && (
              <IconButton icon="delete" variant="danger" size="sm" onClick={() => onRemove(seg.id)} />
            )}
          </div>

          {/* Route: FROM → TO */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FormInput label={`${fromLabel(seg.type)}ต้นทาง`} placeholder={isFlight(seg.type) ? "รหัส 3 ตัว เช่น BKK" : "ชื่อจุดต้นทาง"} value={seg.from} onChange={(e) => onUpdate(seg.id, { from: e.target.value })} />
              {isFlight(seg.type) && <div className="mt-2"><FormInput placeholder="Terminal (ถ้ามี)" value={seg.fromDetail} onChange={(e) => onUpdate(seg.id, { fromDetail: e.target.value })} /></div>}
            </div>
            <div className="pt-6 text-(--outline) shrink-0">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
            <div className="flex-1">
              <FormInput label={`${toLabel(seg.type)}ปลายทาง`} placeholder={isFlight(seg.type) ? "รหัส 3 ตัว เช่น NRT" : "ชื่อจุดปลายทาง"} value={seg.to} onChange={(e) => onUpdate(seg.id, { to: e.target.value })} />
              {isFlight(seg.type) && <div className="mt-2"><FormInput placeholder="Terminal (ถ้ามี)" value={seg.toDetail} onChange={(e) => onUpdate(seg.id, { toDetail: e.target.value })} /></div>}
            </div>
          </div>

          {/* Operator info — different per type */}
          {isFlight(seg.type) ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="สายการบิน" placeholder="ชื่อสายการบิน" icon="flight" value={seg.airline} onChange={(e) => onUpdate(seg.id, { airline: e.target.value })} />
                <FormInput label="เที่ยวบิน" placeholder="เลขเที่ยวบิน" icon="confirmation_number" value={seg.flightNumber} onChange={(e) => onUpdate(seg.id, { flightNumber: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="รหัสจอง (PNR)" placeholder="รหัสจองจากสายการบิน" icon="bookmark" value={seg.bookingRef} onChange={(e) => onUpdate(seg.id, { bookingRef: e.target.value })} />
                <FormInput label="น้ำหนักกระเป๋า" placeholder="โหลด / ถือขึ้นเครื่อง" icon="luggage" value={seg.baggage} onChange={(e) => onUpdate(seg.id, { baggage: e.target.value })} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FormInput label={seg.type === "train" ? "ขบวนรถไฟ" : seg.type === "boat" ? "ชื่อเรือ/บริษัท" : "บริษัท/ผู้ให้บริการ"} placeholder={seg.type === "van" ? "ชื่อบริษัทรถตู้" : seg.type === "train" ? "หมายเลขขบวน" : seg.type === "boat" ? "ชื่อเรือ" : "ชื่อผู้ให้บริการ"} icon={transportOptions.find((o) => o.value === seg.type)?.icon ?? "info"} value={seg.operator} onChange={(e) => onUpdate(seg.id, { operator: e.target.value })} />
              <FormInput label={seg.type === "car" ? "ทะเบียนรถ" : "รหัสจอง/หมายเลข"} placeholder={seg.type === "car" ? "เลขทะเบียน" : "รหัสจอง (ถ้ามี)"} icon="tag" value={seg.vehicleInfo} onChange={(e) => onUpdate(seg.id, { vehicleInfo: e.target.value })} />
            </div>
          )}

          {/* Departure datetime */}
          <div>
            <div className="flex items-center gap-2 px-1 mb-2">
              <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest">ออกเดินทาง</p>
              {isFlight(seg.type) && seg.from && airportTimezone(seg.from) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-(--surface-variant) text-(--on-surface-variant)">
                  {seg.from.toUpperCase()} · {utcOffsetLabel(airportTimezone(seg.from)!)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <DatePicker placeholder="วันที่" value={seg.departureDate} onChange={(v) => onUpdate(seg.id, { departureDate: v })} />
              </div>
              <div className="relative">
                <TimePicker placeholder="เวลา" value={seg.departureTime} onChange={(v) => onUpdate(seg.id, { departureTime: v })} />
              </div>
            </div>
          </div>

          {/* Arrival datetime */}
          <div>
            <div className="flex items-center gap-2 px-1 mb-2">
              <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest">ถึงปลายทาง</p>
              {isFlight(seg.type) && seg.to && airportTimezone(seg.to) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-(--surface-variant) text-(--on-surface-variant)">
                  {seg.to.toUpperCase()} · {utcOffsetLabel(airportTimezone(seg.to)!)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <DatePicker placeholder="วันที่" value={seg.arrivalDate} onChange={(v) => onUpdate(seg.id, { arrivalDate: v })} />
              </div>
              <div className="relative">
                <TimePicker placeholder="เวลา" value={seg.arrivalTime} onChange={(v) => onUpdate(seg.id, { arrivalTime: v })} />
              </div>
            </div>
          </div>

          {/* Meeting point + Note */}
          <FormInput label="จุดนัดพบ" placeholder="สถานที่และเวลานัดพบ" icon="groups" value={seg.meetingPoint} onChange={(e) => onUpdate(seg.id, { meetingPoint: e.target.value })} />
          <FormInput label="หมายเหตุ" placeholder="ข้อความเพิ่มเติม (ถ้ามี)" icon="info" value={seg.note} onChange={(e) => onUpdate(seg.id, { note: e.target.value })} />
        </div>
      ))}

      <DashedAddButton onClick={onAdd}>เพิ่มช่วงการเดินทาง</DashedAddButton>
    </div>
  );
}
