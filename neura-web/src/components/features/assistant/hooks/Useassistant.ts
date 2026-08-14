/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../lib/api";

export type AssistantMode = "today" | "week" | "upcoming" | "overdue" | "suggestion" | "custom" | "daily_plan";

type TaskActionName = "create_task" | "update_task" | "delete_task";
type HabitActionName = "create_habit" | "update_habit" | "delete_habit" | "log_habit_completion";

export interface ToolAction {
  name: TaskActionName | HabitActionName;
  args: Record<string, any>;
  result: {
    created?: { id: string; title: string; priority?: string; durationDays?: number | null };
    updated?: { id: string; title: string; priority?: string; durationDays?: number | null };
    deleted?: { id: string; title: string };
    habit?: string;
    date?: string;
    completed?: boolean;
    error?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ToolAction[];
}

interface AskAssistantResponse {
  reply: string;
  actions: ToolAction[];
}

interface AskAssistantPayload {
  mode: AssistantMode;
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
}

const HABIT_ACTION_NAMES = new Set<HabitActionName>([
  "create_habit",
  "update_habit",
  "delete_habit",
  "log_habit_completion",
]);

async function askAssistant(payload: AskAssistantPayload) {
  const { data } = await api.post<AskAssistantResponse>("/assistant", payload);
  return data;
}

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: askAssistant,
    onSuccess: ({ reply, actions }) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply, actions },
      ]);

      if (actions.length > 0) {
        const touchedTasks = actions.some((a) => !HABIT_ACTION_NAMES.has(a.name as HabitActionName));
        const touchedHabits = actions.some((a) => HABIT_ACTION_NAMES.has(a.name as HabitActionName));

        // Adjust these keys if your tasks/habits hooks use different query keys.
        if (touchedTasks) queryClient.invalidateQueries({ queryKey: ["tasks"] });
        if (touchedHabits) queryClient.invalidateQueries({ queryKey: ["habits"] });
      }
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't reach the assistant just now. Try again in a moment.",
        },
      ]);
    },
  });

  const sendMessage = useCallback(
    (text: string, mode: AssistantMode = "custom") => {
      const trimmed = text.trim();
      if (!trimmed || mutation.isPending) return;

      const history = messages.map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed },
      ]);

      mutation.mutate({ mode, question: trimmed, history });
    },
    [messages, mutation]
  );

  const sendQuickAction = useCallback(
    (mode: AssistantMode, message: string) => {
      sendMessage(message, mode);
    },
    [sendMessage]
  );

  return {
    messages,
    sendMessage,
    sendQuickAction,
    isPending: mutation.isPending,
  };
}