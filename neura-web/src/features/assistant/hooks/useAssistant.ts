/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from "react";
import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useAssistantStore } from "@/features/assistant/stores/assistantStore";
import { TOOL_ACTIONS } from "@/features/assistant/lib/toolActions";
import type { MentionType } from "@/features/assistant/lib/mentionItems";

export type AssistantMode =
  | "today" | "week" | "upcoming" | "overdue" | "suggestion" | "custom" | "daily_plan"
  | "plan_day" | "next_up" | "reschedule_overdue" | "plan_week" | "habit_checkin" | "wrap_up"
  | "weekly_review" | "goal_coach" | "sort_brainstorms" | "connect_dots";

export interface MentionRef {
  id: string;
  title: string;
  type: MentionType;
}

interface ToolActionItem {
  id?: string;
  title: string;
  meta?: string;
  priority?: string;
  durationDays?: number | null;
}

export interface ToolAction {
  name: string; // see TOOL_ACTIONS
  args: Record<string, any>;
  result: {
    created?: ToolActionItem;
    updated?: ToolActionItem;
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
  createdAt?: number;
  /** Failed reply: rendered as an error with a retry button */
  error?: boolean;
  retry?: { mode: AssistantMode; question: string; references?: MentionRef[] };
}

interface AskAssistantResponse {
  reply: string;
  actions: ToolAction[];
}

interface AskAssistantPayload {
  mode: AssistantMode;
  question: string;
  history: { role: "user" | "assistant"; content: string }[];
  references?: MentionRef[];
  clientDate: string;
  timeZone: string;
}

const ASSISTANT_MUTATION_KEY = ["assistant"];

async function askAssistant(payload: AskAssistantPayload) {
  const { data } = await api.post<AskAssistantResponse>("/assistant", payload);
  return data;
}

export function useAssistant() {
  const messages = useAssistantStore((s) => s.messages);
  const setMessages = useAssistantStore((s) => s.setMessages);
  const ownerId = useAssistantStore((s) => s.userId);
  const resetFor = useAssistantStore((s) => s.resetFor);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // A stored conversation belongs to one account; drop it if someone else signs in
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId && ownerId !== userId) resetFor(userId);
  }, [userId, ownerId, resetFor]);

  // Results are written to the store inside mutationFn (not onSuccess/onError), so a reply
  // still lands in the conversation if the user navigates away while it's in flight.
  const mutation = useMutation({
    mutationKey: ASSISTANT_MUTATION_KEY,
    mutationFn: async (payload: AskAssistantPayload) => {
      const { setMessages } = useAssistantStore.getState();
      try {
        const { reply, actions } = await askAssistant(payload);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: reply, actions, createdAt: Date.now() },
        ]);

        const touched = new Set(actions.flatMap((a) => TOOL_ACTIONS[a.name]?.queries ?? []));
        touched.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      } catch (error: any) {
        const serverMessage = error?.response?.data?.message;
        const { mode, question, references } = payload;
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: serverMessage ?? "Sorry, I couldn't reach the assistant just now. Try again in a moment.",
            createdAt: Date.now(),
            error: true,
            retry: { mode, question, references },
          },
        ]);
      }
    },
  });

  // Global, so the page knows a request is still running after a remount
  const isPending = useIsMutating({ mutationKey: ASSISTANT_MUTATION_KEY }) > 0;

  const ask = useCallback(
    (mode: AssistantMode, question: string, history: ChatMessage[], references?: MentionRef[]) => {
      mutation.mutate({
        mode,
        question,
        // failed replies are UI-only, never part of the model's context
        history: history.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
        references,
        clientDate: format(new Date(), "EEEE, yyyy-MM-dd HH:mm"),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    },
    [mutation]
  );

  const sendMessage = useCallback(
    (text: string, mode: AssistantMode = "custom", references?: MentionRef[]) => {
      const trimmed = text.trim();
      if (!trimmed || isPending) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: Date.now() },
      ]);
      ask(mode, trimmed, messages, references);
    },
    [messages, isPending, setMessages, ask]
  );

  const sendQuickAction = useCallback(
    (mode: AssistantMode, message: string) => {
      sendMessage(message, mode);
    },
    [sendMessage]
  );

  /** Re-sends the request behind a failed reply, replacing the error bubble */
  const retry = useCallback(
    (messageId: string) => {
      if (isPending) return;
      const index = messages.findIndex((m) => m.id === messageId);
      const failed = messages[index];
      if (!failed?.retry) return;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      // history = everything before the user message that triggered the failure
      ask(failed.retry.mode, failed.retry.question, messages.slice(0, Math.max(index - 1, 0)), failed.retry.references);
    },
    [messages, isPending, setMessages, ask]
  );

  const clearChat = useCallback(() => {
    mutation.reset();
    setMessages(() => []);
  }, [mutation, setMessages]);

  return {
    messages,
    sendMessage,
    sendQuickAction,
    retry,
    clearChat,
    isPending,
  };
}
