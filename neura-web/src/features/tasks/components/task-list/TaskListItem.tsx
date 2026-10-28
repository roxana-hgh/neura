import { useState } from "react";
import { CalendarDays, ListChecks, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/features/tasks/types/task";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { getListColorClass } from "@/features/tasks/utils/colorMapper";
import { PRIORITY_STYLES } from "@/features/tasks/utils/calendar";
import { DUE_TONE_STYLES, getDueInfo } from "@/features/tasks/utils/taskStats";
import EditTask from "@/features/tasks/components/EditTask";
import TaskDetail from "@/features/tasks/components/TaskDetail";
import TaskGoalBadge from "@/features/tasks/components/TaskGoalBadge";
import AlertDialog from "@/components/shared/AlertDialog";
import { useDeleteTask, useToggleTask } from "@/features/tasks/hooks/useTasks";
import { cn } from "@/lib/utils";

interface Iprops {
  task: Task;
  /** Dashboard widget mode: no description and no edit/delete actions */
  compact?: boolean;
}

function TaskListItem({ task, compact = false }: Iprops) {
  const list = useTasksStore((s) => s.lists.find((l) => l.id === task.list_id));
  const [alertOpen, setAlertOpen] = useState(false);
  const [isTaskPending, setIsTaskPending] = useState(false);

  const { mutate: toggleTask } = useToggleTask();
  const { mutate: deleteTask } = useDeleteTask();

  const TaskCheckHandler = (checked: boolean) => {
    setIsTaskPending(true);
    toggleTask(
      { id: task.id, completed: checked },
      { onSettled: () => setIsTaskPending(false) },
    );
  };

  const due = getDueInfo(task);
  const priority = PRIORITY_STYLES[task.priority];
  const subtasks = task.subtasks ?? [];
  const subtasksDone = subtasks.filter((s) => s.completed).length;
  const checkboxId = `task-item-${task.id}`;

  return (
    <>
      <div
        className={cn(
          "task-item group flex w-full items-start gap-3 rounded-lg transition-colors hover:bg-muted/40",
          compact ? "px-2 py-2" : "px-2 py-2.5 sm:px-3",
        )}
      >
        {/* ── Checkbox (kept outside the TaskDetail trigger) ── */}
        <div className="flex h-5 items-center" onClick={(e) => e.stopPropagation()}>
          {isTaskPending ? (
            <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/50 border-t-transparent" />
          ) : (
            <Checkbox
              checked={task.completed}
              id={checkboxId}
              aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
              onCheckedChange={TaskCheckHandler}
            />
          )}
        </div>

        {/* ── Main content (opens TaskDetail) ── */}
        <TaskDetail
          task={task}
          trigger={
            <div className="min-w-0 grow cursor-pointer">
              <p
                dir="auto"
                className={cn(
                  "truncate text-sm leading-5",
                  task.completed ? "text-muted-foreground line-through" : "font-medium",
                )}
              >
                {task.title}
              </p>
              {!compact && task.description && (
                <p dir="auto" className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {task.description}
                </p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className={cn("inline-flex items-center gap-1", DUE_TONE_STYLES[due.tone])}>
                  <CalendarDays className="size-3.5" />
                  {due.tone === "overdue" ? `Overdue · ${due.label}` : due.label}
                </span>

                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className={cn("size-2 rounded-full", task.completed ? "bg-muted-foreground/40" : priority.dot)} />
                  {priority.label}
                </span>

                {subtasks.length > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 tabular-nums",
                      subtasksDone === subtasks.length ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    <ListChecks className="size-3.5" />
                    {subtasksDone}/{subtasks.length}
                  </span>
                )}

                {list && (
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                    <span className={cn("size-2 shrink-0 rounded-[3px]", getListColorClass(list.color ?? "gray"))} />
                    <span className="truncate">{list.name}</span>
                  </span>
                )}

                {task.goal && <TaskGoalBadge goal={task.goal} className="max-w-56 text-[11px]" />}
              </div>
            </div>
          }
        />

        {/* ── Actions: on hover on desktop, always on touch screens ── */}
        {!compact && (
          <div
            className="task-action flex shrink-0 items-center gap-0.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <EditTask task={task} />
            <Button
              size="icon-xs"
              aria-label="Delete task"
              className="text-muted-foreground hover:text-destructive"
              variant="ghost"
              onClick={() => setAlertOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {alertOpen && (
        <AlertDialog
          title="Delete task?"
          description={`"${task.title}" and its subtasks will be removed. This can't be undone.`}
          acceptButtonText="Delete"
          cancelButtonText="Cancel"
          AcceptButtonVariant="danger"
          open={alertOpen}
          setOpen={setAlertOpen}
          onConfirm={() => deleteTask(task.id)}
        />
      )}
    </>
  );
}

export default TaskListItem;
