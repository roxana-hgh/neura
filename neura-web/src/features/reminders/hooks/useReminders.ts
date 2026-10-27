import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { endOfDay } from "date-fns";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type {
  Reminder, ReminderCounts, ReminderFilters, ReminderInput, ReminderLinkOptions, ReminderView,
} from "@/features/reminders/types/reminder";

/** Reminders show up on goals (next reminder, reminder section), so refresh both. */
function invalidate(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["reminders"] });
  qc.invalidateQueries({ queryKey: ["goals"] });
}

export function useReminders(view: ReminderView, filters: ReminderFilters = {}, enabled = true) {
  return useQuery({
    queryKey: ["reminders", view, filters],
    queryFn: async () => {
      const params = { view, goal_id: filters.goalId, task_id: filters.taskId, note_id: filters.noteId };
      return (await api.get<Reminder[]>("/reminders", { params })).data;
    },
    enabled,
  });
}

export function useReminderCounts() {
  return useQuery({
    queryKey: ["reminders", "counts"],
    queryFn: async () => {
      const params = { end_of_today: endOfDay(new Date()).toISOString() };
      return (await api.get<ReminderCounts>("/reminders/counts", { params })).data;
    },
    // "overdue" changes with the clock, not just with mutations
    refetchInterval: 60_000,
  });
}

export function useReminderLinkOptions(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["reminders", "link-options", q],
    queryFn: async () => (await api.get<ReminderLinkOptions>("/reminders/link-options", { params: { q } })).data,
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReminderInput) => (await api.post<Reminder>("/reminders", input)).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't create the reminder"),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ReminderInput & { id: string }) =>
      (await api.patch<Reminder>(`/reminders/${id}`, input)).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't save the reminder"),
  });
}

/**
 * Done / skip. Optimistically drops the reminder from cached lists that show it as open,
 * so the row disappears at once; the refetch puts a recurring one back at its next time.
 */
export function useCompleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, scope = "occurrence", skip = false }: { id: string; scope?: "occurrence" | "series"; skip?: boolean }) =>
      (await api.post<Reminder>(`/reminders/${id}/${skip ? "skip" : "complete"}`, { scope })).data,
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["reminders"] });
      const previous = qc.getQueriesData<Reminder[]>({ queryKey: ["reminders"] });
      previous.forEach(([key, data]) => {
        if (Array.isArray(data) && key[1] !== "done") qc.setQueryData(key, data.filter((r) => r.id !== id));
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("Couldn't update the reminder");
    },
    onSettled: () => invalidate(qc),
  });
}

export function useReopenReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Reminder>(`/reminders/${id}/reopen`)).data,
    onSettled: () => invalidate(qc),
  });
}

export function useSnoozeReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, until }: { id: string; until: Date }) =>
      (await api.post<Reminder>(`/reminders/${id}/snooze`, { until: until.toISOString() })).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't snooze the reminder"),
  });
}

export function useSetReminderPaused() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paused }: { id: string; paused: boolean }) =>
      (await api.post<Reminder>(`/reminders/${id}/${paused ? "pause" : "resume"}`)).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't update the reminder"),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/reminders/${id}`); },
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't delete the reminder"),
  });
}
