import { Link } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import type { TaskList } from "@/features/tasks/types/task";
import { getListCardIconColorClass, getListColorClass } from "@/features/tasks/utils/colorMapper";
import { useTaskProgress } from "@/features/tasks/utils/taskProgress";
import { cn } from "@/lib/utils";

interface ListCardProps {
  list: TaskList;
  className?: string;
}

function ListCardItem({ list, className }: ListCardProps) {
  const { totalTasks, completedTasks, percentTasks } = useTaskProgress(list.id ?? 0);
  const allDone = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <Link
      to={`/list/${list.id}`}
      className={cn(
        "group flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={cn("relative flex size-9 items-center justify-center rounded-lg", getListCardIconColorClass(list.color))}>
          <span className="absolute inset-0 rounded-lg bg-current opacity-10" />
          <FolderOpen className="relative size-4.5" />
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
        </span>
      </div>

      <h3 dir="auto" className="truncate font-medium">{list.name}</h3>
      <p dir="auto" className="mt-0.5 line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {list.description || "No description"}
      </p>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">
            {completedTasks}/{totalTasks} done
          </span>
          <span className={cn("tabular-nums", allDone && "text-emerald-600 dark:text-emerald-400")}>
            {percentTasks}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", getListColorClass(list.color))}
            style={{ width: `${percentTasks}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export default ListCardItem;
