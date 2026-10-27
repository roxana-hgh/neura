import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CalendarView } from "@/features/tasks/stores/calendarStore";
import { PRIORITY_STYLES, type CalendarStats } from "@/features/tasks/utils/calendar";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  view: CalendarView;
  stats: CalendarStats;
  isFetching: boolean;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const VIEWS: { value: CalendarView; label: string; key: string; Icon: typeof CalendarDays }[] = [
  { value: "month", label: "Month", key: "M", Icon: CalendarDays },
  { value: "week", label: "Week", key: "W", Icon: CalendarRange },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-1.5 rounded border border-background/30 px-1 font-mono text-[10px]">
      {children}
    </kbd>
  );
}

export function CalendarHeader({
  title,
  view,
  stats,
  isFetching,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const unit = view === "week" ? "week" : "month";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-1">
      {/* Title + summary */}
      <div className="min-w-0">
        <h1
          className={cn(
            "text-lg md:text-2xl font-semibold tracking-tight text-foreground truncate transition-opacity",
            isFetching && "opacity-70",
          )}
        >
          {title}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {stats.total} {stats.total === 1 ? "task" : "tasks"}
          </span>
          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.completed} done
          </span>
          {stats.overdue > 0 && (
            <span className="tabular-nums text-red-600 dark:text-red-400">
              {stats.overdue} overdue
            </span>
          )}
          {/* Priority legend: own line on small screens, inline after the stats on lg */}
          <span className="inline-flex basis-full lg:basis-auto items-center gap-2.5 lg:border-l lg:border-border lg:pl-3">
            {Object.values(PRIORITY_STYLES).map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1">
                <span className={cn("size-1.5 rounded-full", p.dot)} />
                {p.label}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={view}
          onValueChange={(v) => v && onViewChange(v as CalendarView)}
        >
          {VIEWS.map(({ value, label, key, Icon }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <ToggleGroupItem value={value} aria-label={`${label} view`} className="cursor-pointer px-2.5">
                  <Icon />
                  <span className="text-xs">{label}</span>
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                {label} view <Kbd>{key}</Kbd>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>

        <div className="ml-auto sm:ml-0 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onToday} className="h-8 text-xs">
                Today
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Jump to today <Kbd>T</Kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onPrev} className="size-8" aria-label={`Previous ${unit}`}>
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Previous {unit} <Kbd>←</Kbd>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onNext} className="size-8" aria-label={`Next ${unit}`}>
                <ChevronRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Next {unit} <Kbd>→</Kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
