import { cn } from "@/lib/trip-utils";

type InfoBadgeProps = {
  icon: string;
  label: string;
  className?: string;
};

export function InfoBadge({ icon, label, className }: InfoBadgeProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "glass-card inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white",
        className,
      )}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
