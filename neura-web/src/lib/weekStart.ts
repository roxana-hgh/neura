import { addDays, format, startOfWeek } from "date-fns";

/** First day of the week, as date-fns `weekStartsOn`: 6 = Saturday, 0 = Sunday, 1 = Monday. */
export type WeekStartsOn = 0 | 1 | 6;

export const DEFAULT_WEEK_STARTS_ON: WeekStartsOn = 1;

export const WEEK_START_OPTIONS: { value: WeekStartsOn; label: string }[] = [
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
];

/** Weekday names in display order for the given week start, e.g. "EEE" → ["Mon", "Tue", …]. */
export function getWeekdayLabels(weekStartsOn: WeekStartsOn, pattern = "EEE"): string[] {
  const first = startOfWeek(new Date(), { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => format(addDays(first, i), pattern));
}
