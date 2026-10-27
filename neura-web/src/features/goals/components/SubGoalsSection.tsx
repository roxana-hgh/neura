import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Bell, ListChecks, MoreHorizontal, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SectionCard from "@/components/shared/SectionCard";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import { DeleteGoalDialog } from "@/features/goals/components/GoalActionDialogs";
import { GoalFormDialog } from "@/features/goals/components/GoalFormDialog";
import { GoalProgressBar } from "@/features/goals/components/GoalProgressBar";
import { UpdateProgressPopover } from "@/features/goals/components/GoalProgressPanel";
import { useCreateGoal, useSetGoalStatus } from "@/features/goals/hooks/useGoals";
import type { GoalDetail, SubGoal } from "@/features/goals/types/goal";
import { progressValueLabel } from "@/features/goals/utils/goalStyles";
import { cn } from "@/lib/utils";

function SubGoalRow({ sub, goal, onEdit, onRemind, onDelete }: {
  sub: SubGoal; goal: GoalDetail;
  onEdit: () => void; onRemind: () => void; onDelete: () => void;
}) {
  const setStatus = useSetGoalStatus();
  const done = sub.status === "completed";
  const measured = sub.metric !== "milestone";
  const dueDiffers = sub.endDate !== goal.endDate;

  return (
    <div className="group flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/40 sm:px-3">
      <Checkbox
        className="mt-0.5"
        checked={done}
        disabled={setStatus.isPending}
        onCheckedChange={(c) => setStatus.mutate({ id: sub.id, status: c ? "completed" : "active" })}
        aria-label={done ? `Mark "${sub.title}" as not done` : `Mark "${sub.title}" as done`}
      />
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onEdit} className="block w-full cursor-pointer text-left">
          <p className={cn("text-sm", done && "text-muted-foreground line-through")}>{sub.title}</p>
        </button>
        {(measured || dueDiffers || sub.counts.tasks > 0 || sub.counts.reminders > 0 || sub.description) && (
          <div className="mt-1 space-y-1.5">
            {sub.description && <p className="line-clamp-2 text-xs text-muted-foreground">{sub.description}</p>}
            {measured && !done && (
              <div className="flex items-center gap-2">
                <GoalProgressBar progress={sub.progress} color={goal.color} className="max-w-40" />
                <span className="text-[11px] tabular-nums text-muted-foreground">{progressValueLabel(sub)}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
              {dueDiffers && <span>Due {format(parseISO(sub.endDate), "MMM d")}</span>}
              {sub.counts.tasks > 0 && <span>{sub.counts.tasksDone}/{sub.counts.tasks} tasks</span>}
              {sub.counts.reminders > 0 && <span className="inline-flex items-center gap-0.5"><Bell className="size-3" />{sub.counts.reminders}</span>}
            </div>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        {(sub.metric === "numeric" || sub.metric === "manual") && !done && (
          <UpdateProgressPopover
            goal={sub}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Update progress" title="Update progress" className="text-muted-foreground">
                <TrendingUp className="size-4" />
              </Button>
            }
          />
        )}
        <Button variant="ghost" size="icon-sm" onClick={onRemind} aria-label="Add reminder" title="Remind me" className="text-muted-foreground">
          <Bell className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More actions" className="text-muted-foreground">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={onRemind}><Bell /> Add reminder</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/** Optional break-down of a goal. For milestone goals the sub-goals are the progress. */
export function SubGoalsSection({ goal }: { goal: GoalDetail }) {
  const createGoal = useCreateGoal();
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<SubGoal | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [reminderFor, setReminderFor] = useState<SubGoal | null>(null);
  const [deleting, setDeleting] = useState<SubGoal | null>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createGoal.mutate({ title: title.trim(), parent_id: goal.id }, { onSuccess: () => setTitle("") });
  };

  const done = goal.subGoals.filter((s) => s.status === "completed").length;

  return (
    <SectionCard
      icon={<ListChecks className="size-4 text-primary" />}
      title={goal.metric === "milestone" ? "Milestones" : "Sub-goals"}
      description={goal.subGoals.length ? `${done} of ${goal.subGoals.length} done` : "Optional — break it into smaller steps"}
      action={
        <Button variant="ghost" size="icon-sm" onClick={() => setNewOpen(true)} aria-label="New sub-goal with details" title="New sub-goal with details">
          <Plus className="size-4" />
        </Button>
      }
      contentClassName="pt-1"
    >
      <div className="divide-y divide-border/60">
        {goal.subGoals.map((sub) => (
          <SubGoalRow
            key={sub.id}
            sub={sub}
            goal={goal}
            onEdit={() => setEditing(sub)}
            onRemind={() => setReminderFor(sub)}
            onDelete={() => setDeleting(sub)}
          />
        ))}
      </div>

      <form onSubmit={add} className="mt-1 flex items-center gap-3 px-2 py-1.5 sm:px-3">
        <Plus className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a step and press Enter"
          maxLength={120}
          aria-label="New sub-goal"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>

      <GoalFormDialog open={newOpen} onOpenChange={setNewOpen} parent={goal} />
      <GoalFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} goal={editing} />
      <ReminderFormDialog
        open={!!reminderFor}
        onOpenChange={(o) => !o && setReminderFor(null)}
        defaults={reminderFor ? { title: reminderFor.title, link: { type: "goal", id: reminderFor.id, title: reminderFor.title } } : undefined}
      />
      {deleting && (
        <DeleteGoalDialog goal={deleting} open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} onDeleted={() => setDeleting(null)} />
      )}
    </SectionCard>
  );
}
