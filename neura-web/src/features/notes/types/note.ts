import type { colors } from "@/types/color";

export interface Note {
  id: string | number;
  title: string;
  description: string | null;
  color: colors;
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
  goalId: string | null;
  taskId: string | null;
  folder: { id: string; name: string; color: colors } | null;
  goal: { id: string; title: string } | null;
  task: { id: string; title: string; completed: boolean } | null;
}

export type NoteInput = Pick<Note, "title" | "description" | "color">;

/** Sent as snake_case; omitted = unchanged, null = unlink */
export interface NoteLinksInput {
  folder_id?: string | null;
  goal_id?: string | null;
  task_id?: string | null;
}

export interface NoteFolder {
  id: string;
  name: string;
  color: colors;
  goalId: string | null;
  goal: { id: string; title: string } | null;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFolderInput {
  name?: string;
  color?: colors;
  goal_id?: string | null;
}

export interface NoteLinkOptions {
  goals: { id: string; title: string; color: string; parentTitle: string | null }[];
  tasks: { id: string; title: string; dueDate: string | null }[];
}

export interface LinkPreview {
  title: string | null;
  author: string | null;
  thumbnail: string | null;
  text: string | null;
}
