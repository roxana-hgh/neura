import { useMemo } from "react";
import { useTasksByList } from "./taskSelectors";

export interface TaskProgress {
  totalTasks: number;
  completedTasks: number;
  percentTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
  percentSubtasks: number;
}

export const useTaskProgress = (listId: string | number): TaskProgress => {
  const { data: tasks = [] } = useTasksByList(String(listId));

  return useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => !!t.completed).length;
    const percentTasks = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalSubtasks = tasks.reduce((acc, t) => acc + (t.subtasks?.length ?? 0), 0);
    const completedSubtasks = tasks.reduce(
      (acc, t) => acc + (t.subtasks?.filter((s) => !!s.completed).length ?? 0),
      0
    );
    const percentSubtasks = totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      percentTasks,
      totalSubtasks,
      completedSubtasks,
      percentSubtasks,
    };
  }, [tasks]);
};