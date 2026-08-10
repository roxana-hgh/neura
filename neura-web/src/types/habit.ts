export type HabitView = "week" | "month" | "year" | "all";
export type DurationUnit = "day" | "week" | "month";

export interface Habit {
  id: string;
  title: string;
  color: string;
  startDate: string;
  durationDays: number | null; // null = no due date, tracks forever
  isArchived: boolean;
  entries: string[];
  stats: { completed: number; total: number; percent: number };
}

export interface HabitsResponse {
  habits: Habit[];
  rangeStart: string;
  rangeEnd: string;
  currentPercent: number;
  previousPercent: number;
}

export interface CreateHabitInput {
  title: string;
  color: string;
  durationDays: number | null;
}

export interface UpdateHabitInput {
  id: string;
  title?: string;
  color?: string;
  durationDays?: number | null;
}