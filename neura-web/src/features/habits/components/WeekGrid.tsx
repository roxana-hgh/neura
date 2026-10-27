import { addDays, format } from "date-fns";
import { Flame } from "lucide-react";
import type { Habit } from "@/features/habits/types/habit";
import { fromDayKey, getCellState, habitEndLabel, toDayKey } from "@/features/habits/lib/habitDate";
import { HabitCell } from "@/features/habits/components/HabitCell";
import { HabitMenu, type HabitActions } from "@/features/habits/components/HabitMenu";
import { cn } from "@/lib/utils";

interface WeekGridProps extends HabitActions {
  habits: Habit[];
  rangeStart: string;
  today: string;
  onToggle: (habitId: string, dayKey: string) => void;
}

// mobile: name on its own line, 7 equal day columns; sm+: name | 7 days | progress
const ROW_GRID =
  "grid grid-cols-7 sm:grid-cols-[minmax(9rem,1fr)_repeat(7,2.75rem)_7.5rem] items-center gap-x-1.5 sm:gap-x-2";

export function WeekGrid({ habits, rangeStart, today, onToggle, onEdit, onDelete }: WeekGridProps) {
  const days = Array.from({ length: 7 }, (_, i) => toDayKey(addDays(fromDayKey(rangeStart), i)));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* day header */}
      <div className={cn(ROW_GRID, "border-b border-border bg-muted/30 px-3 py-2.5 sm:px-4")}>
        <span className="hidden text-xs font-medium text-muted-foreground sm:block">Habit</span>
        {days.map((key) => {
          const isToday = key === today;
          return (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <span className={cn("text-[10px] uppercase tracking-wide", isToday ? "text-primary font-semibold" : "text-muted-foreground")}>
                {format(fromDayKey(key), "EEE")}
              </span>
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                  isToday ? "bg-primary text-primary-foreground font-semibold" : "text-foreground",
                )}
              >
                {format(fromDayKey(key), "d")}
              </span>
            </div>
          );
        })}
        <span className="hidden text-right text-xs font-medium text-muted-foreground sm:block">This week</span>
      </div>

      <div className="divide-y divide-border">
        {habits.map((habit) => {
          const done = new Set(habit.entries);
          const endLabel = habitEndLabel(habit, today);
          return (
            <div key={habit.id} className={cn(ROW_GRID, "gap-y-2.5 px-3 py-3 sm:px-4 hover:bg-muted/20")}>
              {/* name + streak */}
              <div className="col-span-7 flex min-w-0 items-center gap-2 sm:col-span-1">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{habit.title}</p>
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5 tabular-nums" title="Current streak">
                      <Flame className={cn("size-3", habit.streak.current > 0 ? "text-orange-500" : "text-muted-foreground/60")} />
                      {habit.streak.current}d streak
                    </span>
                    {habit.isArchived ? <span>· Archived</span> : endLabel && <span className="truncate">· {endLabel}</span>}
                  </p>
                </div>
                {/* mobile progress */}
                <span className="text-xs font-medium tabular-nums text-muted-foreground sm:hidden">
                  {habit.stats.completed}/{habit.stats.total}
                </span>
                <HabitMenu habit={habit} onEdit={onEdit} onDelete={onDelete} />
              </div>

              {days.map((key) => (
                <div key={key} className="flex justify-center">
                  <HabitCell
                    dayKey={key}
                    state={getCellState(habit, key, today, done.has(key))}
                    color={habit.color}
                    isToday={key === today}
                    onToggle={(k) => onToggle(habit.id, k)}
                  />
                </div>
              ))}

              {/* sm+ progress */}
              <div className="hidden space-y-1 sm:block">
                <div className="flex items-baseline justify-end gap-1.5 text-xs tabular-nums">
                  <span className="font-semibold">{habit.stats.percent}%</span>
                  <span className="text-muted-foreground">{habit.stats.completed}/{habit.stats.total}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${habit.stats.percent}%`, backgroundColor: habit.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
