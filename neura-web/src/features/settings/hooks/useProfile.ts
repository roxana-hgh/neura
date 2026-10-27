import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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