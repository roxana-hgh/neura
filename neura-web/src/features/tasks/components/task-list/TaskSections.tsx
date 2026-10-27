import { useMemo } from "react";
import TasksList from "@/features/tasks/components/task-list/TasksList";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { groupTasks } from "@/features/tasks/utils/groupTasks";
import type { Task } from "@/features/tasks/types/task";
import NoTasks from "@/features/tasks/components/NoTasks";

interface Iprops {
  tasks: Task[] | undefined;
  /** Label of the main section in the default (sorted) view */
  mainLabel?: string;
  /** New tasks created from an empty section go to this list */
  defaultListId?: string | number | null;
}

/** Renders tasks as collapsible sections according to the user's view mode. */
function TaskSections({ tasks, mainLabel, defaultListId }: Iprops) {
  const viewMode = useTasksStore((s) => s.viewMode);

  const sections = useMemo(
    () => groupTasks(tasks ?? [], viewMode, mainLabel),
    [tasks, viewMode, mainLabel],
  );

  const hasActive = sections.some((s) => s.key !== "completed" && s.tasks.length);

  return (
    <div className="space-y-4">
      {viewMode === "grouped" && !hasActive && (
        <div className="rounded-xl border border-border bg-card p-1">
          <NoTasks
            title="You're all caught up"
            description="No open tasks. Add one to plan what's next."
            defaultListId={defaultListId}
          />
        </div>
      )}
      {sections.map((section) => (
        <TasksList
          key={`${viewMode}-${section.key}`}
          tasks={section.tasks}
          label={section.label}
          defaultOpen={section.defaultOpen}
          tone={section.key === "overdue" ? "danger" : "default"}
          defaultListId={defaultListId}
          showCount
        />
      ))}
    </div>
  );
}

export default TaskSections;
