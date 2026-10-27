import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TaskForm from "@/features/tasks/components/TaskForm";
import type { TaskFormValues } from "@/features/tasks/schemas/task.schema";
import type { Task } from "@/features/tasks/types/task";
import { useUpdateTask } from "@/features/tasks/hooks/useTasks";
import { toast } from "@/lib/toast";

interface IProps {
  task: Task;
  // Optionally render a custom trigger instead of the default pencil button
  trigger?: React.ReactNode;
}

function EditTask({ task, trigger }: IProps) {
  const [open, setOpen] = useState(false);

  const { mutate: updateTask } = useUpdateTask();

  const submitHandler = (data: TaskFormValues) => {
    updateTask(
      { id: task.id, values: data },
      {
        onSuccess: () => {
          toast.success("Task updated successfully!");
          setOpen(false);
        },
        onError: (error) => {
          toast.error(`Error updating task: ${error.message}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Edit task"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the details of this task.
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          initialValues={{
            title: task.title,
            priority: task.priority,
            description: task.description,
            due_date: task.due_date,
            list_id: task.list_id,
          }}
          onSubmit={submitHandler}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}

export default EditTask;
