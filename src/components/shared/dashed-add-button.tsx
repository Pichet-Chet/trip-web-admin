"use client";

interface DashedAddButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DashedAddButton({
  children,
  onClick,
  className = "",
}: DashedAddButtonProps): React.ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-4 border-2 border-dashed border-(--primary)/30 rounded-xl text-xs font-bold text-(--primary) uppercase tracking-widest hover:bg-(--primary)/5 transition-all flex items-center justify-center gap-2 ${className}`}
    >
      <span className="material-symbols-outlined text-sm">add_circle</span>
      {children}
    </button>
  );
}
