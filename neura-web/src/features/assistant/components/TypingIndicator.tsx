import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}