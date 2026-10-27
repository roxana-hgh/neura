import { eachDayOfInterval, format } from "date-fns";
import type { Habit } from "@/features/habits/types/habit";
import { DaySquare } from "@/features/habits/components/DaySquare";


interface WeekGridProps {
  habits: Habit[];
  rangeStart: string;
  rangeEnd: string;
}

export function WeekGrid({ habits, rangeStart, rangeEnd }: WeekGridProps) {
  const days = eachDayOfInterval({ start: new Date(rangeStart), end: new Date(rangeEnd) });

  return (
    <div className="space-y-1">
      <div className="flex items-center pl-40 gap-1 pb-2">
        {days.map((d) => (
          <div key={d.toISOString()} className="w-7 shrink-0 text-center text-[10px] uppercase text-muted-foreground">
            {format(d, "EEE")}
          </div>
        ))}
      </div>

      {habits.map((habit) => (
        <div key={habit.id} className="flex items-center gap-1 py-1">
          <div className="w-40 shrink-0 truncate text-sm font-medium flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
            {habit.title}
          </div>
          {days.map((d) => (
            <DaySquare key={d.toISOString()} date={d} habit={habit} size="md" />
          ))}
          <div className="w-12 shrink-0 pl-2 text-right text-xs text-muted-foreground">
            {habit.stats.completed}/{habit.stats.total}
          </div>
        </div>
      ))}
    </div>
  );
}