import { useState } from "react";
import TaskForm from "@/features/tasks/components/TaskForm";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TaskFormValues } from "@/features/tasks/schemas/task.schema";
import { useCreateTask } from "@/features/tasks/hooks/useTasks";
import { toast } from "@/lib/toast";


interface IProps {
  // Pass the current list's id when rendering this button inside a list page.
  // Leave undefined (or don't pass it) on the "All Tasks" page.
  defaultListId?: string | number | null;
    initialDueDate?: Date;
    isSmall?: boolean;
    // Custom trigger element (replaces the default "Add Task" button)
    trigger?: React.ReactNode;
}

function AddNewTask({ defaultListId, initialDueDate, isSmall = false, trigger }: IProps) {
  const [openModal, setOpenModal] = useState(false);

const { mutate: createTask } = useCreateTask();

const handleSubmit = (values: TaskFormValues) => {
  createTask(values, {
    onSuccess: () => {
     setOpenModal(false);
     toast.success("Task created successfully!");
    },
    onError: (error) => {
      toast.error(`Error creating task: ${error.message}`);
    }
  });
};

  // Convert Date → "YYYY-MM-DD" string that TaskForm expects.
  // Format in local time: toISOString() would shift to the previous day in UTC+ zones.
  const initialValues = initialDueDate
    ? { due_date: format(initialDueDate, "yyyy-MM-dd") }
    : undefined;

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size={isSmall ? "xs" : "sm"} variant="outline">
            <span className={`hidden sm:block  ${isSmall ? "text-xs" : "text-sm"}`}>Add Task</span> <Plus className="size-3.5"  />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Fill the form below to add a new task.
          </DialogDescription>
        </DialogHeader>

        <TaskForm
          defaultListId={defaultListId}
          onSubmit={handleSubmit}
          initialValues={initialValues}
          submitLabel="Add Task"
        />
      </DialogContent>
    </Dialog>
  );
}

export default AddNewTask;