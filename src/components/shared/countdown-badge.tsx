"use client";

import { useEffect, useState } from "react";
import { getDaysUntil } from "@/lib/trip-utils";

type CountdownBadgeProps = {
  startDate: string;
  endDate: string;
};

export function CountdownBadge({ startDate, endDate }: CountdownBadgeProps): React.JSX.Element {
  const [daysUntil, setDaysUntil] = useState(getDaysUntil(startDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setDaysUntil(getDaysUntil(startDate));
    }, 60000);
    return () => clearInterval(timer);
  }, [startDate]);

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now > end) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        <span>ทริปจบแล้ว</span>
      </div>
    );
  }

  if (now >= start && now <= end) {
    const currentDay = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-success/90 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm">
        <span>Day {currentDay} of {totalDays} — วันนี้!</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm">
      <span>อีก {daysUntil} วัน! 🎉</span>
    </div>
  );
}
