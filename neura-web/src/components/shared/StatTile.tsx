import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

/** Small metric card, the same look as the Habits summary tiles. */
function StatTile({ icon, label, value, hint, isLoading, className }: StatTileProps) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-border bg-card px-4 py-3", className)}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
       <span className="whitespace-nowrap"> {label}</span>
      </div>
      {isLoading ? (
        <div className="mt-1.5 h-6 w-12 animate-pulse rounded bg-muted" />
      ) : (
        <div className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</div>
      )}
      {hint && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export default StatTile;
