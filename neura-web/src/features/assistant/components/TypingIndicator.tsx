import { AssistantAvatar } from "@/features/assistant/components/ChatMessage";

export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <AssistantAvatar className="motion-safe:animate-pulse" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Thinking</span>
        <span className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
