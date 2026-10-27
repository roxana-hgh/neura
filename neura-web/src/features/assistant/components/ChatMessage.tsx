import { Sparkles, User } from "lucide-react";

import type { ChatMessage as ChatMessageType } from "@/features/assistant/hooks/useAssistant";
import { MarkdownMessage } from "@/features/assistant/components/MarkdownMessage";
import { cn } from "@/lib/utils";
import { ActionBadge } from "@/features/assistant/components/ActionBadge";


interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser && "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      <div className={cn("flex max-w-[80%] flex-col gap-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground whitespace-pre-wrap text-sm leading-relaxed"
              : "rounded-bl-sm bg-muted text-foreground"
          )}
        >
          {isUser ? message.content : <MarkdownMessage content={message.content} />}
        </div>

        {message.actions?.map((action, i) => (
          <ActionBadge key={i} action={action} />
        ))}
      </div>
    </div>
  );
}