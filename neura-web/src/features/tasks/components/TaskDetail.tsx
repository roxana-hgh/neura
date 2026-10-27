import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Plus,
  X,
  Calendar,
  Flag,
  Folder,
  Pencil,
  Trash2,
  Check,
  Trash,
} from "lucide-react";
import type { Task } from "@/features/tasks/types/task";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { getListColorClass } from "@/features/tasks/utils/colorMapper";

import "@/features/tasks/components/Task.styles.css";
import {
  useAddSubtask,
  useDeleteSubtask,
  useDeleteTask,
  useToggleSubTask,
  useToggleTask,
  useUpdateSubtask,
} from "@/features/tasks/hooks/useTasks";
import { isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import EditTask from "@/features/tasks/components/EditTask";
import AlertDialog from "@/components/shared/AlertDialog";

interface IProps {
  task: Task;
  trigger?: React.ReactNode;
}

function TaskDetail({ task, trigger }: IProps) {
  const [open, setOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<
    string | number | null
  >(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");

  const { mutate: toggleTask } = useToggleTask();
  const { mutate: toggleSubTask } = useToggleSubTask();

  const { mutate: addSubtask } = useAddSubtask();
  const updateSubtask = useUpdateSubtask();
  const { mutate: deleteSubtask } = useDeleteSubtask();
  const [isTaskPending, setIsTaskPending] = useState(false);
  const [pendingSubtaskId, setPendingSubtaskId] = useState<
    string | number | null
  >(null);
  const [pendingDeleteSubtaskId, setPendingDeleteSubtaskId] = useState<
    string | number | null
  >(null);
  const [isAddingSubtaskPending, setIsAddingSubtaskPending] = useState(false);
  const lists = useTasksStore((s) => s.lists);
  const { mutate: deleteTask } = useDeleteTask();

  const parentList = task.list_id
    ? lists.find((l) => l.id === task.list_id)
    : null;

  const handleAddSubtask = () => {
    if (!subtaskTitle.trim()) return;
    const nextTitle = subtaskTitle.trim();
    setIsAddingSubtaskPending(true);
    addSubtask(
      { taskId: task.id, title: nextTitle },
      {
        onSettled: () => {
          setIsAddingSubtaskPending(false);
          setSubtaskTitle("");
          setAddingSubtask(false);
        },
      },
    );
  };

  const handleRemoveSubtask = (subtaskId: string | number) => {
    setPendingDeleteSubtaskId(subtaskId);
    deleteSubtask(
      { taskId: task.id, subtaskId },
      { onSettled: () => setPendingDeleteSubtaskId(null) },
    );
  };

  const handleSaveEditSubtask = () => {
    if (!editingSubtaskTitle.trim()) return;
    updateSubtask.mutate({
      taskId: task.id,
      subtaskId: editingSubtaskId!,
      title: editingSubtaskTitle.trim(),
    });
    setEditingSubtaskId(null);
    setEditingSubtaskTitle("");
  };

  const handleStartEditSubtask = (
    subtaskId: string | number,
    currentTitle: string,
  ) => {
    setEditingSubtaskId(subtaskId);
    setEditingSubtaskTitle(currentTitle);
  };

  const handleCancelEditSubtask = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle("");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500/80 dark:text-red-400/70";
      case "medium":
        return "text-amber-500/80 dark:text-amber-400/70";
      case "low":
        return "text-emerald-500/80 dark:text-emerald-400/70";
      default:
        return "text-neutral-500 dark:text-neutral-400";
    }
  };

  const completedSubtasks =
    task.subtasks?.filter((s) => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const progress =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const isOutdated =
    !!task.due_date &&
    !task.completed &&
    isBefore(startOfDay(new Date(task.due_date)), startOfDay(new Date()));

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? (
            <button
              type="button"
              aria-label="View task details"
              className={cn(
                "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-all duration-200 hover:scale-110",
                isOutdated && "opacity-60 text-muted-foreground",
              )}
            >
              <ExternalLink size={18} strokeWidth={1.5} />
            </button>
          )}
        </DialogTrigger>

        <DialogContent className=" overflow-hidden border-neutral-200/60 dark:border-neutral-700/40 bg-white/98 dark:bg-neutral-900/80 backdrop-blur-xl p-0 shadow-2xl">
          {/* Subtle ambient effect */}
          <div className="absolute inset-0 bg-linear-to-br from-neutral-100/50 via-transparent to-neutral-200/40 dark:from-neutral-900/10 dark:via-transparent dark:to-neutral-950/10 pointer-events-none" />

          <div className="relative overflow-y-auto max-h-[85vh] custom-scrollbar">
            <DialogHeader className="px-6 pt-6 pb-3 border-b border-neutral-200 dark:border-neutral-800/50">
              <DialogTitle className="text-base font-normal tracking-tight">
                <div className="flex items-center gap-2.5 group">
                  {isTaskPending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                  ) : (
                    <Checkbox
                      checked={task.completed}
                      id={`task-detail-${task.id}`}
                      onCheckedChange={(checked) => {
                        setIsTaskPending(true);
                        toggleTask(
                          {
                            id: task.id,
                            completed: checked as boolean,
                          },
                          { onSettled: () => setIsTaskPending(false) },
                        );
                      }}
                      className=" h-4 w-4 mt-0.5 transition-all duration-150"
                    />
                  )}

                  <Label
                    className={`cursor-pointer font-normal text-base leading-snug transition-colors duration-150 ${
                      task.completed
                        ? "line-through text-neutral-400 dark:text-neutral-500"
                        : "text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100"
                    }`}
                    htmlFor={`task-detail-${task.id}`}
                  >
                    {task.title}
                  </Label>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 py-4 space-y-4">
              {/* Metadata cards */}
              <div className="grid grid-cols-3 gap-2">
                {/* Due Date */}
                {task.due_date && (
                  <div className="relative overflow-hidden rounded-md border border-neutral-300/60 dark:border-neutral-800/50 bg-neutral-50/80 dark:bg-neutral-800/15 p-2.5 transition-all duration-150 hover:border-neutral-300/60 dark:hover:border-neutral-700/40">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Calendar
                        size={11}
                        className="text-neutral-400 dark:text-neutral-500"
                      />
                      <span className="text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500 font-medium">
                        Due
                      </span>
                    </div>
                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-400">
                      {formatDate(task.due_date)}
                    </p>
                  </div>
                )}

                {/* Priority */}
                <div className="relative overflow-hidden rounded-md border border-neutral-300/60 dark:border-neutral-800/50 bg-neutral-50/80 dark:bg-neutral-800/15 p-2.5 transition-all duration-150 hover:border-neutral-300/60 dark:hover:border-neutral-700/40">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Flag
                      size={11}
                      className="text-neutral-400 dark:text-neutral-500"
                    />
                    <span className="text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500 font-medium">
                      Priority
                    </span>
                  </div>
                  <p
                    className={`text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </p>
                </div>

                {/* List */}
                {parentList && (
                  <div className="relative overflow-hidden rounded-md border border-neutral-300/60 dark:border-neutral-800/50 bg-neutral-50/80 dark:bg-neutral-800/15 p-2.5 transition-all duration-150 hover:border-neutral-300/60 dark:hover:border-neutral-700/40">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Folder
                        size={11}
                        className="text-neutral-400 dark:text-neutral-500"
                      />
                      <span className="text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500 font-medium">
                        List
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${getListColorClass(parentList.color)}`}
                      />
                      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-400 truncate">
                        {parentList.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description  */}
              {task.description && (
                <div className="space-y-1.5">
                  <h3 className="text-[10px] uppercase tracking-wide text-neutral-600 dark:text-neutral-400 font-medium">
                    Description
                  </h3>
                  <div className="relative rounded-md border border-neutral-300/50 dark:border-neutral-800/50 bg-neutral-50/40 dark:bg-neutral-800/20 p-3">
                    <p className="whitespace-pre-line text-xs text-neutral-700 dark:text-neutral-400 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Subtasks  */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-[10px] uppercase tracking-wide text-neutral-600 dark:text-neutral-400 font-medium">
                      Subtasks
                    </h3>
                    {totalSubtasks > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-20 bg-neutral-300 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neutral-600 dark:bg-neutral-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-600 dark:text-neutral-400 font-medium">
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                      </div>
                    )}
                  </div>

                  {!addingSubtask && (
                    <button
                      type="button"
                      onClick={() => setAddingSubtask(true)}
                      className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-400 transition-colors"
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  )}
                </div>

                {/* Add subtask form  */}
                {addingSubtask && (
                  <div className="flex items-center gap-1.5 p-2 rounded-md border border-neutral-300/60 dark:border-neutral-800/40 bg-neutral-100/50 dark:bg-neutral-900/30 animate-in fade-in duration-150">
                    <Input
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      placeholder="Subtask..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask();
                        if (e.key === "Escape") {
                          setAddingSubtask(false);
                          setSubtaskTitle("");
                        }
                      }}
                      className="text-xs h-7 bg-white dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 shadow-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:ring-offset-0 focus-visible:ring-1 focus-visible:ring-neutral-400 focus-visible:ring-offset-0 flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddSubtask}
                      disabled={!subtaskTitle.trim()}
                      className="h-7 px-2 text-xs bg-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 hover:text-neutral-900 dark:text-neutral-300"
                    >
                      <Check size={12} />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingSubtask(false);
                        setSubtaskTitle("");
                      }}
                      className="h-7 w-7 text-neutral-600 hover:text-neutral-800 dark:text-neutral-500 dark:hover:text-neutral-400"
                    >
                      <X size={13} />
                    </Button>
                  </div>
                )}

                {/* Subtask list */}
                <div className="space-y-0.5">
                  {task.subtasks && task.subtasks.length > 0 ? (
                    task.subtasks.map((subtask, index) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 rounded-md border border-transparent hover:border-neutral-200/60 dark:hover:border-neutral-800/40 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 transition-all duration-150 group"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {editingSubtaskId === subtask.id ? (
                          // Edit mode
                          <>
                            <Input
                              value={editingSubtaskTitle}
                              onChange={(e) =>
                                setEditingSubtaskTitle(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEditSubtask();
                                if (e.key === "Escape")
                                  handleCancelEditSubtask();
                              }}
                              autoFocus
                              className="text-xs h-6 bg-white dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 flex-1"
                            />
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              onClick={handleSaveEditSubtask}
                              className="h-6 w-6 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                            >
                              <Check size={12} />
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              onClick={handleCancelEditSubtask}
                              className="h-6 w-6 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                            >
                              <X size={12} />
                            </Button>
                          </>
                        ) : (
                          // View mode
                          <>
                            {pendingSubtaskId === subtask.id ? (
                              <div className="w-3 h-3 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                            ) : (
                              <Checkbox
                                checked={subtask.completed}
                                id={`subtask-${task.id}-${subtask.id}`}
                                onCheckedChange={(checked) => {
                                  setPendingSubtaskId(subtask.id);
                                  toggleSubTask(
                                    {
                                      taskId: task.id,
                                      subtaskId: subtask.id,
                                      completed: checked as boolean,
                                    },
                                    {
                                      onSettled: () =>
                                        setPendingSubtaskId((current) =>
                                          current === subtask.id ? null : current,
                                        ),
                                    },
                                  );
                                }}
                                className="h-3.5 w-3.5 transition-all duration-150"
                              />
                            )}
                            <Label
                              className={`text-xs cursor-pointer flex-1 transition-colors duration-150 ${
                                subtask.completed
                                  ? "line-through text-neutral-500 dark:text-neutral-500"
                                  : "text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-800 dark:group-hover:text-neutral-300"
                              }`}
                              htmlFor={`subtask-${task.id}-${subtask.id}`}
                            >
                              {subtask.title}
                            </Label>

                            {/* Action buttons - smaller and more subtle */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                onClick={() =>
                                  handleStartEditSubtask(
                                    subtask.id,
                                    subtask.title,
                                  )
                                }
                                className="h-5 w-5 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                              >
                                <Pencil size={10} />
                              </Button>
                              {pendingDeleteSubtaskId === subtask.id ? (
                                <div className="w-3 h-3 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                              ) : (
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleRemoveSubtask(subtask.id)
                                  }
                                  className="h-5 w-5 text-neutral-400 hover:text-red-500/70 dark:text-neutral-500 dark:hover:text-red-400/70 hover:bg-red-50 dark:hover:bg-red-500/5"
                                >
                                  <Trash2 size={10} />
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-[12px] text-neutral-600 dark:text-neutral-600">
                        No subtasks yet
                      </p>
                    </div>
                  )}
                  {isAddingSubtaskPending && (
                    <div className="flex justify-center py-2">
                      <div className="w-3 h-3 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Created date - minimal footer */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900/40">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">
                    Created {formatDate(task.created_at)}
                  </p>
                  <div
                    className="task-action max-sm:flex flex items-center justify-self-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <EditTask task={task} />
                    <Button
                      size="icon-xs"
                      aria-label="remove task"
                      className="text-muted-foreground/90"
                      variant="ghost"
                      onClick={() => setAlertOpen(true)}
                    >
                      <Trash className="hover:text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

export default TaskDetail;
