import { TZDate } from "@date-fns/tz";
import { addDays, addMonths, addWeeks, addYears, differenceInCalendarWeeks } from "date-fns";

export const REPEATS = ["none", "daily", "weekly", "monthly", "yearly"] as const;
export type Repeat = (typeof REPEATS)[number];

export interface RepeatRule {
  repeat: Repeat;
  interval: number; // every N days / weeks / months / years
  weekdays: number[]; // weekly only: 0 = Sunday … 6 = Saturday; empty = the start's weekday
  repeatUntil: Date | null;
}

export const isValidTimeZone = (tz: unknown): tz is string => {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/**
 * The first occurrence strictly after `after`, or null when the series is over.
 * Wall-clock time is kept in `timeZone`, so "every day at 09:00" stays at 09:00 across DST.
 * Daily / monthly / yearly steps are counted from `startAt`, so "monthly on the 31st" goes
 * Jan 31 → Feb 28 → Mar 31 instead of drifting to the 28th.
 */
export function nextOccurrence(rule: RepeatRule, startAt: Date, after: Date, timeZone: string): Date | null {
  if (rule.repeat === "none") return null;
  const start = new TZDate(startAt.getTime(), timeZone);
  const interval = Math.max(1, rule.interval);
  let next: Date | null = null;

  if (rule.repeat === "weekly" && rule.weekdays.length > 0) {
    // scan day by day; a day matches when it's one of the weekdays in an "on" week
    const days = new Set(rule.weekdays);
    const from = new Date(Math.max(after.getTime(), startAt.getTime() - 1));
    // the start's wall-clock time on `from`'s calendar day
    const base = addDays(start, differenceInDays(start, from));
    for (let i = 0; i <= 7 * interval + 7; i++) {
      const day = addDays(base, i);
      if (day.getTime() <= after.getTime() || day.getTime() < startAt.getTime()) continue;
      if (!days.has(day.getDay())) continue;
      if (differenceInCalendarWeeks(day, start) % interval !== 0) continue;
      next = day;
      break;
    }
  } else {
    const step = (n: number): Date => {
      switch (rule.repeat) {
        case "daily": return addDays(start, n * interval);
        case "weekly": return addWeeks(start, n * interval);
        case "monthly": return addMonths(start, n * interval);
        default: return addYears(start, n * interval);
      }
    };
    // jump close to `after` first so long-running daily series don't loop for years
    const approxDays = { daily: 1, weekly: 7, monthly: 28, yearly: 365 }[rule.repeat as Exclude<Repeat, "none">] * interval;
    let n = Math.max(0, Math.floor((after.getTime() - startAt.getTime()) / (approxDays * 86_400_000)) - 1);
    while (step(n).getTime() <= after.getTime()) n++;
    next = step(n);
  }

  if (next && rule.repeatUntil && next.getTime() > rule.repeatUntil.getTime()) return null;
  return next ? new Date(next.getTime()) : null;
}

/** Whole calendar days from `a` to `b` in `a`'s time zone (can be negative). */
function differenceInDays(a: TZDate, b: Date) {
  const tz = a.timeZone ?? "UTC";
  const bz = new TZDate(b.getTime(), tz);
  const dayA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const dayB = Date.UTC(bz.getFullYear(), bz.getMonth(), bz.getDate());
  return Math.round((dayB - dayA) / 86_400_000);
}

/** A wall-clock moment in `timeZone`, e.g. ("2026-11-01", 9, 0, "Asia/Tehran"). */
export function zonedTime(dayKey: string, hours: number, minutes: number, timeZone: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(new TZDate(y, m - 1, d, hours, minutes, 0, timeZone).getTime());
}
