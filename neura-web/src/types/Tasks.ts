export type colors = "blue" | "green" | "red" | "yellow" | "orange" | "pink" | "purple" | "gray" ;


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
  due_date: string | null;
  priority: "low" | "medium" | "high";
  subtasks: SubTask[] | null;
  list_id: string | number | null; // null = not assigned to any list
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

