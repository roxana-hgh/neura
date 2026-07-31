/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Plus } from "lucide-react";
import { useTasksStore } from "../../stores/tasks";
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
import { useCreateList } from "../../hooks/useTasks";
import { toast } from "../../../../../lib/toast";

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
          <Button type="button" size={isSmall ? "xs" : "sm"} variant="outline">
            <span className={`hidden sm:block  ${isSmall ? "text-xs" : "text-sm"}`}>New List</span> <Plus />   
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
