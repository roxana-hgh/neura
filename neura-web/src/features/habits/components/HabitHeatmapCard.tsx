import { Flame, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import SectionCard from "@/components/shared/SectionCard";
import EmptyState from "@/components/shared/EmptyState";
import { useHabits, useToggleHabitEntry } from "@/features/habits/hooks/useHabits";
import { fromDayKey, getCellState, toDayKey } from "@/features/habits/lib/habitDate";
import { HabitCell } from "@/features/habits/components/HabitCell";

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  const isUp = delta >= 0;
  return (
    <span
      title="vs last week"
      className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${isUp
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400"
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
    <SectionCard
      icon={<Flame className="size-4 text-orange-500" />}
      title="Habits this week"
      action={data && <TrendBadge current={data.currentPercent} previous={data.previousPercent} />}
      viewAllTo="/habits"
      className="h-full"
    >
      {isPending ? (
        <div className="space-y-3 py-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : activeHabits.length === 0 ? (
        <EmptyState
          compact
          icon={Sprout}
          title="No habits yet"
          description="Small daily wins add up."
          action={
            <Button asChild size="sm" variant="outline">
              <Link className="text-xs" to="/habits">Create a habit</Link>
            </Button>
          }
        />
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
    </SectionCard>
  );
}

export default HabitHeatmapCard;
