"use client";

import { useState } from "react";
import { EndpointCard } from "@/components/endpoint-card";
import type { DomainResult } from "@/lib/types";

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

type QueueState =
  | { kind: "idle" }
  | { kind: "queueing" }
  | { kind: "queued"; position: number; alreadyQueued: boolean }
  | { kind: "error"; message: string };

export function NoResults({ domain }: { domain: string }) {
  const [state, setState] = useState<QueueState>({ kind: "idle" });

  async function requestScan() {
    setState({ kind: "queueing" });
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: domain }),
      });
      const body = (await res.json()) as {
        error?: string;
        position?: number;
        alreadyQueued?: boolean;
      };
      if (!res.ok) {
        setState({ kind: "error", message: body.error ?? `failed (${res.status})` });
        return;
      }
      setState({
        kind: "queued",
        position: body.position ?? 1,
        alreadyQueued: Boolean(body.alreadyQueued),
      });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "network error",
      });
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-card/50 px-4 py-6 text-center">
      <p className="font-mono text-[12px] text-muted-foreground">
        no endpoints found for{" "}
        <span className="text-foreground">{domain}</span>
      </p>
      <p className="text-[12px] text-muted-foreground">
        This site has not been scanned yet.
      </p>

      {state.kind === "idle" && (
        <button
          type="button"
          onClick={requestScan}
          className="mx-auto inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          request scan →
        </button>
      )}
      {state.kind === "queueing" && (
        <p className="font-mono text-[11px] text-muted-foreground">
          queueing...
        </p>
      )}
      {state.kind === "queued" && (
        <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
          {state.alreadyQueued ? "already queued" : "queued"} · position{" "}
          {state.position}
        </p>
      )}
      {state.kind === "error" && (
        <p className="font-mono text-[11px] text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
    </div>
  );
}
