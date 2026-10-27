import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  addDays, addWeeks, addMonths, addYears, parseISO, differenceInCalendarDays,
} from "date-fns";
import { dayKey, type WeekStartsOn } from "@/utils/date";

export type HabitView = "week" | "month" | "year" | "all";
export const HABIT_VIEWS: HabitView[] = ["week", "month", "year", "all"];
type HabitDates = { startDate: Date; durationDays: number | null };

/**
 * Everything here works on "yyyy-MM-dd" day keys so ranges don't drift with the
 * server's or the client's time zone. Keys compare correctly as plain strings.
 */
const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDayKey = (v: unknown): v is string => typeof v === "string" && DAY_KEY_RE.test(v);

/** Entries (and start dates picked by the user) are stored at UTC midnight of their day. */
export const keyToStoredDate = (key: string) => new Date(`${key}T00:00:00.000Z`);
export const storedDateToKey = (d: Date) => d.toISOString().slice(0, 10);

const shiftKey = (key: string, days: number) => dayKey(addDays(parseISO(key), days));

/** First trackable day of a habit. */
export const habitStartKey = (h: HabitDates) => storedDateToKey(h.startDate);

/** Last trackable day, or null when the habit has no due date and tracks forever. */
export function habitLastKey(h: HabitDates): string | null {
  return h.durationDays != null ? shiftKey(habitStartKey(h), Math.max(1, h.durationDays) - 1) : null;
}

export function getRange(
  view: HabitView, baseKey: string, earliestKey: string, todayKey: string, weekStartsOn: WeekStartsOn,
) {
  const base = parseISO(baseKey);
  const toKeys = (start: Date, end: Date) => ({ start: dayKey(start), end: dayKey(end) });
  switch (view) {
    case "week": return toKeys(startOfWeek(base, { weekStartsOn }), endOfWeek(base, { weekStartsOn }));
    case "month": return toKeys(startOfMonth(base), endOfMonth(base));
    case "year": return toKeys(startOfYear(base), endOfYear(base));
    case "all": return { start: earliestKey < todayKey ? earliestKey : todayKey, end: todayKey };
  }
}

export function shiftRange(view: HabitView, key: string, direction: 1 | -1) {
  const base = parseISO(key);
  switch (view) {
    case "week": return dayKey(addWeeks(base, direction));
    case "month": return dayKey(addMonths(base, direction));
    case "year": return dayKey(addYears(base, direction));
    case "all": return key;
  }
}

/** habitId -> set of "yyyy-MM-dd" days with an entry. */
export function groupEntriesByHabit(entries: { habitId: string; date: Date }[]) {
  const byHabit = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!byHabit.has(e.habitId)) byHabit.set(e.habitId, new Set());
    byHabit.get(e.habitId)!.add(storedDateToKey(e.date));
  }
  return byHabit;
}

/**
 * Completed vs. trackable days for one habit inside [rangeStart, rangeEnd],
 * clipped to the habit's own lifetime (start day → last day / today).
 */
export function habitPeriodStats(
  habit: HabitDates,
  doneDays: Set<string>,
  rangeStart: string,
  rangeEnd: string,
  todayKey: string,
) {
  const lastKey = habitLastKey(habit);
  const startKey = habitStartKey(habit);
  const from = rangeStart > startKey ? rangeStart : startKey;
  const to = [rangeEnd, todayKey, ...(lastKey ? [lastKey] : [])].sort()[0];

  const total = from > to ? 0 : differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
  let completed = 0;
  for (const d of doneDays) if (d >= from && d <= to) completed++;
  return { completed, total };
}

export const toPercent = (completed: number, total: number) =>
  total > 0 ? Math.round((completed / total) * 100) : 0;

/** Consecutive days completed, counting back from today (or yesterday if today isn't done yet). */
export function currentStreak(doneDays: Set<string>, now: Date | string) {
  const todayKey = typeof now === "string" ? now : dayKey(now);
  const doneToday = doneDays.has(todayKey);
  let streak = 0;
  let cursor = doneToday ? todayKey : shiftKey(todayKey, -1);
  while (doneDays.has(cursor)) {
    streak++;
    cursor = shiftKey(cursor, -1);
  }
  return { doneToday, streak };
}

/** Longest run of consecutive completed days ever. */
export function bestStreak(doneDays: Set<string>) {
  const keys = [...doneDays].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of keys) {
    run = prev !== null && shiftKey(prev, 1) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}

