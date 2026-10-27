import type { Goal } from "@prisma/client";
import {
  addDays, addMonths, differenceInCalendarDays, endOfMonth, endOfQuarter, endOfWeek, endOfYear,
  parseISO, startOfMonth, startOfQuarter, startOfWeek, startOfYear, subDays,
} from "date-fns";
import { dayKey, type WeekStartsOn } from "@/utils/date";

export const GOAL_PERIODS = ["weekly", "monthly", "quarterly", "half_year", "yearly", "custom"] as const;
export type GoalPeriod = (typeof GOAL_PERIODS)[number];
export const GOAL_METRICS = ["numeric", "milestone", "task", "manual"] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];
export const GOAL_STATUSES = ["active", "paused", "completed", "cancelled"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];
export const REMINDER_PRESETS = ["review", "checkin", "deadline"] as const;
export type ReminderPreset = (typeof REMINDER_PRESETS)[number];

/** Default start/end days ("yyyy-MM-dd") of a period that contains `todayKey`. */
export function periodRange(period: GoalPeriod, todayKey: string, weekStartsOn: WeekStartsOn) {
  const d = parseISO(todayKey);
  switch (period) {
    case "weekly": return { start: dayKey(startOfWeek(d, { weekStartsOn })), end: dayKey(endOfWeek(d, { weekStartsOn })) };
    case "quarterly": return { start: dayKey(startOfQuarter(d)), end: dayKey(endOfQuarter(d)) };
    case "half_year": return { start: todayKey, end: dayKey(subDays(addMonths(d, 6), 1)) };
    case "yearly": return { start: dayKey(startOfYear(d)), end: dayKey(endOfYear(d)) };
    case "custom": return { start: todayKey, end: dayKey(addDays(d, 29)) };
    default: return { start: dayKey(startOfMonth(d)), end: dayKey(endOfMonth(d)) };
  }
}

type ProgressGoal = Pick<Goal, "metric" | "status" | "startValue" | "targetValue" | "currentValue">;
type Done = { completed: boolean };

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** 0–100 for a goal that has no sub-goals of its own (a sub-goal, or a top-level one before it gets any). */
function ownProgress(g: ProgressGoal, tasks: Done[]): number {
  switch (g.metric) {
    case "numeric": {
      if (g.targetValue === null) return 0;
      const span = g.targetValue - g.startValue;
      if (span === 0) return g.currentValue === g.targetValue ? 100 : 0;
      // works for decreasing targets too (80 kg → 72 kg)
      return clamp(((g.currentValue - g.startValue) / span) * 100);
    }
    case "manual": return clamp(g.currentValue);
    case "task": return tasks.length ? (tasks.filter((t) => t.completed).length / tasks.length) * 100 : 0;
    default: return 0; // milestone without sub-goals
  }
}

/** A sub-goal counts as 100 once it's completed; otherwise by its own metric. */
export const subGoalProgress = (s: ProgressGoal, tasks: Done[]) =>
  Math.round(s.status === "completed" ? 100 : ownProgress(s, tasks));

/**
 * 0–100. Milestone goals average their sub-goals; task goals count the tasks linked to
 * the goal and to its sub-goals. Reaching 100 doesn't complete the goal — the user does.
 */
export function goalProgress(
  g: ProgressGoal, tasks: Done[], subGoals: (ProgressGoal & { tasks: Done[] })[],
): number {
  if (g.metric === "milestone") {
    if (!subGoals.length) return 0;
    return Math.round(subGoals.reduce((sum, s) => sum + subGoalProgress(s, s.tasks), 0) / subGoals.length);
  }
  if (g.metric === "task") return Math.round(ownProgress(g, [...tasks, ...subGoals.flatMap((s) => s.tasks)]));
  return Math.round(ownProgress(g, tasks));
}

export type Pace = "ahead" | "on_track" | "behind";

/** How far along the time window is (0–100), and whether progress keeps up with it. */
export function goalPace(startKey: string, endKey: string, todayKey: string, progress: number, status: string) {
  const total = differenceInCalendarDays(parseISO(endKey), parseISO(startKey)) + 1;
  const elapsed = differenceInCalendarDays(parseISO(todayKey), parseISO(startKey)) + 1;
  const expected = Math.round(clamp((elapsed / Math.max(1, total)) * 100));
  let pace: Pace | null = null;
  if (status === "active" && todayKey >= startKey && todayKey <= endKey) {
    pace = progress >= expected + 10 ? "ahead" : progress >= expected - 10 ? "on_track" : "behind";
  }
  return { expectedProgress: expected, pace };
}

/** How many days before the end the "deadline" reminder fires. */
export const deadlineLeadDays = (period: string) => (period === "weekly" ? 1 : 3);

export function autoReminderTitle(kind: string, goalTitle: string, period: string) {
  switch (kind) {
    case "review": return `Weekly review: ${goalTitle}`;
    case "checkin": return `Monthly check-in: ${goalTitle}`;
    default: {
      const n = deadlineLeadDays(period);
      return `${goalTitle} ends in ${n} day${n === 1 ? "" : "s"}`;
    }
  }
}
