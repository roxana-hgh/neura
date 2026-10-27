import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CalendarView = "month" | "week";

interface CalendarStoreState {
  view: CalendarView;
  setView: (view: CalendarView) => void;
}

export const useCalendarStore = create<CalendarStoreState>()(
  persist(
    (set) => ({
      view: "month",
      setView: (view) => set({ view }),
    }),
    { name: "neura-calendar-view" },
  ),
);
