"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  onSubmit,
  loading,
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim() || loading) return;
        onSubmit();
      }}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 transition-colors",
        "focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/30"
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        ref={inputRef}
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Enter a URL — e.g. github.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onChange("");
        }}
        disabled={loading}
        className="min-w-0 flex-1 bg-transparent font-mono text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 font-mono text-[11px] text-muted-foreground transition-colors",
          "hover:border-foreground/40 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground"
        )}
        aria-label="Search endpoints"
      >
        {loading ? "scanning" : "search"}
        <ArrowRight className="size-3" />
      </button>
    </form>
  );
}
