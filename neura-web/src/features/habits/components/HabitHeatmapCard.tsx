import { Flame, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useHabits, useToggleHabitEntry } from "@/features/habits/hooks/useHabits";
import { fromDayKey, getCellState, toDayKey } from "@/features/habits/lib/habitDate";
import { HabitCell } from "@/features/habits/components/HabitCell";

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  const isUp = delta >= 0;
  return (
    <span
      className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${isUp
          ? "text-emerald-500 bg-emerald-500/10"
          : "text-red-500 bg-red-500/10"
        }`}
    >
      {isUp ? "+" : ""}
      {delta}%
    </span>
  );
}

function HabitHeatmapCard() {
  const { data, isPending } = useHabits("week", new Date());
  const toggleEntry = useToggleHabitEntry();

  const days = data
    ? Array.from({ length: 7 }, (_, i) => toDayKey(addDays(fromDayKey(data.rangeStart), i)))
    : [];

  const allActive = data?.habits.filter((h) => !h.isArchived) ?? [];
  const activeHabits = allActive.slice(0, 4);
  const overflowCount = allActive.length - activeHabits.length;

  return (
    <div className="glass py-3 px-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <Flame size={16} className="text-orange-400" />
          <h2 className="font-medium text-base">Habits</h2>
          {data && <TrendBadge current={data.currentPercent} previous={data.previousPercent} />}
        </div>
        <Link to="/habits">
          <Button size="sm" variant="ghost" className="cursor-pointer">
            <span className="text-xs flex items-center gap-0.5">
              View All <ChevronRight size={12} />
            </span>
          </Button>
        </Link>
      </div>

      {isPending ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-6">
          Loading habits...
        </div>
      ) : activeHabits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
          <p className="text-sm text-muted-foreground">No habits yet.</p>
          <Link to="/habits">
            <Button size="xs" className="cursor-pointer">
              Create a habit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mt-1">
          {/* day-of-week header row */}
          <div className="grid grid-cols-[1fr_repeat(7,1.5rem)] gap-1 items-center px-0.5">
            <span />
            {days.map((key) => (
              <span
                key={key}
                className={`text-[10px] text-center uppercase ${key === data!.today ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                {format(fromDayKey(key), "EEEEE")}
              </span>
            ))}
          </div>

          {activeHabits.map((habit) => {
            const done = new Set(habit.entries);
            return (
              <div key={habit.id} className="grid grid-cols-[1fr_repeat(7,1.5rem)] gap-1 items-center px-0.5">
                <span className="text-xs font-medium truncate flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                  <span className="truncate">{habit.title}</span>
                </span>
                {days.map((key) => (
                  <div key={key} className="flex justify-center">
                    <HabitCell
                      dayKey={key}
                      state={getCellState(habit, key, data!.today, done.has(key))}
                      color={habit.color}
                      isToday={key === data!.today}
                      onToggle={(k) => toggleEntry.mutate({ habitId: habit.id, date: k })}
                      className="size-5 sm:size-5 rounded-md ring-offset-1"
                    />
                  </div>
                ))}
              </div>
            );
          })}

          {overflowCount > 0 && (
            <Link to="/habits" className="text-xs text-muted-foreground hover:text-foreground mt-1">
              +{overflowCount} more habit{overflowCount > 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default HabitHeatmapCard;
