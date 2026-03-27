import { IconWrapper } from "./icon-wrapper";

interface StatCardProps {
  icon: string;
  iconColor?: string;
  title: string;
  value: string | number;
  limit?: number;
  suffix?: string;
  children?: React.ReactNode;
}

export function StatCard({
  icon,
  iconColor = "bg-(--primary)/10 text-(--primary)",
  title,
  value,
  limit,
  suffix,
  children,
}: StatCardProps): React.ReactNode {
  const pct = limit ? Math.round((Number(value) / limit) * 100) : 0;

  return (
    <div className="bg-(--surface-container-lowest) rounded-2xl p-6 border border-(--outline-variant)/10">
      <div className="flex items-center gap-3 mb-4">
        <IconWrapper icon={icon} color={iconColor} size="md" />
        <h3 className="font-semibold text-(--on-surface)">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-(--on-surface)">
        {value}
        {limit != null && (
          <span className="text-sm font-normal text-(--on-surface-variant)"> / {limit}</span>
        )}
        {suffix && (
          <span className="text-sm font-normal text-(--on-surface-variant)"> {suffix}</span>
        )}
      </p>
      {limit != null && (
        <div className="h-2 rounded-full bg-slate-100 mt-3">
          <div
            className="h-full rounded-full bg-(--primary) transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
