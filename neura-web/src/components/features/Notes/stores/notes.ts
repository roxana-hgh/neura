import { create } from "zustand";

export interface NoteStoreState {
  search: string;
  setSearch: (value: string) => void;
}

export const useNotesStore = create<NoteStoreState>((set) => ({
  search: "",
  setSearch: (value) => set({ search: value }),
}));