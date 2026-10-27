import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { Task } from "@/features/tasks/types/task";

export type TaskViewMode = "sorted" | "grouped";

export interface TaskSection {
  key: string;
  label: string;
  tasks: Task[];
  defaultOpen?: boolean;
}

const dueTime = (task: Task) => new Date(task.due_date!).getTime();

/** Soonest due date first, tasks without a due date last. */
function byDueDate(a: Task, b: Task) {
  if (!a.due_date && !b.due_date) return 0;
  if (!a.due_date) return 1;
  if (!b.due_date) return -1;
  return dueTime(a) - dueTime(b);
}

/** Most recently completed first. */
function byCompletedAt(a: Task, b: Task) {
  const ta = a.completed_at ? new Date(a.completed_at).getTime() : 0;
  const tb = b.completed_at ? new Date(b.completed_at).getTime() : 0;
  return tb - ta;
}

/** Calendar days between today and the task's due date (negative = overdue). */
function daysUntilDue(task: Task, today: Date) {
  return differenceInCalendarDays(startOfDay(new Date(task.due_date!)), today);
}

/**
 * Splits tasks into display sections.
 *
 * - "sorted" (default): active tasks soonest-first with undated ones last,
 *   then overdue tasks, then completed tasks (collapsed).
 * - "grouped": Overdue, Today, Tomorrow, Next 7 Days, Upcoming, No Date,
 *   then completed tasks (collapsed).
 *
 * Empty sections are omitted, except the main section in "sorted" mode.
 */
export function groupTasks(
  tasks: Task[],
  mode: TaskViewMode,
  mainLabel = "Tasks",
): TaskSection[] {
  const today = startOfDay(new Date());

  const active = tasks.filter((t) => !t.completed).sort(byDueDate);
  const completed = tasks.filter((t) => t.completed).sort(byCompletedAt);

  const overdue = active.filter((t) => t.due_date && daysUntilDue(t, today) < 0);
  const current = active.filter((t) => !t.due_date || daysUntilDue(t, today) >= 0);

  const completedSection: TaskSection = {
    key: "completed",
    label: "Completed",
    tasks: completed,
    defaultOpen: false,
  };

  if (mode === "sorted") {
    return [
      { key: "main", label: mainLabel, tasks: current },
      { key: "overdue", label: "Overdue", tasks: overdue },
      completedSection,
    ].filter((s) => s.key === "main" || s.tasks.length > 0);
  }

  const inRange = (min: number, max: number) =>
    current.filter((t) => {
      if (!t.due_date) return false;
      const days = daysUntilDue(t, today);
      return days >= min && days <= max;
    });

  return [
    { key: "overdue", label: "Overdue", tasks: overdue },
    { key: "today", label: "Today", tasks: inRange(0, 0) },
    { key: "tomorrow", label: "Tomorrow", tasks: inRange(1, 1) },
    { key: "week", label: "Next 7 Days", tasks: inRange(2, 7) },
    { key: "upcoming", label: "Upcoming", tasks: inRange(8, Infinity) },
    { key: "no-date", label: "No Date", tasks: current.filter((t) => !t.due_date) },
    completedSection,
  ].filter((s) => s.tasks.length > 0);
}

