import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { WeekStartsOn } from "@/lib/weekStart";
import type { UpdateProfilePayload, User } from "@/features/settings/types/user";


export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get<User>("/users/me");
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) =>
      api.patch("/users/me", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};

/** Optimistic, so the calendar and habits re-layout as soon as a day is picked. */
export const useUpdateWeekStart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weekStartsOn: WeekStartsOn) =>
      api.patch<User>("/users/me", { weekStartsOn }).then((r) => r.data),
    onMutate: async (weekStartsOn) => {
      await qc.cancelQueries({ queryKey: ["profile"] });
      const previous = qc.getQueryData<User>(["profile"]);
      if (previous) qc.setQueryData<User>(["profile"], { ...previous, weekStartsOn });
      return { previous };
    },
    onError: (_err, _value, context) => {
      if (context?.previous) qc.setQueryData(["profile"], context.previous);
      toast.error("Couldn't save the first day of the week");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
};