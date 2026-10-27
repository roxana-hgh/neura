import { format } from "date-fns";
import type { Habit } from "@/features/habits/types/habit";
import { habitDueDate } from "@/features/habits/lib/habitDate";
import { useToggleHabitEntry } from "@/features/habits/hooks/useHabits";
import { cn } from "@/lib/utils";


interface DaySquareProps {
  date: Date;
  habit: Habit;
  size?: "xs" | "sm" | "md";
}

const SIZE_CLASS = { xs: "h-2.5 w-2.5", sm: "h-4 w-4", md: "h-7 w-7" };

export function DaySquare({ date, habit, size = "md" }: DaySquareProps) {
  const key = format(date, "yyyy-MM-dd");
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const checked = habit.entries.includes(key);
  const due = habitDueDate(habit);

  const disabled =
    key < habit.startDate.slice(0, 10) ||
    (due !== null && key > format(due, "yyyy-MM-dd")) ||
    key > todayKey;

  const { mutate: toggle } = useToggleHabitEntry();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => toggle({ habitId: habit.id, date: key })}
      title={format(date, "MMM d, yyyy")}
      className={cn(
        "rounded-[4px] transition shrink-0",
        SIZE_CLASS[size],
        disabled && "opacity-80 bg-muted",
        !disabled && !checked && "bg-muted hover:bg-muted-foreground/20"
      )}
      style={checked ? { backgroundColor: habit.color } : undefined}
    />
  );
}