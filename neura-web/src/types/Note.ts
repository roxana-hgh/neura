import type { colors } from "./Tasks";

export interface Note {
  id: string | number;
  title: string;
  description: string | null;
  color: colors
  createdAt: string;
}


