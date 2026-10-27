import { useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, Check, Copy, RotateCcw, Sparkles } from "lucide-react";

import type { ChatMessage as ChatMessageType } from "@/features/assistant/hooks/useAssistant";
import { MarkdownMessage } from "@/features/assistant/components/MarkdownMessage";
import { ActionBadge } from "@/features/assistant/components/ActionBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (id: string) => void;
  retryDisabled?: boolean;
}

export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard can be blocked (insecure origin, permissions); nothing useful to show
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy message"}
      title={copied ? "Copied" : "Copy"}
      className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function ChatMessage({ message, onRetry, retryDisabled }: ChatMessageProps) {
  const isUser = message.role === "user";
  const time = message.createdAt ? format(message.createdAt, "HH:mm") : null;

  // Shown on hover on desktop, always visible on touch screens
  const metaRow = (
    <div
      className={cn(
        "flex items-center gap-0.5 text-[11px] text-muted-foreground transition-opacity",
        "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
        isUser && "flex-row-reverse"
      )}
    >
      <CopyButton text={message.content} />
      {time && <span className="px-1 tabular-nums">{time}</span>}
    </div>
  );

  if (isUser) {
    return (
      <div className="group flex flex-col items-end gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div
          dir="auto"
          className="max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm sm:max-w-[75%]"
        >
          {message.content}
        </div>
        {metaRow}
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5">
          <p dir="auto" className="text-sm text-foreground">
            {message.content}
          </p>
          {message.retry && onRetry && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={retryDisabled}
              onClick={() => onRetry(message.id)}
              className="rounded-full"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Try again
            </Button>
          )}
        </div>
      </div>
    );
  }

  const actions = message.actions ?? [];

  return (
    <div className="group flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <AssistantAvatar className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="pt-0.5 text-foreground">
          <MarkdownMessage content={message.content} />
        </div>

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {actions.map((action, i) => (
              <ActionBadge key={i} action={action} />
            ))}
          </div>
        )}

        <div className="-ml-1.5">{metaRow}</div>
      </div>
    </div>
  );
}
