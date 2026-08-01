import { GitBranch, Tag, Trash } from "lucide-react";
import { Button } from "../../../../ui/button";
import { Checkbox } from "../../../../ui/checkbox";
import { Label } from "../../../../ui/label";
import type { Task } from "../../../../../types/Tasks";
import { useTasksStore } from "../../stores/tasks";
import { getListColorClass } from "../../utils/colorMapper";
import EditTask from "../EditTask";
import TaskDetail from "../TaskDetail";
import { useState } from "react";
import AlertDialog from "../../../../utils/AlertDialog";
import { useDeleteTask, useToggleTask } from "../../hooks/useTasks";
import { isBefore, startOfDay } from "date-fns";
import { cn } from "../../../../../lib/utils";

interface Iprops {
  task: Task;
}

function TaskListItem({ task }: Iprops) {
  const list = useTasksStore((s) => s.lists.find((l) => l.id === task.list_id));
  const [alertOpen, setAlertOpen] = useState(false);

  const { mutate: toggleTask } = useToggleTask();
  const [isTaskPending, setIsTaskPending] = useState(false);

  const { mutate: deleteTask } = useDeleteTask();

  const removeTaskHandler = () => {
    setAlertOpen(true);
  };

  const TaskCheckHandler = (checked: boolean) => {
    setIsTaskPending(true);
    toggleTask(
      { id: task.id, completed: checked },
      { onSettled: () => setIsTaskPending(false) },
    );
  };

   const isOutdated =
    !!task.due_date &&
   
    isBefore(startOfDay(new Date(task.due_date)), startOfDay(new Date()));

  return (
    <>
      <div 
       className={cn(
        "task-item group py-2 md:py-3 border-b last-of-type:border-0 w-full ", 
        isOutdated && "opacity-60 text-muted-foreground",
      )}
      >
        <div className="flex items-start w-full gap-1 sm:gap-4">
          {/* ── Checkbox (non-clickable for task detail) ── */}
          <div className="py-1" onClick={(e) => e.stopPropagation()}>
            {isTaskPending ? (
              <div className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
            ) : (
              <Checkbox
                checked={task.completed}
                id={`task-item${task.id}`}
                onCheckedChange={TaskCheckHandler}
              />
            )}
            <Label className="hidden" htmlFor={`task-item${task.id}`}></Label>
          </div>

          {/* ── Main content area (clickable to open TaskDetail) ── */}
          <TaskDetail
            task={task}
            trigger={
              <div className="grow cursor-pointer">
                <h5
                  className={`text-sm mb-1 ${
                    task.completed
                      ? "line-through text-muted-foreground"
                      : "font-medium"
                  }`}
                >
                  {task.title}
                </h5>
                {task.description && (
                  <p className="text-sm whitespace-break-spaces line-clamp-1 text-muted-foreground">
                    {task.description}
                  </p>
                )}

                <div className="flex gap-3 items-center mt-2">
                  {task.subtasks && task.subtasks?.length > 0 && (
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex gap-1 items-center">
                      <GitBranch size={14} />
                      {
                        task.subtasks.filter((subtask) => subtask.completed)
                          .length
                      }{" "}
                      / {task.subtasks.length}
                    </span>
                  )}

                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    Due{" "}
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "No due date"}
                  </span>

                  <span
                    className={`text-xs rounded-full flex gap-1 items-center ${
                      task.priority === "high"
                        ? "text-red-600 dark:text-red-300"
                        : task.priority === "low"
                          ? "text-green-600 dark:text-green-300"
                          : task.priority === "medium"
                            ? "text-amber-600 dark:text-amber-300"
                            : "text-neutral-400"
                    }`}
                  >
                    <Tag size={11} /> {task.priority}
                  </span>

                  {task.list_id && list && (
                    <span className="text-xs rounded-full flex gap-1 items-center">
                      <span
                        className={`p-1 rounded-full ${getListColorClass(
                          list.color ?? "gray",
                        )}`}
                      ></span>
                      {list.name}
                    </span>
                  )}
                </div>
              </div>
            }
          />

          {/* ── Action buttons (non-clickable for task detail) ── */}
          <div
            className="task-action max-sm:flex hidden group-hover:flex items-center justify-self-end"
            onClick={(e) => e.stopPropagation()}
          >
            <EditTask task={task} />
            <Button
              size="icon-xs"
              aria-label="remove task"
              className="text-muted-foreground"
              variant="ghost"
              onClick={removeTaskHandler}
            >
              <Trash className="hover:text-red-400" />
            </Button>
          </div>
        </div>
      </div>
      {alertOpen && (
        <AlertDialog
          title="Remove Task"
          description={`Are you Sure you want to Remove '${task.title}' ? `}
          acceptButtonText="Remove"
          AcceptButtonVariant="danger"
          open={alertOpen}
          setOpen={setAlertOpen}
          onConfirm={() => deleteTask(task.id)}
        />
      )}
    </>
  );
}

export default TaskListItem;
