import { ArrowDownWideNarrow, CalendarDays } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import type { TaskViewMode } from "@/features/tasks/utils/groupTasks";

const options: { value: TaskViewMode; label: string; Icon: typeof CalendarDays }[] = [
  { value: "sorted", label: "Sort by due date", Icon: ArrowDownWideNarrow },
  { value: "grouped", label: "Group by date (Today, Tomorrow, …)", Icon: CalendarDays },
];

function TaskViewToggle() {
  const viewMode = useTasksStore((s) => s.viewMode);
  const setViewMode = useTasksStore((s) => s.setViewMode);

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={viewMode}
      onValueChange={(value) => value && setViewMode(value as TaskViewMode)}
    >
      {options.map(({ value, label, Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <ToggleGroupItem value={value} aria-label={label} className="cursor-pointer">
              <Icon />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}

export default TaskViewToggle;
