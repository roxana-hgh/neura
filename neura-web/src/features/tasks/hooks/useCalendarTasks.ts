import { useQuery } from "@tanstack/react-query";
import type { Task } from "@/features/tasks/types/task";
import { api } from "@/lib/api";

export function useCalendarTasks(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed, matches backend

  return useQuery<Task[]>({
    queryKey: ["tasks", "calendar", year, month],
    queryFn: async () => {
      const res = await api.get("/tasks/calendar", {
        params: { year, month },
      });
      return res.data.map((t: Task & { dueDate?: string }) => ({
        ...t,
        due_date: t.dueDate ?? null,
      }));
    },
  });
}