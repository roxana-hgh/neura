/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task, TaskList } from "@/features/tasks/types/task";
import { api } from "@/lib/api";
import type { TaskFormValues } from "@/features/tasks/schemas/task.schema";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import type { ListFormValues } from "@/features/tasks/schemas/list.schema";
import { useMemo } from "react";
import { eachDayOfInterval, format, isSameDay, startOfDay, subDays } from "date-fns";

// Map snake_case DB fields → your frontend types
export const mapTask = (raw: any): Task => ({
  id: raw.id,
  title: raw.title,
  description: raw.description ?? null,
  completed: raw.completed,
  priority: raw.priority as "low" | "medium" | "high",
  created_at: raw.createdAt, // DateTime → ISO string (already is one)
  completed_at: raw.completedAt ?? null,
  due_date: raw.dueDate ?? null,
  list_id: raw.listId ?? null,
  subtasks: raw.subtasks ?? null,
});

export function useTasks() {
  const search = useTasksStore((s) => s.search);
  const priorities = useTasksStore((s) => s.priorities);

  return useQuery({
    queryKey: ["tasks", search, [...priorities].sort()],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/tasks", {
        params: {
          search: search || undefined,
          priorities: [...priorities].join(",") || undefined,
        },
      });
      return data.map(mapTask);
    },
  });
}

export function useTaskLists() {
  return useQuery({
    queryKey: ["task-lists"],
    queryFn: async () => {
      const { data } = await api.get<TaskList[]>("/tasks/lists");
      return data;
    },
  });
}

export function useTaskList(id: string) {
  return useQuery({
    queryKey: ["task-list", id],
    queryFn: async () => {
      const { data } = await api.get<TaskList>(`/tasks/lists/${id}`);
      return data;
    },
    enabled: !!id, // don't fetch if id is empty
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const { data } = await api.post("/tasks", values);
      return mapTask(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string | number;
      values: TaskFormValues;
    }) => {
      const { data } = await api.put(`/tasks/${id}`, values);
      return mapTask(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: {
      name: string;
      color: string;
      description?: string;
    }) => {
      const { data } = await api.post<TaskList>("/tasks/lists", values);
      return data;
    },
    onSuccess: (newList) => {
      queryClient.setQueryData<TaskList[]>(["task-lists"], (old = []) => [
        ...old,
        newList,
      ]);
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      completed,
    }: {
      id: string | number;
      completed: boolean;
    }) => {
      const { data } = await api.patch(`/tasks/${id}/toggle`, { completed });
      return mapTask(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string | number;
      values: ListFormValues;
    }) => {
      const { data } = await api.put<TaskList>(`/tasks/lists/${id}`, values);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["task-lists"] }),
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`/tasks/lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-lists"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // tasks lose their list_id
    },
  });
}

export function useToggleSubTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      subtaskId,
      completed,
    }: {
      taskId: string | number;
      subtaskId: string | number;
      completed: boolean;
    }) => {
      const { data } = await api.patch(
        `/tasks/${taskId}/subtasks/${subtaskId}/toggle`,
        { completed },
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useAddSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      title,
    }: {
      taskId: string | number;
      title: string;
    }) => {
      const { data } = await api.post(`/tasks/${taskId}/subtasks`, { title });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      subtaskId,
      title,
    }: {
      taskId: string | number;
      subtaskId: string | number;
      title: string;
    }) => {
      const { data } = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        title,
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      subtaskId,
    }: {
      taskId: string | number;
      subtaskId: string | number;
    }) => {
      await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

// Derived, client-side: tasks completed per day for the last 7 days.
// Reuses the cached /tasks list — no extra network call.
export function useTasksCompletedByDay() {
  const { data: tasks, isPending } = useTasks();

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = eachDayOfInterval({ start: subDays(today, 6), end: today });

    return days.map((day) => {
      const count = (tasks ?? []).filter(
        (t) => t.completed && t.completed_at && isSameDay(new Date(t.completed_at), day)
      ).length;

      return {
        date: format(day, "EEE"),
        tasksCompleted: count,
      };
    });
  }, [tasks]);

  return { data: chartData, isPending };
}