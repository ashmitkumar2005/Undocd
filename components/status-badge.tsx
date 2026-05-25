import { cn } from "@/lib/utils";
import type { EndpointStatus } from "@/lib/types";

const STATUS_STYLES: Record<EndpointStatus, string> = {
  working:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  broken:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300",
  unverified:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300",
};

const STATUS_LABEL: Record<EndpointStatus, string> = {
  working: "working",
  broken: "broken",
  unverified: "unverified",
};

export function StatusBadge({
  status,
  className,
}: {
  status: EndpointStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium leading-none",
        STATUS_STYLES[status],
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "working" && "bg-emerald-500",
          status === "broken" && "bg-red-500",
          status === "unverified" && "bg-amber-500"
        )}
        aria-hidden
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
