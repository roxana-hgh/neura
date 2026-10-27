import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DEFAULT_WEEK_STARTS_ON, type WeekStartsOn } from "@/lib/weekStart";

/**
 * The user's first day of the week (Settings → Calendar). Shares the `["profile"]`
 * cache with the settings page, so changing it there updates every view.
 */
export function useWeekStartsOn(): WeekStartsOn {
  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/users/me")).data,
    select: (user: { weekStartsOn?: WeekStartsOn }) => user.weekStartsOn ?? DEFAULT_WEEK_STARTS_ON,
    staleTime: 5 * 60 * 1000,
  });
  return data ?? DEFAULT_WEEK_STARTS_ON;
}
