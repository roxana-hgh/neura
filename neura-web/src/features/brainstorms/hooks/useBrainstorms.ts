import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { Brainstorm, BrainstormStatus } from "@/features/brainstorms/types/brainstorm";

const KEY = ["brainstorms"] as const;

const invalidate = (qc: QueryClient) => qc.invalidateQueries({ queryKey: KEY });

/** Drops an item from the cached inbox at once, so actions feel instant. Returns a rollback. */
async function removeFromInbox(qc: QueryClient, id: string) {
  await qc.cancelQueries({ queryKey: KEY });
  const key = [...KEY, "inbox"];
  const previous = qc.getQueryData<Brainstorm[]>(key);
  if (previous) qc.setQueryData(key, previous.filter((b) => b.id !== id));
  return () => qc.setQueryData(key, previous);
}

export function useBrainstorms(status: BrainstormStatus) {
  return useQuery({
    queryKey: [...KEY, status],
    queryFn: async () => (await api.get<Brainstorm[]>("/brainstorms", { params: { status } })).data,
  });
}

export function useCreateBrainstorm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => (await api.post<Brainstorm>("/brainstorms", { content })).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't save it, try again"),
  });
}

export function useUpdateBrainstorm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) =>
      (await api.patch<Brainstorm>(`/brainstorms/${id}`, { content })).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't save the change"),
  });
}

/** Keep for later (review): stays in the inbox, no longer counted as new */
export function useKeepBrainstorm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Brainstorm>(`/brainstorms/${id}/keep`)).data,
    onSuccess: () => invalidate(qc),
  });
}

/** Out of the inbox: pass the task / reminder it became, or nothing to dismiss it. */
export function useProcessBrainstorm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId, reminderId }: { id: string; taskId?: string; reminderId?: string }) =>
      (await api.post<Brainstorm>(`/brainstorms/${id}/process`, { task_id: taskId, reminder_id: reminderId })).data,
    onMutate: ({ id }) => removeFromInbox(qc, id),
    onError: (_e, _v, rollback) => {
      rollback?.();
      toast.error("Couldn't move it out of the inbox");
    },
    onSettled: () => invalidate(qc),
  });
}

export function useRestoreBrainstorm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Brainstorm>(`/brainstorms/${id}/restore`)).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't restore it"),
  });
}

export function useDeleteBrainstorm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/brainstorms/${id}`);
    },
    onMutate: (id) => removeFromInbox(qc, id),
    onError: (_e, _v, rollback) => {
      rollback?.();
      toast.error("Couldn't delete it");
    },
    onSettled: () => invalidate(qc),
  });
}

export function useClearProcessed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.delete<{ deleted: number }>("/brainstorms/processed")).data,
    onSuccess: () => invalidate(qc),
    onError: () => toast.error("Couldn't clear the history"),
  });
}
