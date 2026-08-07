import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../lib/api"
import { format } from "date-fns";
import type { HabitsResponse, HabitView, CreateHabitInput, UpdateHabitInput } from "../../../../types/habit";

const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

export function useHabits(view: HabitView, date: Date) {
  return useQuery({
    queryKey: ["habits", view, dateKey(date)],
    queryFn: async () => {
      const { data } = await api.get<HabitsResponse>("/habits", { params: { view, date: dateKey(date) } });
      return data;
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHabitInput) => (await api.post("/habits", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: UpdateHabitInput) => (await api.patch(`/habits/${id}`, rest)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/habits/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

export function useToggleHabitEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) =>
      (await api.post(`/habits/${habitId}/toggle`, { date })).data,
    // optimistic flip so the square updates instantly, no spinner
    onMutate: async ({ habitId, date }) => {
      await queryClient.cancelQueries({ queryKey: ["habits"] });
      const previous = queryClient.getQueriesData<HabitsResponse>({ queryKey: ["habits"] });

      previous.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<HabitsResponse>(key, {
          ...data,
          habits: data.habits.map((h) => {
            if (h.id !== habitId) return h;
            const has = h.entries.includes(date);
            const entries = has ? h.entries.filter((d) => d !== date) : [...h.entries, date];
            const completed = has ? h.stats.completed - 1 : h.stats.completed + 1;
            const percent = h.stats.total > 0 ? Math.round((completed / h.stats.total) * 100) : 0;
            return { ...h, entries, stats: { ...h.stats, completed, percent } };
          }),
        });
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}