"use client";

import { cn, getDayGradientClass, formatDateShort, detectMapProviderFromActivities, buildRouteUrl, getRouteButtonLabel } from "@/lib/trip-utils";

import { ActivityItem } from "@/components/shared/activity-item";
import type { Day } from "@/lib/types/trip";

type DayCardProps = {
  day: Day;
};

export function DayCard({ day }: DayCardProps): React.JSX.Element {
  const gradientClass = getDayGradientClass(day.dayNumber);

  const activitiesWithMaps = day.activities.filter((a) => a.mapsLink);
  const provider = detectMapProviderFromActivities(activitiesWithMaps);
  const places = activitiesWithMaps.map((a) => a.placeName);
  const routeUrl = buildRouteUrl(places, provider);

  return (
    <div id={`day-${day.dayNumber}`} className="scroll-mt-16">
      {/* Day header */}
      <div className={cn("relative overflow-hidden rounded-t-2xl", gradientClass)}>
        {day.coverImageUrl && (
          <img
            src={day.coverImageUrl}
            alt={day.title}
            className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
          />
        )}
        <div className="relative px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/70">
                Day {day.dayNumber} — {formatDateShort(day.date)}
              </p>
              <h3 className="mt-0.5 text-lg font-bold text-white">
                {day.subtitle} {day.title}
              </h3>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
              {day.activities.length} กิจกรรม
            </span>
          </div>
        </div>
      </div>

      {/* Activities list */}
      <div className="space-y-3 rounded-b-2xl border border-t-0 border-border bg-guest-card-bg p-4">
        {day.activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}

        {/* Route link */}
        {routeUrl && (
          <a
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary-50 py-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary-100"
          >
            <span className="material-symbols-outlined text-sm">map</span>
            {getRouteButtonLabel(provider)}
          </a>
        )}
      </div>
    </div>
  );
}
