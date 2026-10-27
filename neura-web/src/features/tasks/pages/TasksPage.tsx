import { Plus } from "lucide-react";
import AddNewTask from "@/features/tasks/components/AddTask";
import TasksSearch from "@/features/tasks/components/TaskSearch";
import TaskViewToggle from "@/features/tasks/components/TaskViewToggle";
import TasksSummary from "@/features/tasks/components/TasksSummary";
import TaskSections from "@/features/tasks/components/task-list/TaskSections";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TaskSectionsSkeleton from "@/features/tasks/components/task-list/TaskSectionsSkeleton";

function TasksPage() {
  const { data: tasks, isPending, isPlaceholderData } = useTasks();
  const isSearching = useTasksStore((s) => s.search.length > 0);

  return (
    <div className="tasks-page container mx-auto space-y-5">
      <PageHeader
        eyebrow="Tasks"
        title="All tasks"
        description="Everything on your plate, across all your lists."
        actions={
          <>
            <TasksSearch className="order-last w-full sm:order-first sm:w-56" />
            <TaskViewToggle />
            <AddNewTask
              trigger={
                <Button type="button" size="sm">
                  <Plus className="size-4" /> New task
                </Button>
              }
            />
          </>
        }
      />

      {/* Counts describe all tasks, so they're hidden while the list is filtered by a search */}
      {!isSearching && <TasksSummary tasks={tasks} isLoading={isPending} />}

      {isPending ? (
        <TaskSectionsSkeleton />
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          <TaskSections tasks={tasks} mainLabel="Upcoming" />
        </div>
      )}
    </div>
  );
}

export default TasksPage;
