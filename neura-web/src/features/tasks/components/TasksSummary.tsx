import { useMemo } from "react";
import { AlarmClock, CalendarCheck, CircleDashed, CircleCheck } from "lucide-react";
import StatTile from "@/components/shared/StatTile";
import type { Task } from "@/features/tasks/types/task";
import { getTaskStats } from "@/features/tasks/utils/taskStats";

interface TasksSummaryProps {
  tasks: Task[] | undefined;
  isLoading?: boolean;
}

function TasksSummary({ tasks, isLoading }: TasksSummaryProps) {
  const stats = useMemo(() => getTaskStats(tasks ?? []), [tasks]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        isLoading={isLoading}
        icon={<CircleDashed className="size-3.5" />}
        label="Open"
        value={stats.open}
        hint="tasks still to do"
      />
      <StatTile
        isLoading={isLoading}
        icon={<CalendarCheck className="size-3.5 text-primary" />}
        label="Due today"
        value={stats.dueToday}
        hint={stats.dueToday ? "on today's plate" : "Nothing due today"}
      />
      <StatTile
        isLoading={isLoading}
        icon={<AlarmClock className="size-3.5 text-rose-500" />}
        label="Overdue"
        value={
          <span className={stats.overdue ? "text-rose-600 dark:text-rose-400" : undefined}>{stats.overdue}</span>
        }
        hint={stats.overdue ? "need a new date" : "You're on track"}
      />
      <StatTile
        isLoading={isLoading}
        icon={<CircleCheck className="size-3.5 text-emerald-500" />}
        label="Done"
        value={stats.doneThisWeek}
        hint="completed in the last 7 days"
      />
    </div>
  );
}

export default TasksSummary;
