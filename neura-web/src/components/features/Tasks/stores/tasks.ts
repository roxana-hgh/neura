import { create } from "zustand";
import type { TaskList } from "../../../../types/Tasks";

export interface TaskStoreState {
  // ── Lists ──────────────────────────────────
  lists: TaskList[];

  // ── Filter state ───────────────────────────
  search: string;
  priorities: Set<string>;

  // ── List actions ───────────────────────────
  setLists: (lists: TaskList[]) => void;
  addList: (list: TaskList) => void;
  removeList: (id: string | number) => void;
  updateList: (id: string | number, updates: Partial<TaskList>) => void;

  // ── Filter actions ─────────────────────────
  setSearch: (value: string) => void;
  togglePriority: (priority: string) => void;
  clearFilters: () => void;
}

export const useTasksStore = create<TaskStoreState>((set) => ({
  // ── Initial state ──────────────────────────
  lists: [],
  search: "",
  priorities: new Set<string>(),

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
}));