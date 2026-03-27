interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps): React.ReactNode {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

export function CardSkeleton(): React.ReactNode {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <Skeleton className="h-44 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function TableRowSkeleton(): React.ReactNode {
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function PageSkeleton(): React.ReactNode {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
