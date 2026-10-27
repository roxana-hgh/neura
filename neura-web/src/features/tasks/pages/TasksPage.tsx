import AddNewTask from "@/features/tasks/components/AddTask";
import TasksSearch from "@/features/tasks/components/TaskSearch";
import TaskViewToggle from "@/features/tasks/components/TaskViewToggle";
import TaskSections from "@/features/tasks/components/task-list/TaskSections";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import Loader from "@/components/ui/loader";

function TasksPage() {
  const { data: tasks, isPending } = useTasks();

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
            <TaskViewToggle />
          </div>
          <div className="shrink-0">
            <AddNewTask />
          </div>
        </div>
      </div>

      <TaskSections tasks={tasks} mainLabel="Upcoming Tasks" />

      {isPending && <Loader screen />}
    </div>
  );
}

export default TasksPage;