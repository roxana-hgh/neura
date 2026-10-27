import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import type { Habit } from "@/features/habits/types/habit";
import { DaySquare } from "@/features/habits/components/DaySquare";


const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthCalendarProps {
  habits: Habit[];
  monthDate: Date;
}

export function MonthCalendar({ habits, monthDate }: MonthCalendarProps) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });
  const leading = (getDay(start) + 6) % 7; // Monday-start offset

  return (
    <div className="space-y-6">
      {habits.map((habit) => (
        <div key={habit.id}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
              {habit.title}
            </div>
            <span className="text-xs text-muted-foreground">
              {habit.stats.completed}/{habit.stats.total}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 max-w-xs">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="text-center text-[10px] uppercase text-muted-foreground">
                {w}
              </div>
            ))}
            {Array.from({ length: leading }).map((_, i) => (
              <div key={`blank-${i}`} className="h-4 w-4" />
            ))}
            {days.map((d) => (
              <DaySquare key={d.toISOString()} date={d} habit={habit} size="sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}