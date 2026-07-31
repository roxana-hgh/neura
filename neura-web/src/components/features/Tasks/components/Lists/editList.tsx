import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import type { TaskList } from "../../../../../types/Tasks";
import { useTasksStore } from "../../stores/tasks";
import type { ListFormValues } from "../../schema/list.schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../ui/dialog";
import { Button } from "../../../../ui/button";
import ListForm from "./Listform";
import { useUpdateList } from "../../hooks/useTasks";
import { toast } from "../../../../../lib/toast";


interface IProps {
  list: TaskList;
  // Optionally render a custom trigger instead of the default pencil button
  trigger?: React.ReactNode;
}

function EditList({ list, trigger }: IProps) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const { mutate: updateList } = useUpdateList();
  const updateStore = useTasksStore((s) => s.updateList);

  const submitHandler = (data: ListFormValues) => {
    updateList(
      { id: list.id, values: data },
      {
        onSuccess: (updated) => {
          updateStore(list.id, updated);
          queryClient.invalidateQueries({ queryKey: ["task-lists"] });
          queryClient.setQueryData(["task-list", list.id], updated);

          setOpen(false);
          toast.success("List has been updated")
        },
        onError: (error) => {
          console.error("Error updating list:", error);
          toast.error("Failed to update list");  
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
            size="icon-sm"
            variant="outline"
            aria-label="Edit list"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>
            Update the name or colour of this list.
          </DialogDescription>
        </DialogHeader>

        <ListForm
          initialValues={{
            name: list.name,
            color: list.color,
            description: list.description ?? "",
          }}
          onSubmit={submitHandler}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}

export default EditList;
