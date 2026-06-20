import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-6 space-y-3", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-6 space-y-4", className)}>
      <Skeleton className="h-4 w-1/4" />
      <div className="h-64 skeleton rounded-xl" />
    </div>
  );
}
