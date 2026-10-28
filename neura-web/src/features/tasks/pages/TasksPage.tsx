import { Plus, Target } from "lucide-react";
import AddNewTask from "@/features/tasks/components/AddTask";
import TasksSearch from "@/features/tasks/components/TaskSearch";
import TaskViewToggle from "@/features/tasks/components/TaskViewToggle";
import TasksSummary from "@/features/tasks/components/TasksSummary";
import TaskSections from "@/features/tasks/components/task-list/TaskSections";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import TaskSectionsSkeleton from "@/features/tasks/components/task-list/TaskSectionsSkeleton";

function TasksPage() {
  const { data: allTasks, isPending, isPlaceholderData } = useTasks();
  const isSearching = useTasksStore((s) => s.search.length > 0);
  const hideGoalTasks = useTasksStore((s) => s.hideGoalTasks);
  const toggleHideGoalTasks = useTasksStore((s) => s.toggleHideGoalTasks);

  const goalTaskCount = allTasks?.filter((t) => t.goal).length ?? 0;
  const tasks = hideGoalTasks ? allTasks?.filter((t) => !t.goal) : allTasks;
  const goalFilterLabel = hideGoalTasks ? "Show tasks from goals" : "Hide tasks from goals";

  return (
    <div className="tasks-page container mx-auto space-y-5">
      <PageHeader
        eyebrow="Tasks"
        title="All tasks"
        description="Everything on your plate, across all your lists."
        actions={
          <>
            <TasksSearch className="order-last w-full sm:order-first sm:w-56" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={!hideGoalTasks}
                  onPressedChange={toggleHideGoalTasks}
                  aria-label={goalFilterLabel}
                  className={cn("cursor-pointer gap-1.5 px-2.5", hideGoalTasks && "text-muted-foreground")}
                >
                  <Target />
                  <span className={cn(hideGoalTasks && "line-through")}>Goals</span>
                  {goalTaskCount > 0 && <span className="text-xs tabular-nums text-muted-foreground">{goalTaskCount}</span>}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>{goalFilterLabel}</TooltipContent>
            </Tooltip>
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
