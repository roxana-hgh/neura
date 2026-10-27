import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMessage } from "@/features/assistant/hooks/useAssistant";

interface AssistantStoreState {
  /** Owner of the conversation, so a different account never sees it */
  userId: string | null;
  messages: ChatMessage[];
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  resetFor: (userId: string | null) => void;
}

// Client-only chat transcript: survives page navigation and reloads within the tab
export const useAssistantStore = create<AssistantStoreState>()(
  persist(
    (set) => ({
      userId: null,
      messages: [],
      setMessages: (updater) => set((s) => ({ messages: updater(s.messages) })),
      resetFor: (userId) => set({ userId, messages: [] }),
    }),
    {
      name: "neura-assistant-chat",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ userId, messages }) => ({ userId, messages }),
    },
  ),
);
