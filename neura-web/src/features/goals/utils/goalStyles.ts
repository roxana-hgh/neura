import type { colors } from "@/types/color";
import type { GoalPace, GoalStatus } from "@/features/goals/types/goal";

export const GOAL_COLOR_OPTIONS: colors[] = ["blue", "green", "purple", "pink", "orange", "yellow", "red", "gray"];

/** Dot / bar fill per goal color. */
export const GOAL_COLORS: Record<colors, { dot: string; bar: string; text: string }> = {
  blue: { dot: "bg-blue-500", bar: "bg-blue-500", text: "text-blue-500" },
  green: { dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-500" },
  red: { dot: "bg-rose-500", bar: "bg-rose-500", text: "text-rose-500" },
  yellow: { dot: "bg-yellow-500", bar: "bg-yellow-500", text: "text-yellow-500" },
  orange: { dot: "bg-orange-500", bar: "bg-orange-500", text: "text-orange-500" },
  pink: { dot: "bg-pink-500", bar: "bg-pink-500", text: "text-pink-500" },
  purple: { dot: "bg-violet-500", bar: "bg-violet-500", text: "text-violet-500" },
  gray: { dot: "bg-slate-500", bar: "bg-slate-500", text: "text-slate-500" },
};

export const goalColor = (c: string) => GOAL_COLORS[c as colors] ?? GOAL_COLORS.blue;

export const STATUS_STYLES: Record<GoalStatus, { label: string; badge: string }> = {
  active: { label: "Active", badge: "bg-primary/10 text-primary" },
  paused: { label: "Paused", badge: "bg-muted text-muted-foreground" },
  completed: { label: "Completed", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", badge: "bg-muted text-muted-foreground line-through" },
};

/** Amber, never red: a passed deadline isn't a failure. */
export const NEEDS_REVIEW_BADGE = "bg-amber-500/10 text-amber-700 dark:text-amber-400";

export const PACE_STYLES: Record<GoalPace, { label: string; text: string }> = {
  ahead: { label: "Ahead", text: "text-emerald-600 dark:text-emerald-400" },
  on_track: { label: "On track", text: "text-sky-600 dark:text-sky-400" },
  behind: { label: "Behind", text: "text-amber-600 dark:text-amber-400" },
};

/** "32 / 50 km", "64%", … the headline number of a goal. */
export function progressValueLabel(g: {
  metric: string; currentValue: number; targetValue: number | null; unit: string | null; progress: number;
}) {
  if (g.metric === "numeric" && g.targetValue !== null) {
    const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
    return `${fmt(g.currentValue)} / ${fmt(g.targetValue)}${g.unit ? ` ${g.unit}` : ""}`;
  }
  return `${g.progress}%`;
}
