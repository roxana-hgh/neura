import {
  addDays, addHours, addMinutes, differenceInCalendarDays, format, isPast, isToday, isTomorrow, set, startOfDay,
} from "date-fns";
import type { Reminder, ReminderRepeat } from "@/features/reminders/types/reminder";

export const userTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Local date + "HH:mm" → Date. */
export function combineDateTime(dateKey: string, time: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

/** "Today 09:00", "Tomorrow 18:30", "Fri 09:00", "Nov 12 09:00", "Nov 12, 2027 09:00". */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  const time = format(d, "HH:mm");
  if (isToday(d)) return `Today ${time}`;
  if (isTomorrow(d)) return `Tomorrow ${time}`;
  const diff = differenceInCalendarDays(d, new Date());
  if (diff === -1) return `Yesterday ${time}`;
  if (diff > 1 && diff < 7) return `${format(d, "EEE")} ${time}`;
  if (d.getFullYear() === new Date().getFullYear()) return `${format(d, "MMM d")} ${time}`;
  return `${format(d, "MMM d, yyyy")} ${time}`;
}

/** "Daily", "Every 2 weeks on Mon, Wed", "Monthly", … or null for one-off reminders. */
export function describeRepeat(r: Pick<Reminder, "repeat" | "interval" | "weekdays">): string | null {
  if (r.repeat === "none") return null;
  const n = r.interval;
  const unit = { daily: "day", weekly: "week", monthly: "month", yearly: "year" }[r.repeat];
  let text = n === 1 ? { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" }[r.repeat] : `Every ${n} ${unit}s`;
  if (r.repeat === "weekly" && r.weekdays.length) {
    const days = [...r.weekdays].sort();
    if (n === 1 && days.join() === "1,2,3,4,5") return "Weekdays";
    if (n === 1 && days.length === 7) return "Daily";
    text += ` on ${days.map((d) => WEEKDAY_SHORT[d]).join(", ")}`;
  }
  return text;
}

export const isOverdue = (r: Pick<Reminder, "nextAt" | "status">) => r.status === "active" && isPast(new Date(r.nextAt));

export interface TimePreset {
  label: string;
  at: () => Date;
}

/** Quick picks for a new reminder's time. */
export function quickTimePresets(now = new Date()): TimePreset[] {
  const evening = set(now, { hours: 18, minutes: 0, seconds: 0, milliseconds: 0 });
  return [
    { label: "In 1 hour", at: () => roundUp(addHours(new Date(), 1)) },
    ...(now < addHours(evening, -1) ? [{ label: "This evening", at: () => evening }] : []),
    { label: "Tomorrow 9:00", at: () => set(addDays(startOfDay(new Date()), 1), { hours: 9 }) },
    { label: "Next week", at: () => set(addDays(startOfDay(new Date()), 7), { hours: 9 }) },
  ];
}

/** Snooze choices; "This evening" only while it's still ahead. */
export function snoozePresets(now = new Date()): TimePreset[] {
  const evening = set(now, { hours: 18, minutes: 0, seconds: 0, milliseconds: 0 });
  return [
    { label: "10 minutes", at: () => addMinutes(new Date(), 10) },
    { label: "1 hour", at: () => addHours(new Date(), 1) },
    ...(now < evening ? [{ label: "This evening (18:00)", at: () => evening }] : []),
    { label: "Tomorrow 9:00", at: () => set(addDays(startOfDay(new Date()), 1), { hours: 9 }) },
  ];
}

/** Next quarter hour, so "in 1 hour" gives 15:15 rather than 15:07. */
function roundUp(d: Date) {
  const m = d.getMinutes();
  return set(d, { minutes: Math.ceil(m / 15) * 15, seconds: 0, milliseconds: 0 });
}

export type ReminderGroup = "overdue" | "today" | "tomorrow" | "week" | "later" | "paused";

export const GROUP_LABELS: Record<ReminderGroup, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "Next 7 days",
  later: "Later",
  paused: "Paused",
};

export function groupOf(r: Reminder): ReminderGroup {
  if (r.status === "paused") return "paused";
  const d = new Date(r.nextAt);
  if (isPast(d)) return "overdue";
  if (isToday(d)) return "today";
  if (isTomorrow(d)) return "tomorrow";
  return differenceInCalendarDays(d, new Date()) < 7 ? "week" : "later";
}

export const REPEAT_LABELS: Record<ReminderRepeat, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export const WEEKDAY_LETTERS = WEEKDAY_SHORT;
