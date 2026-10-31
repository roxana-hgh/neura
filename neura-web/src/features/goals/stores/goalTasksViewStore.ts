import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GoalTaskSort } from "@/features/goals/utils/goalTasks";

interface GoalTasksViewState {
  sort: GoalTaskSort;
  /** Group the goal page's tasks by sub-goal */
  grouped: boolean;
  setSort: (sort: GoalTaskSort) => void;
  setGrouped: (grouped: boolean) => void;
}

export const useGoalTasksViewStore = create<GoalTasksViewState>()(
  persist(
    (set) => ({
      sort: "due",
      grouped: true,
      setSort: (sort) => set({ sort }),
      setGrouped: (grouped) => set({ grouped }),
    }),
    { name: "neura-goal-tasks-view" },
  ),
);
