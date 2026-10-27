import { format, isBefore, isToday, isWeekend, startOfToday } from "date-fns";
import { Plus } from "lucide-react";
import type { Task } from "@/features/tasks/types/task";
import { Button } from "@/components/ui/button";
import AddNewTask from "@/features/tasks/components/AddTask";
import { CalendarWeekTaskCard } from "@/features/tasks/components/calendar/CalendarWeekTaskCard";
import { dayKey } from "@/features/tasks/utils/calendar";
import { cn } from "@/lib/utils";

interface Props {
  days: Date[];
  tasksByDay: Map<string, Task[]>;
  onSelectDay: (day: Date) => void;
}

// Seven columns on md+, a stacked agenda (one card per day) on mobile
export function CalendarWeekView({ days, tasksByDay, onSelectDay }: Props) {
  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-0 md:rounded-xl md:border md:border-border md:overflow-hidden md:bg-card md:shadow-xs">
      {days.map((day) => {
        const dayTasks = tasksByDay.get(dayKey(day)) ?? [];
        const today = isToday(day);
        const past = isBefore(day, startOfToday());
        const done = dayTasks.filter((t) => t.completed).length;

        return (
          <section
            key={day.toISOString()}
            aria-label={format(day, "EEEE, MMMM d")}
            className={cn(
              "group flex flex-col min-h-0 min-w-0",
              "rounded-xl border border-border bg-card md:rounded-none md:border-0 md:border-r md:last:border-r-0",
              isWeekend(day) && "md:bg-muted/20",
              today && "border-primary/50 md:bg-primary/5",
            )}
          >
            {/* Day header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 md:flex-col md:gap-1 md:px-2 md:py-3">
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                className="flex items-center gap-2 md:flex-col md:gap-1 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider",
                    today ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {format(day, "EEE")}
                </span>
                <span
                  className={cn(
                    "inline-flex size-7 md:size-9 items-center justify-center rounded-full text-sm md:text-lg font-semibold tabular-nums transition-colors",
                    today
                      ? "bg-primary text-primary-foreground"
                      : past
                        ? "text-muted-foreground hover:bg-accent"
                        : "text-foreground hover:bg-accent",
                  )}
                >
                  {format(day, "d")}
                </span>
              </button>

              <span className="ml-auto md:ml-0 text-[10px] text-muted-foreground tabular-nums">
                {dayTasks.length === 0 ? "No tasks" : `${done}/${dayTasks.length} done`}
              </span>
            </div>

            {/* Tasks */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
              {dayTasks.map((t) => (
                <CalendarWeekTaskCard key={t.id} task={t} />
              ))}

              <AddNewTask
                initialDueDate={day}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full gap-1 text-xs text-muted-foreground border border-dashed border-transparent",
                      "hover:border-border hover:text-foreground focus-visible:opacity-100",
                      dayTasks.length > 0 && "md:opacity-0 md:group-hover:opacity-100",
                    )}
                  >
                    <Plus className="size-3.5" /> Add task
                  </Button>
                }
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
