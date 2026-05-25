"use client";

import { useState, useTransition } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { NoResults, ResultsList } from "@/components/results-list";
import { SearchInput } from "@/components/search-input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  normalizeDomain,
  type DomainResult,
  type ScanResponse,
} from "@/lib/types";

type View =
  | { kind: "idle" }
  | { kind: "loading"; query: string }
  | { kind: "results"; result: DomainResult }
  | { kind: "empty"; query: string }
  | { kind: "error"; query: string; message: string };

export default function Home() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ kind: "idle" });
  const [, startTransition] = useTransition();

  async function runSearch(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    const domain = normalizeDomain(trimmed);
    setView({ kind: "loading", query: trimmed });

    try {
      const res = await fetch(
        `/api/scan?url=${encodeURIComponent(trimmed)}`,
        { cache: "no-store" }
      );

      if (res.status === 404) {
        startTransition(() => setView({ kind: "empty", query: domain }));
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        startTransition(() =>
          setView({
            kind: "error",
            query: domain,
            message: body.error ?? `request failed (${res.status})`,
          })
        );
        return;
      }

      const data = (await res.json()) as ScanResponse;
      startTransition(() => {
        if (data.found) setView({ kind: "results", result: data.result });
        else setView({ kind: "empty", query: data.domain });
      });
    } catch (err) {
      startTransition(() =>
        setView({
          kind: "error",
          query: domain,
          message: err instanceof Error ? err.message : "network error",
        })
      );
    }
  }

  function pickSuggestion(domain: string) {
    setQuery(domain);
    void runSearch(domain);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-12 sm:py-20">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[15px] font-semibold tracking-tight text-foreground">
            undocd
          </span>
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
            // open-source endpoint discovery
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ashmitkumar2005/Undocd"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            github
          </a>
          <ThemeToggle />
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <h1 className="text-[22px] font-medium leading-tight tracking-tight text-foreground sm:text-[26px]">
          Find API endpoints from any URL.
        </h1>
        <p className="max-w-xl text-[14px] leading-relaxed text-muted-foreground">
          Enter a website. Undocd returns publicly accessible API endpoints,
          shared and verified by an open-source community.
        </p>
      </section>

      <SearchInput
        value={query}
        onChange={setQuery}
        onSubmit={() => runSearch(query)}
        loading={view.kind === "loading"}
      />

      <section className="flex flex-col gap-4">
        {view.kind === "idle" && (
          <div className="undocd-fade-in">
            <EmptyState onPick={pickSuggestion} />
          </div>
        )}
        {view.kind === "loading" && (
          <div className="undocd-fade-in">
            <LoadingState />
          </div>
        )}
        {view.kind === "results" && (
          <div className="undocd-fade-in" key={view.result.domain}>
            <ResultsList result={view.result} />
          </div>
        )}
        {view.kind === "empty" && (
          <div className="undocd-fade-in" key={view.query}>
            <NoResults domain={view.query} />
          </div>
        )}
        {view.kind === "error" && (
          <div
            className="undocd-fade-in flex flex-col gap-1 rounded-md border border-red-200 bg-red-50/50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20"
            key={view.query + view.message}
          >
            <p className="font-mono text-[12px] text-red-700 dark:text-red-300">
              error scanning <span className="text-foreground">{view.query}</span>
            </p>
            <p className="text-[12px] text-muted-foreground">{view.message}</p>
          </div>
        )}
      </section>

      <footer className="mt-auto flex items-center justify-between pt-8 font-mono text-[11px] text-muted-foreground">
        <span>reading from /endpoints/*.json on github</span>
        <span>v0.2 · phase 2a</span>
      </footer>
    </main>
  );
}
