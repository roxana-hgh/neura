import { CheckCheck, Plus } from "lucide-react";
import AddNewTask from "@/features/tasks/components/AddTask";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

interface Iprops {
  title?: string;
  description?: string;
  defaultListId?: string | number | null;
  initialDueDate?: Date;
}

function NoTasks({
  title = "Nothing here yet",
  description = "Add a task and it will show up here.",
  defaultListId,
  initialDueDate,
}: Iprops) {
  return (
    <EmptyState
      compact
      icon={CheckCheck}
      title={title}
      description={description}
      action={
        <AddNewTask
          defaultListId={defaultListId}
          initialDueDate={initialDueDate}
          trigger={

            <Button variant="outline" type="button" className="flex items-center gap-0.5" size="sm">
              <Plus className="size-3.5" /> <span className="text-xs">Add task</span>
            </Button>
          }
        />
      }
    />
  );
}

export default NoTasks;
