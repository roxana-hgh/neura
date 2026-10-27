import { format } from "date-fns";

/** Calendar-day key used for habit entries and streaks, e.g. "2026-02-04". */
export const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

/** First day of the week (date-fns `weekStartsOn`): Saturday, Sunday or Monday. */
export type WeekStartsOn = 0 | 1 | 6;
export const WEEK_START_DAYS: readonly WeekStartsOn[] = [6, 0, 1];
export const DEFAULT_WEEK_STARTS_ON: WeekStartsOn = 1;
export const isWeekStartsOn = (v: unknown): v is WeekStartsOn => WEEK_START_DAYS.includes(v as WeekStartsOn);
