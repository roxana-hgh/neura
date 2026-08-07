import { eachDayOfInterval, format } from "date-fns";
import { useToggleHabitEntry } from "../hooks/useHabits";
import { cn } from "../../../../lib/utils";
import type { Habit, HabitView } from "../../../../types/habit";


interface HabitGridProps {
  habits: Habit[];
  rangeStart: string;
  rangeEnd: string;
  view: HabitView;
}

export function HabitGrid({ habits, rangeStart, rangeEnd, view }: HabitGridProps) {
  const days = eachDayOfInterval({ start: new Date(rangeStart), end: new Date(rangeEnd) });
  const { mutate: toggle } = useToggleHabitEntry();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex items-center pl-40 gap-1 pb-2">
          {days.map((d) => (
            <div key={d.toISOString()} className="w-7 shrink-0 text-center text-[10px] uppercase text-muted-foreground">
              {view === "week" ? format(d, "EEE") : format(d, "d")}
            </div>
          ))}
        </div>

        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center gap-1 py-1.5">
            <div className="w-40 shrink-0 truncate text-sm font-medium flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
              {habit.title}
            </div>

            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const checked = habit.entries.includes(key);
              const inRange = key >= habit.startDate.slice(0, 10) && key <= habit.endDate.slice(0, 10);

              return (
                <button
                  key={key}
                  disabled={!inRange}
                  onClick={() => toggle({ habitId: habit.id, date: key })}
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-md transition",
                    !inRange && "opacity-20 cursor-not-allowed",
                    inRange && !checked && "bg-muted hover:bg-muted-foreground/20"
                  )}
                  style={checked ? { backgroundColor: habit.color } : undefined}
                />
              );
            })}

            <div className="w-12 shrink-0 pl-2 text-right text-xs text-muted-foreground">
              {habit.stats.completed}/{habit.stats.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}