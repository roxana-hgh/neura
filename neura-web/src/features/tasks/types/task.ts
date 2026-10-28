import type { colors } from "@/types/color";


export interface SubTask {
  id: string | number;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string | number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  subtasks: SubTask[] | null;
  list_id: string | number | null; // null = not assigned to any list
  /** The goal (or sub-goal, with its parent) this task belongs to. */
  goal: TaskGoal | null;
}

export interface TaskGoal {
  id: string;
  title: string;
  parent: { id: string; title: string } | null;
}

export interface TaskList {
  id: string | number;
  name: string;
  color: colors;
  description?: string | null;
}


export type TaskWithListName = Task & {
  listName: string | null;
  listColor: colors
};