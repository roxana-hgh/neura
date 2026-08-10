import { addDays } from "date-fns";
import type { DurationUnit, Habit } from "../../../../types/habit";


export function unitToDays(unit: DurationUnit, value: number): number {
  if (unit === "day") return value;
  if (unit === "week") return value * 7;
  return value * 30; // month, approximated
}

export function habitDueDate(habit: Habit): Date | null {
  if (habit.durationDays == null) return null;
  return addDays(new Date(habit.startDate), habit.durationDays);
}