import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useWeekStartsOn } from "@/hooks/useWeekStartsOn";
import { toast } from "@/lib/toast";
import { toDayKey } from "@/features/habits/lib/habitDate";
import type { HabitsResponse, HabitView, CreateHabitInput, UpdateHabitInput } from "@/features/habits/types/habit";

export function useHabits(view: HabitView, date: Date) {
  const weekStartsOn = useWeekStartsOn();
  return useQuery({
    queryKey: ["habits", view, toDayKey(date), weekStartsOn],
    queryFn: async () => {
      // `today` is sent so the API judges "future" days and streaks in the user's time zone;
      // `weekStartsOn` decides where the week view begins (Settings → Calendar)
      const params = { view, date: toDayKey(date), today: toDayKey(new Date()), weekStartsOn };
      const { data } = await api.get<HabitsResponse>("/habits", { params });
      return data;
    },
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[1] === view ? prev : undefined),
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHabitInput) => (await api.post("/habits", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
    onError: () => toast.error("Couldn't create the habit"),
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: UpdateHabitInput) => (await api.patch(`/habits/${id}`, rest)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
    onError: () => toast.error("Couldn't save the habit"),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/habits/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
    onError: () => toast.error("Couldn't delete the habit"),
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
        // only caches whose range contains the day know whether it was checked
        if (!data || date < data.rangeStart || date > data.rangeEnd) return;
        queryClient.setQueryData<HabitsResponse>(key, {
          ...data,
          habits: data.habits.map((h) => {
            if (h.id !== habitId) return h;
            const has = h.entries.includes(date);
            const delta = has ? -1 : 1;
            const entries = has ? h.entries.filter((d) => d !== date) : [...h.entries, date].sort();
            const countable = date >= h.startKey && (h.lastKey === null || date <= h.lastKey) && date <= data.today;
            const completed = h.stats.completed + (countable ? delta : 0);
            const percent = h.stats.total > 0 ? Math.round((completed / h.stats.total) * 100) : 0;
            return {
              ...h,
              entries,
              stats: { ...h.stats, completed, percent },
              totalCompleted: h.totalCompleted + delta,
              doneToday: date === data.today ? !has : h.doneToday,
            };
          }),
        });
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error("Couldn't update that day");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}
