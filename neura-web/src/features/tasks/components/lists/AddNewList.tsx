/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Plus } from "lucide-react";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ListForm from "@/features/tasks/components/lists/ListForm";
import { useCreateList } from "@/features/tasks/hooks/useTasks";
import { toast } from "@/lib/toast";

interface Iprops {
  iconOnlyTrigger?: boolean;
  isSmall?: boolean;
}

function AddNewList({ iconOnlyTrigger, isSmall = false }: Iprops) {
  const [open, setOpen] = useState(false);

  const addList = useTasksStore((s) => s.addList);
  const { mutate: createList } = useCreateList();

  const handleSubmit = (values: any) => {
    createList(values, {
      onSuccess: (list) => {
        addList(list);
        setOpen(false);
        toast.success("List created successfully!");
      },
      onError: (error) => {
        toast.error(`Error creating list: ${error.message}`);
      }
    });
  };



  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {iconOnlyTrigger ? (
          <Button asChild type="button" size="icon-xs" variant="link">
            <Plus size={12} />
          </Button>
        ) : (
          <Button type="button" size={isSmall ? "xs" : "sm"} className="flex items-center gap-0.5">
            <Plus className="size-3.5" /> <span className="text-xs">New list</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New List</DialogTitle>
          <DialogDescription>
            Create a new list to organise your tasks.
          </DialogDescription>
        </DialogHeader>

        <ListForm onSubmit={handleSubmit} submitLabel="Create List" />
      </DialogContent>
    </Dialog>
  );
}

export default AddNewList;
