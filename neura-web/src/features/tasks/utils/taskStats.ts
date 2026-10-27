import { differenceInCalendarDays, format, isThisYear, startOfDay, subDays } from "date-fns";
import type { Task } from "@/features/tasks/types/task";

export type DueTone = "overdue" | "today" | "soon" | "later" | "none";

export interface DueInfo {
  label: string;
  tone: DueTone;
}

/** Human label for a task's due date: "Today", "Tomorrow", "Yesterday", "Mon", "Oct 30"… */
export function getDueInfo(task: Task, now = new Date()): DueInfo {
  if (!task.due_date) return { label: "No date", tone: "none" };

  const due = startOfDay(new Date(task.due_date));
  const days = differenceInCalendarDays(due, startOfDay(now));
  const date = format(due, isThisYear(due) ? "MMM d" : "MMM d, yyyy");

  if (days === 0) return { label: "Today", tone: task.completed ? "later" : "today" };
  if (days === 1) return { label: "Tomorrow", tone: "soon" };
  if (days === -1) return { label: "Yesterday", tone: task.completed ? "later" : "overdue" };
  if (days < 0) return { label: date, tone: task.completed ? "later" : "overdue" };
  if (days < 7) return { label: format(due, "EEEE"), tone: "soon" };
  return { label: date, tone: "later" };
}

export const DUE_TONE_STYLES: Record<DueTone, string> = {
  overdue: "text-rose-600 dark:text-rose-400",
  today: "text-primary font-medium",
  soon: "text-foreground/80",
  later: "text-muted-foreground",
  none: "text-muted-foreground/70",
};

export interface TaskStats {
  open: number;
  dueToday: number;
  overdue: number;
  /** Completed in the last 7 days, today included */
  doneThisWeek: number;
}

export function getTaskStats(tasks: Task[], now = new Date()): TaskStats {
  const today = startOfDay(now);
  const weekStart = subDays(today, 6);
  const stats: TaskStats = { open: 0, dueToday: 0, overdue: 0, doneThisWeek: 0 };

  for (const t of tasks) {
    if (t.completed) {
      if (t.completed_at && new Date(t.completed_at) >= weekStart) stats.doneThisWeek++;
      continue;
    }
    stats.open++;
    if (!t.due_date) continue;
    const days = differenceInCalendarDays(startOfDay(new Date(t.due_date)), today);
    if (days === 0) stats.dueToday++;
    else if (days < 0) stats.overdue++;
  }
  return stats;
}
