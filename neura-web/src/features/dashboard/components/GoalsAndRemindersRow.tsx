import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import SectionCard from "@/components/shared/SectionCard";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { GoalProgressBar } from "@/features/goals/components/GoalProgressBar";
import { timeLeftLabel } from "@/features/goals/lib/goalPeriod";
import { goalColor, NEEDS_REVIEW_BADGE, PACE_STYLES, progressValueLabel } from "@/features/goals/utils/goalStyles";
import { useReminders } from "@/features/reminders/hooks/useReminders";
import { ReminderItem } from "@/features/reminders/components/ReminderItem";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import type { Reminder } from "@/features/reminders/types/reminder";
import { cn } from "@/lib/utils";

const MAX_ROWS = 4;

function GoalsCard() {
  const { data: goals = [], isPending } = useGoals(false);
  // review first, then the ones ending soonest
  const active = goals
    .filter((g) => g.status === "active")
    .sort((a, b) => Number(b.needsReview) - Number(a.needsReview) || a.endDate.localeCompare(b.endDate))
    .slice(0, MAX_ROWS);

  return (
    <SectionCard icon={<Target className="size-4 text-primary" />} title="Goals in progress" viewAllTo="/goals">
      {isPending ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted/60" />)}</div>
      ) : active.length === 0 ? (
        <EmptyState
          compact
          icon={Target}
          title="No active goals"
          description="Set one for this week, month or year."
          action={<Button size="sm" variant="outline" asChild><Link to="/goals"><Plus className="size-3" /><span className="text-xs">New goal</span></Link></Button>}
        />
      ) : (
        <div className="space-y-1">
          {active.map((g) => (
            <Link key={g.id} to={`/goal/${g.id}`} className="block space-y-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40">
              <div className="flex items-center gap-2 text-sm">
                <span className={cn("size-2 shrink-0 rounded-full", goalColor(g.color).dot)} />
                <span className="min-w-0 flex-1 truncate font-medium">{g.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{progressValueLabel(g)}</span>
              </div>
              <GoalProgressBar progress={g.progress} expected={g.expectedProgress} color={g.color} />
              <p className="text-[11px] text-muted-foreground">
                {g.needsReview ? (
                  <span className={cn("rounded-full px-1.5 py-px font-medium", NEEDS_REVIEW_BADGE)}>Needs review</span>
                ) : (
                  <>
                    {g.pace && <span className={cn("font-medium", PACE_STYLES[g.pace].text)}>{PACE_STYLES[g.pace].label} · </span>}
                    {timeLeftLabel(g.startDate, g.endDate)}
                  </>
                )}
              </p>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function UpNextCard() {
  const { data = [], isPending } = useReminders("upcoming");
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const upcoming = data.filter((r) => r.status === "active").slice(0, MAX_ROWS);

  return (
    <SectionCard
      icon={<Bell className="size-4 text-primary" />}
      title="Up next"
      viewAllTo="/reminders"
      action={
        <Button variant="ghost" size="icon-xs" onClick={() => setCreateOpen(true)} aria-label="New reminder" title="New reminder" className="text-muted-foreground">
          <Plus />
        </Button>
      }
      contentClassName="px-2 pb-2"
    >
      {isPending ? (
        <div className="space-y-2 px-2">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted/60" />)}</div>
      ) : upcoming.length === 0 ? (
        <EmptyState compact icon={Bell} title="No reminders coming up" description="Remember anything at the right time." />
      ) : (
        <div className="divide-y divide-border/60">
          {upcoming.map((r) => <ReminderItem key={r.id} reminder={r} onEdit={setEditing} />)}
        </div>
      )}
      <ReminderFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} reminder={editing} />
      <ReminderFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SectionCard>
  );
}

export default function GoalsAndRemindersRow() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <GoalsCard />
      <UpNextCard />
    </div>
  );
}
