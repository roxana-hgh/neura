import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AddNewTask from "@/features/tasks/components/AddTask";
import type { Task } from "@/features/tasks/types/task";
import TaskListItem from "@/features/tasks/components/task-list/TaskListItem";

interface Props {
  date: Date;
  tasks: Task[];
  open: boolean;
  onClose: () => void;
}

export function DayTasksModal({ date, tasks, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 flex flex-col max-h-[80vh]">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-neutral-200 dark:border-neutral-800/50">
          <DialogDescription className="text-[10px] font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-500 mb-1">
            {format(date, "EEEE")}
          </DialogDescription>
          <DialogTitle className="text-base font-normal text-neutral-800 dark:text-neutral-200">
            {format(date, "MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        {/* Task list — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
          {tasks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-neutral-500 dark:text-neutral-600">
                No tasks for this day
              </p>
            </div>
          ) : (
            // task row inside modal-body map
            tasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 [&>button]:w-full">
          <AddNewTask initialDueDate={date} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
