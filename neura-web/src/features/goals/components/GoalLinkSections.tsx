import { useState } from "react";
import { Link } from "react-router-dom";
import { format, isPast, isToday, parseISO } from "date-fns";
import { Bell, CircleCheckBig, Link2, Plus, StickyNote, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/shared/EmptyState";
import SectionCard from "@/components/shared/SectionCard";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import {
  useCreateGoalTask, useGoalLink, useGoalLinkOptions, useToggleGoalTask,
} from "@/features/goals/hooks/useGoals";
import type { GoalDetail, GoalTask } from "@/features/goals/types/goal";
import { cn } from "@/lib/utils";

/** Searchable list of unlinked tasks / notes. */
function LinkExistingPopover({ goalId, type }: { goalId: string; type: "task" | "note" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data, isLoading } = useGoalLinkOptions(goalId, open);
  const link = useGoalLink();
  const items = (type === "task" ? data?.tasks : data?.notes) ?? [];
  const filtered = items.filter((i) => (i.title || "Untitled").toLowerCase().includes(q.toLowerCase().trim()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
          <Link2 className="size-3.5" /> Link existing
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border p-2">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={type === "task" ? "Search open tasks…" : "Search notes…"}
            className="h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {isLoading && <div className="m-2 h-6 animate-pulse rounded bg-muted" />}
          {!isLoading && filtered.length === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nothing to link</p>}
          {filtered.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => link.mutate({ id: goalId, type, targetId: i.id, attach: true })}
              className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <span className="min-w-0 flex-1 truncate">{i.title || "Untitled"}</span>
              {i.goalId && <span className="shrink-0 text-[10px] text-muted-foreground">moves here</span>}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TaskRow({ task, goal, onRemind }: { task: GoalTask; goal: GoalDetail; onRemind: () => void }) {
  const toggle = useToggleGoalTask();
  const link = useGoalLink();
  const sub = task.goalId !== goal.id ? goal.subGoals.find((s) => s.id === task.goalId) : null;
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = !!due && !task.completed && isPast(due) && !isToday(due);

  return (
    <div className="group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 sm:px-3">
      <Checkbox
        className="mt-0.5"
        checked={task.completed}
        disabled={toggle.isPending}
        onCheckedChange={(c) => toggle.mutate({ id: task.id, completed: !!c })}
        aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", task.completed && "text-muted-foreground line-through")}>{task.title}</p>
        {(due || sub) && (
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
            {due && <span className={cn(overdue && "text-rose-600 dark:text-rose-400")}>{isToday(due) ? "Today" : format(due, "MMM d")}</span>}
            {sub && <span className="truncate">↳ {sub.title}</span>}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        {!task.completed && (
          <Button variant="ghost" size="icon-sm" onClick={onRemind} aria-label="Remind me" title="Remind me" className="text-muted-foreground">
            <Bell className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => link.mutate({ id: task.goalId ?? goal.id, type: "task", targetId: task.id, attach: false })}
          aria-label="Unlink from goal"
          title="Unlink from goal (the task is kept)"
          className="text-muted-foreground"
        >
          <Unlink className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function GoalTasksSection({ goal }: { goal: GoalDetail }) {
  const createTask = useCreateGoalTask();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(goal.id);
  const [remindTask, setRemindTask] = useState<GoalTask | null>(null);
  const done = goal.tasks.filter((t) => t.completed).length;
  const openSubs = goal.subGoals.filter((s) => s.status !== "completed");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate({ goalId: target, title: title.trim() }, { onSuccess: () => setTitle("") });
  };

  return (
    <SectionCard
      icon={<CircleCheckBig className="size-4 text-primary" />}
      title="Tasks"
      description={goal.tasks.length ? `${done} of ${goal.tasks.length} done` : goal.metric === "task" ? "Progress comes from these tasks" : "Concrete actions toward this goal"}
      action={<LinkExistingPopover goalId={goal.id} type="task" />}
      contentClassName="pt-1"
    >
      <div className="divide-y divide-border/60">
        {goal.tasks.map((t) => <TaskRow key={t.id} task={t} goal={goal} onRemind={() => setRemindTask(t)} />)}
      </div>

      <form onSubmit={add} className="mt-1 flex items-center gap-3 px-2 py-1.5 sm:px-3">
        <Plus className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task and press Enter"
          maxLength={100}
          aria-label="New task"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {openSubs.length > 0 && (
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger size="sm" className="h-7 max-w-36 text-xs" aria-label="Add to">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={goal.id}>This goal</SelectItem>
              {openSubs.map((s) => <SelectItem key={s.id} value={s.id}>↳ {s.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </form>

      <ReminderFormDialog
        open={!!remindTask}
        onOpenChange={(o) => !o && setRemindTask(null)}
        lockLink
        defaults={remindTask ? {
          title: remindTask.title,
          link: { type: "task", id: remindTask.id, title: remindTask.title },
          ...(remindTask.dueDate && parseISO(remindTask.dueDate) > new Date() && {
            at: new Date(new Date(remindTask.dueDate).setHours(9, 0, 0, 0)),
          }),
        } : undefined}
      />
    </SectionCard>
  );
}

export function GoalNotesSection({ goal }: { goal: GoalDetail }) {
  const link = useGoalLink();
  return (
    <SectionCard
      icon={<StickyNote className="size-4 text-primary" />}
      title="Notes"
      action={<LinkExistingPopover goalId={goal.id} type="note" />}
      contentClassName="pt-1"
    >
      {goal.notes.length === 0 ? (
        <EmptyState compact icon={StickyNote} title="No notes attached" description="Attach plans, research or journal notes." className="py-5" />
      ) : (
        <div className="divide-y divide-border/60">
          {goal.notes.map((n) => (
            <div key={n.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 sm:px-3">
              <StickyNote className="size-4 shrink-0 text-muted-foreground" />
              <Link to={`/note/${n.id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">{n.title || "Untitled"}</Link>
              <span className="shrink-0 text-[11px] text-muted-foreground">{format(new Date(n.updatedAt), "MMM d")}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => link.mutate({ id: goal.id, type: "note", targetId: n.id, attach: false })}
                aria-label="Detach note"
                title="Detach (the note is kept)"
                className="text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Unlink className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
