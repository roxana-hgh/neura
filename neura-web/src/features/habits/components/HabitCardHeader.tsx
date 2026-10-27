import { Flame, Trophy } from "lucide-react";
import type { Habit } from "@/features/habits/types/habit";
import { habitEndLabel } from "@/features/habits/lib/habitDate";
import { HabitMenu, type HabitActions } from "@/features/habits/components/HabitMenu";

interface HabitCardHeaderProps extends HabitActions {
  habit: Habit;
  today: string;
  /** label for the period stats, e.g. "this month" */
  periodLabel: string;
}

export function HabitCardHeader({ habit, today, periodLabel, onEdit, onDelete }: HabitCardHeaderProps) {
  const endLabel = habitEndLabel(habit, today);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{habit.title}</h3>
        {habit.isArchived ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Archived</span>
        ) : (
          endLabel && <span className="text-[11px] text-muted-foreground">{endLabel}</span>
        )}
        <HabitMenu habit={habit} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="tabular-nums">
          <span className="font-semibold text-foreground">{habit.stats.percent}%</span> {periodLabel}
          <span className="ml-1">({habit.stats.completed}/{habit.stats.total})</span>
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums" title="Current streak">
          <Flame className="size-3.5 text-orange-500" /> {habit.streak.current}d
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums" title="Best streak">
          <Trophy className="size-3.5 text-amber-500" /> {habit.streak.best}d
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${habit.stats.percent}%`, backgroundColor: habit.color }}
        />
      </div>
    </div>
  );
}
