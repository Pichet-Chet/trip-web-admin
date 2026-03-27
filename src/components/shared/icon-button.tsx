"use client";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md";
}

const variants = {
  default: "bg-(--surface-container-low) text-(--on-surface-variant) hover:bg-(--surface-variant)",
  primary: "bg-(--surface-container-low) text-(--primary) hover:bg-(--primary) hover:text-white",
  danger: "bg-(--surface-container-low) text-(--on-surface-variant) hover:bg-red-50 hover:text-red-600",
};

const sizes = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
};

export function IconButton({
  icon,
  variant = "default",
  size = "md",
  className = "",
  ...props
}: IconButtonProps): React.ReactNode {
  return (
    <button
      className={`${sizes[size]} rounded-full flex items-center justify-center transition-all shadow-sm ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}
