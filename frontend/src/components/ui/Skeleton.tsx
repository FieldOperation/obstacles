import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx('animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700', className)}
      aria-hidden
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card card-body space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th><Skeleton className="h-4 w-20" /></th>
            <th><Skeleton className="h-4 w-16" /></th>
            <th><Skeleton className="h-4 w-24" /></th>
            <th><Skeleton className="h-4 w-20" /></th>
            <th><Skeleton className="h-4 w-24" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td><Skeleton className="h-4 w-24" /></td>
              <td><Skeleton className="h-6 w-16 rounded-full" /></td>
              <td><Skeleton className="h-4 w-32" /></td>
              <td><Skeleton className="h-4 w-20" /></td>
              <td><Skeleton className="h-4 w-16" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
