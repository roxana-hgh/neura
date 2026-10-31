import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Archive, ArchiveRestore, ArrowLeft, Bell, CalendarClock, CircleCheck, CircleSlash, Flag, MoreHorizontal, Pause,
  Pencil, Play, Plus, RotateCcw, Target, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import EmptyState from "@/components/shared/EmptyState";
import SectionCard from "@/components/shared/SectionCard";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import { ReminderList } from "@/features/reminders/components/ReminderList";
import { CloseGoalDialog, DeleteGoalDialog, ExtendGoalDialog } from "@/features/goals/components/GoalActionDialogs";
import { GoalStatusBadge } from "@/features/goals/components/GoalCard";
import { GoalFormDialog } from "@/features/goals/components/GoalFormDialog";
import { GoalNotesSection, GoalTasksSection } from "@/features/goals/components/GoalLinkSections";
import { GoalProgressPanel } from "@/features/goals/components/GoalProgressPanel";
import { GoalTimeline } from "@/features/goals/components/GoalTimeline";
import { SubGoalsSection } from "@/features/goals/components/SubGoalsSection";
import { useArchiveGoal, useGoal, useSetGoalStatus } from "@/features/goals/hooks/useGoals";
import { formatRange, METRIC_LABEL, PERIOD_LABEL, timeLeftLabel } from "@/features/goals/lib/goalPeriod";
import type { GoalDetail } from "@/features/goals/types/goal";
import { goalColor } from "@/features/goals/utils/goalStyles";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type DialogName = "edit" | "complete" | "cancel" | "extend" | "delete" | "reminder" | null;

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  );
}

