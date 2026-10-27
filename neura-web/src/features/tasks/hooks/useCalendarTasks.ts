import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { eachMonthOfInterval } from "date-fns";
import type { Task } from "@/features/tasks/types/task";
import { api } from "@/lib/api";
import { mapTask } from "@/features/tasks/hooks/useTasks";
import type { CalendarRange } from "@/features/tasks/utils/calendar";

// Merge the per-month results; a task can't appear twice, but dedupe by id to be safe
function combine(results: UseQueryResult<Task[]>[]) {
  const byId = new Map<Task["id"], Task>();
  for (const r of results) for (const t of r.data ?? []) byId.set(t.id, t);
  return {
    data: [...byId.values()],
    isLoading: results.some((r) => r.isLoading),
    isFetching: results.some((r) => r.isFetching),
  };
}

// The visible range can span up to 3 months (month view with leading/trailing
// days, or a week crossing a month boundary), so fetch each month it touches.
export function useCalendarTasks(range: CalendarRange) {
  const months = eachMonthOfInterval(range);

  return useQueries({
    queries: months.map((m) => {
      const year = m.getFullYear();
      const month = m.getMonth(); // 0-indexed, matches backend
      return {
        queryKey: ["tasks", "calendar", year, month],
        queryFn: async () => {
          const res = await api.get("/tasks/calendar", { params: { year, month } });
          return (res.data as unknown[]).map(mapTask);
        },
        placeholderData: (prev: Task[] | undefined) => prev,
      };
    }),
    combine,
  });
}
