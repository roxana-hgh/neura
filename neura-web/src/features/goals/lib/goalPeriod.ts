import {
  addDays, addMonths, addQuarters, addWeeks, addYears, differenceInCalendarDays, endOfMonth, endOfQuarter, endOfWeek,
  endOfYear, format, parseISO, startOfMonth, startOfQuarter, startOfWeek, startOfYear, subDays,
} from "date-fns";
import type { WeekStartsOn } from "@/lib/weekStart";
import type { GoalMetric, GoalPeriod, ReminderPreset } from "@/features/goals/types/goal";

const key = (d: Date) => format(d, "yyyy-MM-dd");

export const PERIOD_OPTIONS: { value: GoalPeriod; label: string; group: string }[] = [
  { value: "weekly", label: "Week", group: "Weekly" },
  { value: "monthly", label: "Month", group: "Monthly" },
  { value: "quarterly", label: "Quarter", group: "Quarterly" },
  { value: "half_year", label: "6 months", group: "6 months" },
  { value: "yearly", label: "Year", group: "Yearly" },
  { value: "custom", label: "Custom", group: "Custom range" },
];

export const PERIOD_LABEL = Object.fromEntries(PERIOD_OPTIONS.map((p) => [p.value, p.label])) as Record<GoalPeriod, string>;

/**
 * Start / end days of the period containing today (`offset` 0) or the next one (`offset` 1).
 * Weeks follow the user's week start.
 */
export function periodRange(period: GoalPeriod, weekStartsOn: WeekStartsOn, offset = 0, today = new Date()) {
  switch (period) {
    case "weekly": {
      const d = addWeeks(today, offset);
      return { start: key(startOfWeek(d, { weekStartsOn })), end: key(endOfWeek(d, { weekStartsOn })) };
    }
    case "quarterly": {
      const d = addQuarters(today, offset);
      return { start: key(startOfQuarter(d)), end: key(endOfQuarter(d)) };
    }
    case "half_year": {
      const start = offset ? addMonths(startOfMonth(today), 1) : today;
      return { start: key(start), end: key(subDays(addMonths(start, 6), 1)) };
    }
    case "yearly": {
      const d = addYears(today, offset);
      return { start: key(startOfYear(d)), end: key(endOfYear(d)) };
    }
    case "custom":
      return { start: key(today), end: key(addDays(today, 29)) };
    default: {
      const d = addMonths(today, offset);
      return { start: key(startOfMonth(d)), end: key(endOfMonth(d)) };
    }
  }
}

/** "Oct 1 – 31", "Oct 1 – Dec 31", "Oct 1, 2026 – Mar 31, 2027". */
export function formatRange(startKey: string, endKey: string) {
  const s = parseISO(startKey);
  const e = parseISO(endKey);
  if (s.getFullYear() !== e.getFullYear()) return `${format(s, "MMM d, yyyy")} – ${format(e, "MMM d, yyyy")}`;
  if (s.getMonth() === e.getMonth()) return `${format(s, "MMM d")} – ${format(e, "d")}`;
  return `${format(s, "MMM d")} – ${format(e, "MMM d")}`;
}

/** "12 days left", "Ends today", "Starts in 3 days", "Ended Oct 20". */
export function timeLeftLabel(startKey: string, endKey: string, today = new Date()) {
  const toStart = differenceInCalendarDays(parseISO(startKey), today);
  if (toStart > 0) return `Starts in ${toStart} day${toStart === 1 ? "" : "s"}`;
  const left = differenceInCalendarDays(parseISO(endKey), today);
  if (left < 0) return `Ended ${format(parseISO(endKey), "MMM d")}`;
  if (left === 0) return "Ends today";
  return `${left} day${left === 1 ? "" : "s"} left`;
}

export const METRIC_OPTIONS: { value: GoalMetric; label: string; description: string }[] = [
  { value: "manual", label: "Self-assessed", description: "You rate how it's going" },
  { value: "numeric", label: "Number", description: "e.g. 50 km, 12 books, 80 → 72 kg" },
  { value: "milestone", label: "Milestones", description: "Progress = finished sub-goals" },
  { value: "task", label: "Tasks", description: "Progress = completed linked tasks" },
];

export const METRIC_LABEL = Object.fromEntries(METRIC_OPTIONS.map((m) => [m.value, m.label])) as Record<GoalMetric, string>;

/** Reminder presets offered on a new goal, and which are on by default for the period. */
export const PRESET_OPTIONS: { value: ReminderPreset; label: string; hint: string }[] = [
  { value: "review", label: "Weekly review", hint: "End of each week, 20:00" },
  { value: "checkin", label: "Monthly check-in", hint: "Once a month, 20:00" },
  { value: "deadline", label: "Before the deadline", hint: "A few days before the end, 09:00" },
];

export function defaultPresets(period: GoalPeriod): ReminderPreset[] {
  if (period === "weekly") return ["deadline"];
  if (period === "monthly" || period === "custom") return ["review", "deadline"];
  return ["review", "checkin", "deadline"];
}

export const GOAL_CATEGORIES = ["Health", "Career", "Learning", "Finance", "Personal", "Relationships"];
