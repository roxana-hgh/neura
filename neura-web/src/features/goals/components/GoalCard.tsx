import { Link } from "react-router-dom";
import { Bell, CircleCheckBig, Flag, ListChecks } from "lucide-react";
import { formatWhen } from "@/features/reminders/lib/reminderTime";
import { PERIOD_LABEL, timeLeftLabel } from "@/features/goals/lib/goalPeriod";
import type { Goal } from "@/features/goals/types/goal";
import {
  goalColor, NEEDS_REVIEW_BADGE, PACE_STYLES, progressValueLabel, STATUS_STYLES,
} from "@/features/goals/utils/goalStyles";
import { GoalProgressBar } from "@/features/goals/components/GoalProgressBar";
import { cn } from "@/lib/utils";

export function GoalStatusBadge({ goal, className }: { goal: Pick<Goal, "status" | "needsReview">; className?: string }) {
  if (goal.needsReview) {
    return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", NEEDS_REVIEW_BADGE, className)}>Needs review</span>;
  }
  if (goal.status === "active") return null;
  const s = STATUS_STYLES[goal.status];
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", s.badge, className)}>{s.label}</span>;
}

export function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const color = goalColor(goal.color);
  const closed = goal.status === "completed" || goal.status === "cancelled";

  return (
    <Link
      to={`/goal/${goal.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm",
        goal.status === "paused" && "opacity-75",
        compact && "gap-2 p-3",
      )}
    >
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className={cn("size-2 shrink-0 rounded-full", color.dot)} />
        <span className="truncate">{[goal.category, PERIOD_LABEL[goal.period]].filter(Boolean).join(" · ")}</span>
        <GoalStatusBadge goal={goal} className="ml-auto shrink-0" />
      </div>

      <div className="min-w-0">
        <h3 className={cn("line-clamp-2 font-medium leading-snug", compact && "text-sm", goal.status === "cancelled" && "text-muted-foreground line-through")}>
          {goal.title}
        </h3>
        {goal.successCriteria && !compact && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            <Flag className="mr-1 inline size-3" />{goal.successCriteria}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <GoalProgressBar progress={goal.progress} expected={closed ? undefined : goal.expectedProgress} color={goal.color} />
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium tabular-nums">{progressValueLabel(goal)}</span>
          <span className="truncate text-muted-foreground">
            {goal.pace && <span className={cn("font-medium", PACE_STYLES[goal.pace].text)}>{PACE_STYLES[goal.pace].label} · </span>}
            {closed ? STATUS_STYLES[goal.status].label : timeLeftLabel(goal.startDate, goal.endDate)}
          </span>
        </div>
      </div>

      {!compact && (goal.counts.subGoals > 0 || goal.counts.tasks > 0 || goal.nextReminder) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
          {goal.counts.subGoals > 0 && (
            <span className="inline-flex items-center gap-1"><ListChecks className="size-3" />{goal.counts.subGoalsDone}/{goal.counts.subGoals} steps</span>
          )}
          {goal.counts.tasks > 0 && (
            <span className="inline-flex items-center gap-1"><CircleCheckBig className="size-3" />{goal.counts.tasksDone}/{goal.counts.tasks} tasks</span>
          )}
          {goal.nextReminder && (
            <span className="inline-flex min-w-0 items-center gap-1" title={goal.nextReminder.title}>
              <Bell className="size-3 shrink-0" /><span className="truncate">{formatWhen(goal.nextReminder.nextAt)}</span>
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
