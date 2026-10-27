import { useEffect, useRef } from "react";
import { eachDayOfInterval, endOfWeek, format, startOfWeek } from "date-fns";
import type { Habit } from "@/features/habits/types/habit";
import { fromDayKey, getCellState, toDayKey } from "@/features/habits/lib/habitDate";
import { HabitCell } from "@/features/habits/components/HabitCell";
import { HabitCardHeader } from "@/features/habits/components/HabitCardHeader";
import type { HabitActions } from "@/features/habits/components/HabitMenu";
import { useWeekStartsOn } from "@/hooks/useWeekStartsOn";
import { getWeekdayLabels } from "@/lib/weekStart";

interface ContributionGridProps {
  habit: Habit;
  start: string;
  end: string;
  today: string;
  onToggle: (dayKey: string) => void;
}

/** Month label per week column: on the week holding the 1st, never closer than 3 columns apart. */
function monthLabels(weeks: string[][], start: string, end: string) {
  const labels: (string | null)[] = weeks.map(() => null);
  let lastIdx = -Infinity;
  weeks.forEach((week, i) => {
    const first = week.find((k) => k >= start && k <= end && k.endsWith("-01"));
    if (!first || i - lastIdx < 3) return;
    labels[i] = format(fromDayKey(first), first.slice(5, 7) === "01" ? "MMM yyyy" : "MMM");
    lastIdx = i;
  });
  // label the opening partial month too, when there's room before the next label
  const next = labels.findIndex(Boolean);
  if (next === -1 || next >= 3) labels[0] = format(fromDayKey(start), "MMM");
  return labels;
}

function ContributionGrid({ habit, start, end, today, onToggle }: ContributionGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const done = new Set(habit.entries);
  const weekStartsOn = useWeekStartsOn();
  // label every other row (1st, 3rd, 5th, 7th day of the week)
  const weekdayLabels = getWeekdayLabels(weekStartsOn).map((w, i) => (i % 2 === 0 ? w : ""));

  const days = eachDayOfInterval({
    start: startOfWeek(fromDayKey(start), { weekStartsOn }),
    end: endOfWeek(fromDayKey(end), { weekStartsOn }),
  }).map(toDayKey);
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const labels = monthLabels(weeks, start, end);

  // open scrolled to the most recent weeks (mobile / long histories)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const todayCol = el.querySelector<HTMLElement>("[data-today]");
    el.scrollLeft = todayCol ? todayCol.offsetLeft - el.clientWidth / 2 : el.scrollWidth;
  }, [start, end]);

  return (
    <div ref={scrollRef} className="relative overflow-x-auto pb-1">
      <div className="inline-flex gap-1.5">
        <div className="sticky left-0 z-10 flex flex-col gap-0.75 bg-card pr-1 text-[9px] leading-3 text-muted-foreground">
          <span className="h-4" />
          {weekdayLabels.map((w, i) => (
            <span key={i} className="h-3">{w}</span>
          ))}
        </div>

        <div className="flex gap-0.75">
          {weeks.map((week, i) => (
            <div key={week[0]} className="flex flex-col gap-0.75" data-today={week.includes(today) || undefined}>
              <span className="relative h-4">
                {labels[i] && (
                  <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] text-muted-foreground">
                    {labels[i]}
                  </span>
                )}
              </span>
              {week.map((key) =>
                key < start || key > end ? (
                  <span key={key} className="size-3" />
                ) : (
                  <HabitCell
                    key={key}
                    dayKey={key}
                    size="xs"
                    state={getCellState(habit, key, today, done.has(key))}
                    color={habit.color}
                    isToday={key === today}
                    onToggle={onToggle}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface YearHeatmapProps extends HabitActions {
  habits: Habit[];
  view: "year" | "all";
  rangeStart: string;
  rangeEnd: string;
  today: string;
  onToggle: (habitId: string, dayKey: string) => void;
}

export function YearHeatmap({ habits, view, rangeStart, rangeEnd, today, onToggle, onEdit, onDelete }: YearHeatmapProps) {
  return (
    <div className="grid gap-4">
      {habits.map((habit) => {
        // "all": each habit's own lifetime (start → last day or today)
        let start = rangeStart;
        let end = rangeEnd;
        if (view === "all") {
          start = habit.startKey;
          end = habit.lastKey && habit.lastKey < today ? habit.lastKey : today;
          if (end < start) end = start;
        }

        return (
          <div key={habit.id} className="space-y-4 rounded-xl border border-border bg-card p-4">
            <HabitCardHeader
              habit={habit}
              today={today}
              periodLabel={view === "year" ? `in ${rangeStart.slice(0, 4)}` : "all time"}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            <ContributionGrid
              habit={habit}
              start={start}
              end={end}
              today={today}
              onToggle={(k) => onToggle(habit.id, k)}
            />
            <p className="text-[11px] text-muted-foreground">
              {habit.totalCompleted} check-in{habit.totalCompleted === 1 ? "" : "s"} total · started{" "}
              {format(fromDayKey(habit.startKey), "MMM d, yyyy")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
