// utils/taskSelectors.ts
import { useMemo } from "react"
import { useTasksStore } from "../stores/tasks"
import type { TaskWithListName } from "../../../../types/Tasks"
import { useQuery } from "@tanstack/react-query";
import { mapTask, useTasks } from "../hooks/useTasks";
import { api } from "../../../../lib/api";


// taskSelectors.ts
export const useTasksByList = (listId: string) => {
  const search = useTasksStore((s) => s.search);
  const priorities = useTasksStore((s) => s.priorities);

  return useQuery({
    queryKey: ["tasks", "list", listId, search, [...priorities].sort()],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/tasks", {
        params: {
          listId,
          search: search || undefined,
          priorities: [...priorities].join(",") || undefined,
        },
      });
      return data.map(mapTask);
    },
  });
};

export const useUnassignedTasks = () => {
  return useQuery({
    queryKey: ["tasks", "unassigned"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/tasks", {
        params: { unassigned: true },
      });
      return data.map(mapTask);
    },
  });
};

export const useAllTasksSortedByDueDate = () => {
  const lists = useTasksStore((s) => s.lists);
  const { data: tasks = [] } = useTasks();

  // Just enrich with list name/color — sorting is done by the API
  return useMemo((): TaskWithListName[] => {
    const listNameMap = new Map(lists.map((l) => [l.id, l.name]));
    const listColorMap = new Map(lists.map((l) => [l.id, l.color]));

    return tasks.map((task) => ({
      ...task,
      listName: task.list_id != null ? (listNameMap.get(task.list_id) ?? null) : null,
      listColor: task.list_id != null ? (listColorMap.get(task.list_id) ?? "gray") : "gray",
    }));
  }, [tasks, lists]);
};