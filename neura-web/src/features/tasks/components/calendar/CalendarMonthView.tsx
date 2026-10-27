import { format, isSameMonth, isToday, isWeekend } from "date-fns";
import { Check } from "lucide-react";
import type { Task } from "@/features/tasks/types/task";
import { CalendarTaskChip } from "@/features/tasks/components/calendar/CalendarTaskChip";
import {
  dayKey,
  isTaskOverdue,
  PRIORITY_STYLES,
  WEEKDAYS,
} from "@/features/tasks/utils/calendar";
import { cn } from "@/lib/utils";

interface Props {
  cursor: Date;
  days: Date[];
  tasksByDay: Map<string, Task[]>;
  onSelectDay: (day: Date) => void;
}

export function CalendarMonthView({ cursor, days, tasksByDay, onSelectDay }: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border overflow-hidden bg-card shadow-xs">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <span className="sm:hidden">{d[0]}</span>
            <span className="hidden sm:inline">{d}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-0">
        {days.map((day) => {
          const dayTasks = tasksByDay.get(dayKey(day)) ?? [];
          const openCount = dayTasks.filter((t) => !t.completed).length;
          const hasOverdue = dayTasks.some(isTaskOverdue);
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-label={`${format(day, "EEEE, MMMM d")}: ${dayTasks.length} tasks`}
              className={cn(
                "group relative flex flex-col gap-1 p-1 sm:p-1.5 text-left min-w-0",
                "min-h-16 sm:min-h-20 lg:min-h-24",
                "border-b border-r border-border/60 nth-[7n]:border-r-0",
                "transition-colors hover:bg-accent/40 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                isWeekend(day) && "bg-muted/20",
                !inMonth && "bg-muted/40",
                today && "bg-primary/5",
              )}
            >
              {/* Day number + open-task count */}
              <div className="flex items-center justify-center sm:justify-between gap-1">
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full text-[11px] sm:text-xs font-medium size-5 sm:size-6 tabular-nums",
                    today
                      ? "bg-primary text-primary-foreground font-semibold"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span
                    className={cn(
                      "hidden sm:inline-flex items-center rounded-full px-1.5 h-4 text-[10px] font-medium tabular-nums",
                      hasOverdue
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : openCount === 0
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {openCount === 0 ? <Check className="size-3" /> : openCount}
                  </span>
                )}
              </div>

              {/* Mobile: open-task count + per-task priority bar (details live in the day modal) */}
              {dayTasks.length > 0 && (
                <div className={cn("sm:hidden mt-auto flex flex-col items-center gap-1", !inMonth && "opacity-50")}>
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums",
                      hasOverdue
                        ? "bg-red-500 text-white"
                        : openCount === 0
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : PRIORITY_STYLES[dayTasks[0].priority].badge, // sorted: first open task has the top priority
                    )}
                  >
                    {openCount === 0 ? <Check className="size-3" /> : openCount}
                  </span>
                  <div className="flex w-full max-w-8 gap-0.5">
                    {dayTasks.slice(0, 4).map((t) => (
                      <span
                        key={t.id}
                        className={cn(
                          "h-1 flex-1 rounded-full",
                          t.completed ? "bg-muted-foreground/25" : PRIORITY_STYLES[t.priority].dot,
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* sm+: chips — 2 on sm/md, 3 on lg, then "+N more" */}
              <div className={cn("hidden sm:flex flex-col gap-0.5 min-w-0", !inMonth && "opacity-50")}>
                {dayTasks.slice(0, 3).map((t, idx) => (
                  <div key={t.id} className={cn("min-w-0", idx === 2 && "hidden lg:block")}>
                    <CalendarTaskChip task={t} />
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <span className="lg:hidden text-[10px] text-muted-foreground pl-1 group-hover:text-foreground">
                    +{dayTasks.length - 2} more
                  </span>
                )}
                {dayTasks.length > 3 && (
                  <span className="hidden lg:inline text-[10px] text-muted-foreground pl-1 group-hover:text-foreground">
                    +{dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
