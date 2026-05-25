import { EndpointCard } from "@/components/endpoint-card";
import type { DomainResult } from "@/lib/mock-data";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function ResultsList({ result }: { result: DomainResult }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
        <span>
          {result.cached ? "cached" : "fresh scan"} · {result.endpoints.length}{" "}
          endpoint{result.endpoints.length === 1 ? "" : "s"}
        </span>
        <span>scanned {timeAgo(result.lastScanned)}</span>
      </div>

      <div className="flex flex-col gap-2">
        {result.endpoints.map((e) => (
          <EndpointCard key={`${e.method}-${e.url}`} endpoint={e} />
        ))}
      </div>
    </div>
  );
}

export function NoResults({ domain }: { domain: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-card/50 px-4 py-6 text-center">
      <p className="font-mono text-[12px] text-muted-foreground">
        no endpoints found for{" "}
        <span className="text-foreground">{domain}</span>
      </p>
      <p className="text-[12px] text-muted-foreground">
        Try another URL, or check back later — this site has not been scanned
        yet.
      </p>
    </div>
  );
}
