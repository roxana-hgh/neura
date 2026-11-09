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
  /** Deadline time on the due day, "HH:mm"; null = all day (every task created before times existed) */
  due_time: string | null;
  priority: "low" | "medium" | "high";
  subtasks: SubTask[] | null;
  list_id: string | number | null; // null = not assigned to any list
  /** The goal (or sub-goal, with its parent) this task belongs to. */
  goal: TaskGoal | null;
  tags: TaskTag[];
}

export interface TaskTag {
  id: string;
  name: string;
  color: colors;
}

/** A tag as returned by GET /tasks/tags, with how many tasks use it. */
export interface TaskTagWithCount extends TaskTag {
  taskCount: number;
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