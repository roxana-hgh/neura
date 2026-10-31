import { useState } from "react";
import { Link } from "react-router-dom";
import { format, isPast, isToday, parseISO } from "date-fns";
import {
  ArrowUpDown, Bell, ChevronDown, CircleCheckBig, Layers, Link2, ListTodo, MoreHorizontal, Pencil, Plus, StickyNote,
  Trash2, Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import AlertDialog from "@/components/shared/AlertDialog";
import EmptyState from "@/components/shared/EmptyState";
import SectionCard from "@/components/shared/SectionCard";
import { ReminderFormDialog } from "@/features/reminders/components/ReminderFormDialog";
import {
  useCreateGoalTask, useDeleteGoalTask, useGoalLink, useGoalLinkOptions, useSetGoalTaskVisibility, useToggleGoalTask,
} from "@/features/goals/hooks/useGoals";
import { GoalTaskDialog } from "@/features/goals/components/GoalTaskDialog";
import { useGoalTasksViewStore } from "@/features/goals/stores/goalTasksViewStore";
import type { GoalDetail, GoalTask } from "@/features/goals/types/goal";
import { TASK_PRIORITY_STYLES } from "@/features/goals/utils/goalStyles";
import { GOAL_TASK_SORTS, groupGoalTasks, sortGoalTasks } from "@/features/goals/utils/goalTasks";
import { toast } from "@/lib/toast";
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
          {filtered.map((i) => {
            const linking = link.isPending && link.variables?.targetId === i.id;
            return (
              <button
                key={i.id}
                type="button"
                disabled={link.isPending}
                onClick={() => link.mutate({ id: goalId, type, targetId: i.id, attach: true })}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent"
              >
                <span className="min-w-0 flex-1 truncate">{i.title || "Untitled"}</span>
                {linking ? (
                  <Spinner className="size-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  i.goalId && <span className="shrink-0 text-[10px] text-muted-foreground">moves here</span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TaskRow({ task, goal, hideMilestone, onEdit, onRemind }: {
  task: GoalTask; goal: GoalDetail; hideMilestone: boolean; onEdit: () => void; onRemind: () => void;
}) {
  const toggle = useToggleGoalTask();
  const link = useGoalLink();
  const visibility = useSetGoalTaskVisibility();
  const remove = useDeleteGoalTask();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = link.isPending || visibility.isPending || remove.isPending;
  const sub = !hideMilestone && task.goalId !== goal.id ? goal.subGoals.find((s) => s.id === task.goalId) : null;
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = !!due && !task.completed && isPast(due) && !isToday(due);
  const priority = task.priority !== "medium" ? TASK_PRIORITY_STYLES[task.priority] : null;

  return (
    <div className={cn("group flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 sm:px-3", (link.isPending || remove.isPending) && "opacity-60")}>
      {toggle.isPending ? (
        <Spinner className="mt-0.5 shrink-0 text-muted-foreground" />
      ) : (
        <Checkbox
          className="mt-0.5"
          checked={task.completed}
          disabled={link.isPending || remove.isPending}
          onCheckedChange={(c) => toggle.mutate({ id: task.id, completed: !!c })}
          aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        />
      )}
      <button type="button" onClick={onEdit} disabled={remove.isPending} className="block min-w-0 flex-1 cursor-pointer text-left">
        <p dir="auto" className={cn("truncate text-sm", task.completed && "text-muted-foreground line-through")}>{task.title}</p>
        {task.description && <p dir="auto" className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>}
        {(due || sub || priority || task.showInTasks) && (
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
            {due && <span className={cn(overdue && "text-rose-600 dark:text-rose-400")}>{isToday(due) ? "Today" : format(due, "MMM d")}</span>}
            {priority && <span className={priority.text}>{priority.label}</span>}
            {sub && <span className="truncate">↳ {sub.title}</span>}
            {task.showInTasks && <span className="inline-flex items-center gap-1"><ListTodo className="size-3" /> Also in Tasks</span>}
          </div>
        )}
      </button>
      <div className={cn(
        "flex shrink-0 items-center sm:transition-opacity",
        !busy && "sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100",
      )}>
        {!task.completed && (
          <Button variant="ghost" size="icon-sm" onClick={onRemind} aria-label="Remind me" title="Remind me" className="text-muted-foreground">
            <Bell className="size-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" disabled={busy} aria-label="More actions" className="text-muted-foreground">
              {busy ? <Spinner /> : <MoreHorizontal className="size-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuItem onSelect={onEdit}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => visibility.mutate({ goalId: goal.id, taskId: task.id, showInTasks: !task.showInTasks })}>
              <ListTodo /> {task.showInTasks ? "Remove from Tasks list" : "Also show in Tasks list"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => link.mutate({ id: task.goalId ?? goal.id, type: "task", targetId: task.id, attach: false })}>
              <Unlink /> Unlink from goal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}><Trash2 /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {confirmDelete && (
        <AlertDialog
          title="Delete task?"
          description={`"${task.title}" and its subtasks will be removed. This can't be undone.`}
          acceptButtonText="Delete"
          cancelButtonText="Cancel"
          AcceptButtonVariant="danger"
          open={confirmDelete}
          setOpen={setConfirmDelete}
          onConfirm={() => remove.mutate(
            { goalId: goal.id, taskId: task.id },
            { onSuccess: () => toast.default("Task deleted") },
          )}
        />
      )}
    </div>
  );
}

function TaskGroupSection({ title, tasks, collapsed, onToggle, children }: {
  title: string; tasks: GoalTask[]; collapsed: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const done = tasks.filter((t) => t.completed).length;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted/40 sm:px-3"
      >
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", collapsed && "-rotate-90")} />
        <span dir="auto" className="min-w-0 truncate">{title}</span>
        <span className="ml-auto shrink-0 font-normal text-muted-foreground tabular-nums">{done}/{tasks.length}</span>
      </button>
      {!collapsed && <div className="divide-y divide-border/60">{children}</div>}
    </div>
  );
}

export function GoalTasksSection({ goal }: { goal: GoalDetail }) {
  const createTask = useCreateGoalTask();
  const { sort, grouped, setSort, setGrouped } = useGoalTasksViewStore();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(goal.id);
  // off by default: tasks added here live on the goal page only
  const [showInTasks, setShowInTasks] = useState(false);
  const [remindTask, setRemindTask] = useState<GoalTask | null>(null);
  const [editing, setEditing] = useState<GoalTask | null>(null);
  const [milestoneFilter, setMilestoneFilter] = useState("all");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const done = goal.tasks.filter((t) => t.completed).length;
  const hasSubs = goal.subGoals.length > 0;
  const openSubs = goal.subGoals.filter((s) => s.status !== "completed");
  const noun = goal.metric === "milestone" ? "milestone" : "sub-goal";

  // A sub-goal can be completed or deleted while it's selected: fall back instead of pointing at it.
  const addTo = openSubs.some((s) => s.id === target) ? target : goal.id;
  const filter = milestoneFilter === goal.id || goal.subGoals.some((s) => s.id === milestoneFilter) ? milestoneFilter : "all";

  const sorted = sortGoalTasks(goal.tasks, sort);
  const countOf = (id: string) => goal.tasks.filter((t) => t.goalId === id).length;
  const visible = filter === "all" ? sorted : sorted.filter((t) => t.goalId === filter);
  const groups = hasSubs && grouped && filter === "all" ? groupGoalTasks(goal, sorted) : null;

  const changeFilter = (value: string) => {
    setMilestoneFilter(value);
    // A new task should land in the view being looked at, not vanish into another one.
    if (value === goal.id || openSubs.some((s) => s.id === value)) setTarget(value);
  };

  const toggleGroup = (id: string) =>
    setCollapsed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const value = title.trim();
    if (!value || createTask.isPending) return;
    // Clear right away; the pending row below shows the task until the list catches up.
    setTitle("");
    createTask.mutate({ goalId: addTo, title: value, showInTasks }, { onError: () => setTitle(value) });
  };

  const renderRow = (t: GoalTask) => (
    <TaskRow
      key={t.id}
      task={t}
      goal={goal}
      hideMilestone={!!groups || filter !== "all"}
      onEdit={() => setEditing(t)}
      onRemind={() => setRemindTask(t)}
    />
  );

  return (
    <SectionCard
      icon={<CircleCheckBig className="size-4 text-primary" />}
      title="Tasks"
      description={goal.tasks.length ? `${done} of ${goal.tasks.length} done` : goal.metric === "task" ? "Progress comes from these tasks" : "Concrete actions toward this goal"}
      action={<LinkExistingPopover goalId={goal.id} type="task" />}
      contentClassName="pt-1"
    >
      <form onSubmit={add} className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
            maxLength={100}
            aria-label="New task"
          />
          {/* preventDefault keeps focus in the input, so the mobile keyboard stays open between tasks */}
          <Button
            type="submit"
            size="icon"
            disabled={!title.trim() || createTask.isPending}
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Add task"
            title="Add task"
            className="shrink-0"
          >
            {createTask.isPending ? <Spinner /> : <Plus className="size-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {openSubs.length > 0 && (
            <Select value={addTo} onValueChange={setTarget}>
              <SelectTrigger size="sm" className="min-w-0 flex-1 text-xs sm:max-w-64" aria-label="Add to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start" className="max-w-[calc(100vw-2rem)]">
                <SelectItem value={goal.id}>This goal</SelectItem>
                {openSubs.map((s) => <SelectItem key={s.id} value={s.id}>↳ {s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Toggle
            size="sm"
            pressed={showInTasks}
            onPressedChange={setShowInTasks}
            aria-label="Also add to Tasks list"
            title={showInTasks ? "New tasks also go to your Tasks list" : "New tasks stay on this goal only — click to also add them to your Tasks list"}
            className={cn(
              "h-8 shrink-0 cursor-pointer gap-1 px-2 text-xs text-muted-foreground",
              showInTasks && "data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
            )}
          >
            <ListTodo className="size-3.5" />
            {showInTasks ? "In Tasks" : "Goal only"}
          </Toggle>
        </div>
      </form>

      {(goal.tasks.length > 1 || filter !== "all") && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          {hasSubs && (
            <Select value={filter} onValueChange={changeFilter}>
              <SelectTrigger size="sm" className="min-w-0 basis-full text-xs sm:max-w-64 sm:flex-1 sm:basis-auto" aria-label={`Filter by ${noun}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start" className="max-w-[calc(100vw-2rem)]">
                <SelectItem value="all">All tasks ({goal.tasks.length})</SelectItem>
                <SelectItem value={goal.id}>This goal ({countOf(goal.id)})</SelectItem>
                {goal.subGoals.map((s) => <SelectItem key={s.id} value={s.id}>↳ {s.title} ({countOf(s.id)})</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {hasSubs && filter === "all" && (
            <Toggle
              size="sm"
              pressed={grouped}
              onPressedChange={setGrouped}
              aria-label={`Group by ${noun}`}
              title={grouped ? "Show one flat list" : `Group by ${noun}`}
              className={cn(
                "h-8 shrink-0 cursor-pointer gap-1 px-2 text-xs text-muted-foreground",
                grouped && "data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
              )}
            >
              <Layers className="size-3.5" /> Group
            </Toggle>
          )}
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger size="sm" className="ml-auto w-auto shrink-0 gap-1.5 text-xs" aria-label="Sort tasks">
              <ArrowUpDown className="size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {GOAL_TASK_SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mt-2">
        {createTask.isPending && (
          <div className="flex items-center gap-3 px-2 py-2 sm:px-3" aria-live="polite">
            <Spinner className="shrink-0 text-muted-foreground" />
            <p className="truncate text-sm text-muted-foreground">{createTask.variables.title}</p>
          </div>
        )}
        {groups ? (
          <div className="space-y-1">
            {groups.map((g) => (
              <TaskGroupSection
                key={g.id}
                title={g.title}
                tasks={g.tasks}
                collapsed={collapsed.includes(g.id)}
                onToggle={() => toggleGroup(g.id)}
              >
                {g.tasks.map(renderRow)}
              </TaskGroupSection>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/60">{visible.map(renderRow)}</div>
        )}
        {filter !== "all" && visible.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No tasks here yet</p>
        )}
      </div>

      <GoalTaskDialog goalId={goal.id} task={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
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
          {goal.notes.map((n) => {
            const detaching = link.isPending && link.variables?.targetId === n.id;
            return (
              <div key={n.id} className={cn("group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40 sm:px-3", detaching && "opacity-60")}>
                <StickyNote className="size-4 shrink-0 text-muted-foreground" />
                <Link to={`/note/${n.id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">{n.title || "Untitled"}</Link>
                <span className="shrink-0 text-[11px] text-muted-foreground">{format(new Date(n.updatedAt), "MMM d")}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={detaching}
                  onClick={() => link.mutate({ id: goal.id, type: "note", targetId: n.id, attach: false })}
                  aria-label="Detach note"
                  title="Detach (the note is kept)"
                  className={cn("text-muted-foreground", !detaching && "sm:opacity-0 sm:group-hover:opacity-100")}
                >
                  {detaching ? <Spinner /> : <Unlink className="size-4" />}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
