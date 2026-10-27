import { useState } from "react";
import { AlertCircle, ListChecks } from "lucide-react";
import type { Task } from "@/features/tasks/types/task";
import { Checkbox } from "@/components/ui/checkbox";
import TaskDetail from "@/features/tasks/components/TaskDetail";
import { useToggleTask } from "@/features/tasks/hooks/useTasks";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { getListColorClass } from "@/features/tasks/utils/colorMapper";
import { isTaskOverdue, PRIORITY_STYLES } from "@/features/tasks/utils/calendar";
import { cn } from "@/lib/utils";

// Full task card for the week view: checkbox, title, priority, subtasks, list
export function CalendarWeekTaskCard({ task }: { task: Task }) {
  const list = useTasksStore((s) => s.lists.find((l) => l.id === task.list_id));
  const { mutate: toggleTask } = useToggleTask();
  const [pending, setPending] = useState(false);
  const overdue = isTaskOverdue(task);
  const priority = PRIORITY_STYLES[task.priority];
  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter((s) => s.completed).length;

  const onToggle = (checked: boolean) => {
    setPending(true);
    toggleTask({ id: task.id, completed: checked }, { onSettled: () => setPending(false) });
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border bg-background p-2 shadow-xs transition-colors",
        "hover:border-foreground/20",
        overdue && "border-red-500/30 bg-red-500/5",
        task.completed && "opacity-60",
      )}
    >
      <div className="pt-0.5">
        {pending ? (
          <div className="size-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
        ) : (
          <Checkbox
            checked={task.completed}
            onCheckedChange={(c) => onToggle(c === true)}
            aria-label={`Mark "${task.title}" as ${task.completed ? "not done" : "done"}`}
          />
        )}
      </div>

      <TaskDetail
        task={task}
        trigger={
          <div className="min-w-0 flex-1 cursor-pointer">
            <p
              className={cn(
                "text-[13px] leading-snug font-medium wrap-break-word line-clamp-2",
                task.completed && "line-through text-muted-foreground font-normal",
              )}
            >
              {task.title}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className={cn("rounded px-1.5 py-px font-medium", priority.badge)}>
                {priority.label}
              </span>
              {overdue && (
                <span className="inline-flex items-center gap-0.5 font-medium text-red-600 dark:text-red-400">
                  <AlertCircle className="size-3" /> Overdue
                </span>
              )}
              {subtasks.length > 0 && (
                <span className="inline-flex items-center gap-0.5 tabular-nums">
                  <ListChecks className="size-3" /> {doneSubtasks}/{subtasks.length}
                </span>
              )}
              {list && (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <span className={cn("size-1.5 shrink-0 rounded-full", getListColorClass(list.color))} />
                  <span className="truncate max-w-20">{list.name}</span>
                </span>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
