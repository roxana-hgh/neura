import { eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, getDay, format } from "date-fns";
import type { Habit } from "@/features/habits/types/habit";
import { DaySquare } from "@/features/habits/components/DaySquare";


function MonthBlock({ habit, monthDate }: { habit: Habit; monthDate: Date }) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });
  const leading = (getDay(start) + 6) % 7; // Monday-start offset

  return (
    <div className="w-[104px]">
      <div className="text-[10px] text-muted-foreground mb-1">{format(monthDate, "MMM yyyy")}</div>
      <div className="grid grid-cols-7 gap-[3px]">
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`blank-${i}`} className="h-2.5 w-2.5" />
        ))}
        {days.map((d) => (
          <DaySquare key={d.toISOString()} date={d} habit={habit} size="xs" />
        ))}
      </div>
    </div>
  );
}

interface YearHeatmapProps {
  habits: Habit[];
  rangeStart: string;
  rangeEnd: string;
}

export function YearHeatmap({ habits, rangeStart, rangeEnd }: YearHeatmapProps) {
  const months = eachMonthOfInterval({ start: new Date(rangeStart), end: new Date(rangeEnd) });

  return (
    <div className="space-y-8">
      {habits.map((habit) => (
        <div key={habit.id}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
              {habit.title}
            </div>
            <span className="text-xs text-muted-foreground">
              {habit.stats.completed}/{habit.stats.total}
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            {months.map((m) => (
              <MonthBlock key={m.toISOString()} habit={habit} monthDate={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}