import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Scanning for endpoints">
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-foreground" />
        scanning network requests...
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-md border border-border/80 bg-card px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Skeleton className="h-6 w-12 rounded-md" />
              <Skeleton className="h-4 flex-1 max-w-[60%]" />
            </div>
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
