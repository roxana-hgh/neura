import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Task } from "@/features/tasks/types/task";
import TaskListItem from "@/features/tasks/components/task-list/TaskListItem";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import NoTasks from "@/features/tasks/components/NoTasks";
import { cn } from "@/lib/utils";

interface Iprobs {
  label: string;
  tasks: Task[] | undefined;
  defaultOpen?: boolean;
  showCount?: boolean;
  /** "danger" highlights the header, e.g. for overdue tasks */
  tone?: "default" | "danger";
  defaultListId?: string | number | null;
}

function TasksList({ label, tasks, defaultOpen = true, showCount = false, tone = "default", defaultListId }: Iprobs) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const count = tasks?.length ?? 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="tasks-list group w-full">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1 py-1.5 text-left"
        >
          <ChevronRight
            className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
          />
          <h2
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              tone === "danger" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
            )}
          >
            {label}
          </h2>
          {showCount && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-medium tabular-nums",
                tone === "danger"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-1">
        <div className="rounded-xl border border-border bg-card p-1">
          {count ? (
            tasks!.map((task) => <TaskListItem key={task.id} task={task} />)
          ) : (
            <NoTasks defaultListId={defaultListId} />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default TasksList;
