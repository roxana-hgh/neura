import { eachDayOfInterval, getDay } from "date-fns";
import type { Habit } from "@/features/habits/types/habit";
import { fromDayKey, getCellState, toDayKey } from "@/features/habits/lib/habitDate";
import { HabitCell } from "@/features/habits/components/HabitCell";
import { HabitCardHeader } from "@/features/habits/components/HabitCardHeader";
import type { HabitActions } from "@/features/habits/components/HabitMenu";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface MonthCalendarProps extends HabitActions {
  habits: Habit[];
  rangeStart: string;
  rangeEnd: string;
  today: string;
  onToggle: (habitId: string, dayKey: string) => void;
}

export function MonthCalendar({ habits, rangeStart, rangeEnd, today, onToggle, onEdit, onDelete }: MonthCalendarProps) {
  const start = fromDayKey(rangeStart);
  const days = eachDayOfInterval({ start, end: fromDayKey(rangeEnd) }).map(toDayKey);
  const leading = (getDay(start) + 6) % 7; // Monday-start offset

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {habits.map((habit) => {
        const done = new Set(habit.entries);
        return (
          <div key={habit.id} className="space-y-4 rounded-xl border border-border bg-card p-4">
            <HabitCardHeader habit={habit} today={today} periodLabel="this month" onEdit={onEdit} onDelete={onDelete} />

            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w} className="text-center text-[10px] font-medium uppercase text-muted-foreground">
                  {w}
                </div>
              ))}
              {Array.from({ length: leading }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {days.map((key) => (
                <HabitCell
                  key={key}
                  dayKey={key}
                  size="md"
                  label={Number(key.slice(8))}
                  state={getCellState(habit, key, today, done.has(key))}
                  color={habit.color}
                  isToday={key === today}
                  onToggle={(k) => onToggle(habit.id, k)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
