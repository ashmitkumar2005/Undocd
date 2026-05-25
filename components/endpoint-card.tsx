"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MethodBadge } from "@/components/method-badge";
import { StatusBadge } from "@/components/status-badge";
import type { Endpoint } from "@/lib/mock-data";

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

export function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(endpoint.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="group flex flex-col gap-2 rounded-md border border-border/80 bg-card px-4 py-3 transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MethodBadge method={endpoint.method} />
          <code className="truncate font-mono text-[13px] text-foreground">
            {endpoint.url}
          </code>
        </div>
        <StatusBadge status={endpoint.status} className="shrink-0" />
      </div>

      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {endpoint.description}
      </p>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span>
            auth:{" "}
            <span
              className={cn(
                endpoint.authRequired ? "text-foreground" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {endpoint.authRequired ? "required" : "none"}
            </span>
          </span>
          <span aria-hidden>·</span>
          <span>
            cors:{" "}
            <span
              className={cn(
                endpoint.corsEnabled
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              )}
            >
              {endpoint.corsEnabled ? "yes" : "no"}
            </span>
          </span>
          <span aria-hidden>·</span>
          <span>verified {timeAgo(endpoint.lastVerified)}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 px-2 text-[12px] text-muted-foreground hover:text-foreground"
          aria-label="Copy endpoint URL"
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
