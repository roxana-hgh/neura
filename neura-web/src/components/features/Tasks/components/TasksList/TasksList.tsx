import { ChevronDownIcon } from "lucide-react";
import type { Task } from "../../../../../types/Tasks";
import TaskListItem from "./TaskListItem";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../../ui/collapsible";
import NoTasks from "../NoTasks";

interface Iprobs {
  label: string;
  tasks: Task[] | undefined;
}

function TasksList({ label, tasks }: Iprobs) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="tasks-list py-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <div className="task-list-title border-b p-1 sm:p-2 font-bold text-lg flex justify-content-between items-center">
            <h2 className="text-base">{label}</h2>
            <ChevronDownIcon
              size={15}
              className="ml-auto group-data-[state=open]:rotate-180"
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col items-start p-1 sm:p-2.5 pt-0 text-sm">
          {tasks && tasks.length ? (
            tasks.map((task) => <TaskListItem key={task.id} task={task} />)
          ) : (
             <NoTasks/>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default TasksList;
