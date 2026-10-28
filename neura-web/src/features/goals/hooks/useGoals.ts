import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Goal, GoalDetail, GoalInput, GoalStatus, GoalTaskInput, LinkedReminder } from "@/features/goals/types/goal";

/** The client's calendar day, so "needs review" and pace follow the user's time zone. */
const today = () => format(new Date(), "yyyy-MM-dd");

/**
 * Goal changes can move reminders (pause / resume / extend) and tasks (linking),
 * so refresh those caches too.
 */
function invalidate(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["goals"] }),
    qc.invalidateQueries({ queryKey: ["reminders"] }),
  ]);
}

/** Goal + task caches, for changes to a goal's tasks. Awaited so `isPending` lasts until the list shows the change. */
function invalidateWithTasks(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["goals"] }),
    qc.invalidateQueries({ queryKey: ["tasks"] }),
  ]);
}

export function useGoals(archived = false) {
  return useQuery({
    queryKey: ["goals", "list", archived],
    queryFn: async () => (await api.get<Goal[]>("/goals", { params: { archived, today: today() } })).data,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ["goals", "detail", id],
    queryFn: async () => (await api.get<GoalDetail>(`/goals/${id}`, { params: { today: today() } })).data,
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GoalInput) => (await api.post<GoalDetail>("/goals", input, { params: { today: today() } })).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't create the goal"),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: GoalInput & { id: string }) =>
      (await api.patch<GoalDetail>(`/goals/${id}`, input, { params: { today: today() } })).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't save the goal"),
  });
}

export function useSetGoalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, keepReminderIds = [], note }: {
      id: string; status: GoalStatus; keepReminderIds?: string[]; note?: string;
    }) => (await api.patch<GoalDetail & { reminderChanges: { paused: number; restored: number } }>(
      `/goals/${id}/status`,
      { status, keep_reminder_ids: keepReminderIds, note: note || null },
      { params: { today: today() } },
    )).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't update the goal"),
  });
}

export function useExtendGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, endDate, note }: { id: string; endDate: string; note?: string }) =>
      (await api.post<GoalDetail>(`/goals/${id}/extend`, { end_date: endDate, note: note || null }, { params: { today: today() } })).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't extend the goal"),
  });
}

export function useArchiveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) =>
      (await api.post<GoalDetail>(`/goals/${id}/archive`, { archived }, { params: { today: today() } })).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't archive the goal"),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, keepReminders }: { id: string; keepReminders: boolean }) => {
      await api.delete(`/goals/${id}`, { params: { reminders: keepReminders ? "keep" : "delete" } });
    },
    onSuccess: (_d, { id }) => {
      qc.removeQueries({ queryKey: ["goals", "detail", id] });
      // Not awaited: the caller navigates away right after, no need to wait for the refetch.
      invalidate(qc);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error("Couldn't delete the goal"),
  });
}

export function useRecordProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value, delta, note }: { id: string; value?: number; delta?: number; note?: string }) =>
      (await api.post<GoalDetail>(`/goals/${id}/progress`, { value, delta, note: note || null }, { params: { today: today() } })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: () => toast.error("Couldn't save progress"),
  });
}

export function useAddGoalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) =>
      (await api.post<GoalDetail>(`/goals/${id}/notes`, { note }, { params: { today: today() } })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
    onError: () => toast.error("Couldn't save the note"),
  });
}

export function useDeleteGoalLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, logId }: { id: string; logId: string }) => { await api.delete(`/goals/${id}/logs/${logId}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

/** Active / paused reminders of the goal and its sub-goals, for the complete / delete dialogs. */
export function useGoalLinkedReminders(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["goals", "linked-reminders", id],
    queryFn: async () => (await api.get<LinkedReminder[]>(`/goals/${id}/reminders`)).data,
    enabled,
  });
}

export function useGoalLinkOptions(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["goals", "link-options", id],
    queryFn: async () => (await api.get<{
      tasks: { id: string; title: string; dueDate: string | null; goalId: string | null }[];
      notes: { id: string; title: string; goalId: string | null }[];
    }>(`/goals/${id}/link-options`)).data,
    enabled,
  });
}

export function useGoalLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type, targetId, attach }: { id: string; type: "task" | "note"; targetId: string; attach: boolean }) => {
      if (attach) await api.post(`/goals/${id}/links`, { type, target_id: targetId });
      else await api.delete(`/goals/${id}/links/${type}/${targetId}`);
    },
    onSuccess: () => invalidateWithTasks(qc),
    onError: () => toast.error("Couldn't update the link"),
  });
}

export function useCreateGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, title, dueDate, showInTasks = false }: {
      goalId: string; title: string; dueDate?: string | null; showInTasks?: boolean;
    }) => (await api.post(`/goals/${goalId}/tasks`, { title, due_date: dueDate ?? null, show_in_tasks: showInTasks })).data,
    onSuccess: () => invalidateWithTasks(qc),
    onError: () => toast.error("Couldn't create the task"),
  });
}

/** Shows / hides a goal task on the Tasks page and calendar. */
export function useSetGoalTaskVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, taskId, showInTasks }: { goalId: string; taskId: string; showInTasks: boolean }) => {
      await api.patch(`/goals/${goalId}/tasks/${taskId}`, { show_in_tasks: showInTasks });
    },
    onSuccess: (_d, { showInTasks }) => {
      toast.default(showInTasks ? "Task added to your Tasks list" : "Task removed from your Tasks list");
      return invalidateWithTasks(qc);
    },
    onError: () => toast.error("Couldn't update the task"),
  });
}

/** Edits a goal task (only the fields sent change). `goalId` is the goal whose page it's edited from. */
export function useUpdateGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, taskId, ...input }: { goalId: string; taskId: string } & GoalTaskInput) => {
      await api.patch(`/goals/${goalId}/tasks/${taskId}`, input);
    },
    onSuccess: () => invalidateWithTasks(qc),
    onError: () => toast.error("Couldn't save the task"),
  });
}

export function useDeleteGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, taskId }: { goalId: string; taskId: string }) => {
      await api.delete(`/goals/${goalId}/tasks/${taskId}`);
    },
    onSuccess: () => Promise.all([invalidateWithTasks(qc), qc.invalidateQueries({ queryKey: ["reminders"] })]),
    onError: () => toast.error("Couldn't delete the task"),
  });
}

/** Toggles a task from inside a goal; task-based progress updates with it. */
export function useToggleGoalTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) =>
      (await api.patch(`/tasks/${id}/toggle`, { completed })).data,
    onSuccess: () => invalidateWithTasks(qc),
    onError: () => toast.error("Couldn't update the task"),
  });
}
