import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HabitView } from "@/features/habits/types/habit";

interface HabitsStoreState {
  view: HabitView;
  setView: (view: HabitView) => void;
}

export const useHabitsStore = create<HabitsStoreState>()(
  persist(
    (set) => ({
      view: "week",
      setView: (view) => set({ view }),
    }),
    { name: "neura-habits-view" },
  ),
);
