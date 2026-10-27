export type HabitView = "week" | "month" | "year" | "all";
export type DurationUnit = "day" | "week" | "month";

/** All `*Key` fields and `entries` are calendar days, "yyyy-MM-dd". */
export interface Habit {
  id: string;
  title: string;
  color: string;
  startDate: string;
  durationDays: number | null; // null = no due date, tracks forever
  isArchived: boolean;
  startKey: string; // first trackable day
  lastKey: string | null; // last trackable day, null = forever
  entries: string[]; // completed days inside the requested range
  stats: { completed: number; total: number; percent: number }; // for the requested range
  streak: { current: number; best: number };
  doneToday: boolean;
  totalCompleted: number; // all-time
}

export interface HabitsResponse {
  habits: Habit[];
  rangeStart: string; // "yyyy-MM-dd"
  rangeEnd: string; // "yyyy-MM-dd"
  today: string; // "yyyy-MM-dd"
  currentPercent: number;
  previousPercent: number;
}

export interface CreateHabitInput {
  title: string;
  color: string;
  durationDays: number | null;
  startDate: string;
}

export interface UpdateHabitInput {
  id: string;
  title?: string;
  color?: string;
  durationDays?: number | null;
  startDate?: string;
}
