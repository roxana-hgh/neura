import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT = 5;

interface SearchStoreState {
  open: boolean;
  setOpen: (open: boolean) => void;
  recent: string[];
  addRecent: (query: string) => void;
  removeRecent: (query: string) => void;
  clearRecent: () => void;
}

/** Palette open state (header button, Ctrl/⌘ K) and recent queries (persisted). */
export const useSearchStore = create<SearchStoreState>()(
  persist(
    (set) => ({
      open: false,
      setOpen: (open) => set({ open }),
      recent: [],
      addRecent: (query) =>
        set((s) => {
          const q = query.trim();
          if (!q) return s;
          const rest = s.recent.filter((r) => r.toLowerCase() !== q.toLowerCase());
          return { recent: [q, ...rest].slice(0, MAX_RECENT) };
        }),
      removeRecent: (query) => set((s) => ({ recent: s.recent.filter((r) => r !== query) })),
      clearRecent: () => set({ recent: [] }),
    }),
    { name: "neura-search", partialize: (s) => ({ recent: s.recent }) },
  ),
);
