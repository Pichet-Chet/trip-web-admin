"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, onMenuClick, actions }: HeaderProps): React.ReactNode {
  return (
    <header className="sticky top-0 z-30 h-16 bg-(--surface-container-lowest)/80 backdrop-blur-xl border-b border-(--outline-variant)/20 flex items-center gap-4 px-4 md:px-8">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 rounded-lg hover:bg-(--surface-variant)/50 transition-colors"
      >
        <span className="material-symbols-outlined text-(--on-surface)">menu</span>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-(--on-surface) truncate">{title}</h1>
        {subtitle && <p className="text-xs text-(--on-surface-variant) truncate">{subtitle}</p>}
      </div>

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Search (desktop) */}
      <div className="hidden md:flex items-center gap-2 bg-(--surface-container-low) rounded-xl px-4 py-2.5 w-64">
        <span className="material-symbols-outlined text-(--outline) text-xl">search</span>
        <input
          type="text"
          placeholder="ค้นหาทริป..."
          className="bg-transparent text-sm text-(--on-surface) placeholder:text-(--outline)/50 outline-none w-full"
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-(--surface-variant)/50 transition-colors">
        <span className="material-symbols-outlined text-(--on-surface-variant)">notifications</span>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-(--primary) rounded-full" />
      </button>
    </header>
  );
}