function DetailsCard({ goal, onEdit }: { goal: GoalDetail; onEdit: () => void }) {
  return (
    <SectionCard
      icon={<Target className="size-3.5 text-primary" />}
      title="Details"
      action={<Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit goal"><Pencil className="size-3.5" /></Button>}
    >
      <div className="divide-y divide-border/60">
        <DetailRow label="Dates">{formatRange(goal.startDate, goal.endDate)}</DetailRow>
        <DetailRow label="Time frame">{PERIOD_LABEL[goal.period]}</DetailRow>
        <DetailRow label="Measure">{METRIC_LABEL[goal.metric]}</DetailRow>
        {goal.category && <DetailRow label="Category">{goal.category}</DetailRow>}
        {goal.completedAt && <DetailRow label="Completed">{format(new Date(goal.completedAt), "MMM d, yyyy")}</DetailRow>}
      </div>
      {goal.description && <p className="mt-3 whitespace-pre-wrap border-t border-border/60 pt-3 text-sm text-muted-foreground">{goal.description}</p>}
    </SectionCard>
  );
}

export function GoalDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: goal, isLoading, isError } = useGoal(id);
  const setStatus = useSetGoalStatus();
  const archive = useArchiveGoal();
  const [dialog, setDialog] = useState<DialogName>(null);
  const subgoalsRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-xl bg-muted/60" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="h-36 animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-48 animate-pulse rounded-xl border border-border bg-card" />
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      </div>
    );
  }

  if (isError || !goal) {
    return (
      <EmptyState
        icon={Target}
        title="Goal not found"
        description="It may have been deleted."
        action={<Button size="sm" variant="outline" asChild><Link to="/goals">Back to goals</Link></Button>}
      />
    );
  }

  const isSub = !!goal.parentId;
  const closed = goal.status === "completed" || goal.status === "cancelled";
  const color = goalColor(goal.color);
  const close = (o: boolean) => !o && setDialog(null);

  const changeStatus = (status: "active" | "paused") =>
    setStatus.mutate({ id: goal.id, status }, {
      onSuccess: (res) => {
        const { paused, restored } = res.reminderChanges;
        const verb = status === "paused" ? "Goal paused" : closed ? "Goal reopened" : "Goal resumed";
        const extra = status === "paused"
          ? paused ? ` · ${paused} reminder${paused === 1 ? "" : "s"} paused` : ""
          : restored ? ` · ${restored} reminder${restored === 1 ? "" : "s"} back on` : "";
        toast.default(verb + extra);
      },
    });

  const toggleArchive = () =>
    archive.mutate({ id: goal.id, archived: !goal.archivedAt }, {
      onSuccess: () => toast.default(goal.archivedAt ? "Goal restored" : "Goal archived", {
        action: { label: "Undo", onClick: () => archive.mutate({ id: goal.id, archived: !!goal.archivedAt }) },
      }),
    });

  const scrollTo = (section: "subgoals" | "tasks") =>
    (section === "tasks" ? tasksRef : subgoalsRef).current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3 px-1">
        <Link
          to={isSub ? `/goal/${goal.parent!.id}` : "/goals"}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> {isSub ? goal.parent!.title : "Goals"}
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", color.dot)} />
              {[goal.category, PERIOD_LABEL[goal.period], formatRange(goal.startDate, goal.endDate)].filter(Boolean).join(" · ")}
              <GoalStatusBadge goal={goal} />
              {goal.archivedAt && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">Archived</span>}
            </div>
            <h1 className={cn("text-xl font-semibold tracking-tight md:text-2xl", goal.status === "cancelled" && "text-muted-foreground line-through")}>
              {goal.title}
            </h1>
            {goal.successCriteria && (
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><Flag className="mt-0.5 size-3.5 shrink-0" />{goal.successCriteria}</p>
            )}
            {!closed && <p className="text-xs text-muted-foreground">{timeLeftLabel(goal.startDate, goal.endDate)}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {closed ? (
              <Button size="sm" variant="outline" disabled={setStatus.isPending} onClick={() => changeStatus("active")}>
                {setStatus.isPending ? <Spinner /> : <RotateCcw className="size-3.5" />} Reopen
              </Button>
            ) : goal.status === "paused" ? (
              <Button size="sm" variant="outline" disabled={setStatus.isPending} onClick={() => changeStatus("active")}>
                {setStatus.isPending ? <Spinner /> : <Play className="size-3.5" />} Resume
              </Button>
            ) : (
              <Button size="sm" onClick={() => setDialog("complete")}><CircleCheck className="size-3.5" /> <span className="text-xs">Mark complete</span></Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="More actions" disabled={setStatus.isPending || archive.isPending}>
                  {setStatus.isPending || archive.isPending ? <Spinner /> : <MoreHorizontal className="size-3.5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onSelect={() => setDialog("edit")}><Pencil /> Edit</DropdownMenuItem>
                {!closed && <DropdownMenuItem onSelect={() => setDialog("extend")}><CalendarClock /> Change deadline</DropdownMenuItem>}
                {goal.status === "active" && <DropdownMenuItem onSelect={() => changeStatus("paused")}><Pause /> Pause</DropdownMenuItem>}
                {!closed && <DropdownMenuItem onSelect={() => setDialog("cancel")}><CircleSlash /> Cancel goal</DropdownMenuItem>}
                <DropdownMenuSeparator />
                {!isSub && (
                  <DropdownMenuItem onSelect={toggleArchive}>
                    {goal.archivedAt ? <><ArchiveRestore /> Unarchive</> : <><Archive /> Archive</>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onSelect={() => setDialog("delete")}><Trash2 /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {goal.needsReview && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center">
          <CalendarClock className="hidden size-5 shrink-0 text-amber-600 sm:block dark:text-amber-400" />
          <div className="flex-1 text-sm">
            <p className="font-medium">The deadline was {format(parseISO(goal.endDate), "MMM d")}. How did it go?</p>
            <p className="text-muted-foreground">Mark it done, give it more time, or let it go — all fine.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" onClick={() => setDialog("complete")}>Mark complete</Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("extend")}>Extend</Button>
            <Button size="sm" variant="ghost" onClick={() => setDialog("cancel")}>Cancel goal</Button>
          </div>
        </div>
      )}

      {goal.status === "paused" && (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Paused — its reminders are paused too. Resume when you're ready.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <GoalProgressPanel goal={goal} onScrollTo={scrollTo} />
          {!isSub && <div ref={subgoalsRef} className="scroll-mt-4"><SubGoalsSection goal={goal} /></div>}
          <div ref={tasksRef} className="scroll-mt-4"><GoalTasksSection key={goal.id} goal={goal} /></div>
          <GoalNotesSection goal={goal} />
        </div>

        <div className="min-w-0 space-y-4">
          <SectionCard
            icon={<Bell className="size-3.5 text-primary" />}
            title="Reminders"
            action={
              <Button variant="ghost" size="icon-sm" onClick={() => setDialog("reminder")} aria-label="Add reminder" title="Add reminder">
                <Plus className="size-3.5" />
              </Button>
            }
            contentClassName="px-1 pt-1 pb-2"
          >
            <ReminderList
              view="all"
              filters={{ goalId: goal.id }}
              empty={
                <EmptyState
                  compact
                  icon={Bell}
                  title="No reminders"
                  description="Add a weekly review or a nudge before the deadline."
                  className="py-5"
                  action={<Button size="sm" variant="outline" onClick={() => setDialog("reminder")}><Plus className="size-3.5" /> <span className="text-xs">Add reminder</span></Button>}
                />
              }
            />
          </SectionCard>
          <DetailsCard goal={goal} onEdit={() => setDialog("edit")} />
          <GoalTimeline goal={goal} logs={goal.logs} />
        </div>
      </div>

      <GoalFormDialog open={dialog === "edit"} onOpenChange={close} goal={goal} />
      <CloseGoalDialog goal={goal} status="completed" open={dialog === "complete"} onOpenChange={close} />
      <CloseGoalDialog goal={goal} status="cancelled" open={dialog === "cancel"} onOpenChange={close} />
      <ExtendGoalDialog goal={goal} open={dialog === "extend"} onOpenChange={close} />
      <DeleteGoalDialog
        goal={goal}
        open={dialog === "delete"}
        onOpenChange={close}
        onDeleted={() => navigate(isSub ? `/goal/${goal.parent!.id}` : "/goals", { replace: true })}
      />
      <ReminderFormDialog
        open={dialog === "reminder"}
        onOpenChange={close}
        defaults={{ title: `Check in: ${goal.title}`, link: { type: "goal", id: goal.id, title: goal.title } }}
      />
    </div>
  );
}
