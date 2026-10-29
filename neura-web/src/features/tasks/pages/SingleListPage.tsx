import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FolderX, Plus, Trash2 } from "lucide-react";
import { useTasksByList } from "@/features/tasks/utils/taskSelectors";
import AddNewTask from "@/features/tasks/components/AddTask";
import TaskSections from "@/features/tasks/components/task-list/TaskSections";
import TaskSectionsSkeleton from "@/features/tasks/components/task-list/TaskSectionsSkeleton";
import TaskViewToggle from "@/features/tasks/components/TaskViewToggle";
import TasksSearch from "@/features/tasks/components/TaskSearch";
import EditList from "@/features/tasks/components/lists/EditList";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { getListColorClass } from "@/features/tasks/utils/colorMapper";
import { useDeleteList, useTaskList } from "@/features/tasks/hooks/useTasks";
import AlertDialog from "@/components/shared/AlertDialog";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SingleList() {
  const params = useParams();
  const listId = params.id ?? "";
  const navigate = useNavigate();

  const { data: list, isPending: isLoading } = useTaskList(listId);
  const { data: tasks, isPending: isTasksLoading, isPlaceholderData } = useTasksByList(listId);
  const isSearching = useTasksStore((s) => s.search.length > 0);

  const [alertOpen, setAlertOpen] = useState(false);
  const { mutate: deleteList } = useDeleteList();
  const removeFromStore = useTasksStore((s) => s.removeList);

  const deleteHandler = () => {
    if (!list) return;
    deleteList(list.id, {
      onSuccess: () => {
        removeFromStore(list.id);
        navigate("/lists");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-5">
        <div className="space-y-2 px-1">
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        </div>
        <TaskSectionsSkeleton />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container mx-auto">
        <EmptyState
          icon={FolderX}
          title="List not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/lists">Back to lists</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.completed).length ?? 0;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <div className="tasks-page container mx-auto space-y-5">
        <PageHeader
          eyebrow={
            <Link to="/lists" className="transition-colors hover:text-foreground">
              Lists
            </Link>
          }
          title={
            <span className="flex items-center gap-2.5">
              <span className={cn("size-3 shrink-0 rounded-lg", getListColorClass(list.color ?? "gray"))} />
              <span dir="auto" className="truncate">{list.name}</span>
            </span>
          }
          description={list.description ? <span dir="auto">{list.description}</span> : undefined}
          actions={
            <>
              <TasksSearch className="order-last w-full sm:order-first sm:w-48" />
              <TaskViewToggle />
              <EditList list={list} />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Delete list"
                className="text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setAlertOpen(true)}
              >
                <Trash2 className="size-4" />
              </Button>
              <AddNewTask
                defaultListId={list.id}
                trigger={
                 
                  <Button type="button" className="flex items-center gap-0.5" size="sm">
                  <Plus className="size-3.5" /> <span className="text-xs">New task</span>
                </Button>
                }
              />
            </>
          }
        />

        {/* Progress over the whole list, so it's hidden while searching */}
        {!isSearching && total > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-[width] duration-500", getListColorClass(list.color ?? "gray"))}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {done}/{total} done · {percent}%
            </span>
          </div>
        )}

        {isTasksLoading ? (
          <TaskSectionsSkeleton />
        ) : (
          <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
            <TaskSections tasks={tasks} mainLabel="To do" defaultListId={list.id} />
          </div>
        )}
      </div>

      <AlertDialog
        title="Delete list?"
        description={`"${list.name}" will be deleted. Its tasks are kept and moved out of the list.`}
        acceptButtonText="Delete"
        cancelButtonText="Cancel"
        AcceptButtonVariant="danger"
        open={alertOpen}
        setOpen={setAlertOpen}
        onConfirm={deleteHandler}
      />
    </>
  );
}

export default SingleList;
