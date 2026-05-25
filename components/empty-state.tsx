import { SUGGESTED_DOMAINS } from "@/lib/mock-data";

export function EmptyState({
  onPick,
}: {
  onPick: (domain: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          how it works
        </p>
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          Enter any website URL. Undocd checks its open-source database, and if
          the site has not been scanned yet, an AI scanner discovers public API
          endpoints, saves them, and shares them with everyone.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          try one
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onPick(d)}
              className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
