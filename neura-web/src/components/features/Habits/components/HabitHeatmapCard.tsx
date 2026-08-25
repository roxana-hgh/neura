import { Flame, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../ui/button";
import { useHabits } from "../hooks/useHabits";
import { useToggleHabitEntry } from "../hooks/useHabits";
import {
  eachDayOfInterval,
  format,
  isAfter,
  isSameDay,
  startOfDay,
} from "date-fns";

const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

function TrendBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const delta = current - previous;
  const isUp = delta >= 0;
  return (
    <span
      className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
        isUp
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
  const today = startOfDay(new Date());
  const { data, isPending } = useHabits("week", today);
  const toggleEntry = useToggleHabitEntry();

  const days = data
    ? eachDayOfInterval({
        start: new Date(data.rangeStart),
        end: new Date(data.rangeEnd),
      })
    : [];

  const activeHabits = data?.habits.filter((h) => !h.isArchived).slice(0, 4) ?? [];
  const overflowCount = data
    ? data.habits.filter((h) => !h.isArchived).length - activeHabits.length
    : 0;

  return (
    <div className="glass py-3 px-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <Flame size={16} className="text-orange-400" />
          <h2 className="font-medium text-base">Habits</h2>
          {data && (
            <TrendBadge
              current={data.currentPercent}
              previous={data.previousPercent}
            />
          )}
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
            {days.map((d) => (
              <span
                key={dateKey(d)}
                className="text-[10px] text-center text-muted-foreground uppercase"
              >
                {format(d, "EEEEE")}
              </span>
            ))}
          </div>

          {activeHabits.map((habit) => (
            <div
              key={habit.id}
              className="grid grid-cols-[1fr_repeat(7,1.5rem)] gap-1 items-center px-0.5"
            >
              <span className="text-xs font-medium truncate flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
                <span className="truncate">{habit.title}</span>
              </span>
              {days.map((d) => {
                const key = dateKey(d);
                const done = habit.entries.includes(key);
                const future = isAfter(startOfDay(d), today);
                const isToday = isSameDay(d, today);
                return (
                  <button
                    key={key}
                    disabled={future}
                    onClick={() =>
                      toggleEntry.mutate({ habitId: habit.id, date: key })
                    }
                    className={`w-5 h-5 mx-auto rounded-md transition-colors ${
                      future
                        ? "bg-muted/30 cursor-not-allowed"
                        : "cursor-pointer hover:opacity-80"
                    } ${isToday && !done ? "ring-1 ring-offset-1 ring-muted-foreground/40" : ""}`}
                    style={{
                      backgroundColor: done ? habit.color : undefined,
                    }}
                  />
                );
              })}
            </div>
          ))}

          {overflowCount > 0 && (
            <Link
              to="/habits"
              className="text-xs text-muted-foreground hover:text-foreground mt-1"
            >
              +{overflowCount} more habit{overflowCount > 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default HabitHeatmapCard;