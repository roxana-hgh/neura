// hooks/useDailyPlan.ts
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface DailyPlanResponse {
  reply: string;
  actions: unknown[];
}

async function fetchDailyPlan() {
  const { data } = await api.post<DailyPlanResponse>("/assistant", {
    mode: "daily_plan",
    question: "Give me today's plan.",
    history: [],
  });
  return data.reply;
}

export function useDailyPlan() {
  return useMutation({
    mutationFn: fetchDailyPlan,
  });
}