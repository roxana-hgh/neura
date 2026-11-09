import { isBefore, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import type { Task } from "@/features/tasks/types/task";

export type Meridiem = "AM" | "PM";

/** "20:30" → { hour: 8, minute: 30, meridiem: "PM" } (hour 1–12) */
export function to12h(time: string): { hour: number; minute: number; meridiem: Meridiem } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h % 12 || 12, minute: m, meridiem: h < 12 ? "AM" : "PM" };
}

/** 8, 30, "PM" → "20:30" */
export function from12h(hour: number, minute: number, meridiem: Meridiem): string {
  const h = (hour % 12) + (meridiem === "PM" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "20:30" → "8:30 PM" (how a deadline time is shown everywhere) */
export function formatDueTime(time: string): string {
  const { hour, minute, meridiem } = to12h(time);
  return `${hour}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Free-typed time → "HH:mm", or null when it can't be read.
 * Accepts "20", "20:30", "2030", "8pm", "8:30 pm", "8.30a", "12am", Persian / Arabic digits and
 * "ق.ظ" / "ب.ظ" / "صبح" / "عصر" / "شب". A bare number is 24h ("8" = 8 AM, "20" = 8 PM).
 */
export function parseTimeInput(input: string): string | null {
  let text = input
    .trim()
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[٫:]/g, ":");

  let meridiem: Meridiem | null = null;
  const pm = /(p\.?\s*m\.?|p|ب\.?\s*ظ\.?|بعد\s*از\s*ظهر|بعدازظهر|عصر|شب)$/;
  const am = /(a\.?\s*m\.?|a|ق\.?\s*ظ\.?|قبل\s*از\s*ظهر|صبح)$/;
  if (pm.test(text)) {
    meridiem = "PM";
    text = text.replace(pm, "");
  } else if (am.test(text)) {
    meridiem = "AM";
    text = text.replace(am, "");
  }
  text = text.replace(/^ساعت\s*/, "").trim();

  const match = /^(\d{1,2})(?:\s*[:.\s]?\s*(\d{2}))?$/.exec(text);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  if (minute > 59) return null;

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    return from12h(hour, minute, meridiem);
  }
  if (hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Rounds "HH:mm" to the nearest 5 minutes, never past 23:55. */
export function snapTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(Math.round((h * 60 + m) / 5) * 5, 23 * 60 + 55);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** The due day at local midnight. Old tasks have no time, so they stay "all day". */
export function dueDay(task: Pick<Task, "due_date">): Date | null {
  if (!task.due_date) return null;
  // stored as the day at UTC midnight: the first 10 chars are the day the user picked
  return parseISO(task.due_date.slice(0, 10));
}

/** "14:30" → the given day at 14:30 local time. */
export function atTime(day: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return setMinutes(setHours(startOfDay(day), h), m);
}

/** The exact deadline when the task has a time, else null (all day). */
export function dueAt(task: Pick<Task, "due_date" | "due_time">): Date | null {
  const day = dueDay(task);
  return day && task.due_time ? atTime(day, task.due_time) : null;
}

/** Open and past its deadline: the time when it has one, otherwise the end of the due day. */
export function isPastDue(task: Pick<Task, "due_date" | "due_time" | "completed">, now = new Date()): boolean {
  if (task.completed) return false;
  const day = dueDay(task);
  if (!day) return false;
  const at = dueAt(task);
  return at ? isBefore(at, now) : isBefore(day, startOfDay(now));
}

/** Within a day: tasks with a time first (earliest first), then all-day ones. */
export function compareDueTime(a: Pick<Task, "due_time">, b: Pick<Task, "due_time">): number {
  if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
  if (a.due_time) return -1;
  if (b.due_time) return 1;
  return 0;
}
