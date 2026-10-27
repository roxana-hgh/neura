import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TaskList } from "@/features/tasks/types/task";
import type { TaskViewMode } from "@/features/tasks/utils/groupTasks";

export interface TaskStoreState {
  // ── Lists ──────────────────────────────────
  lists: TaskList[];

  // ── Filter state ───────────────────────────
  search: string;
  priorities: Set<string>;

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
      priorities.has(priority)
        ? priorities.delete(priority)
        : priorities.add(priority);
      return { priorities };
    }),

  clearFilters: () => set({ search: "", priorities: new Set<string>() }),

  // ── View actions ───────────────────────────
  setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: "neura-tasks-view",
      // only the view preference is persisted; lists come from the API
      partialize: (state) => ({ viewMode: state.viewMode }),
    },
  ),
);