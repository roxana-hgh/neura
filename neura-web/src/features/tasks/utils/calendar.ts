import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  isSameYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Task } from "@/features/tasks/types/task";
import type { CalendarView } from "@/features/tasks/stores/calendarStore";

// The calendar always starts weeks on Monday
export const WEEK_STARTS_ON = 1;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface CalendarRange {
  start: Date;
  end: Date;
}

// Visible days for a view: full weeks around the month, or the single week
export function getVisibleRange(view: CalendarView, cursor: Date): CalendarRange {
  if (view === "week") {
    return {
      start: startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON }),
      end: endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON }),
    };
  }
  return {
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON }),
  };
}

export function getRangeDays(range: CalendarRange): Date[] {
  return eachDayOfInterval(range);
}

export function shiftCursor(view: CalendarView, cursor: Date, step: 1 | -1): Date {
  return view === "week" ? addWeeks(cursor, step) : addMonths(cursor, step);
}

export function formatRangeTitle(view: CalendarView, cursor: Date, range: CalendarRange): string {
  if (view === "month") return format(cursor, "MMMM yyyy");

  const { start, end } = range;
  if (!isSameYear(start, end)) {
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  }
  if (!isSameMonth(start, end)) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMMM d")} – ${format(end, "d, yyyy")}`;
}

export function dayKey(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.due_date || task.completed) return false;
  return isBefore(new Date(task.due_date), startOfDay(new Date()));
}

const PRIORITY_ORDER: Record<Task["priority"], number> = { high: 0, medium: 1, low: 2 };

// Open tasks first, then by priority, then alphabetically
function compareTasks(a: Task, b: Task): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1;
  const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (byPriority !== 0) return byPriority;
  return a.title.localeCompare(b.title);
}

export function groupTasksByDay(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.due_date) continue;
    const key = dayKey(task.due_date);
    const bucket = map.get(key);
    if (bucket) bucket.push(task);
    else map.set(key, [task]);
  }
  for (const bucket of map.values()) bucket.sort(compareTasks);
  return map;
}

export interface CalendarStats {
  total: number;
  completed: number;
  overdue: number;
}

export function getCalendarStats(tasks: Task[]): CalendarStats {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    overdue: tasks.filter(isTaskOverdue).length,
  };
}

export const PRIORITY_STYLES: Record<
  Task["priority"],
  { label: string; dot: string; bar: string; badge: string }
> = {
  high: {
    label: "High",
    dot: "bg-rose-500",
    bar: "before:bg-rose-500",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  medium: {
    label: "Medium",
    dot: "bg-amber-500",
    bar: "before:bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  low: {
    label: "Low",
    dot: "bg-sky-500",
    bar: "before:bg-sky-500",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
};
