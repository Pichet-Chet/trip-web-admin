interface StatItem {
  value: string | number;
  label: string;
}

interface StatsSummaryProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsSummary({
  stats,
  columns = 3,
  className = "",
}: StatsSummaryProps): React.ReactNode {
  return (
    <div className={`grid grid-cols-${columns} gap-4 text-center ${className}`}>
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="text-2xl font-black text-(--on-surface)">{stat.value}</p>
          <p className="text-[10px] text-(--on-surface-variant) font-semibold uppercase">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
