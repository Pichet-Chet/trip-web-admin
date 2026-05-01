"use client";

import Link from "next/link";
import { ImageUpload, IconWrapper, StatsSummary } from "@/components/shared";

export interface AccommodationLite {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  checkIn: string | null;
  checkOut: string | null;
}

interface DayContextPanelProps {
  coverImageUrl: string | null;
  /** Trip start date (yyyy-mm-dd). Used to derive which calendar date the
      currently-active day represents, so we can match accommodation
      check-in / check-out / staying status against it. */
  tripStartDate: string;
  activeDayIndex: number;
  accommodations: AccommodationLite[];
  /** Trip id — link "edit accommodations" jumps back to the basics step. */
  tripId: string;
  totalTripDays: number;
  daysCount: number;
  totalActivities: number;
  /** Days with zero activities — drives the progress hint. */
  emptyDaysCount: number;
  travelersCount: number;
  onCoverChange: (url: string | null) => void;
}

const TIME_FROM_ISO = (dt: string | null): string => {
  if (!dt || !dt.includes("T")) return "";
  return dt.split("T")[1]?.slice(0, 5) || "";
};

export function DayContextPanel({
  coverImageUrl, tripStartDate, activeDayIndex, accommodations, tripId,
  totalTripDays, daysCount, totalActivities, emptyDaysCount, travelersCount, onCoverChange,
}: DayContextPanelProps): React.ReactNode {
  const dayDate = tripStartDate
    ? new Date(new Date(tripStartDate).getTime() + activeDayIndex * 86400000)
    : null;
  const dayStr = dayDate?.toISOString().split("T")[0] ?? "";

  // Bucket accommodations into the three states this UI cares about.
  const checkIns = dayDate ? accommodations.filter((a) => a.checkIn?.split("T")[0] === dayStr) : [];
  const checkOuts = dayDate ? accommodations.filter((a) => a.checkOut?.split("T")[0] === dayStr) : [];
  const staying = dayDate
    ? accommodations.filter((acc) => {
        const ci = acc.checkIn ? new Date(acc.checkIn.split("T")[0]) : null;
        const co = acc.checkOut ? new Date(acc.checkOut.split("T")[0]) : null;
        if (!ci) return false;
        return dayDate > ci && (!co || dayDate < co);
      })
    : [];

  type AccomStatus = "check-in" | "check-out" | "staying";
  const entries: { acc: AccommodationLite; status: AccomStatus }[] = [
    ...checkOuts.map((acc) => ({ acc, status: "check-out" as const })),
    ...checkIns.map((acc) => ({ acc, status: "check-in" as const })),
    ...staying.map((acc) => ({ acc, status: "staying" as const })),
  ];

  const statusConfig: Record<AccomStatus, { label: string; icon: string; timeFn: (a: AccommodationLite) => string }> = {
    "check-in": { label: "เช็คอิน", icon: "login", timeFn: (a) => TIME_FROM_ISO(a.checkIn) },
    "check-out": { label: "เช็คเอาท์", icon: "logout", timeFn: (a) => TIME_FROM_ISO(a.checkOut) },
    "staying": { label: "พักต่อเนื่อง", icon: "bed", timeFn: () => "" },
  };

  return (
    <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-36">
      <ImageUpload
        value={coverImageUrl ?? ""}
        onChange={onCoverChange}
        uploadUrl={`/admin/media/upload?folder=day-covers`}
        folder="day-covers"
        label="ภาพปกประจำวัน"
        hint="แนะนำ 1920x1080 px"
        aspect="video"
      />

      {entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <IconWrapper icon="hotel" size="sm" />
              <h4 className="text-sm font-bold text-(--on-surface)">ที่พักวันนี้</h4>
            </div>
            <Link
              href={`/dashboard/trips/new?id=${tripId}`}
              className="text-[11px] font-bold text-(--primary) hover:underline shrink-0"
              title="แก้ไขข้อมูลที่พัก (กลับสู่ขั้นตอนข้อมูลทริป)"
            >
              แก้ไข
            </Link>
          </div>
          <div className="space-y-3">
            {entries.map(({ acc, status }) => {
              const cfg = statusConfig[status];
              const time = cfg.timeFn(acc);
              return (
                <div key={`${status}-${acc.id}`} className="bg-(--surface-container-low) rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-(--on-surface) truncate">{acc.name}</p>
                      {acc.address && <p className="text-xs text-(--on-surface-variant) mt-0.5 truncate">{acc.address}</p>}
                      {acc.phone && <p className="text-xs text-(--on-surface-variant) truncate">{acc.phone}</p>}
                    </div>
                    <span className="material-symbols-outlined text-(--on-surface-variant) text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-(--outline-variant)/20">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      status === "check-in"
                        ? "bg-(--primary-container) text-(--on-primary-container)"
                        : "bg-(--surface-variant) text-(--on-surface-variant)"
                    }`}>
                      <span className="material-symbols-outlined text-xs">{cfg.icon}</span>
                      {cfg.label}
                    </span>
                    {time && (
                      <span className="text-xs text-(--on-surface-variant) font-medium">
                        {time} น.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-(--on-surface-variant)">สรุปทริป</h4>
        <StatsSummary stats={[
          { value: totalTripDays || daysCount, label: "วัน" },
          { value: totalActivities, label: "กิจกรรม" },
          { value: travelersCount, label: "ผู้เดินทาง" },
        ]} />

        {/* Progress hint — at-a-glance "how close to done" without the
            operator clicking through each day. Hidden once everything's
            filled to keep the panel quiet. */}
        {daysCount > 0 && emptyDaysCount > 0 && (
          <div className="flex items-start gap-2 pt-3 border-t border-(--outline-variant)/20">
            <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">pending_actions</span>
            <div className="flex-1 text-xs">
              <p className="font-bold text-amber-700">
                ยังไม่มีกิจกรรม {emptyDaysCount} จาก {daysCount} วัน
              </p>
              <p className="text-(--on-surface-variant) mt-0.5">วันที่ว่างจะถูกแสดงด้วยจุดสีอำพันบนแท็บด้านบน</p>
            </div>
          </div>
        )}
        {daysCount > 0 && emptyDaysCount === 0 && totalActivities > 0 && (
          <div className="flex items-start gap-2 pt-3 border-t border-(--outline-variant)/20">
            <span className="material-symbols-outlined text-emerald-600 text-base mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="flex-1 text-xs font-bold text-emerald-700">ทุกวันมีกิจกรรมครบแล้ว</p>
          </div>
        )}
      </div>
    </div>
  );
}
