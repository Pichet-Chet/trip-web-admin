"use client";

import { FormInput, IconButton, DatePicker, TimePicker } from "@/components/shared";
import type { Accommodation } from "@/types";

interface HotelCardProps {
  hotel: Accommodation;
  index: number;
  showRemove: boolean;
  /** Trip-level date bounds — passed to date pickers as min/max. */
  startDate: string;
  endDate: string;
  onUpdate: (patch: Partial<Accommodation>) => void;
  onRemove: () => void;
}

export function HotelCard({
  hotel, index, showRemove, startDate, endDate, onUpdate, onRemove,
}: HotelCardProps): React.ReactNode {
  const checkInDate = hotel.checkIn?.split("T")[0] || "";
  const checkInTime = hotel.checkIn?.includes("T") ? hotel.checkIn.split("T")[1] : "";
  const checkOutDate = hotel.checkOut?.split("T")[0] || "";
  const checkOutTime = hotel.checkOut?.includes("T") ? hotel.checkOut.split("T")[1] : "";

  // Derived: nights inferred from check-in / check-out dates so the
  // operator doesn't have to keep them in sync manually.
  const nightsCount =
    checkInDate && checkOutDate
      ? Math.max(0, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000))
      : 0;

  return (
    <div className="bg-white p-5 md:p-7 rounded-3xl border border-(--outline-variant)/30 shadow-sm space-y-5 relative">
      {showRemove && (
        <div className="absolute top-4 right-4">
          <IconButton icon="close" variant="danger" size="sm" onClick={onRemove} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-(--on-surface-variant) bg-(--surface-container-low) px-2.5 py-1 rounded-full">
          ที่พัก {index + 1}
        </span>
      </div>
      <FormInput label="ชื่อที่พัก" placeholder="ชื่อโรงแรม / รีสอร์ท" value={hotel.name} onChange={(e) => onUpdate({ name: e.target.value })} />
      <FormInput label="ที่อยู่" placeholder="ที่อยู่โรงแรม" icon="location_on" value={hotel.address} onChange={(e) => onUpdate({ address: e.target.value })} />
      <FormInput label="เบอร์โทร" placeholder="เบอร์โทรโรงแรม" type="tel" icon="call" value={hotel.phone} onChange={(e) => onUpdate({ phone: e.target.value })} />

      {/* Check-in: วันที่ + เวลา */}
      <div>
        <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">เช็คอิน</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <DatePicker placeholder="วันที่เข้า" min={startDate} max={endDate} value={checkInDate} onChange={(v) => onUpdate({ checkIn: v })} />
          </div>
          <div className="relative">
            <TimePicker placeholder="เวลา" value={checkInTime} onChange={(v) => onUpdate({ checkIn: checkInDate ? `${checkInDate}T${v}` : v })} />
          </div>
        </div>
      </div>

      {/* Check-out: วันที่ + เวลา */}
      <div>
        <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">เช็คเอาท์</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <DatePicker placeholder="วันที่ออก" min={checkInDate || startDate} max={endDate} value={checkOutDate} onChange={(v) => onUpdate({ checkOut: v })} />
          </div>
          <div className="relative">
            <TimePicker placeholder="เวลา" value={checkOutTime} onChange={(v) => onUpdate({ checkOut: checkOutDate ? `${checkOutDate}T${v}` : v })} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1 text-xs text-(--on-surface-variant)">
        <span className="material-symbols-outlined text-sm">info</span>
        <span>
          {nightsCount > 0
            ? `รวม ${nightsCount} คืน (คำนวณจากวันเช็คอิน — เช็คเอาท์)`
            : "จำนวนคืนจะคำนวณอัตโนมัติจากวันเช็คอิน — เช็คเอาท์"}
        </span>
      </div>
    </div>
  );
}
