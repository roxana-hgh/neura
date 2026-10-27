import type { Task } from "@/features/tasks/types/task";
import { isTaskOverdue, PRIORITY_STYLES } from "@/features/tasks/utils/calendar";
import { cn } from "@/lib/utils";

// Compact one-line task used inside month cells; the left bar shows priority
export function CalendarTaskChip({ task }: { task: Task }) {
  const overdue = isTaskOverdue(task);

  return (
    <div
      title={task.title}
      className={cn(
        "relative truncate rounded-md py-0.5 pl-2 pr-1.5 text-[11px] leading-4 font-medium",
        "before:absolute before:inset-y-1 before:left-0.5 before:w-0.5 before:rounded-full",
        PRIORITY_STYLES[task.priority].bar,
        overdue
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-muted/70 text-foreground/85",
        task.completed && "line-through text-muted-foreground opacity-60",
      )}
    >
      {task.title}
    </div>
  );
}
