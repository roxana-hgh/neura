export type HabitView = "week" | "month" | "year" | "all";

export interface Habit {
  id: string;
  title: string;
  color: string;
  startDate: string;
  endDate: string;
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
  durationWeeks?: number;
}

export interface UpdateHabitInput {
  id: string;
  title?: string;
  color?: string;
  durationWeeks?: number;
}