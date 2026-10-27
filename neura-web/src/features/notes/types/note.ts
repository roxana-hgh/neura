import type { colors } from "@/types/color";

export interface Note {
  id: string | number;
  title: string;
  description: string | null;
  color: colors;
  createdAt: string;
  updatedAt: string;
}

export type NoteInput = Pick<Note, "title" | "description" | "color">;
