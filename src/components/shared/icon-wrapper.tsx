interface IconWrapperProps {
  icon: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  filled?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { wrapper: "w-8 h-8 rounded-lg", icon: "text-lg" },
  md: { wrapper: "w-10 h-10 rounded-xl", icon: "text-xl" },
  lg: { wrapper: "w-12 h-12 rounded-2xl", icon: "text-3xl" },
};

export function IconWrapper({
  icon,
  color = "bg-(--primary)/10 text-(--primary)",
  size = "md",
  filled = false,
  className = "",
}: IconWrapperProps): React.ReactNode {
  const s = sizeMap[size];
  return (
    <div className={`${s.wrapper} flex items-center justify-center ${color} ${className}`}>
      <span
        className={`material-symbols-outlined ${s.icon}`}
        style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
    </div>
  );
}
