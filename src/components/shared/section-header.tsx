import { IconWrapper } from "./icon-wrapper";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  variant?: "bar" | "icon";
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  variant = "bar",
}: SectionHeaderProps): React.ReactNode {
  if (variant === "icon" && icon) {
    return (
      <div className="flex items-center gap-3">
        <IconWrapper icon={icon} size="md" />
        <div>
          <h3 className="text-lg font-bold text-(--on-surface)">{title}</h3>
          {subtitle && <p className="text-sm text-(--on-surface-variant)">{subtitle}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 rounded-full bg-(--primary)" />
        <h2 className="text-base font-bold text-(--on-surface)">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-(--on-surface-variant) ml-4">{subtitle}</p>}
    </div>
  );
}
