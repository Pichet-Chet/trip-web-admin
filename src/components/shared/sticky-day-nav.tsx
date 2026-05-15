"use client";

import { useRef } from "react";
import { cn } from "@/lib/trip-utils";
import type { Day } from "@/lib/mock-data";

type StickyDayNavProps = {
  days: Day[];
  activeDay: number;
  onDayClick: (dayNumber: number) => void;
};

export function StickyDayNav({ days, activeDay, onDayClick }: StickyDayNavProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-sm">
      <div
        ref={scrollRef}
        className="hide-scrollbar flex gap-1 overflow-x-auto px-4 py-2"
      >
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => onDayClick(day.dayNumber)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
              activeDay === day.dayNumber
                ? "bg-primary text-white shadow-md"
                : "bg-muted text-muted-foreground hover:bg-primary-100 hover:text-primary",
            )}
          >
            <span className="mr-1">{day.subtitle.split(" ")[0]}</span>
            <span>D{day.dayNumber}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
