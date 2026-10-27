import { CalendarCheck, CircleCheck, Flame, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import type { HabitsResponse, HabitView } from "@/features/habits/types/habit";
import { cn } from "@/lib/utils";

const PERIOD_LABEL: Record<HabitView, string> = {
  week: "last week",
  month: "last month",
  year: "last year",
  all: "",
};

function Tile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function HabitsSummary({ data, view }: { data: HabitsResponse; view: HabitView }) {
  const completed = data.habits.reduce((s, h) => s + h.stats.completed, 0);
  const total = data.habits.reduce((s, h) => s + h.stats.total, 0);
  const delta = data.currentPercent - data.previousPercent;
  const top = data.habits.reduce<(typeof data.habits)[number] | null>(
    (best, h) => (!best || h.streak.current > best.streak.current ? h : best),
    null,
  );
  const todayHabits = data.habits.filter(
    (h) => h.startKey <= data.today && (h.lastKey === null || h.lastKey >= data.today),
  );
  const doneToday = todayHabits.filter((h) => h.doneToday).length;
  const includesToday = data.rangeStart <= data.today && data.today <= data.rangeEnd;
  const bestEver = data.habits.reduce<(typeof data.habits)[number] | null>(
    (best, h) => (!best || h.streak.best > best.streak.best ? h : best),
    null,
  );

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        icon={<Target className="size-3.5" />}
        label="Completion"
        value={`${data.currentPercent}%`}
        hint={
          view !== "all" && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {delta >= 0 ? "+" : ""}{delta}% vs {PERIOD_LABEL[view]}
            </span>
          )
        }
      />
      <Tile
        icon={<CalendarCheck className="size-3.5" />}
        label="Check-ins"
        value={
          <>
            {completed}
            <span className="text-sm font-normal text-muted-foreground">/{total}</span>
          </>
        }
        hint="days completed in this period"
      />
      {/* past periods only list the habits alive back then, so "today" would be incomplete */}
      {includesToday ? (
        <Tile
          icon={<CircleCheck className="size-3.5" />}
          label="Today"
          value={
            <>
              {doneToday}
              <span className="text-sm font-normal text-muted-foreground">/{todayHabits.length}</span>
            </>
          }
          hint={todayHabits.length > 0 && doneToday === todayHabits.length ? "All done, nice!" : "habits done today"}
        />
      ) : (
        <Tile
          icon={<Trophy className="size-3.5 text-amber-500" />}
          label="Best streak"
          value={`${bestEver?.streak.best ?? 0}d`}
          hint={bestEver?.title ?? "—"}
        />
      )}
      <Tile
        icon={<Flame className="size-3.5 text-orange-500" />}
        label="Top streak"
        value={`${top?.streak.current ?? 0}d`}
        hint={top && top.streak.current > 0 ? top.title : "Check in today to start one"}
      />
    </div>
  );
}
