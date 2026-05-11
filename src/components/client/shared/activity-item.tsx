import { cn, detectMapProvider, getMapButtonLabel, getActivityTypeStyle } from "@/lib/trip-utils";
// Inline SVG icon (lucide-react not available in trip-web-admin)
function MapPin({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
import type { Activity } from "@/lib/mock-data";

type ActivityItemProps = {
  activity: Activity;
};

export function ActivityItem({ activity }: ActivityItemProps): React.JSX.Element {
  const typeStyle = getActivityTypeStyle(activity.type);
  return (
    <div
      className={cn(
        "relative flex gap-3 rounded-xl border bg-white p-4 transition-all",
        activity.isNew && "border-success/50 bg-success/5",
        activity.isChanged && "border-warning/50 bg-warning-light/30",
        (activity.isNew || activity.isChanged) && "activity-highlight",
      )}
    >
      {/* Time badge */}
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-2xl">{activity.emoji}</span>
        <span className={cn("mt-1 rounded-md px-2 py-0.5 text-xs font-bold", typeStyle.bg, typeStyle.text)}>
          {activity.time}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-foreground">{activity.name}</h4>
          <div className="flex shrink-0 gap-1">
            {activity.isNew && (
              <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-white">
                NEW
              </span>
            )}
            {activity.isChanged && (
              <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-white">
                แก้ไข
              </span>
            )}
          </div>
        </div>
        {activity.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {activity.description}
          </p>
        )}
        {activity.mapsLink && (
          <a
            href={activity.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <MapPin className="h-3 w-3" />
            {getMapButtonLabel(detectMapProvider(activity.mapsLink))}
          </a>
        )}
      </div>

      {/* Activity image */}
      {activity.imageUrl && (
        <div className="hidden shrink-0 sm:block">
          <img
            src={activity.imageUrl}
            alt={activity.name}
            className="h-20 w-20 rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
}
