import { create } from "zustand";
import type { DateRangeFilter, FocusSessionTag } from "@/features/focus/types/focusSession";


interface FocusTimerUIState {
  durationMinutes: number;
  setDurationMinutes: (m: number) => void;
  historyRange: DateRangeFilter;
  setHistoryRange: (r: DateRangeFilter) => void;
  historyTag: FocusSessionTag | "all";
  setHistoryTag: (t: FocusSessionTag | "all") => void;
}

export const useFocusTimerStore = create<FocusTimerUIState>((set) => ({
  durationMinutes: 25,
  setDurationMinutes: (m) => set({ durationMinutes: m }),
  historyRange: "today",
  setHistoryRange: (r) => set({ historyRange: r }),
  historyTag: "all",
  setHistoryTag: (t) => set({ historyTag: t }),
}));