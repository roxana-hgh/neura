// hooks/useDailyPlan.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../../lib/api";

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
  return useQuery({
    // date-keyed so it naturally refreshes once a new day starts
    queryKey: ["assistant", "daily-plan", new Date().toDateString()],
    queryFn: fetchDailyPlan,
    staleTime: 1000 * 60 * 30, // 30 min — avoid re-hitting Gemini on every dashboard visit
    refetchOnWindowFocus: false,
  });
}