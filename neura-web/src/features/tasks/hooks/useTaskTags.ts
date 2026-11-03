import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { mapTask } from "@/features/tasks/hooks/useTasks";
import type { TaskTag, TaskTagWithCount } from "@/features/tasks/types/task";

export type TagInput = Pick<TaskTag, "name" | "color">;

/** `{ error }` message from the API (e.g. "A tag with this name already exists"), or a fallback. */
export function tagErrorMessage(error: unknown, fallback = "Something went wrong") {
  return (isAxiosError(error) && error.response?.data?.error) || fallback;
}

export function useTaskTags() {
  return useQuery({
    queryKey: ["task-tags"],
    queryFn: async () => {
      const { data } = await api.get<TaskTagWithCount[]>("/tasks/tags");
      return data;
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TagInput) => {
      const { data } = await api.post<TaskTag>("/tasks/tags", values);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task-tags"] }),
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TagInput }) => {
      const { data } = await api.put<TaskTag>(`/tasks/tags/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-tags"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // tasks embed the tag's name / color
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-tags"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/** Replaces a task's tags without touching its other fields. */
export function useSetTaskTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, tagIds }: { taskId: string | number; tagIds: string[] }) => {
      const { data } = await api.patch(`/tasks/${taskId}/tags`, { tag_ids: tagIds });
      return mapTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-tags"] }); // per-tag task counts
    },
  });
}
