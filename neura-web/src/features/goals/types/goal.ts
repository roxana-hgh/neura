import type { colors } from "@/types/color";

export type GoalPeriod = "weekly" | "monthly" | "quarterly" | "half_year" | "yearly" | "custom";
export type GoalMetric = "numeric" | "milestone" | "task" | "manual";
export type GoalStatus = "active" | "paused" | "completed" | "cancelled";
export type GoalPace = "ahead" | "on_track" | "behind";
export type ReminderPreset = "review" | "checkin" | "deadline";

/** `startDate` / `endDate` are calendar days, "yyyy-MM-dd". */
export interface GoalBase {
  id: string;
  parentId: string | null;
  title: string;
  successCriteria: string | null;
  description: string | null;
  category: string | null;
  color: colors;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  metric: GoalMetric;
  startValue: number;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  status: GoalStatus;
  completedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  progress: number; // 0–100
  expectedProgress: number; // share of the time window that has passed
  pace: GoalPace | null;
  /** active, and the end date has passed: the user decides (complete / extend / cancel) */
  needsReview: boolean;
}

export interface Goal extends GoalBase {
  counts: { subGoals: number; subGoalsDone: number; tasks: number; tasksDone: number };
  nextReminder: { nextAt: string; title: string } | null;
}

export interface SubGoal extends GoalBase {
  counts: { tasks: number; tasksDone: number; reminders: number };
}

export type GoalLogType = "created" | "progress" | "note" | "status" | "extended" | "metric_changed";

export interface GoalLog {
  id: string;
  type: GoalLogType;
  value: number | null;
  note: string | null;
  meta: { from?: string | number; to?: string | number } | null;
  createdAt: string;
}

/** Raw task row from the API (camelCase, as Prisma returns it). */
export interface GoalTask {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  description: string | null;
  dueDate: string | null;
  createdAt: string;
  goalId: string | null;
  /** false = only shown here, not on the Tasks page / calendar */
  showInTasks: boolean;
}

/** Body of PATCH /goals/:id/tasks/:taskId (snake_case like the task endpoints). */
export interface GoalTaskInput {
  title?: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  due_date?: string | null;
  show_in_tasks?: boolean;
}

export interface GoalDetail extends Goal {
  parent: { id: string; title: string } | null;
  subGoals: SubGoal[];
  tasks: GoalTask[];
  notes: { id: string; title: string; color: colors; updatedAt: string }[];
  logs: GoalLog[];
}

export interface LinkedReminder {
  id: string;
  title: string;
  origin: "manual" | "goal_auto";
  repeat: string;
  nextAt: string;
  status: string;
  goalId: string;
}

/** Body of POST /goals and PATCH /goals/:id (snake_case, as the API expects). */
export interface GoalInput {
  title?: string;
  success_criteria?: string | null;
  description?: string | null;
  category?: string | null;
  color?: colors;
  period?: GoalPeriod;
  start_date?: string;
  end_date?: string;
  metric?: GoalMetric;
  start_value?: number;
  target_value?: number | null;
  unit?: string | null;
  parent_id?: string;
  reminder_presets?: ReminderPreset[];
  time_zone?: string;
}
