// src/lib/utils/sortTasksByDueStatus.ts
import { isBefore, startOfDay } from "date-fns";
import type { Task } from "@/features/tasks/types/task";


/**
 * Returns tasks in a single ordered array:
 * 1. Due today → future (soonest first)
 * 2. No due date
 * 3. Overdue (past due date)
 *
 * Assumes input may be in any order; does its own date-based sort
 * within each bucket (falls back to the array's existing order if
 * due dates are equal, e.g. from the API's own ordering).
 */
export function sortTasksByDueStatus(tasks: Task[]): Task[] {
  const today = startOfDay(new Date());

  const dated: Task[] = [];
  const undated: Task[] = [];
  const outdated: Task[] = [];

  for (const task of tasks) {
    if (!task.due_date) {
      undated.push(task);
      continue;
    }

    const due = startOfDay(new Date(task.due_date));

    if (isBefore(due, today)) {
      outdated.push(task);
    } else {
      dated.push(task);
    }
  }

  // dated bucket: soonest due date first
  dated.sort(
    (a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime(),
  );

  // outdated bucket: most recently overdue first (closest to today)
  outdated.sort(
    (a, b) => new Date(b.due_date!).getTime() - new Date(a.due_date!).getTime(),
  );

  return [...dated, ...undated, ...outdated];
}