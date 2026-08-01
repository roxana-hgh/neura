/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../lib/api";


export type AssistantMode = "today" | "week" | "upcoming" | "overdue" | "suggestion" | "custom";

export interface ToolAction {
  name: "create_task" | "update_task" | "delete_task";
  args: Record<string, any>;
  result: {
    created?: { id: string; title: string; priority: string };
    updated?: { id: string; title: string; priority: string };
    deleted?: { id: string; title: string };
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

      // If the assistant created, edited, or deleted a task, make sure the rest
      // of the app (task list, calendar) reflects it. Adjust the key below if
      // your tasks hook uses a different query key.
      if (actions.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
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

  // Quick actions now carry their own mode + message, so adding a new one
  // is just adding an entry in QuickActions.tsx — no hook changes needed.
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