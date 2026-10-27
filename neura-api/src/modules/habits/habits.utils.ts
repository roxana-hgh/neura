import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  addDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, subDays,
  min as minDate, max as maxDate, differenceInCalendarDays,
} from "date-fns";
import { dayKey } from "@/utils/date";

export type HabitView = "week" | "month" | "year" | "all";
type HabitDates = { startDate: Date; durationDays: number | null };

/** null = the habit has no due date and tracks forever. */
export function habitDueDate(h: HabitDates): Date | null {
  return h.durationDays != null ? addDays(h.startDate, h.durationDays) : null;
}

export function getRange(view: HabitView, dateStr: string | undefined, earliest: Date | null) {
  const base = dateStr ? new Date(dateStr) : new Date();
  switch (view) {
    case "week": return { start: startOfWeek(base, { weekStartsOn: 1 }), end: endOfWeek(base, { weekStartsOn: 1 }) };
    case "month": return { start: startOfMonth(base), end: endOfMonth(base) };
    case "year": return { start: startOfYear(base), end: endOfYear(base) };
    case "all": return { start: earliest ?? new Date(), end: new Date() };
  }
}

export function shiftRange(view: HabitView, date: Date, direction: 1 | -1) {
  switch (view) {
    case "week": return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
    case "month": return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
    case "year": return direction === 1 ? addYears(date, 1) : subYears(date, 1);
    case "all": return date;
  }
}

/** habitId -> set of "yyyy-MM-dd" days with an entry. */
export function groupEntriesByHabit(entries: { habitId: string; date: Date }[]) {
  const byHabit = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!byHabit.has(e.habitId)) byHabit.set(e.habitId, new Set());
    byHabit.get(e.habitId)!.add(dayKey(e.date));
  }
  return byHabit;
}

/**
 * Completed vs. trackable days for one habit inside [rangeStart, rangeEnd],
 * clipped to the habit's own lifetime (start date → due date / now).
 */
export function habitPeriodStats(
  habit: HabitDates,
  doneDays: Set<string>,
  rangeStart: Date,
  rangeEnd: Date,
  now: Date,
) {
  const due = habitDueDate(habit);
  const cellStart = maxDate([rangeStart, habit.startDate]);
  const cellEndCandidates = [rangeEnd, now];
  if (due) cellEndCandidates.push(due);
  const cellEnd = minDate(cellEndCandidates);

  const total = Math.max(0, differenceInCalendarDays(cellEnd, cellStart) + 1);
  let completed = 0;
  for (const d of doneDays) {
    const dd = new Date(d);
    if (dd >= cellStart && dd <= cellEnd) completed++;
  }
  return { completed, total };
}

export const toPercent = (completed: number, total: number) =>
  total > 0 ? Math.round((completed / total) * 100) : 0;

/** Consecutive days completed, counting back from today (or yesterday if today isn't done yet). */
export function currentStreak(doneDays: Set<string>, now: Date) {
  const doneToday = doneDays.has(dayKey(now));
  let streak = 0;
  let cursor = doneToday ? now : subDays(now, 1);
  while (doneDays.has(dayKey(cursor))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return { doneToday, streak };
}
