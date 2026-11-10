import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TaskList } from "@/features/tasks/types/task";
import type { TaskViewMode } from "@/features/tasks/utils/groupTasks";

export type TagMatchMode = "any" | "all";

export interface TaskStoreState {
  // ── Lists ──────────────────────────────────
  lists: TaskList[];

  // ── Filter state ───────────────────────────
  search: string;
  priorities: Set<string>;
  /** Hide tasks that belong to a goal from the Tasks page (persisted) */
  hideGoalTasks: boolean;
  /** Tag ids to filter the task list by (cleared when leaving the page) */
  tagFilter: string[];
  /** "any" = task has at least one selected tag, "all" = task has every one (persisted) */
  tagMatch: TagMatchMode;

  // ── View state (persisted) ─────────────────
  viewMode: TaskViewMode;

  // ── List actions ───────────────────────────
  setLists: (lists: TaskList[]) => void;
  addList: (list: TaskList) => void;
  removeList: (id: string | number) => void;
  updateList: (id: string | number, updates: Partial<TaskList>) => void;

  // ── Filter actions ─────────────────────────
  setSearch: (value: string) => void;
  togglePriority: (priority: string) => void;
  clearFilters: () => void;
  toggleHideGoalTasks: () => void;
  toggleTagFilter: (tagId: string) => void;
  clearTagFilter: () => void;
  setTagMatch: (mode: TagMatchMode) => void;

  // ── View actions ───────────────────────────
  setViewMode: (mode: TaskViewMode) => void;
}

export const useTasksStore = create<TaskStoreState>()(
  persist(
    (set) => ({
  // ── Initial state ──────────────────────────
  lists: [],
  search: "",
  priorities: new Set<string>(),
  hideGoalTasks: false,
  tagFilter: [],
  tagMatch: "any",
  viewMode: "sorted",

  // ── List actions ───────────────────────────
  setLists: (lists) => set({ lists }),

  addList: (list) =>
    set((state) => ({ lists: [...state.lists, list] })),

  removeList: (id) =>
    set((state) => ({ lists: state.lists.filter((l) => l.id !== id) })),

  updateList: (id, updates) =>
    set((state) => ({
      lists: state.lists.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  // ── Filter actions ─────────────────────────
  setSearch: (value) => set({ search: value }),

  togglePriority: (priority) =>
    set((state) => {
      const priorities = new Set(state.priorities);
      if (priorities.has(priority)) priorities.delete(priority);
      else priorities.add(priority);
      return { priorities };
    }),

  clearFilters: () => set({ search: "", priorities: new Set<string>() }),

  toggleHideGoalTasks: () => set((state) => ({ hideGoalTasks: !state.hideGoalTasks })),

  toggleTagFilter: (tagId) =>
    set((state) => ({
      tagFilter: state.tagFilter.includes(tagId)
        ? state.tagFilter.filter((id) => id !== tagId)
        : [...state.tagFilter, tagId],
    })),

  clearTagFilter: () => set({ tagFilter: [] }),

  setTagMatch: (tagMatch) => set({ tagMatch }),

  // ── View actions ───────────────────────────
  setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: "neura-tasks-view",
      // only view preferences are persisted; lists come from the API
      partialize: (state) => ({
        viewMode: state.viewMode,
        hideGoalTasks: state.hideGoalTasks,
        tagMatch: state.tagMatch,
      }),
    },
  ),
);