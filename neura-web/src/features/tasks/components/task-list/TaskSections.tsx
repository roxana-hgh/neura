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
}

/** Renders tasks as collapsible sections according to the user's view mode. */
function TaskSections({ tasks, mainLabel }: Iprops) {
  const viewMode = useTasksStore((s) => s.viewMode);

  const sections = useMemo(
    () => groupTasks(tasks ?? [], viewMode, mainLabel),
    [tasks, viewMode, mainLabel],
  );

  const hasActive = sections.some((s) => s.key !== "completed" && s.tasks.length);

  return (
    <>
      {viewMode === "grouped" && !hasActive && <NoTasks />}
      {sections.map((section) => (
        <div className="mb-2" key={`${viewMode}-${section.key}`}>
          <TasksList
            tasks={section.tasks}
            label={section.label}
            defaultOpen={section.defaultOpen}
            showCount
          />
        </div>
      ))}
    </>
  );
}

export default TaskSections;
