import { format } from "date-fns";
import type { Task, TaskRepeat } from "@/features/tasks/types/task";
import { dueDay } from "@/features/tasks/utils/dueDate";

export const TASK_REPEAT_LABELS: Record<TaskRepeat, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const REPEAT_UNIT: Record<Exclude<TaskRepeat, "none">, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

/** 0 = Sunday … 6 = Saturday (same order as `Date.getDay()`). */
export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Daily", "Every 2 weeks on Mon, Thu", "Weekdays"; null when the task doesn't repeat. */
export function describeTaskRepeat(
  r: Pick<Task, "repeat" | "repeat_interval" | "repeat_weekdays">,
): string | null {
  if (r.repeat === "none") return null;
  const n = r.repeat_interval || 1;
  let text = n === 1 ? TASK_REPEAT_LABELS[r.repeat] : `Every ${n} ${REPEAT_UNIT[r.repeat]}s`;
  if (r.repeat === "weekly" && r.repeat_weekdays.length) {
    const days = [...r.repeat_weekdays].sort();
    if (n === 1 && days.join() === "1,2,3,4,5") return "Weekdays";
    if (n === 1 && days.length === 7) return "Daily";
    text += ` on ${days.map((d) => WEEKDAY_SHORT[d]).join(", ")}`;
  }
  return text;
}

/** describeTaskRepeat + ", until Dec 31" when the series has an end. */
export function describeTaskRepeatFull(task: Pick<Task, "repeat" | "repeat_interval" | "repeat_weekdays" | "repeat_until">) {
  const text = describeTaskRepeat(task);
  if (!text || !task.repeat_until) return text;
  return `${text}, until ${format(dueDay({ due_date: task.repeat_until })!, "MMM d, yyyy")}`;
}
