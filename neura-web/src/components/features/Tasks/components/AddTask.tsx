import { useState } from "react";
import TaskForm from "./TaskForm";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../ui/dialog";
import { Button } from "../../../ui/button";
import type { TaskFormValues } from "../schema/task.schema";
import { useCreateTask } from "../hooks/useTasks";
import { toast } from "../../../../lib/toast";


interface IProps {
  // Pass the current list's id when rendering this button inside a list page.
  // Leave undefined (or don't pass it) on the "All Tasks" page.
  defaultListId?: string | number | null;
    initialDueDate?: Date; 
    isSmall?: boolean;
}

function AddNewTask({ defaultListId, initialDueDate, isSmall = false  }: IProps) {
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

  // Convert Date → "YYYY-MM-DD" string that TaskForm expects
  const initialValues = initialDueDate
    ? { due_date: initialDueDate.toISOString().split("T")[0] } // ← new
    : undefined;

  return (
    <Dialog open={openModal} onOpenChange={setOpenModal}>
      <DialogTrigger asChild>
        <Button type="button" size={isSmall ? "xs" : "sm"} variant="outline">
          <span className={`hidden sm:block  ${isSmall ? "text-xs" : "text-sm"}`}>Add Task</span> <Plus  />
        </Button>
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