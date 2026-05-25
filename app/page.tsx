"use client";

import { useState, useTransition } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { NoResults, ResultsList } from "@/components/results-list";
import { SearchInput } from "@/components/search-input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getMockEndpoints,
  normalizeDomain,
  type DomainResult,
} from "@/lib/mock-data";

type View =
  | { kind: "idle" }
  | { kind: "loading"; query: string }
  | { kind: "results"; result: DomainResult }
  | { kind: "empty"; query: string };

export default function Home() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ kind: "idle" });
  const [, startTransition] = useTransition();

  async function runSearch(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    setView({ kind: "loading", query: trimmed });
    const result = await getMockEndpoints(trimmed);
    startTransition(() => {
      if (result) setView({ kind: "results", result });
      else setView({ kind: "empty", query: normalizeDomain(trimmed) });
    });
  }

  function pickSuggestion(domain: string) {
    setQuery(domain);
    void runSearch(domain);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-12 sm:py-20">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[15px] font-semibold tracking-tight text-foreground">
            undocd
          </span>
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
            // open-source endpoint discovery
          </span>
        </div>
        <a
          href="https://github.com/ashmitkumar2005/Undocd"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          github
        </a>
        <ThemeToggle />
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
      </section>

      <footer className="mt-auto flex items-center justify-between pt-8 font-mono text-[11px] text-muted-foreground">
        <span>cached results from /endpoints/*.json</span>
        <span>v0.1 · design preview</span>
      </footer>
    </main>
  );
}
