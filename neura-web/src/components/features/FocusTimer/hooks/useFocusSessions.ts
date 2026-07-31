import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateFocusSessionInput, DateRangeFilter, FocusSession, FocusSessionListResponse, FocusSessionStats, UpdateFocusSessionInput } from "../../../../types/FocusSession";
import { api } from "../../../../lib/api";


const KEY = "focus-sessions";


export function useFocusSessions(range: DateRangeFilter, tag: string | undefined, page = 1, pageSize = 12) {
  return useQuery({
    queryKey: [KEY, range, tag, page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<FocusSessionListResponse>("/focus-sessions", {
        params: { range, tag, page, pageSize },
      });
      return data;
    },
  });
}

export function useFocusSessionStats(range: DateRangeFilter = "week") {
  return useQuery({
    queryKey: [KEY, "stats", range],
    queryFn: async () => {
      const { data } = await api.get<FocusSessionStats>("/focus-sessions/stats", { params: { range } });
      return data;
    },
  });
}

export function useCreateFocusSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFocusSessionInput) => {
      const { data } = await api.post<FocusSession>("/focus-sessions", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateFocusSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateFocusSessionInput }) => {
      const { data } = await api.patch<FocusSession>(`/focus-sessions/${id}`, updates);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteFocusSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/focus-sessions/${id}`);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}