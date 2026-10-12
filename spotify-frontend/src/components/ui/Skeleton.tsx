import { cn } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded bg-[linear-gradient(90deg,var(--bg-highlight)_25%,var(--bg-highlight-hover)_50%,var(--bg-highlight)_75%)]",
        "bg-[length:200%_100%]",
        className
      )}
    />
  );
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Skeleton className="h-12 w-12 shrink-0 rounded-sm" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function TrackCardSkeleton() {
  return (
    <div className="w-40 shrink-0 space-y-3 md:w-[200px]">
      <Skeleton className="aspect-square w-full rounded" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function ShelfSkeleton() {
  return (
    <section className="space-y-3 px-4 md:px-6">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-4">
        {[...Array(5)].map((_, i) => (
          <TrackCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
