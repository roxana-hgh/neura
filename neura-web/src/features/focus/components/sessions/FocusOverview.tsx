import { LucideCalendarDays, LucideFlame, LucideInfinity } from "lucide-react";
import type { DateRangeFilter } from "@/features/focus/types/focusSession";
import { useFocusSessionStats } from "@/features/focus/hooks/useFocusSessions";
import { formatDuration } from "@/features/focus/utils/time";

const TILES: { range: DateRangeFilter; label: string; Icon: typeof LucideFlame; iconClass: string }[] = [
  { range: "today", label: "Today", Icon: LucideFlame, iconClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  { range: "week", label: "This week", Icon: LucideCalendarDays, iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { range: "all", label: "All time", Icon: LucideInfinity, iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
];

function StatTile({ range, label, Icon, iconClass }: (typeof TILES)[number]) {
  const { data, isLoading } = useFocusSessionStats(range);

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 sm:p-4">
      <div className={`hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex ${iconClass}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="mt-1 h-6 w-16 animate-pulse rounded bg-muted" />
        ) : (
          <p className="truncate text-lg sm:text-xl font-semibold tabular-nums text-foreground">
            {formatDuration(data?.totalDuration ?? 0)}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {data?.sessionCount ?? 0} {data?.sessionCount === 1 ? "session" : "sessions"}
        </p>
      </div>
    </div>
  );
}

function FocusOverview() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {TILES.map((tile) => (
        <StatTile key={tile.range} {...tile} />
      ))}
    </div>
  );
}

export default FocusOverview;
