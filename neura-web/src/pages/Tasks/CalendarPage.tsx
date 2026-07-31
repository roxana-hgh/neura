import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Task } from "../../types/Tasks";
import { useCalendarTasks } from "../../components/features/Tasks/hooks/useCalendarTasks";
import { Button } from "../../components/ui/button";
import { DayTasksModal } from "../../components/features/Tasks/components/DayTasksModal";

// Full labels for desktop, single-letter for mobile — index-matched
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

function getTasksForDay(tasks: Task[], day: Date): Task[] {
  return tasks.filter((t) => {
    if (!t.due_date) return false;
    return isSameDay(new Date(t.due_date), day);
  });
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.completed) return false;
  return isBefore(new Date(task.due_date), startOfDay(new Date()));
}

function PriorityPill({ task, index }: { task: Task; index: number }) {
  const overdue = isOverdue(task);
  const color = overdue
    ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
    : PILL_COLORS[index % PILL_COLORS.length];

  return (
    <div
      className={[
        "text-[9px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded-md truncate max-w-full leading-tight",
        color,
        task.completed ? "opacity-40 line-through" : "",
      ].join(" ")}
    >
      {task.title}
    </div>
  );
}

// Soft pastel palette — 6 colors, cycles by task position in the day
const PILL_COLORS = [
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
];

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { data: tasks = [], isLoading } = useCalendarTasks(currentMonth);

  // Build the full grid — always Mon-start, 6 rows max
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDayTasks = useMemo<Task[]>(() => {
    if (!selectedDate) return [];
    return getTasksForDay(tasks, selectedDate);
  }, [selectedDate, tasks]);

  const prevMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setCurrentMonth(new Date());

  return (
    <div className="p-3 sm:p-4 md:p-6 h-full flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-foreground flex-1 truncate">
          {format(currentMonth, "MMMM yyyy")}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={goToday}
          className="text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={prevMonth}
          className="h-7 w-7 sm:h-8 sm:w-8"
        >
          <ChevronLeft size={14} className="sm:hidden" />
          <ChevronLeft size={16} className="hidden sm:block" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={nextMonth}
          className="h-7 w-7 sm:h-8 sm:w-8"
        >
          <ChevronRight size={14} className="sm:hidden" />
          <ChevronRight size={16} className="hidden sm:block" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col min-h-0 rounded-lg sm:rounded-xl border border-border overflow-hidden bg-card">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className="py-1.5 sm:py-2 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {calendarDays.map((day, i) => {
              const dayTasks = getTasksForDay(tasks, day);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const selected = selectedDate && isSameDay(day, selectedDate);

              // Mobile shows 1 pill + overflow count, desktop shows 2
              const visiblePillCount = 1; // overridden responsively below via CSS, see note

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={[
                    "flex flex-col gap-0.5 p-1 sm:p-1.5 md:p-2 text-left border-b border-r border-border/50",
                    "min-h-14 sm:min-h-16 md:min-h-20",
                    "hover:bg-muted/30 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    !inMonth ? "opacity-25" : "",
                    today ? "border-l-2 border-l-primary bg-primary/5" : "",
                    selected ? "bg-muted/40" : "",
                  ].join(" ")}
                >
                  {/* Day number */}
                  <span
                    className={[
                      "inline-flex items-center justify-center rounded-full text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1",
                      "w-5 h-5 sm:w-6 sm:h-6",
                      today
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Task pills — 1 on mobile, 2 on sm+, then +N */}
                  <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                    {dayTasks.slice(0, 2).map((t, idx) => (
                      <div
                        key={t.id}
                        className={idx === 1 ? "hidden sm:block" : ""}
                      >
                        <PriorityPill task={t} index={idx} />
                      </div>
                    ))}

                    {/* Overflow count — different threshold per breakpoint */}
                    {dayTasks.length > 1 && (
                      <span className="text-[9px] sm:hidden text-muted-foreground pl-0.5">
                        +{dayTasks.length - 1} more
                      </span>
                    )}
                    {dayTasks.length > 2 && (
                      <span className="hidden sm:inline text-[10px] text-muted-foreground pl-1">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <DayTasksModal
        open={!!selectedDate}
        date={selectedDate ?? new Date()}
        tasks={selectedDayTasks}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  );
}