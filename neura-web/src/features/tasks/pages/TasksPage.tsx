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
import TagFilter from "@/features/tasks/components/tags/TagFilter";
import ActiveTagFilters from "@/features/tasks/components/tags/ActiveTagFilters";
import { filterTasksByTags } from "@/features/tasks/utils/taskTags";

function TasksPage() {
  const { data: allTasks, isPending, isPlaceholderData } = useTasks();
  const isSearching = useTasksStore((s) => s.search.length > 0);
  const hideGoalTasks = useTasksStore((s) => s.hideGoalTasks);
  const toggleHideGoalTasks = useTasksStore((s) => s.toggleHideGoalTasks);
  const tagFilter = useTasksStore((s) => s.tagFilter);
  const tagMatch = useTasksStore((s) => s.tagMatch);

  const goalTaskCount = allTasks?.filter((t) => t.goal).length ?? 0;
  const pageTasks = hideGoalTasks ? allTasks?.filter((t) => !t.goal) : allTasks;
  const tasks = filterTasksByTags(pageTasks, tagFilter, tagMatch);
  const goalFilterLabel = hideGoalTasks ? "Show tasks from goals" : "Hide tasks from goals";

  return (
    <div className="tasks-page container mx-auto space-y-5">
      <PageHeader
        eyebrow="Tasks"
        title="All tasks"
        description="Everything on your plate, across all your lists."
        actions={
          <>
            <TasksSearch className="order-last w-full sm:order-first sm:w-60" />
            <TaskViewToggle />
            <TagFilter tasks={pageTasks} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={!hideGoalTasks}
                  onPressedChange={toggleHideGoalTasks}
                  aria-label={goalFilterLabel}
                  className={cn("cursor-pointer gap-1 px-2.5", hideGoalTasks && "text-muted-foreground")}
                >
                  <Target className="size-3.5" />
                  <span className={cn(hideGoalTasks && "line-through text-xs")}>Goals</span>
                  {goalTaskCount > 0 && <span className="text-xs tabular-nums text-muted-foreground">{goalTaskCount}</span>}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>{goalFilterLabel}</TooltipContent>
            </Tooltip>
           
            <AddNewTask
              trigger={
                <Button type="button" className="flex items-center gap-0.5" size="sm">
                  <Plus className="size-3.5" /> <span className="text-xs">New task</span>
                </Button>
              }
            />
          </>
        }
      />

      <ActiveTagFilters shownCount={isPending ? undefined : tasks?.length} />

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
