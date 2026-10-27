import { ChevronLeft, ChevronRight, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { HabitView } from "@/features/habits/types/habit";
import { cn } from "@/lib/utils";

const VIEWS: { value: HabitView; label: string; key: string }[] = [
  { value: "week", label: "Week", key: "W" },
  { value: "month", label: "Month", key: "M" },
  { value: "year", label: "Year", key: "Y" },
  { value: "all", label: "All time", key: "A" },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="ml-1.5 rounded border border-background/30 px-1 font-mono text-[10px]">{children}</kbd>;
}

interface HabitsHeaderProps {
  title: string;
  view: HabitView;
  isFetching: boolean;
  isCurrentPeriod: boolean;
  onViewChange: (view: HabitView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onManage: () => void;
  onCreate: () => void;
}

export function HabitsHeader({
  title, view, isFetching, isCurrentPeriod, onViewChange, onPrev, onNext, onToday, onManage, onCreate,
}: HabitsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 px-1 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Habits</p>
          <h1
            className={cn(
              "truncate text-lg font-semibold tracking-tight md:text-2xl transition-opacity",
              isFetching && "opacity-60",
            )}
          >
            {title}
          </h1>
        </div>
        {/* mobile actions */}
        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          <Button variant="outline" size="icon-sm" onClick={onManage} aria-label="Manage habits">
            <ListChecks className="size-4" />
          </Button>
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" /> New
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={view}
          onValueChange={(v) => v && onViewChange(v as HabitView)}
        >
          {VIEWS.map(({ value, label, key }) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <ToggleGroupItem value={value} aria-label={`${label} view`} className="cursor-pointer px-2.5 text-xs">
                  {label}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                {label} view <Kbd>{key}</Kbd>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>

        {view !== "all" && (
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onToday} disabled={isCurrentPeriod} className="h-8 text-xs">
                  Today
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Jump to today <Kbd>T</Kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onPrev} className="size-8" aria-label={`Previous ${view}`}>
                  <ChevronLeft className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Previous {view} <Kbd>←</Kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onNext} className="size-8" aria-label={`Next ${view}`}>
                  <ChevronRight className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Next {view} <Kbd>→</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* desktop actions */}
        <div className="hidden items-center gap-1.5 lg:ml-2 lg:flex">
          <Button variant="outline" size="sm" onClick={onManage}>
            <ListChecks className="size-4" /> Manage
          </Button>
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" /> New habit
          </Button>
        </div>
      </div>
    </div>
  );
}
