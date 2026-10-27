import { useMemo } from "react";
import { isBefore, startOfDay } from "date-fns";

import AddNewTask from "@/features/tasks/components/AddTask";
import TasksSearch from "@/features/tasks/components/TaskSearch";
import TasksList from "@/features/tasks/components/task-list/TasksList";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import Loader from "@/components/ui/loader";
import type { Task } from "@/features/tasks/types/task";

function TasksPage() {
  const { data: tasks, isPending } = useTasks();

  // tasks already arrive sorted dueDate asc, nulls last (from the API),
  // so we just split them into buckets and preserve that order.
  const { upcomingTasks, outdatedTasks } = useMemo(() => {
    if (!tasks) return { upcomingTasks: [] as Task[], outdatedTasks: [] as Task[] };

    const today = startOfDay(new Date());

    const dated: Task[] = [];
    const undated: Task[] = [];
    const outdated: Task[] = [];

    for (const task of tasks) {
      if (!task.due_date) {
        undated.push(task);
        continue;
      }

      const due = startOfDay(new Date(task.due_date));

      if (isBefore(due, today)) {
        outdated.push(task);
      } else {
        dated.push(task);
      }
    }

    return {
      upcomingTasks: [...dated, ...undated], // today→future first, no-due-date at the end
      outdatedTasks: outdated,
    };
  }, [tasks]);

  return (
    <div className="tasks-page container mx-auto ">
      <div className="flex items-center justify-between mb-3">
        <div className=" p-1">
          <h3 className="font-bold text-xl mb-1">Your Tasks</h3>
          <p className="text-muted-foreground text-sm">
            Here's a list of your tasks
          </p>
        </div>
        <div className="flex items-center  flex-wrap gap-2 ">
          <div className="grow hidden sm:block">
            <TasksSearch />
          </div>
          <div className="shrink-0">
            <AddNewTask />
          </div>
        </div>
      </div>

      <div className="mb-2">
        <TasksList tasks={upcomingTasks} label="Upcoming Tasks" />
      </div>

      {outdatedTasks.length > 0 && (
        <div className="mb-2">
          <TasksList tasks={outdatedTasks} label="Outdated Tasks" />
        </div>
      )}

      {isPending && <Loader screen />}
    </div>
  );
}

export default TasksPage;