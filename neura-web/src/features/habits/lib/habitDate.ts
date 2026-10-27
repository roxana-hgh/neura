import {
  addDays, addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO,
} from "date-fns";
import type { DurationUnit, Habit, HabitView } from "@/features/habits/types/habit";

/** Local calendar day <-> "yyyy-MM-dd". Never use toISOString() for this (see CLAUDE.md "Dates"). */
export const toDayKey = (d: Date) => format(d, "yyyy-MM-dd");
export const fromDayKey = (key: string) => parseISO(key);

export function unitToDays(unit: DurationUnit, value: number): number {
  if (unit === "day") return value;
  if (unit === "week") return value * 7;
  return value * 30; // month, approximated
}

/** Reverse of unitToDays. */
export function daysToDurationInput(days: number): { value: number; unit: DurationUnit } {
  if (days % 30 === 0) return { value: days / 30, unit: "month" };
  if (days % 7 === 0) return { value: days / 7, unit: "week" };
  return { value: days, unit: "day" };
}

export function durationLabel(durationDays: number | null) {
  if (durationDays == null) return "Every day, no end date";
  const { value, unit } = daysToDurationInput(durationDays);
  return `${value} ${unit}${value > 1 ? "s" : ""}`;
}

/** Last trackable day for a start day + duration, mirrors the API's habitLastKey. */
export function lastDayKey(startKey: string, durationDays: number | null): string | null {
  if (durationDays == null) return null;
  return toDayKey(addDays(fromDayKey(startKey), Math.max(1, durationDays) - 1));
}

export function habitDueDate(habit: Habit): Date | null {
  return habit.lastKey ? fromDayKey(habit.lastKey) : null;
}

/** "Ends Nov 9", "Ended Nov 9" or null for habits that track forever. */
export function habitEndLabel(habit: Habit, todayKey: string) {
  if (!habit.lastKey) return null;
  const date = format(fromDayKey(habit.lastKey), "MMM d");
  if (habit.lastKey < todayKey) return `Ended ${date}`;
  const left = differenceInCalendarDays(fromDayKey(habit.lastKey), fromDayKey(todayKey)) + 1;
  return `${left} day${left > 1 ? "s" : ""} left`;
}

export type CellState = "done" | "open" | "inactive" | "future";

/**
 * done / open: trackable and clickable.
 * inactive: outside the habit's lifetime (before start or after the last day).
 * future: after today.
 */
export function getCellState(habit: Habit, key: string, todayKey: string, done: boolean): CellState {
  if (key > todayKey) return "future";
  if (key < habit.startKey || (habit.lastKey !== null && key > habit.lastKey)) return "inactive";
  return done ? "done" : "open";
}

export function shiftAnchor(view: HabitView, date: Date, dir: 1 | -1) {
  if (view === "week") return addWeeks(date, dir);
  if (view === "month") return addMonths(date, dir);
  if (view === "year") return addYears(date, dir);
  return date;
}

export function formatRangeTitle(view: HabitView, startKey: string, endKey: string) {
  const start = fromDayKey(startKey);
  const end = fromDayKey(endKey);
  if (view === "month") return format(start, "MMMM yyyy");
  if (view === "year") return format(start, "yyyy");
  if (view === "all") return `Since ${format(start, "MMM d, yyyy")}`;
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  if (sameYear) return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}
