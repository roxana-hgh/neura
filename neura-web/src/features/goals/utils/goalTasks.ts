import type { GoalDetail, GoalTask } from "@/features/goals/types/goal";

export type GoalTaskSort = "due" | "priority" | "newest" | "oldest" | "title";

export const GOAL_TASK_SORTS: { value: GoalTaskSort; label: string }[] = [
  { value: "due", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title" },
];

const PRIORITY_RANK: Record<GoalTask["priority"], number> = { high: 0, medium: 1, low: 2 };

/** Soonest first, undated last. */
function byDueDate(a: GoalTask, b: GoalTask) {
  if (!a.dueDate) return b.dueDate ? 1 : 0;
  if (!b.dueDate) return -1;
  return a.dueDate.localeCompare(b.dueDate);
}

const COMPARE: Record<GoalTaskSort, (a: GoalTask, b: GoalTask) => number> = {
  due: byDueDate,
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDueDate(a, b),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  title: (a, b) => a.title.localeCompare(b.title),
};

/** Open tasks always come before completed ones, whatever the sort. */
export function sortGoalTasks(tasks: GoalTask[], sort: GoalTaskSort) {
  return [...tasks].sort((a, b) =>
    Number(a.completed) - Number(b.completed) || COMPARE[sort](a, b) || b.createdAt.localeCompare(a.createdAt));
}

export interface GoalTaskGroup {
  id: string;
  title: string;
  tasks: GoalTask[];
}

/** The goal's own tasks first, then one group per sub-goal. Groups without tasks are left out. */
export function groupGoalTasks(goal: GoalDetail, tasks: GoalTask[]): GoalTaskGroup[] {
  return [{ id: goal.id, title: "This goal" }, ...goal.subGoals]
    .map(({ id, title }) => ({ id, title, tasks: tasks.filter((t) => t.goalId === id) }))
    .filter((g) => g.tasks.length > 0);
}
