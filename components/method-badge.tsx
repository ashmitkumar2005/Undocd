import { cn } from "@/lib/utils";
import type { HttpMethod } from "@/lib/mock-data";

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  POST: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300",
  PUT: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300",
  PATCH:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300",
  DELETE:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300",
};

export function MethodBadge({
  method,
  className,
}: {
  method: HttpMethod;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-md border px-2 font-mono text-[11px] font-semibold tracking-wide",
        METHOD_STYLES[method],
        className
      )}
    >
      {method}
    </span>
  );
}
