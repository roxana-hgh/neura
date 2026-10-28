import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import type { TaskGoal } from "@/features/tasks/types/task";
import { cn } from "@/lib/utils";

/**
 * "From goal" marker: links to the goal (or sub-goal) the task belongs to.
 * Clicks don't bubble, so it can sit inside a TaskDetail trigger.
 */
function TaskGoalBadge({ goal, className }: { goal: TaskGoal; className?: string }) {
  const label = goal.parent ? `${goal.parent.title} › ${goal.title}` : goal.title;

  return (
    <Link
      to={`/goal/${goal.id}`}
      onClick={(e) => e.stopPropagation()}
      title={`From goal: ${label}`}
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary hover:bg-primary/15",
        className,
      )}
    >
      <Target className="size-3 shrink-0" />
      <span className="truncate" dir="auto">{label}</span>
    </Link>
  );
}

export default TaskGoalBadge;
